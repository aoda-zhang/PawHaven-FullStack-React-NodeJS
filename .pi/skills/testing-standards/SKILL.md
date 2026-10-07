---
name: testing-standards
description: >
  How to write and run a test in PawHaven, and what a test has to earn. The stack is vitest
  everywhere — Jest is NOT installed. Covers co-location, service tests with a hand-built Prisma
  double, jsdom component tests with browser-API polyfills, and the unplugin-swc requirement in
  backend-core. Read before writing a test, deciding whether a change needs one, or reporting a test
  result.
  Trigger: test testing unit test integration test e2e end-to-end API test regression, vitest jest
  playwright test runner config jsdom testing-library render hook mock stub spy assert coverage,
  prisma mock test double fixture builder, nest testing module Test.createTestingModule dependency
  injection, test placement co-located tests directory convention.
---

# Testing Standards

## The stack is vitest

Jest is not installed anywhere in this monorepo. Writing `jest.fn()` produces a test that cannot run.

| Layer              | Runner     | Library                                           |
| ------------------ | ---------- | ------------------------------------------------- |
| Backend unit       | vitest     | `vi.fn()`, hand-built doubles                     |
| Backend HTTP       | vitest     | `supertest` (gateway, auth-service, backend-core) |
| Frontend component | vitest     | `@testing-library/react` + `jest-dom/vitest`      |
| Shared / packages  | vitest     | per-package `vitest.config.ts`                    |
| E2E                | playwright | `@playwright/test`                                |

## Run them

```bash
pnpm test                                    # turbo run test — all packages
pnpm --filter @pawhaven/core-service test
pnpm --filter @pawhaven/portal test
pnpm test:e2e                                # playwright
```

`@pawhaven/shared` runs `vitest run --passWithNoTests`; an empty result there is not a failure. What
`pnpm test:e2e` currently collects is recorded in
[docs/quality](../../../docs/quality/README.md), not here.

## Where tests live

Co-located, never in a top-level `tests/` or `__tests__/` directory:

```
src/modules/rescue/rescue.service.test.ts        # backend — beside the unit under test
src/features/rescue-detail/tests/*.test.tsx      # frontend — a tests/ dir inside the feature
packages/ui/src/components/timeline/*.test.tsx   # packages — inside the component folder
```

`*.test.ts` / `*.test.tsx` is the only test suffix in the repo. There are no `.spec.ts` files and no
`__tests__/` directories.

## Backend service tests

`rescue.service.test.ts` is the reference shape:

1. **Import `vi` from `vitest`** — not globals, even though `packages/ui` sets `globals: true`.
2. **Build records through a factory with overridable defaults.** The reference builds
   `buildRecord(overrides)` once and spreads the overrides last. A literal fixture duplicated across
   cases drifts the moment a field is added.
3. **Double Prisma by hand.** There is no `prisma-mock` dependency. The double is a `vi.fn()` per
   model method wired into a fake client, and it must distinguish the call shapes the service
   actually uses — a narrow `select` lookup is not the general case, and a double that treats them
   as one passes a test the real client would fail.
4. **Cover the error path explicitly.** The double accepts `Error` in place of records so the
   rejection branch is reachable.
5. **Assert on the thrown `BadRequestException` / `NotFoundException`**, not on Prisma's error text —
   the service deliberately hides internals from clients.

→ [references/backend-service-tests.md](./references/backend-service-tests.md) — the factory, the
double, the error-path shape, HTTP tests, and what not to do.

## Frontend component tests

`packages/ui/src/components/carousel/tests/Carousel.test.tsx` is the reference. Three rules:

- **The `// @vitest-environment jsdom` pragma is per-file.** Put it at the top of every DOM test.
- **Import `@testing-library/jest-dom/vitest`** for the custom matchers.
- **Polyfill browser APIs; do not mock the component's dependencies.** jsdom implements none of
  `matchMedia`, `IntersectionObserver`, or `ResizeObserver`, so a library like Embla fails at init.
  Stub the **environment**, not the thing under test: a test that mocks the component's own
  collaborators proves nothing about the component.

→ [references/frontend-component-tests.md](./references/frontend-component-tests.md) — the working
test file and the three polyfill stubs.

## Browser verification

`e2e/smoke.spec.ts` is the Playwright substrate: the portal boots, mounts its root, and raises no
uncaught exception. It needs only the portal, which `playwright.config.ts` starts for you. A deeper
journey belongs in its own spec file, added by the change that needs it.

→ [references/browser-verification.md](./references/browser-verification.md) — the config, the commands,
the ports, the preconditions, and the console/network capture snippets.

## backend-core needs SWC

`packages/backend-core/vitest.config.ts` registers `unplugin-swc`. esbuild, vitest's default
transformer, does not emit `design:paramtypes`, so NestJS cannot resolve constructor dependencies in
tests. SWC does.

If `Test.createTestingModule` cannot resolve a constructor dependency, this is why. Do not "fix" it
by removing the plugin.

## What a test must earn

A test earns its place by failing when the behaviour breaks. That is the gate, not a number. **No
coverage threshold is enforced**, not in any `vitest.config.ts` and not in CI. Do not quote a target
percentage as a project rule.

Before writing one, answer:

- **Which surface?** The original repro, on the same surface that failed. Inconclusive or
  wrong-surface is not a pass.
- **Which layer?** Unit for logic, HTTP for a contract, component for rendering and interaction. Do
  not test a service through three layers at once.
- **What would it catch?** If the answer is "nothing specific", delete it.

Never mark something verified because it compiles. See
[prove-it-works](../principles/references/prove-it-works.md).

## Related

- Test review: [test-doctor](../code-review/test-doctor/SKILL.md)
- Current measured state: [docs/quality](../../../docs/quality/README.md)
