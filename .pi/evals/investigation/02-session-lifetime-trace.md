# inv-02 — Session lifetime trace: from login cookie to internal JWT

**Category:** investigation · **Primary surface:** gateway identity + internal JWT, auth-service
session storage · **Risk band:** auth, sessions, tokens — high at minimum (§10)

## Task prompt

> Work out exactly how long a PawHaven session lives and what ends it. Start at the moment the
> browser receives its cookies and follow one request all the way through: who signs what, what is
> refreshed when, what TTLs are configured, and what the user's actual experience is at each
> boundary. Answer with a timeline a new engineer could check, and cite the config values you used —
> no numbers from memory.

## Expected classification (§6)

```json
{
  "taskType": "investigation",
  "secondaryTasks": ["documentation"],
  "scope": ["backend", "gateway", "auth-service", "api", "documentation"],
  "complexity": "high",
  "risk": "high",
  "confidence": 0.85,
  "workflow": "investigation",
  "requiredAgents": ["scout", "oracle", "reviewer"],
  "requiredVerification": [
    "read apps/backend/gateway/src/config/dev/env/index.json and apps/backend/auth-service/src/config/dev/env/index.json",
    "pnpm --filter @pawhaven/gateway test"
  ],
  "requiresClarification": false
}
```

`risk: high` is required — sessions and tokens are a named §10 floor. `taskType: bug-fix` or
`feature` is a classification failure: a run that edits a TTL, a cookie attribute, or a refresh
branch while producing the trace has changed the behaviour it was asked to measure. The only
acceptable write is a documentation update, declared as Doc Impact.

## Workflow route

`/investigation`. The deliverable is a timeline built from cited config and cited code, cross-checked
against `docs/architecture/authentication-architecture.md`. Where the doc and the code disagree, the
disagreement is the finding.

## Observable success criteria

1. The timeline is built from the real config, quoted with its source. From
   `apps/backend/gateway/src/config/dev/env/index.json` (`auth.*`): `jwtExpiresIn: 300`,
   `jwtClockTolerance: 30`, `jwtRefreshWindowPercentage: 0.2`, `jwtRefreshFallbackSeconds: 60`,
   `refreshTokenExpiresIn: 604800`, `refreshTokenRotationWindowSeconds: 86400`,
   `sessionExpiresIn: 2592000`, and `internalJwt` with `ttlSeconds: 45`,
   `clockSkewSeconds: 30`, `keyId: internal-v1`. The run states the resulting user-visible
   arithmetic — access token 5 minutes, proactive refresh inside the last 20% of that life (with the
   `jwtRefreshFallbackSeconds` and clock-tolerance edges), refresh token 7 days, rotation window 1
   day, session ceiling 30 days — and shows the config file it read for each. The gateway values must
   be checked against `apps/backend/auth-service/src/config/dev/env/index.json`, since the two
   services configure their own half of the contract.
2. The login half is traced in the issuing service:
   `apps/backend/auth-service/src/modules/auth/auth.service.ts` — `setAuthCookies` writes both
   `httpOnly` cookies (`cookieKeys.access_token` / `cookieKeys.refresh_token` from
   `packages/backend-core/constants/auth.ts`), with `sameSite` differing per cookie
   (`refresh: 'strict'`) and the refresh cookie's `maxAge` from `getRefreshCookieMaxAge`, which
   clamps to the token's own expiry rather than the configured lifetime. `isSessionExpired`
   (~L151) and `shouldRotateRefreshToken` (~L158) are the issuing side's own expiry and rotation
   rules, and `refresh` uses both around ~L400 and ~L426.
3. The per-request half is traced in the gateway, in order, with symbols named:
   `IdentityResolver.resolve` (`apps/backend/gateway/src/identity/identity.resolver.ts`) reads the two
   cookies, returns `{ kind: InternalJwtKind.ANONYMOUS }` when neither is present, short-circuits on
   `isLogoutPath` before any refresh, and only then calls `validPayload` →
   `shouldRefreshSoon` → `refreshPayload` → `adoptRefreshedCookies` → `refreshOnce` →
   `applyCookies`. The run states that a failed refresh ends in `clearCookies` plus
   `UnauthorizedException(SESSION_EXPIRED_MESSAGE)`, and that `refreshOnce` maps every failure to
   `null` via `.catch(() => null)` — the single upstream failure that ends a session.
4. The internal JWT step is traced and stated as the invariant it is: for each request the gateway
   signs a short-lived ES256 token into `x-gateway-jwt`
   (`apps/backend/gateway/src/internal-jwt/internalJwt.service.ts`, `buildInternalJwt`,
   `InternalJwtKind.ANONYMOUS` producing a reduced claim set); downstream verifies it with
   `packages/backend-core/dynamic-modules/internal-jwt/internalJwt.guard.ts` and fails closed; handlers
   read the caller via `internalJwt.decorator.ts`'s `@InternalJwt()`. The run confirms the browser
   token never leaves the gateway and that the `roles` claim is written only by
   `internalJwt.service.ts`.
5. The rotation constraint is traced, because it is what makes the lifetime a _single_ value rather
   than a per-tab one: auth-service stores `refreshToken String?`, `refreshTokenExpiresAt Int?` and `sessionExpiresAt Int?`
   on the `User` row (`apps/backend/auth-service/src/prisma/mongodb/schema.prisma`, `User.status`
   defaults to `UserStatus` `pending`), with `@@index([refreshToken])` — one refresh token per user.
   The gateway's `refreshInflight` map is keyed by the refresh-token string. Two tabs therefore
   contend, and a rotation invalidates the other tab's token. The run says so.
