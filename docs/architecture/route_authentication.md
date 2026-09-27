# Route-Level Authentication (Frontend → Backend)

## Overview

Protected routes are guarded by an **authenticated parent route** in the React Router v7 Data Mode route tree. Its `requireUser` loader verifies authentication by priming the `/auth/me` query via `queryClient.ensureQueryData(...)`, and redirects to `/auth/login?redirect=…` when verification fails. Since the access token is stored in an `httpOnly` cookie (unreadable by JavaScript), the only safe way to verify identity is through a server-side check.

> This replaced the previous `RequireAuth` component approach, which wrapped each protected page and redirected using React Router location `state`.

## Architecture Flow

```mermaid
flowchart LR
    subgraph Frontend
        Browser[Browser]
        Router[React Router v7 Data Mode]
        Guard[authenticated route / requireUser loader]
        Login[Login page reads ?redirect]
    end

    subgraph Backend
        Gateway[API Gateway]
        InternalJwtService[InternalJwtService<br/>resolve identity]
        AuthService[Auth Service]
        GatewayGuard[InternalJwtGuard<br/>verify internal JWT]
    end

    Browser --> Router: User visits protected route
    Router --> Guard: Run requireUser loader
    Guard --> Gateway: GET /auth/me (auto Cookie)
    Gateway --> InternalJwtService: resolve identity (F1-F4)
    InternalJwtService --> Gateway: sign internal JWT
    Gateway --> AuthService: proxy + x-gateway-jwt
    AuthService --> GatewayGuard: verify internal JWT (default-auth)
    GatewayGuard --> AuthService: attach req.internalJwt
    AuthService --> Gateway: { userId, email }
    Gateway --> Guard: 200 OK
    Guard --> Router: Authenticated → render children

    Guard -.->|failure| Login: redirect('/auth/login?redirect=...')
```

## Step-by-Step Flow

### Step 1: Route Definition (frontend-owned)

- Routes are defined statically in the frontend. The backend returns a `routers` tree in the home
  response, but the frontend does not consume it and the router does not read it.
- Protected routes are nested under a single authenticated parent route, so protection is expressed by position in the tree rather than by a database flag:

```tsx
// apps/frontend/portal/src/router/router.tsx
{
  id: 'authenticated',
  loader: requireUser,
  Component: AuthenticatedLayout,
  children: [reportAnimalRoute],
}
```

- The legacy `handle.isRequireUserLogin` route flag is no longer read by the frontend. The backend still stores menu/route permissions (see Follow-ups).

### Step 2: Auth Guard (`requireUser` loader)

```ts
// apps/frontend/portal/src/features/Auth/route.tsx
export const requireUser = async ({ request }: LoaderFunctionArgs) => {
  const { pathname, search } = new URL(request.url);
  const redirectTo = `${routePaths.login}?${routeSearchParams.redirect}=${encodeURIComponent(`${pathname}${search}`)}`;

  try {
    await getQueryClient().ensureQueryData(
      currentUserQueryOptions(getCurrentUserId()),
    );
  } catch {
    throw redirect(redirectTo);
  }

  return null;
};
```

- Runs **once for the entire protected subtree** — child routes do not re-check and do not trigger duplicate `/auth/me` calls.
- Uses the same query key as `useCurrentUser`, so an already-cached user is reused.
- The guard runs before render: a protected page never mounts for an unauthenticated user.

### Step 3: Login Redirect

`Login` reads the intended destination from the `?redirect` search param:

```tsx
const [searchParams] = useSearchParams();
const from = searchParams.get(routeSearchParams.redirect) ?? routePaths.home;
```

Using a search param (instead of location `state`) keeps the target visible in the URL, so it survives refreshes and can be shared.

### Step 4: Backend Identity Resolution (Gateway) + Internal-JWT Verification

- **Routing**: the gateway resolves the target downstream service from the request path prefix via `MicroServiceRegistry` (`apps/backend/gateway/src/routing/micro-service.registry.ts`), which reads `microServices[]` from the gateway YAML. For `/auth/me` the prefix `/api/auth` maps to `auth-service`.

