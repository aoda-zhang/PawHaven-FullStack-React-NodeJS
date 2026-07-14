# Testing Rules

> **Applies to**: Testing agent, Frontend agent, Backend agent.
> **Purpose**: Define testing standards and expectations.

## 1. Test File Placement

- Test files live NEXT to the source they test: `foo.spec.ts` alongside `foo.ts`.
- E2E tests: `e2e/` directory at the project root.
- Never place tests in a separate `__tests__/` directory unless it's a shared test utility.

## 2. Coverage Targets

| Layer                 | Target | Hard Minimum |
| --------------------- | ------ | ------------ |
| Use-cases (backend)   | 90%    | 80%          |
| Services (backend)    | 85%    | 75%          |
| Controllers (backend) | 80%    | 70%          |
| Frontend components   | 75%    | 65%          |
| Frontend hooks        | 85%    | 75%          |
| Shared packages       | 95%    | 90%          |

## 3. Test Pyramid

- **Unit tests**: Most tests belong here. Test individual functions, components, hooks.
- **Integration tests**: Test module-to-module and module-to-DB interactions.
- **API tests**: Test HTTP endpoints with real or simulated requests.
- **E2E tests**: Critical user flows only. Login, rescue case lifecycle, payment flow.

## 4. Test Priority

1. Happy path (the feature works correctly under normal conditions)
2. Error handling (the feature fails gracefully)
3. Edge cases (empty, null, boundary, concurrent)
4. Regression (previous bugs don't re-appear)

## 5. Mocking Rules

- Mock EXTERNAL dependencies (APIs, databases in unit tests, third-party services).
- Do NOT mock INTERNAL modules that are part of the system under test.
- Use Jest mocks for backend, Vitest mocks for frontend.
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
