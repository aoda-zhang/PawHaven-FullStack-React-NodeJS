# bug-fix-01 — Logged out when several requests land at once

**Category:** bug-fix · **Primary surface:** gateway (`identity` + `proxy`) ·
**Risk band:** auth, sessions, tokens — high at minimum (§10)

## Task prompt

> Users are reporting that they get bounced to the login page in the middle of using the site, but
> only when the homepage loads — it seems like several requests go out at once and one of them wins
> and clears the cookies. Reproduce it, find the root cause, fix it.

## Expected classification (§6)

```json
{
  "taskType": "bug-fix",
  "secondaryTasks": [],
  "scope": ["backend", "gateway", "api", "testing"],
  "complexity": "high",
  "risk": "high",
  "confidence": 0.8,
  "workflow": "bug-fix",
  "requiredAgents": ["scout", "backend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm --filter @pawhaven/gateway test",
    "repro on the gateway surface"
  ],
  "requiresClarification": false
}
```

`secondaryTasks: ["architecture-change"]` is acceptable and even expected if the fix turns into a
redesign of refresh coalescing — §7 says a fix by redesigning session management is
`bug-fix` + `architecture-change` with `risk: high`. `risk: medium` or `low` is a classification
failure: sessions and tokens are named floors.

## Workflow route

`/bug-fix`. The prompt's own discipline is the pass condition: reproduce on the failing surface
before proposing a fix, and verify the repro passes **on the same surface** that failed.

## Observable success criteria

1. A reproduction exists before any fix, and the run shows it failing: a test in
   `apps/backend/gateway/src/identity/identity.resolver.test.ts` (or `proxy.service.test.ts`) that
   issues two concurrent resolutions with an expiring access token and an available refresh token,
   and demonstrates the observed loss — 401, cleared cookies, or a stale token forwarded downstream.
   A hypothesis written as prose with no failing check is not a repro.
2. The root cause is named as a mechanism, not a symptom. Candidate mechanisms live in the real
   code, and the run must rule each in or out with evidence rather than pick the first plausible one:
   - `refreshInflight` is keyed by the refresh-token string
     (`apps/backend/gateway/src/identity/identity.resolver.ts` ~L35, ~L270) — two different
     concurrent requests carrying different refresh tokens do not coalesce.
   - `applyCookies` appends `set-cookie` to the response **and** mutates `req.cookies` and
     `req.headers.cookie` in place; the mutation is per-request, so a request that adopted another
     request's refresh result may still be forwarding the old token.
   - `resolve` calls `clearCookies` then throws `UnauthorizedException` when the refresh attempt
     returns null — `refreshOnce` maps any failure to `null` via `.catch(() => null)`, so one failed
     upstream refresh can log the caller out of otherwise valid work.
   - `shouldRefreshSoon` uses `refreshWindowPercentage` (0.2 of token lifetime, `jwtRefreshWindowPercentage`
     in `apps/backend/gateway/src/config/dev/env/index.json`), so a burst near expiry is the normal
     case, not an edge case.
3. The fix keeps the gateway auth invariant: only the gateway touches browser cookies, and it still
   signs a short-lived ES256 internal JWT per target service via
   `apps/backend/gateway/src/internal-jwt/internalJwt.service.ts`. No fix may forward a browser token
   downstream, widen the TTL, or disable proactive refresh to make the symptom go away.
4. Anonymous and logout paths are unaffected: `isLogoutPath` short-circuits before refresh, and
   `kind: ANONYMOUS` when neither cookie is present. Both must still hold, and the run must show the
   tests that cover them still passing.
5. The failure mode degrades honestly: if refresh cannot complete, the response is a 401 the portal's
   global handler can act on — not a partially-applied cookie set. `packages/frontend-core` handles
   401 by redirecting; `apps/frontend/portal/src/utils/apiClient.ts` documents that.
6. `pnpm --filter @pawhaven/gateway test` and `pnpm typecheck` green, with the new test shown going
   from red to green. `gateway-throttle.test.ts`, `identity.resolver.test.ts` and
   `proxy.service.test.ts` are the existing suites that must stay green.
7. `/handoff` records Doc Impact, and it is `update` if behaviour under concurrency is now different
   from what `docs/architecture/authentication-architecture.md` describes (the F1–F4 resolution and
   refresh rules).

## What a good run must produce

The failing repro (command + output) · the ruled-in/ruled-out hypothesis list with evidence · the
minimal fix, no belt-and-braces second guard stacked on the first · a regression test that fails
without the fix · the same-surface verification · a proposed commit split (failing test first, then
fix) · the handoff with Doc Impact. No push, no PR, no commit.

## Real surfaces involved

- `apps/backend/gateway/src/identity/identity.resolver.ts` — `resolve`, `refreshPayload`,
  `refreshOnce`, `adoptRefreshedCookies`, `applyCookies`, `clearCookies`, `upsertCookieHeader`,
  `validPayload`, `shouldRefreshSoon`, `getRefreshWindowSeconds`.
- `apps/backend/gateway/src/identity/identity.resolver.test.ts` — existing coverage to extend.
- `apps/backend/gateway/src/proxy/proxy.service.ts` — `handleProxyReq`,
  `pendingInternalJwtHeaders` (a `WeakMap` keyed on the request), `stripInboundGatewayHeaders`.
- `apps/backend/gateway/src/internal-jwt/internalJwt.service.ts`, `internalJwtTarget.resolver.ts`,
  `InternalJwt.types.ts`.
- `apps/backend/gateway/src/config/dev/env/index.json` — `auth.jwtExpiresIn: 300`,
  `jwtRefreshWindowPercentage: 0.2`, `jwtRefreshFallbackSeconds: 60`, `refreshTokenRotationWindowSeconds`.
- `packages/backend-core/constants/auth.ts` — `cookieKeys`, `authRouteSuffixes`;
  `packages/backend-core/types/InternalJwt.schema.ts`,
  `packages/backend-core/dynamic-modules/internal-jwt/internalJwt.guard.ts`.
- `apps/backend/auth-service/src/modules/auth/auth.service.ts` — `setAuthCookies`,
  `getRefreshCookieMaxAge`, `refresh`, rotation — the other side of the cookie contract.

## Known trap

`auth-service` stores the refresh token on the `User` row
(`apps/backend/auth-service/src/prisma/mongodb/schema.prisma`, `refreshToken String?` with
`@@index([refreshToken])`) and rotation is single-valued per user. A "fix" that stops the gateway
from refreshing at all, or that makes two tabs each keep their own token pair, collides with that
storage shape and trades one bug for a worse one. Recognising the rotation constraint is part of the
root-cause work; ignoring it is a review blocker.