1. The `/auth/me` request automatically includes the `access_token` (and `refresh_token`) httpOnly cookies.
2. Gateway `InternalJwtService` resolves the caller identity:
   - No cookies → anonymous identity (F1).
   - Valid access token (signature, `type: 'access'`, within the 30-day session cap) → authenticated identity; if the token is inside the proactive-refresh window it attempts a rotation (single-flight) without downgrading a still-valid token (F2 / F3-window).
   - Expired/missing access + valid refresh → calls auth-service `/auth/refresh` (single-flight) and applies the returned Set-Cookie to the response (F3).
   - Unresolvable cookies (stale/broken) → clears auth cookies and the request fails with 401 — it does NOT silently continue as anonymous (F4).
3. On success the gateway signs the resolved identity as a compact ES256 internal JWT (`x-gateway-jwt`, `kid` in the JOSE header) with the shared `internal-v1` key pair and forwards it.
4. Auth-service's global `InternalJwtGuard` verifies the JWT (fail closed: decode `kid` → look it up in `publicKeys` → alg-pinned ES256 + audience + skew → zod parse → lifetime cap → future-`iat`). `/auth/me` is a default-authenticated route, so an anonymous identity is rejected with 401 here.
5. **After 30 days**, `/auth/me` returns 401 `sessionExpired` regardless of refresh-token validity — `requireUser` redirects to `/auth/login` and the user must authenticate again.

### Step 5: Auth Service `/me` Handler

`AuthController.me()` injects the verified identity with `@InternalJwt() claims: AuthenticatedInternalJwt` and returns `this.authService.getCurrentUser(claims.sub)` — a DB read that resolves `{ userId, email }` from the user row and 401s when the user is missing or soft-deleted. The auth-service no longer reads or verifies the access cookie itself for `/me` — the gateway's `InternalJwtService` already resolved the browser session and the global guard verified the signature. A user deleted after their token was issued therefore gets a 401 here instead of a stale profile.

### Step 6: Dispatch & Render

- `useCurrentUser` (React Query) exposes the cached result; components read it with `useQuery`.
- The profile is dispatched to Redux by the components that consume `useCurrentUser`.
- On failure the loader throws `redirect(...)`, so the protected page never renders.

## Key Design Decisions

| Decision                                              | Reason                                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend doesn't read httpOnly cookie                 | httpOnly prevents JavaScript access; protects against XSS token theft                                                                                                                                                                                         |
| Verify via `/auth/me` API instead of local state      | Backend is the only source of truth; detects expired or tampered tokens (only refresh tokens are revocable server-side)                                                                                                                                       |
| Session hard-caps at 30 days via `/auth/me` 401       | Absolute session bound: refresh may slide for 7 days, but after `sessionExpiresAt` login is required                                                                                                                                                          |
| Guard is a **router loader**, not a wrapper component | Runs before render; no loading flash, no partially mounted protected page                                                                                                                                                                                     |
| Single guard on the authenticated **parent route**    | Children inherit protection; avoids repeated `/auth/me` calls per page                                                                                                                                                                                        |
| Loader reuses `useCurrentUser`'s query key            | One cache entry shared by the guard and the UI — no duplicate requests                                                                                                                                                                                        |
| Redirect target stored in `?redirect` search param    | Survives refresh/share; no reliance on router location state                                                                                                                                                                                                  |
| `useCurrentUser` has no side effects in queryFn       | Avoids ESLint exhaustive-deps warnings; dispatch logic lives in `useEffect` in consuming components                                                                                                                                                           |
| Any API 401 → `/auth/login?redirect=<current>`        | The cache-level `onAuthError` (query client) redirects on **any** 401 — navigation loader, in-page refetch, or mutation — preserving the current path as `?redirect=`; it is skipped when already on an auth page, so an expired session never fails silently |

## Follow-ups

- Route `handle.permission` metadata for UX-level permission gating (backend remains the security boundary).
- The backend still returns a `routers` tree in the home response that the frontend no longer consumes — candidate for removal.
