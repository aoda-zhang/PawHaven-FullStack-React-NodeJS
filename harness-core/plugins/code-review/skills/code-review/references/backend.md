# Backend review

Applies when the change touches backend source or a service contract. The **rules** are owned by the
[backend skill](../../../../backend-development/skills/backend/SKILL.md) and its references; this file is
how a reviewer detects and judges a violation of them.

## Order

1. Run the project-specific checks below.
2. Read the backend skill and the reference for the area the diff touches.
3. Read the diff, then the code around it.
4. Judge the trust model before anything else, when the diff touches auth or a request edge.

## Project-specific checks

Both are `BLOCKING`.

```bash
rg -n 'console\.log' apps/backend --glob '*.ts' --glob '!**/node_modules/**' --glob '!**/dist/**' \
  --glob '!**/*.test.ts' --glob '!**/*.spec.ts'

rg -n ': any\b|<any>' apps/backend --glob '*.ts' --glob '!**/node_modules/**' --glob '!**/dist/**' \
  --glob '!**/*.test.ts' --glob '!**/*.spec.ts'
```

- **Debug logging in production code.** Backend code logs through the framework logger, which is what
  every service in the tree does. **The linter does not enforce this** — the console rule is off for
  backend — so a green lint run says nothing about it and this command is the only check.
- **`any`.** Untyped data crossing controller → service → persistence produces runtime errors that are
  expensive to trace. The linter reports this as a warning, not an error; this dimension is stricter
  than the linter on purpose.

Both commands return candidates. Open the line and judge it.

## Module shape

Read [module-anatomy.md](../../../../backend-development/skills/backend/references/module-anatomy.md).

- Is the module **flat** — one module, one service, one controller, one co-located test? A new
  `entities/`, `use-cases/`, `events/`, or barrel `index.ts` is a finding.
- Does the module export **its service and nothing else**? Every extra export is surface another module
  can couple to.
- Is a new module registered in the application module's imports?
- Do relative imports carry the explicit extension the module resolution mode requires?

## Controller and service separation

- **Does the controller do anything but bind and delegate?** A controller that branches on domain
  state has become the service.
- **Is the response validated before it leaves the service?** The service builds a shape; the shape is
  parsed against the shared schema before it is returned. Trusting the shape you just built is how a
  response contract rots.
- **Is the error a generic typed exception rather than a persistence error's text?** The client never
  sees the driver's error text. Leaking it is a security finding, not a style one.

## Validation at both edges

- **Is every inbound `@Body` / `@Query` given a schema from the shared types?** There is no global
  validation pipe in this repository, so a body without a schema is unvalidated. This is
  `BLOCKING`.
- **Is the schema imported rather than redeclared?** A schema redefined on the backend is two sources
  of truth for one contract. It belongs in the shared types, and its duplication is an
  [architecture](./architecture.md) finding.
- **Does the validated type and the schema's inferred type agree?** A hand-written type beside a
  schema that says something else is a type defect, not a style one.

## Auth declarations

Read [auth-boundary.md](../../../../backend-development/skills/backend/references/auth-boundary.md).
This is the trust model, and a violation of it is `BLOCKING` under
[security.md](./security.md) as well.

- **Is the endpoint's policy declared?** The absence of a decorator means "authenticated", which is
  correct only when that was a decision. A public endpoint with no declaration is a finding.
- **Is identity read through the internal-claims parameter, never from a raw header or cookie?** A
  handler that parses a header itself is blocking, however clean it looks.
- **Is the trust model redesigned?** It is fixed. A per-feature deviation is not a feature decision.

## Data access

Read [data-and-validation.md](../../../../backend-development/skills/backend/references/data-and-validation.md).

- **Is the client injected by decorator rather than constructed or typed as a constructor parameter?**
- **Is a query shaped for the read rather than the whole document?**
- **Is an update scoped?** An update without a filter is a defect even when the caller is trusted.
- **Is a write's failure path handled** rather than assumed impossible?

## Backend service tests

Read [backend-service-tests.md](../../../../testing/skills/testing-standards/references/backend-service-tests.md).

- Is the persistence double hand-built, and does it distinguish the call shapes the service actually
  uses? A double that treats a narrow lookup and a full read as one passes a test the real client
  fails.
- Is the error path covered, so the rejection branch is reachable?
- Are assertions on the typed exception the service throws, not on the driver's message?

Test completeness as a whole is [testing.md](./testing.md).

## What this dimension does not judge

Frontend rules, the general quality questions, and the boundary questions are in
[frontend.md](./frontend.md), [code-quality.md](./code-quality.md), and
[architecture.md](./architecture.md).
