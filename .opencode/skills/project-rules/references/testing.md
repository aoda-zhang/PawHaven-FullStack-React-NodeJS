# Testing Rules

> **Applies to**: Testing agent, Frontend agent, Backend agent.
> **Purpose**: Define testing standards and expectations.

## 1. Test File Placement

- Test files live NEXT to the source they test: `foo.test.ts` alongside `foo.ts` — that is the only
  suffix in the repo (29 files, zero `.spec.ts`).
- E2E tests go in `e2e/` at the project root, as `playwright.config.ts` sets `testDir: './e2e'`.
  The directory is currently empty; `pnpm test:e2e` runs Playwright against it.
- Never place tests in a separate `__tests__/` directory unless it's a shared test utility.

## 2. Coverage

**No coverage threshold is enforced** — not in any `vitest.config.ts`, not in CI, not in
`testing-standards`. Do not quote a target percentage as a project rule, and do not cite a
per-layer table that no config backs.

The gate is behavioural, not numerical: a test earns its place by **failing when the behaviour
breaks**. `testing-standards` → _What a test must earn_ is the authority on which surface, which
layer, and what it would catch.

## 3. Test Pyramid

- **Unit tests**: Most tests belong here. Test individual functions, components, hooks.
- **Integration tests**: Test module-to-module and module-to-DB interactions.
- **API tests**: Test HTTP endpoints with real or simulated requests.
- **E2E tests**: Critical user flows only. Login, rescue case lifecycle, report-animal flow.

## 4. Test Priority

1. Happy path (the feature works correctly under normal conditions)
2. Error handling (the feature fails gracefully)
3. Edge cases (empty, null, boundary, concurrent)
4. Regression (previous bugs don't re-appear)

## 5. Mocking Rules

- Mock EXTERNAL dependencies (APIs, databases in unit tests, third-party services).
- Do NOT mock INTERNAL modules that are part of the system under test.
- **Vitest everywhere** — backend and frontend both run Vitest (`vi.fn()` / `vi.mock()`). Jest is not
  installed; the `@types/jest` entries in a few `package.json` files are stale leftovers, not a
  second test stack.
- `data-testid` attributes on interactive elements for reliable E2E selectors.

## 6. Test Execution

Failed tests:

- Testing agent reports failures with file:line, expected vs actual, stack trace.
- Testing agent does NOT fix code — the implementing agent fixes.
- After fix: re-run ALL tests for the affected module (not just the failing one).

Regression tests for bug fixes:

- Write the test FIRST (it fails, confirming the bug).
- Apply the fix (test now passes).
- This test stays in the suite permanently.
