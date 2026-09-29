# Security Rules

> **Applies to**: Backend agent, Code Review agent, Architect agent.
> **Purpose**: Enforce security practices at design, implementation, and review stages.

## 1. Authentication & Authorization

- All protected endpoints pass through the gateway, which resolves the caller, then downstream
  services verify the internal JWT it signs (see [services](./services.md) §4).
- Two distinct tokens:

  | Token        | Issuer       | Algorithm | Lifetime                                                        |
  | ------------ | ------------ | --------- | --------------------------------------------------------------- |
  | Browser JWT  | auth-service | HS256     | Access **3 min in prod**, 5 min in dev/test/uat; refresh 7 days |
  | Internal JWT | gateway      | **ES256** | 45 s (`internalJwt.ttlSeconds`)                                 |

  The internal JWT is signed with a **private key** and verified against a `kid`-keyed public key —
  it is asymmetric, not a shared secret. Do not describe it as HS256 or reach for `jwtSecret`.

- **RBAC is modelled, but not enforced server-side.** The pieces are real and split across
  services:

  | Where                              | What                                                                        |
  | ---------------------------------- | --------------------------------------------------------------------------- |
  | auth-service Prisma                | `User.roles String[] @default([])`                                          |
  | `@pawhaven/backend-core/constants` | `userRoles` (e.g. `userRoles.volunteer`)                                    |
  | core-service Prisma                | `Role`, `Permission`, `RolePermission`, `MenuPermission`, `RoutePermission` |
  | token flow                         | `roles` rides browser JWT → gateway → internal JWT claims                   |
  | `bootstrap`                        | resolves `roles` → permission codes, default role `guest`                   |

  **No endpoint checks a role or permission to allow or deny a request.** There is no roles guard
  and no role-based 403 path — permissions gate _display_ (which menus render), not access. So:
  do not describe an API as "role-protected", do not cite an "RBAC service" (there is no such
  class), and do not add a permission check without first deciding where enforcement belongs.

- Frontend route gating is the `requireUser` route loader in
  `apps/frontend/portal/src/features/auth/route.tsx` — it ensures the current-user query, and
  `redirect`s to login on failure. There is no `RequireAuth` wrapper component.
  Route auth flow: [`docs/architecture/route_authentication.md`](../../../../docs/architecture/route_authentication.md).

## 2. Input Validation

- ALL API inputs MUST go through Zod validation at the controller level, using the NestJS `schema`
  option: `@Body({ schema: XSchema })`. See [services](./services.md) §6.
- Frontend: Zod schemas in React Hook Form resolvers.
- Never trust client-side validation alone — backend MUST validate independently.

## 3. Secrets & Configuration

- NEVER commit secrets to the repository. Use environment variables.
- Per-service configuration lives in `apps/backend/<service>/src/config/<env>/env/`, read through
  `ConfigService` with `getOrThrow`. See [architecture](./architecture.md) Rule 8.
- API keys, tokens, database URLs: environment variables only.
- `.env` files are gitignored; `.env.example` templates carry placeholders only.

## 4. Data Protection

- Password hashing: bcrypt with appropriate salt rounds.
- Sensitive data in logs: MASK personally identifiable information (PII) before logging.
- SQL/NoSQL injection: Use Prisma's parameterized queries — never string interpolation.
- MongoDB injection: Never construct raw queries with user input.

## 5. API Security

- Rate limiting: configured at gateway level — `GatewayThrottleGuard`, an in-process `Map` capped
  at 10 000 clients. Not distributed.
- CORS: restrict to known origins (configured per environment).
- **HTTPS is not enforced by this codebase.** There is no HTTP→HTTPS redirect in the gateway; TLS
  termination belongs to the deployment layer. Do not add an app-level redirect without a decision.
- Input size limits: configured at gateway (`http.maxJsonBodySize`).

## 6. Dependency Security

- Regular `pnpm audit` for vulnerable dependencies.
- Critical dependencies should be pinned to specific versions.
- Review third-party package permissions before adding.

## 7. Security in Code Review

- Security issues are ALWAYS ❌ Blocking severity.
- Code review must check: auth guards present, input validation, no secret exposure, no injection vectors.
- Security bugs: fix immediately, skip plan approval step, add regression test.
- Exception scope: security bugs still skip the approval step, but must still declare the classification and the matched workflow before dispatching, and still go through a lane — never implement directly.
