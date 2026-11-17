# CI/CD: what runs, and how a service ships

> This document covers **the workflows and the deployment path**. Gate semantics live in
> [Quality Gates](quality-gates.md); deployment claims in the architecture docs mirror the platform
> configuration, which lives outside this repository.

## Principle

CI proves; CD promotes. The quality gate is the merge-readiness signal and reproduces the checks a
developer runs locally; platform previews deploy on push, and they are gated only when the platform
is configured to require that check.

## Workflows

| Workflow                       | Trigger            | What it does                                                                                                                                                                                   |
| ------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml`                     | PR, push, manual   | Install (frozen lockfile) → generate Prisma clients → `build:libs` → architecture/token/quality gates → lint, typecheck, test, build; a separate job installs Chromium and runs Playwright E2E |
| `ui-library.yml`               | PR, push, manual   | `token-check` → build `@pawhaven/ui` and workspace deps → `verify:package` → UI tests                                                                                                          |
| `storybook.yml`                | PR, push, manual   | Install Chromium → `test-storybook` (Storybook tests in a real browser) → build Storybook                                                                                                      |
| `react-doctor.yml`             | PR, push to `main` | React Doctor scan (`millionco/react-doctor@v2`, version pinned to `0.9.12`)                                                                                                                    |
| `opencode-review.yml.disabled` | None               | PR review definition is preserved but disabled: GitHub ignores the non-`.yml` filename, so it triggers nothing                                                                                 |

## Version and install discipline

Workflows that install workspace dependencies resolve Node from `package.json` `engines` and install
the package manager with `corepack enable && corepack install`, then run
`pnpm install --frozen-lockfile`; `react-doctor.yml` only runs the pinned scanner. The lockfile is
the contract; CI never updates it.

## Build order

Downstream apps consume **built** packages, not source. Every workflow therefore runs
`pnpm build:libs` (or a filtered `...` build) before typecheck, test or build. Prisma clients are
generated explicitly (`prisma:generate-mongodb` for `core-service` and `auth-service`) before any
typecheck or test.

## Deployment path

There is no repository-side deploy workflow. Deployment is configured in the platform dashboards
outside this repository:

- **Backend services** — Vercel deploys services from their own projects, keyed on each project's
  root directory (for example `document-service`, `core-service`, `auth-service`, as configured in
  the Vercel dashboard).
- **Portal** — Cloudflare Pages publishes the portal through its GitHub integration; that
  configuration lives in the Cloudflare dashboard.

Preview and production promotion happen in those platforms, not in GitHub Actions.

## Concurrency and safety

- The preserved PR-review definition keeps its per-PR concurrency group, so a re-enabled run would
  cancel superseded ones; as long as it is disabled it triggers nothing.
- The PR reviewer definition must stay read-only for repository contents — `contents: read`, never
  `contents: write`.
- Preview and production ordering now lives in the platform Git integrations, so this repository no
  longer enforces it with a `needs` chain.

## Adding a workflow

1. Reuse the version/install/corepack steps; do not hardcode a Node version.
2. Run `build:libs` and Prisma generation before anything that typechecks or tests.
3. Keep write permissions minimal; the PR reviewer stays read-only for repository contents.
4. Name the job after the invariant it proves, and make the failing step name the command it ran.
