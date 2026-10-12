# Feature: Auth (`portal/src/features/auth`)

> **Status**: Implemented · **Verified against**: `auth-service`, `gateway/identity`, `portal/features/auth`
> **Feature docs**: [README](README.md) · **Sources**: [Authentication Architecture](../architecture/authentication-architecture.md) · [Route Authentication](../architecture/route_authentication.md) · [Product Blueprint §2](../product/PawHaven-Product-Strategy-EN.md)

One document per portal feature folder. Chapter 1 breaks the feature into the sections a user
actually sees; the later chapters cover the data path underneath.

## 1. Screens

Two pages, `/auth/login` and `/auth/register`, both wrapped in one shared shell. Both declare
`handle: { isMenuAvailable: false, isFooterAvailable: false }`, so the app chrome is suppressed on
both — see [App Shell §1.1](07-app-shell-bootstrap.md#11-navigation).

### 1.1 Login

`login/Login.tsx`. React Hook Form over `CredentialsDto` — exactly two fields, `email` and
`password`, both `FormInput`. No remember-me, no forgot-password link, no social sign-in.

On success it navigates to `searchParams.get('redirect') ?? '/'` with `replace: true`. The
`redirect` param is what `requireUser` writes when it bounces an unauthenticated visitor, so
signing in returns you to the page you asked for rather than always to the homepage.

The secondary button calls `navigate(routePaths.register)`. There is no link back from register to
login by route — `Register.tsx` has one, pointing at `routePaths.login`.

### 1.2 Register

`register/Register.tsx`. The same two fields, same `CredentialsDto`, same form shape. There is no
confirm-password field, no username field, no terms checkbox, and no password-strength indicator.
`username` is derived server-side from the email local part; see [§4](#4-data-model).

On success it navigates to `/` with `replace: true` — it does **not** honour a `redirect` param,
so a user who deep-linked to a gated page and then registered lands on the homepage instead.

### 1.3 Auth shell

`AuthLayout.tsx`, used by both pages. A centred card on `sm+` (`max-w-[28rem]`,
`max-h-[calc(100dvh-4rem)]`, `sm:rounded-lg`, `sm:shadow-modal`) and a full-bleed sheet with a
top-right close button below `sm`. It contains `<ScrollRestoration />` and an `overflow-y-auto`
body, so each page scrolls inside the card rather than the document.

The two `CloseButton` instances — one per breakpoint — both navigate to `routePaths.home`. The
`aria-label` on that button is absent in both renderings, so it is an icon-only control with no
accessible name.

### 1.4 Route guard

`route.tsx` exports `requireUser`, the **only** route guard in the portal. It calls
`getQueryClient().ensureQueryData(currentUserQueryOptions(userId))` inside a `try/catch` and
`throw redirect(...)` on any failure, preserving `pathname + search` in the `redirect` param.

It is attached to the `authenticated` parent route in `router/router.tsx`, and exactly one route is
nested under it: `reportAnimalRoute`. The other five are public.

`currentUserQueryOptions` sets `staleTime` to 5 minutes and `retry: false`. The `userId` it keys on
is read from the Redux store at call time, so the guard re-reads session state rather than trusting
its argument.

## 2. Session Lifecycle

```mermaid
flowchart TD
    A[POST /api/auth/register<br/>email + password] --> B[auth-service hashes password<br/>creates user · roles [] · status pending]
    B --> C[Set-Cookie access_token + refresh_token<br/>httpOnly · path /]
    C --> D[Browser holds cookies only]
    D --> E{Subsequent request}
    E --> F[Gateway reads cookies<br/>IdentityResolver F1–F4]
    F --> G{Near expiry?}
    G -- yes --> H[POST /api/auth/refresh<br/>rotation inside the window]
    H --> F
    G -- no --> I[Sign InternalJwt · ES256 · 45s<br/>header x-gateway-jwt]
    I --> J[Proxy forwards to target service]
    J --> K[InternalJwtGuard verifies<br/>aud + exp + rid]
    K --> L[Handler reads @InternalJwt]
```

The **gateway owns the browser tokens**: it resolves the caller from the cookies, refreshes when
needed, and signs a short-lived internal JWT for the downstream service. `auth-service` never sees
a browser token arriving from the proxy — it issues and validates them, and the gateway forwards
the outcome.

Logout is `POST /api/auth/logout`: it clears the refresh token server-side and expires both
cookies. The gateway treats `/auth/logout` as a logout path and stops signing an authenticated
internal JWT for it.

## 3. Endpoints

All reached through the gateway at `/api/auth/*`; the gateway rewrites the prefix to
`/auth-service`.

| Method | Path                         | Policy        | Notes                                                    |
| ------ | ---------------------------- | ------------- | -------------------------------------------------------- |
| POST   | `/api/auth/register`         | `@Public()`   | 409 if the email exists; sets cookies, returns a session |
| POST   | `/api/auth/login`            | `@Public()`   | Sets cookies, returns a session                          |
| POST   | `/api/auth/refresh`          | `@Public()`   | Needs the refresh cookie; 401 without it                 |
| POST   | `/api/auth/logout`           | `@Public()`   | Clears the refresh token and both cookies                |
| GET    | `/api/auth/me`               | authenticated | Current user from the internal JWT `sub`                 |
| GET    | `/api/auth/volunteer-count`  | `@Public()`   | `{ count }` — consumed by the `home` module              |
| POST   | `/api/auth/volunteer/opt-in` | authenticated | Idempotently adds `volunteer` to `roles`                 |

### Roles

`userRoles` in `packages/backend-core/constants/userRoles.ts` defines exactly two:

| Role        | How it is granted                                |
| ----------- | ------------------------------------------------ |
| `volunteer` | `POST /api/auth/volunteer/opt-in` — self-service |
| `admin`     | Seeded or set by hand; no API grants it          |

A newly registered user has `roles: []` and `status: pending` (both Prisma defaults). There is no
`registered` role — "registered user" in this codebase means _has an account_, not _holds a role_.
`shelter` and `rescuer` are **not** roles in the code; they appear only in the product blueprint.

## 4. Data Model

`User` in `apps/backend/auth-service/src/prisma/mongodb/schema.prisma`:

| Field                   | Type       | Notes                                             |
| ----------------------- | ---------- | ------------------------------------------------- |
| `id`                    | ObjectId   | `@map("_id")`                                     |
| `email`                 | String     | `@unique`                                         |
| `password`              | String     | Hashed                                            |
| `username`              | String?    | Derived from the email local part on registration |
| `roles`                 | String[]   | `@default([])`                                    |
| `status`                | UserStatus | `pending` \| `active`, defaults to `pending`      |
| `refreshToken`          | String?    | Indexed                                           |
| `refreshTokenExpiresAt` | Int?       | Unix seconds                                      |
| `sessionExpiresAt`      | Int?       | Unix seconds                                      |
| `deletedAt`             | DateTime?  | Soft delete                                       |

## 5. Tokens & Cookies

Cookie names are `access_token` and `refresh_token` (`cookieKeys` in
`packages/backend-core/constants/auth.ts`). Both are `httpOnly`, `path: /`, and `secure` in
production. The browser never holds a token in JS-readable storage.

Values come from `auth-service` env config, not from code:

| Setting                                  | Dev value | Meaning                                |
| ---------------------------------------- | --------- | -------------------------------------- |
| `auth.jwtExpiresIn`                      | 300 s     | Access token lifetime                  |
| `auth.refreshTokenExpiresIn`             | 604800 s  | Refresh token lifetime (7 days)        |
| `auth.sessionExpiresIn`                  | 2592000 s | Session record lifetime (30 days)      |
| `auth.refreshTokenRotationWindowSeconds` | 86400 s   | Window inside which refresh is allowed |
| `internalJwt.ttlSeconds` (gateway)       | 45 s      | Internal JWT lifetime                  |

The refresh cookie's `maxAge` is clamped to the token's own remaining lifetime, so the cookie
cannot outlive the token it carries.

## 6. Frontend Files

| File                                | Role                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `route.tsx`                         | `loginRoute`, `registerRoute`, `requireUser`, `currentUserQueryOptions` |
| `login/Login.tsx`                   | §1.1                                                                    |
| `register/Register.tsx`             | §1.2                                                                    |
| `AuthLayout.tsx`                    | §1.3                                                                    |
| `api/auth.api.ts`                   | The calls                                                               |
| `api/auth.mutations.ts`             | `login` / `register` / `logout` mutations                               |
| `api/auth.queries.ts`               | The `me` query                                                          |
| `api/auth.queryKeys.ts`             | Key factory                                                             |
| `types.ts`                          | `CredentialsDto` and friends                                            |
| `api/tests/auth.mutations.test.tsx` | The only test in the feature                                            |

Session state lives in Redux (`store/globalReducer.ts`) — client session state, not server data.
There is no profile feature, so nothing else consumes the user record.

## 7. What Does Not Exist

- **No password reset.** Not an endpoint, not a token type, not a link on the login page.
- **No email verification.** `status: pending` is written at registration and nothing ever moves
  it to `active`.
- **No confirm-password, no password policy, no strength meter, no terms acceptance.**
- **No social or SSO sign-in.** Two endpoints, email and password only.
- **No RBAC guard.** There is no `RolesGuard` and no `@Roles()` decorator anywhere in the backend.
  Roles are read in exactly two places: the gateway copies them into the internal JWT, and the
  `bootstrap` module filters menu items by them. No endpoint authorises on role — endpoint policy
  is `@Public()` / `@OptionalAuth()` / default-authenticated, which is a different axis.
- **No volunteer network.** Opting in sets a role string. There is no profile, no availability, no
  capability, no matching, and no case claiming. The opt-in endpoint has **no caller in the
  portal** — no button anywhere posts to it. The `/volunteer` link on the homepage CTA is a dead
  route. See the product blueprint §10 for the intent.
- **No account deletion or profile editing**, despite `deletedAt` existing.

## 8. Related Docs

- [Authentication Architecture](../architecture/authentication-architecture.md) — the full F1–F4 resolution and internal JWT contract
- [Route Authentication](../architecture/route_authentication.md) — `requireUser` in context
- [App Shell & Bootstrap](07-app-shell-bootstrap.md) — resolves this user's menu items
- [Report a Stray Animal](03-report-animal.md) — the one auth-gated route
