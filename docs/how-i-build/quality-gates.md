# Quality gates: what proves a change

> This document covers **which mechanical gate owns which invariant**, where each runs, and how a
> new gate is added. The rules themselves live in the canonical docs; this is the map.

## Why gates exist

A document is a claim; a gate is proof. Every claim this repo makes about boundaries, tokens,
translations, links, or agent wiring is checked by a command you can name and show output from.
Nothing here grades code — the gates are binary: pass or fail, warning or finding.

## The gate map

| Command                                      | Owns                                                          | Runs in                                                 |
| -------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| `pnpm quality-check`                         | Repository health scan (below); delegates the two named gates | CI (`quality-gate.yml`), local                          |
| `pnpm architecture-check`                    | Import boundaries A1–A5                                       | CI, local                                               |
| `pnpm token-check`                           | Design-token drift (CSS + source)                             | pre-commit, CI (`Lint, typecheck and repository rules`) |
| `pnpm check:i18n`                            | Translation keys used vs. defined, JSON validity              | local, review                                           |
| `pnpm check:links`                           | Relative doc links and anchors                                | CI (via `quality-check`), local                         |
| `pnpm agent-workflow-check`                  | Agent/command/skill harness invariants                        | local, review                                           |
| `pnpm doctor:react`                          | React Doctor (security, perf, correctness, a11y, bundle)      | CI (`quality-gate.yml`, `React Doctor`)                 |
| `pnpm lint` / `typecheck` / `test` / `build` | Per-package checks via Turborepo                              | CI (`quality-gate.yml`), local                          |

## Quality Gate jobs

`quality-gate.yml` is the merge gate and the only required check. Its jobs are named after the
invariant they prove, and the `changes` job decides which of them run:

| Job                                    | Runs when                                                                                                                      | Proves                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `Classify changed areas`               | always (pull request, push, manual dispatch; a manual dispatch sets every bucket true)                                         | Path filters decide which checks the diff can affect                                                   |
| `PR title`                             | pull requests only; a push skips it                                                                                            | The title matches `[PW-<issue>] <type>(<scope>): <subject>`                                            |
| `Lint, typecheck and repository rules` | always; architecture and repository rules always, i18n keys on `i18n`, tokens on `css`, lint and typecheck on `code` or `deps` | Architecture boundaries, repository rules, translation keys/duplicates, design tokens, lint, typecheck |
| `Unit tests`                           | `code` or `deps`                                                                                                               | Vitest across every workspace package                                                                  |
| `Workspace build`                      | `code` or `deps`                                                                                                               | `turbo run build` for every package                                                                    |
| `Workflow lint`                        | `ci` or `deps`                                                                                                                 | actionlint (pinned version and checksum) over every workflow, shellcheck findings included             |
| `Accessibility`                        | `frontend` or `deps`                                                                                                           | axe over every portal route through `e2e/a11y.spec.ts`; story-axe lives in `Component catalogue`       |
| `Component catalogue`                  | `ui` or `deps`                                                                                                                 | Chromium → `test-storybook` over every story → Storybook build → required-story check                  |
| `UI package contract`                  | `frontend` or `deps`                                                                                                           | `@pawhaven/ui` + workspace build → `verify:package` → Portal bundle CSS contract                       |
| `React Doctor`                         | `frontend` or `deps`                                                                                                           | React-specific security, performance and bundle checks                                                 |
| `Dependency review`                    | pull requests only                                                                                                             | `dependency-review` blocks a PR that introduces a high-severity advisory; push runs skip it            |
| `Dependency CVEs (OSV)`                | pull requests, or any run with `deps`                                                                                          | Lockfile CVE scan against OSV, uploaded as SARIF; report-only while the tree has open advisories       |
| `SonarQube analysis (advisory)`        | always                                                                                                                         | Platform analysis; blocking only when `SONAR_REQUIRED=true`                                            |
| `Gate`                                 | always (`if: always()`)                                                                                                        | Fails if any relevant job failed or was cancelled                                                      |

The repository variable `SONAR_REQUIRED` decides whether Sonar's verdict is binding:

| `SONAR_REQUIRED` | Effect                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| unset or `false` | The scan still runs and reports on the PR; `Gate` ignores its result.      |
| `true`           | A failed or cancelled scan fails `Gate`, so the pull request cannot merge. |

