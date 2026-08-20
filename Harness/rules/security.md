# Security Rules

> **Applies to**: Backend agent, Code Review agent, Architect agent.
> **Purpose**: Enforce security practices at design, implementation, and review stages.

## 1. Authentication & Authorization

- All protected endpoints MUST pass through the API Gateway's auth guard.
- JWT is stateless (RS256). Access token = 15 minutes. Refresh token = 7 days.
- RBAC: roles defined in auth-service. Never hardcode role checks without using the RBAC service.
- Frontend routes: `RequireAuth` wrapper for authenticated pages. Route auth flow defined in `knowledge/route_authentication.md`.

## 2. Input Validation

- ALL API inputs MUST go through Zod validation at the controller level.
- Backend: `ZodValidationPipe` from `nestjs-zod`.
- Frontend: Zod schemas in React Hook Form resolvers.
- Never trust client-side validation alone — backend MUST validate independently.

## 3. Secrets & Configuration

- NEVER commit secrets to the repository. Use environment variables.
- `config-service` manages environment-specific configuration.
- API keys, tokens, database URLs: environment variables only.
- `.env` files are gitignored. `.env.example` templates are ok (no real values).

## 4. Data Protection

- Password hashing: bcrypt with appropriate salt rounds.
- Sensitive data in logs: MASK personally identifiable information (PII) before logging.
- SQL/NoSQL injection: Use Prisma's parameterized queries — never string interpolation.
- MongoDB injection: Never construct raw queries with user input.

## 5. API Security

- Rate limiting: configured at gateway level.
- CORS: restrict to known origins (configured per environment).
- HTTPS: enforced in production (redirect HTTP → HTTPS at gateway).
- Input size limits: configured at gateway for request body size.

## 6. Dependency Security

- Regular `pnpm audit` for vulnerable dependencies.
- Critical dependencies should be pinned to specific versions.
- Review third-party package permissions before adding.

## 7. Security in Code Review

- Security issues are ALWAYS ❌ Blocking severity.
- Code review must check: auth guards present, input validation, no secret exposure, no injection vectors.
- Security bugs: fix immediately, skip plan approval step, add regression test.
