# Route-Level Authentication (Frontend → Backend)

## Overview

Protected routes on the frontend are guarded by the `RequireAuth` component, which verifies authentication by calling the backend `/auth/me` endpoint. Since the access token is stored in an `httpOnly` cookie (unreadable by JavaScript), the only safe way to verify identity is through a server-side check.

## Architecture Flow

```mermaid
flowchart LR
    subgraph Frontend
        Browser[Browser]
        Portal[Portal Frontend]
        RequireAuth[RequireAuth Component]
        AppRouterProvider[AppRouterProvider]
    end

    subgraph Backend
        Gateway[API Gateway]
        RefreshGuard[JWT Refresh Guard]
        VerifyGuard[JWT Verification Guard]
        AuthService[Auth Service]
    end

    Browser --> Portal: User visits protected route
    Portal --> AppRouterProvider: Render route
    AppRouterProvider --> RequireAuth: Wrap with auth guard
    RequireAuth --> Gateway: GET /auth/me (auto Cookie)
    Gateway --> RefreshGuard: Check access token
    RefreshGuard --> VerifyGuard: Validate token
    VerifyGuard --> AuthService: Proxy request
    AuthService --> AuthService: Read & verify cookie
    AuthService --> Gateway: { userId, email }
    Gateway --> RequireAuth: 200 OK
    RequireAuth --> AppRouterProvider: Authenticated → show page

    RequireAuth -.->|isError| Browser: Redirect /login
```

## Step-by-Step Flow

### Step 1: Route Registration (Bootstrap)

- Admin sets `handle.isRequireUserLogin: true` directly on a route record in the database (stored in the route's `handle` JSON column).
- On app startup, `BootstrapService` reads all routes from the database and returns `handle.isRequireUserLogin` as-is in the bootstrap response.
- Frontend receives the route config via `GET /core/app/bootstrap`, which includes `handle.isRequireUserLogin: true`.

> Note: `isRequireUserLogin` is the single source of truth for route-level auth gating. The legacy `authRequired` database column has been removed — auth gating is now driven entirely by the `handle.isRequireUserLogin` field.

### Step 2: Route Rendering (AppRouterProvider)

```tsx
// apps/frontend/portal/src/router/AppRouterProvider.tsx
import { RequireAuth } from '@pawhaven/frontend-core';
import { useCurrentUser } from '@/features/Auth/api/auth.queries';
import { routePaths } from '@/router/routePaths';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isLoading, isError } = useCurrentUser();

  return (
    <RequireAuth
      isLoading={isLoading}
      isError={isError}
      loginPath={routePaths.login}
    >
      {children}
    </RequireAuth>
  );
};

const createRouteElement = (route: RouterEle): ReactNode => {
  const handle = route.handle ?? {};
  const page = handle.isLazyLoad ? (
    <SuspenseWrapper>{routerElementMapping[route.element]}</SuspenseWrapper>
  ) : (
    routerElementMapping[route.element]
  );

  if (!handle?.isRequireUserLogin) {
    return page;
  }

  return <ProtectedRoute>{page}</ProtectedRoute>;
};
```

### Step 3: Auth Verification (RequireAuth)

```tsx
// packages/frontend-core/src/components/RequireAuth/index.tsx
import { Navigate, useLocation } from 'react-router-dom';

interface RequireAuthProps {
  children: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  loginPath: string;
}

export const RequireAuth = ({
  children,
  isLoading,
  isError,
  loginPath,
}: RequireAuthProps) => {
  const location = useLocation();

  if (isLoading) return null;

  if (isError) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

The component is intentionally minimal — it receives the auth query result (`isLoading`/`isError`) as props so it stays decoupled from any specific API call.

### Step 4: Backend JWT Verification (Gateway)

1. Frontend's `useCurrentUser` calls `GET /auth/me`; the request automatically includes the `access_token` httpOnly cookie.
2. Gateway intercepts the request:
   - `JwtRefreshGuard` runs first: checks if the access token is missing, invalid, or expiring soon. If expiring, it automatically calls `/auth/refresh` to get new tokens.
   - `JwtVerificationGuard` runs second: validates the JWT signature, extracts the user payload, and attaches `req.user`.
3. On success, gateway proxies the request to `AuthService` with `X-Auth-User-Id` and `X-Auth-User-Email` headers.

### Step 5: Auth Service Verification

`AuthService.getMe()` reads the `access_token` cookie directly from the request, verifies it, and returns `{ userId, email }`. The gateway already validated the token signature, so this endpoint just retrieves the user payload.

### Step 6: Dispatch & Render

- `useCurrentUser` returns `{ data, isError, isLoading }` from React Query.
- `isLoading`: return `null` (show nothing while checking).
- `isError`: redirect to `/login`, passing `state: { from: location }` for post-login redirect.
- `isSuccess`: render the protected page; user profile is dispatched to Redux via `dispatch(setProfile(data))` in the component that consumes `useCurrentUser`.

## Key Design Decisions

| Decision                                            | Reason                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Frontend doesn't read httpOnly cookie               | httpOnly prevents JavaScript access; protects against XSS token theft                                      |
| Verify via `/auth/me` API instead of local state    | Backend is the only source of truth; detects expired, revoked, or tampered tokens                          |
| RequireAuth receives `isLoading`/`isError` as props | Keeps the component reusable; caller controls the exact hook and API                                       |
| `authQueryKeys` uses factory functions `() => []`   | Consistent with `homeQueryKeys`; ensures fresh query key on each render                                    |
| Redirect stores `location` in state                 | Enables "redirect back after login" UX pattern                                                             |
| useCurrentUser has no side effects in queryFn       | Avoids ESLint exhaustive-deps warnings; dispatch logic is handled in a `useEffect` in consuming components |
