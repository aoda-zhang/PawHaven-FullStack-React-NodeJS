# Auth Boundary

## Contents

- [Declaring endpoint policy](#declaring-endpoint-policy)
- [Reading identity](#reading-identity)
- [What the guard actually enforces](#what-the-guard-actually-enforces)
- [Verifying this yourself](#verifying-this-yourself)
- [Reviewing a change here](#reviewing-a-change-here)

The trust model — who mints the internal JWT, how it is signed, and what the gateway resolves — is
owned by [authentication-architecture.md](../../../../docs/architecture/authentication-architecture.md).
This reference holds the implementation side: how to declare policy, how to read identity, and what
counts as a blocking defect in a service.

## Declaring endpoint policy

Policy is declared with a decorator, never inferred. Omitting a decorator is not "public" — it means
**authenticated**.

| Declaration       | Guard behaviour                                                     |
| ----------------- | ------------------------------------------------------------------- |
| _(none)_          | `x-gateway-jwt` must verify **and** be `AUTHENTICATED`, else 401    |
| `@OptionalAuth()` | Verifies if present; claims stay unset on failure; request proceeds |
| `@Public()`       | Same as `@OptionalAuth()` — no identity required                    |

```typescript
import { OptionalAuth, Public } from '@pawhaven/backend-core/decorators';
```

Both `@Public()` and `@OptionalAuth()` are resolved across handler **and** class metadata, so a
class-level decorator applies to every route in it.

## Reading identity

```typescript
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';

@Post()
create(
  @Body({ schema: CreateRescueDtoSchema }) dto: CreateRescueDto,
  @InternalJwt() claims: AuthenticatedInternalJwt,
) {
  return this.rescueService.create(dto, claims);
}
```

`AuthenticatedInternalJwt` carries `sub`, `username`, `rid`, and `kind`. The service takes `claims`
as a **parameter** — it never touches headers.

Never do this in a downstream service:

```typescript
// ✗ all of these are defects
request.headers['x-gateway-jwt'];
request.cookies.token;
jsonwebtoken.decode(request.headers.authorization);
```

## What the guard actually enforces

`InternalJwtGuard.canActivate` does three things, in order:

1. `@Public()` / `@OptionalAuth()` → attempt verification, swallow failures, attach claims if valid,
   **return true**.
2. Otherwise → verify. A verification error becomes `UnauthorizedException`; any other error
   propagates. **This is the fail-closed path** — there is no branch that returns `true` without a
   verified token.
3. A verified token must also have `claims.kind === InternalJwtKind.AUTHENTICATED`. A structurally
   valid token of another kind is rejected. Kind is not decoration.

The guard also compares the `x-trace-id` header against the JWT's `rid` claim. A mismatch is
**logged as a warning, not rejected** — `rid` carries no authorization meaning, and the header stays
authoritative. So a trace mismatch in the logs means a caller assembled the two headers
inconsistently; it is a diagnosability bug, not an auth bypass. Do not "fix" it by rejecting.

## Verifying this yourself

```bash
pnpm --filter @pawhaven/gateway test
pnpm --filter @pawhaven/backend-core test
```

## Reviewing a change here

These are **blocking**, not suggestions:

- A downstream service reading a browser token, a cookie, or `Authorization` directly.
- A new endpoint with no declared policy where the intent was public, or a `@Public()` on something
  that touches user data.
- A guard change that adds a path returning `true` without a verified `AUTHENTICATED` token.
- Verifying the internal JWT with anything other than the configured key map — the guard throws at
  module init if `internalJwt.publicKeys` is empty, which is deliberate.
- A new service that talks to another service without going through the gateway.
