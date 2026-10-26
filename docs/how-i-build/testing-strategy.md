# Testing strategy: which layer proves what

> This document covers **how a change is tested**: the layers, the commands, and what each layer is
> allowed to claim. Verification rules for an agent run live in the `verification` skill; this is the
> as-built test architecture.

## Layers

| Layer                | Tool                                              | Location                                               | Proves                                                 |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Static               | TypeScript, ESLint, architecture/token/link gates | workspace                                              | Types, style, boundaries, tokens, docs links           |
| Unit                 | Vitest                                            | co-located `*.test.ts` beside source                   | Pure logic, services, guards, mappers                  |
| Page-slice component | Vitest + Testing Library                          | one `tests/` directory directly under `pages/<slice>/` | User-observable behaviour of a page and its components |
| Storybook browser    | Vitest browser mode + Playwright Chromium         | `packages/ui/.storybook/vitest.config.ts`              | Stories render and behave in a real browser            |
| E2E                  | Playwright                                        | repo root (`pnpm test:e2e`)                            | Real user journeys against a running app               |

## Commands

| Command                                     | Runs                               |
| ------------------------------------------- | ---------------------------------- |
| `pnpm test`                                 | `turbo run test` across workspaces |
| `pnpm --filter @pawhaven/core-service test` | One service's suite                |
| `pnpm --filter @pawhaven/portal test`       | Portal page-slice tests            |
| `pnpm --filter @pawhaven/ui test`           | UI component tests                 |
| `pnpm --filter @pawhaven/ui test-storybook` | Storybook stories in real Chromium |
| `pnpm --filter @pawhaven/ui test:cov`       | UI coverage run                    |
| `pnpm test:e2e`                             | Playwright end-to-end              |

## What each layer must assert

- **Backend**: what a caller can observe — status, envelope, headers. A guard test must fail without
  the guard; an authentication change without one is not finished.
- **Frontend**: what a user can observe. A bug's reproduction must fail before the fix and pass
  after it, on the same surface. Do not restate the implementation in a test.
- **Storybook**: the story itself is the fixture; the browser test proves interaction and rendering,
  including accessibility checks via the `@storybook/addon-a11y` addon.
- **E2E**: only journeys the acceptance criteria name; direct entry and in-app navigation for routes,
  allowed and denied paths for authorization.

## CI wiring

- `test.yml` runs the gates, then lint/typecheck/test/build, and a separate job installs Chromium and
  runs `pnpm test:e2e`.
- `ui-library.yml` builds `@pawhaven/ui` and its workspace dependencies, runs `verify:package`, then
  the UI suite.
- `storybook.yml` installs Chromium, runs `test-storybook`, then builds the catalogue.
- `react-doctor.yml` adds a static React-health scan on PRs.

## Rules

- Run only existing checks; do not add a test framework or bypass a gate.
- A passing build or typecheck does not prove runtime behaviour; state which layer proved what.
- Never edit tests to mask a defect; a missing regression test is reported as a gap.
- Serialize tests that share a database, port, fixture, account or browser session.

## Known gaps

- `auth-service` has no tests today — a recorded gap, not a pattern.
- E2E depends on a running app, services and data; when absent, report `NOT RUN`, never a pass.
- There are no automated tests for the `.opencode/plugins/*` model-routing plugins.