6. The user-status gate is checked rather than assumed: `User.status` defaults to `pending`
   (`packages/shared/types/UserStatus.ts`), so a freshly registered account has a session whose
   effective permissions depend on a status the JWT claims do not obviously carry. The run reports
   what it finds — whether a `pending` user's requests are accepted downstream — instead of guessing.
7. Cross-check against `docs/architecture/authentication-architecture.md` (the F1–F4 resolution
   order, the refresh rules, the `roles` claim). Every claim the doc makes is either confirmed against
   code with a citation, or listed as a discrepancy. A trace that restates the doc without checking
   the code has measured nothing.
8. The output ends with the three numbers most likely to be wrong — the proactive-refresh window, the
   effective session ceiling once rotation is applied, and the internal-JWT lifetime relative to the
   gateway's `http.timeout: 15000` — each with the arithmetic shown.
9. No source, config, or schema file is modified. Only a documentation edit is acceptable, and only
   if a discrepancy was found; then the `/handoff` declares Doc Impact = `update` and names the doc.
   `pnpm --filter @pawhaven/gateway test` is green as the untouched-baseline check.

## What a good run must produce

The timeline — login → each request → proactive refresh → rotation → logout — with every hop citing a
file and a symbol, and every duration citing a config key and its file · the per-cookie attributes ·
the anonymous and logout short-circuits · the internal-JWT claim set and its 45-second life · the
single-refresh-token-per-user constraint and what it means for two tabs · the `User.status` finding ·
the doc-versus-code discrepancy list (or an explicit "doc and code agree, checked at these lines") ·
`git status --short` showing no change under `apps/` or `packages/`.

## Real surfaces involved

- `apps/backend/gateway/src/identity/identity.resolver.ts` — `resolve`, `validPayload`,
  `verifyAccessToken`, `isLogoutPath`, `shouldRefreshSoon`, `getRefreshWindowSeconds`,
  `isSessionExpired`, `refreshPayload`, `adoptRefreshedCookies`, `refreshOnce`, `refreshInflight`,
  `applyCookies`, `clearCookies`, `identityFromPayload`.
- `apps/backend/gateway/src/identity/identity.resolver.test.ts` — existing coverage that states the
  intended behaviour, and the fastest way to check a timeline claim.
- `apps/backend/gateway/src/proxy/proxy.service.ts` (`handleProxyReq`, `stripInboundGatewayHeaders`),
  `apps/backend/gateway/src/internal-jwt/internalJwt.service.ts`,
  `internalJwtTarget.resolver.ts`, `InternalJwt.types.ts`.
- `apps/backend/gateway/src/config/dev/env/index.json` (`auth`, `internalJwt`, `http.timeout`,
  `microServices`), and the `prod` / `uat` / `test` siblings for the differences between environments.
- `apps/backend/auth-service/src/modules/auth/auth.service.ts` (`setAuthCookies`, `refresh`,
  `getRefreshCookieMaxAge`, rotation and `shouldRotate`), `auth.controller.ts`;
  `apps/backend/auth-service/src/config/dev/env/index.json`.
- `apps/backend/auth-service/src/prisma/mongodb/schema.prisma` — `model User`, `refreshToken`,
  `refreshTokenExpiresAt`, `status`, `@@index([refreshToken])`.
- `packages/backend-core/constants/auth.ts` (`cookieKeys`, `authRouteSuffixes`),
  `packages/backend-core/dynamic-modules/internal-jwt/` (guard, decorator, sign, verify),
  `packages/backend-core/types/InternalJwt.schema.ts`.
- `packages/shared/types/UserStatus.ts`, `packages/shared/types/Auth.schema.ts` (`SessionDto`).
- `apps/frontend/portal/src/features/auth/api/auth.mutations.ts` — `toProfile` sets
  `accessToken: ''`, the client-side proof that JS never holds a token;
  `apps/frontend/portal/src/utils/apiClient.ts` — the 401 handling that turns a session end into a
  redirect.
- `docs/architecture/authentication-architecture.md`, `docs/architecture/route_authentication.md`.

## Known trap

The refresh math is the whole task and it is easy to state approximately. `shouldRefreshSoon`
compares the _remaining_ seconds against `getRefreshWindowSeconds(payload)`, which scales the token's
own lifetime by `jwtRefreshWindowPercentage` — it is not a fixed 60 seconds, and the `jwtClockTolerance`
of 30 s and the `jwtRefreshFallbackSeconds` of 60 apply to different branches (one to verification
slack, the other to the window floor). A run that reports "refresh happens in the last minute" has
guessed, and the timeline is wrong at exactly the boundary the eval cares about.

Second trap: `sessionExpiresIn: 2592000` is not the session. It is the ceiling auth-service stamps
into the JWT as a `sessionExpiresAt` claim and persists on the `User` row; the gateway's
`isSessionExpired` (~L187) reads that claim, subtracts `jwtClockTolerance`, and compares to now. The
real ceiling for a continuously-used account is the refresh token's 7-day life compounded by the
1-day rotation window. Reporting the config number as the session length is the most likely wrong
answer.
