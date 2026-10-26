# CI/CD: what runs, and how a service ships

> This document covers **the workflows and the deployment path**. Gate semantics live in
> [Quality Gates](quality-gates.md); deployment claims in the architecture docs are mirrored here
> only where the workflow is the source of truth.

## Principle

CI proves; CD promotes. Nothing reaches a deployed service without passing the same gates a
developer runs locally, and deployment is a manual, explicit action — not a side effect of merging.

## Workflows

| Workflow              | Trigger                      | What it does                                                                                                                                                                                   |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml`            | PR, push, manual             | Install (frozen lockfile) → generate Prisma clients → `build:libs` → architecture/token/quality gates → lint, typecheck, test, build; a separate job installs Chromium and runs Playwright E2E |
| `ui-library.yml`      | PR, push, manual             | `token-check` → build `@pawhaven/ui` and workspace deps → `verify:package` → UI tests                                                                                                          |
| `storybook.yml`       | PR, push, manual             | Install Chromium → `test-storybook` (Storybook tests in a real browser) → build Storybook                                                                                                      |
| `react-doctor.yml`    | PR, push to `main`           | React Doctor scan (`millionco/react-doctor@v2`, version pinned to `0.9.12`)                                                                                                                    |
| `opencode-review.yml` | PR                           | Read-only agent review of the PR diff; cancellation is concurrency-grouped per PR                                                                                                              |
| `deploy.yml`          | Manual (`workflow_dispatch`) | Resolve one service → install/build → deploy preview → deploy production on Vercel                                                                                                             |

## Version and install discipline

Both the app and the deploy workflows resolve Node from `package.json` `engines` and install the
package manager with `corepack enable && corepack install`, then run
`pnpm install --frozen-lockfile`. The lockfile is the contract; CI never updates it.

## Build order

Downstream apps consume **built** packages, not source. Every workflow therefore runs
`pnpm build:libs` (or a filtered `...` build) before typecheck, test or build. Prisma clients are
generated explicitly (`prisma:generate-mongodb` for `core-service` and `auth-service`) before any
typecheck or test.

## Deployment path

`deploy.yml` is manual and per-service:

1. `resolve` — `service-resolver` maps the chosen service (`portal`, `gateway`, `core-service`,
   `auth-service`, `document-service`) to a path, a Turborepo build filter, and a
   `VERCEL_PROJECT_ID_*` secret name.
2. `install_build` — the shared install/build action.
3. `deploy_preview` — deploy the target to Vercel preview (`environment: preview`).
4. `deploy_production` — deploy to Vercel production, gated on the preview job succeeding.

The portal also publishes a Cloudflare Pages preview through the GitHub integration; that
configuration lives in the Cloudflare dashboard, not in this repository.

## Concurrency and safety

- The PR-review workflow cancels superseded runs per PR; the deploy workflow never runs
  preview and production in parallel (`needs` chain).
- The PR reviewer runs with `contents: read`; the workflow must not gain `contents: write`.
- A service that is not listed in `service-resolver` cannot be deployed — adding a service means
  adding its case and its project secret.

## Adding a workflow

1. Reuse the version/install/corepack steps; do not hardcode a Node version.
2. Run `build:libs` and Prisma generation before anything that typechecks or tests.
3. Keep write permissions minimal; the PR reviewer stays read-only for repository contents.
4. Name the job after the invariant it proves, and make the failing step name the command it ran.