It lives in Settings → Secrets and variables → Actions → Variables, so flipping the switch needs no
branch-protection change and no workflow edit.

### Execution model

- `Classify changed areas` runs first and publishes one output per path bucket.
- Every other check declares `needs: [changes]` and runs in parallel: no check waits for another.
  `PR title` is the exception — a push has no title, so it depends only on the event.
- `Gate` needs every job and runs with `if: always()`, so it reports whatever the checks did.
- There is no sequential "gate order". The order in `Gate`'s `needs` list — `changes`, `title`,
  `static`, `unit`, `build`, `workflow-lint`, `a11y`, `catalogue`, `ui-package`, `react-doctor`,
  `security`, `osv`, then the advisory `sonar` — is display-only, as is the order of jobs in the
  file.
- Skipped checks are ignored by `Gate`; a `failure` or `cancelled` result in a job that ran fails
  it. Sonar only counts when `SONAR_REQUIRED=true`.
- Path buckets: `code`, `backend`, `frontend`, `ui`, `i18n`, `css`, `deps`, `ci` — the table below
  lists the globs each owns. A manual dispatch treats every bucket as changed.

| Bucket     | Glob patterns                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `code`     | `**/*.ts`, `**/*.tsx`, `**/*.js`, `**/*.jsx`, `**/*.mjs`, `**/*.cjs`                               |
| `backend`  | `apps/backend/**`, `packages/backend-core/**`, `packages/shared/**`, `libs/**`                     |
| `frontend` | `apps/frontend/**`, `packages/ui/**`, `packages/frontend-core/**`, `packages/design-system/**`     |
| `ui`       | `packages/ui/**`, `packages/design-system/**`, `**/*.stories.*`                                    |
| `i18n`     | `packages/i18n/**`, `apps/frontend/**/*.ts`, `apps/frontend/**/*.tsx`, `packages/frontend-core/**` |
| `css`      | `**/*.css`                                                                                         |
| `deps`     | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`                              |
| `ci`       | `.github/**`                                                                                       |

Because unrelated jobs are skipped, branch protection requires **`Gate` only**. A skipped job is
irrelevant to the diff and `Gate` treats it as passing; a missing required check could never be
distinguished from a pending one, which is why the fan-in job exists.

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

| Workflow                       | Purpose                                                                                                                                                                                                                                                                                                      | Also called by     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| `quality-gate.yml`             | Classifies the diff, runs `Lint, typecheck and repository rules`, `Unit tests`, `Workspace build`, `Workflow lint`, `Accessibility`, `Component catalogue`, `UI package contract`, `React Doctor`, `Dependency review`, `Dependency CVEs (OSV)` and `SonarQube analysis (advisory)`, then reports one `Gate` | —                  |
| `sonar.yml`                    | SonarQube Cloud analysis; blocking only when the `SONAR_REQUIRED` variable is `true`                                                                                                                                                                                                                         | `quality-gate.yml` |
| `opencode-review.yml.disabled` | Disabled, preserved PR reviewer definition — no triggers                                                                                                                                                                                                                                                     | —                  |

The gate runs on pull requests and pushes to `develop`/`main`, and `release.yml` does not re-run
it: a release builds the chosen service and publishes that artifact straight to production after
the `prod` environment approval.

`release.yml` is not a gate: it runs no tests and no lint. It only publishes what the gate already
checked, so the checks that matter are the merge-time gates.

## Adding a gate

1. Put the logic in `scripts/` as one focused Node script with `exit 0 = clean, 1 = finding`.
2. Add a root `package.json` script; never let a gate be invoked ad hoc only.
3. Wire it into `quality-gate.yml` (and `quality-check` if it is a repository-health concern), or
   into the hook that needs it. Gates that share mutable resources stay sequential.
4. Never add a bypass flag. If a gate is wrong, fix the gate in its own change.

## Known gaps

- `auth-service` has no tests (`backend-development-patterns.md` records this as a gap, not a pattern).
- No health endpoints exist, so no gate can probe one.
- `check:i18n` parses top-level locale files only; `documents/` is covered by its own rules.
- Gate coverage is directory-based (`token-check` scans a fixed list of paths); a new package is not
  scanned until it is added to that list.
