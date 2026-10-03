---
name: backend-doctor
description: >
  Backend code quality detection. Covers: console.log in backend (forbidden, use Logger service),
  TypeScript any type (forbidden). All Blocking.
  Trigger: backend NestJS console.log any type backend code quality.
---

# backend-doctor — Backend Code Quality

## Responsibility

Detect common quality issues in backend code. The backend source roots are known, so they are named
rather than discovered — `apps/backend/*/src`, which is `core-service`, `gateway`, `auth-service`,
and `document-service`.

## Rules

### Rule 1: console.log in backend source

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n 'console\.log' apps/backend --glob '*.ts' \
    --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/*.test.ts' --glob '!**/*.spec.ts'
  ```
- **Explanation**: `console.log` is forbidden in backend production code. Use the NestJS `Logger`
  (`private readonly logger = new Logger(ClassName.name)`) or the logging service. Console output is
  uncontrolled, cannot be filtered by level, and bypasses the logging infrastructure.
- **This rule is not mechanically enforced.** `libs/eslint-config/node.js` sets `no-console: 'off'`
  for backend, so a green `pnpm lint` says nothing about it. The command is the only check.
- **Known hit**: `apps/backend/document-service/src/modules/email/email.service.ts` logs a caught
  error with `console.log`. It is pre-existing — report it as a finding about the codebase, not as a
  regression from the change under review.

### Rule 2: TypeScript `any` type in backend

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n ': any\b|<any>' apps/backend --glob '*.ts' \
    --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/*.test.ts' --glob '!**/*.spec.ts'
  ```
- **Explanation**: `any` disables type checking. In backend code, where data crosses
  controller → service → Prisma, untyped data produces runtime errors that are expensive to trace. Use
  `unknown`, a proper DTO, or a generic.
- **Also a warning, not an error, in ESLint** — `no-explicit-any` is configured as a warning in the
  node config. So this is a warning in lint output and a blocking finding here; the two disagree by
  design, and this doctor is the stricter of the two.

## Execution

1. Run both commands; they are independent and can run together.
2. All violations are ❌ Blocking.
3. Report: each violation with file path, line number, the matched text, and which rule it breaks.
4. If a hit is pre-existing, report it as such and do not attribute it to the change under review.

## Related

- Architecture: [architecture-doctor](../architecture-doctor/SKILL.md) · boundaries: [boundary-doctor](../boundary-doctor/SKILL.md)
- Frontend pairing: [react-doctor](../../../agents/frontend/review/skills/react-doctor/SKILL.md)
- Standards: [backend](../../../skills/backend/SKILL.md) — what the linter will and will not catch
