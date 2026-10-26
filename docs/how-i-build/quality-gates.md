# Quality gates: what proves a change

> This document covers **which mechanical gate owns which invariant**, where each runs, and how a
> new gate is added. The rules themselves live in the canonical docs; this is the map.

## Why gates exist

A document is a claim; a gate is proof. Every claim this repo makes about boundaries, tokens,
translations, links, or agent wiring is checked by a command you can name and show output from.
Nothing here grades code — the gates are binary: pass or fail, warning or finding.

## The gate map

| Command                                      | Owns                                                          | Runs in                           |
| -------------------------------------------- | ------------------------------------------------------------- | --------------------------------- |
| `pnpm quality-check`                         | Repository health scan (below); delegates the two named gates | CI (`test.yml`), local            |
| `pnpm architecture-check`                    | Import boundaries A1–A5                                       | CI, local                         |
| `pnpm token-check`                           | Design-token drift (CSS + source)                             | pre-commit, CI (`ui-library.yml`) |
| `pnpm check:i18n`                            | Translation keys used vs. defined, JSON validity              | local, review                     |
| `pnpm check:links`                           | Relative doc links and anchors                                | CI (via `quality-check`), local   |
| `pnpm agent-workflow-check`                  | Agent/command/skill harness invariants                        | local, review                     |
| `pnpm doctor:react`                          | React Doctor (security, perf, correctness, a11y, bundle)      | CI (`react-doctor.yml`)           |
| `pnpm lint` / `typecheck` / `test` / `build` | Per-package checks via Turborepo                              | CI (`test.yml`), local            |

## What `quality-check` owns

`scripts/check-quality.mjs` is a scan, not an aggregator of everything:

1. **Orphaned docs** — a `docs/**/*.md` file no entry point reaches.
2. **Stale paths** — a live reference to a resource the refactor retired.
3. **Duplicate-rule candidates** — the same normative sentence in two files (warning-only; a human
   decides whether it is a restatement or a reference).
4. **Rules pointer** — `docs/context/agent-constraints.md` is reachable from `AGENTS.md`.
5. **Approval workflow** — every file-change entry point requires explicit plan approval.

It **delegates** rather than duplicates: `architecture-check` and `check:links` run as subprocesses
and their exit status is folded into its own. Token checks and harness verification are named as
owners, not reimplemented.

## Architecture rules A1–A5

`scripts/check-architecture.mjs` enforces what the architecture docs describe:

| Rule | Enforces                                                                                |
| ---- | --------------------------------------------------------------------------------------- |
| A1   | Package dependency direction; a backend service imports packages, never another service |
| A2   | Frontend slice isolation, except an explicit allowlist                                  |
| A3   | `core-service` cross-module imports only from `home`, via an explicit allowlist         |
| A4   | Only `portal` exists; there is no `apps/frontend/admin`                                 |
| A5   | Frontend layer direction — each layer reads only the layers below it                    |

An unlisted deviation fails the gate. A deliberate deviation is an allowlist entry in the same
change, plus a note in the affected feature doc.

## Local hooks

| Hook         | Runs                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `pre-commit` | `lint-staged` (ESLint `--fix`, Prettier) on staged files, then `@pawhaven/design-system` `token-check` |
| `commit-msg` | `commitlint --edit` against `commitlint.config.cjs`                                                    |

The hooks are a fast local filter, not the full suite: `pnpm lint`, `pnpm typecheck`, and the tests
still run in CI.

## CI wiring

| Workflow              | Purpose                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml`            | Install (frozen lockfile) → Prisma clients → `build:libs` → architecture/token/quality gates → lint, typecheck, test, build; a separate job runs Playwright E2E |
| `ui-library.yml`      | `token-check` → build `@pawhaven/ui` with workspace deps → `verify:package` → UI tests                                                                          |
| `storybook.yml`       | Install Chromium → `test-storybook` (Storybook tests in a real browser) → build Storybook                                                                       |
| `react-doctor.yml`    | React Doctor scan on PRs and `main`                                                                                                                             |
| `opencode-review.yml` | Read-only agent review of the PR diff (non-blocking)                                                                                                            |
| `deploy.yml`          | Manual per-service deployment (see [CI/CD](ci-cd.md))                                                                                                           |

## Adding a gate

1. Put the logic in `scripts/` as one focused Node script with `exit 0 = clean, 1 = finding`.
2. Add a root `package.json` script; never let a gate be invoked ad hoc only.
3. Wire it into `test.yml` (and `quality-check` if it is a repository-health concern), or into the
   hook that needs it. Gates that share mutable resources stay sequential.
4. Never add a bypass flag. If a gate is wrong, fix the gate in its own change.

## Known gaps

- `auth-service` has no tests (`backend-development-patterns.md` records this as a gap, not a pattern).
- No health endpoints exist, so no gate can probe one.
- `check:i18n` parses top-level locale files only; `documents/` is covered by its own rules.
- Gate coverage is directory-based (`token-check` scans a fixed list of paths); a new package is not
  scanned until it is added to that list.
