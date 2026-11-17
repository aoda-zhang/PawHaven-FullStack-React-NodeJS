# CI/CD: what runs, and how a service ships

> This document covers **the workflows and the deployment model**. Gate semantics live in
> [Quality Gates](quality-gates.md); the commands, cluster setup and failure modes live in the
> [deployment runbook](deployment-runbook.md).

## Principle

CI proves; a release tags what already passed; a deploy promotes an image that already exists.
The quality gate is the merge-readiness signal and reproduces the checks a developer runs locally.

There are exactly two deployment entry points — `release.yml` and `deploy.yml` — and both are
`workflow_dispatch` only. No push, tag, schedule or pull request deploys anything.

## Workflows

| Workflow                       | Trigger                                      | What it does                                                                                                                                                                                                                                                                           |
| ------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml`                     | PR, push to `main`, manual, `workflow_call`  | Install (frozen lockfile) → generate Prisma clients → `build:libs` → architecture/token/quality gates → lint, typecheck, `check:i18n`, Storybook axe tests (Chromium), test, build; a separate job installs Chromium and runs Playwright E2E                                           |
| `ui-library.yml`               | PR/push on UI paths, manual, `workflow_call` | `token-check` → build `@pawhaven/ui` and workspace deps → `verify:package` → UI tests → Portal CSS contract checks                                                                                                                                                                     |
| `storybook.yml`                | PR/push on UI paths, manual, `workflow_call` | Install Chromium → `test-storybook` (Storybook tests in a real browser) → build Storybook → verify required stories                                                                                                                                                                    |
| `react-doctor.yml`             | PR, push to `main`                           | React Doctor scan (`millionco/react-doctor@v2`, version pinned to `0.9.12`)                                                                                                                                                                                                            |
| `publish-images.yml`           | `workflow_call` only                         | Build a dynamic matrix of the requested services and push `ghcr.io/aoda-zhang/pawhaven-<service>` with the version tag plus `sha-<7>`                                                                                                                                                  |
| `deploy-k3s.yml`               | `workflow_call` only                         | Preflight the target namespace, apply `deploy/platform/<env>`, then copy each selected service's `<env>` manifests to a temp dir, substitute the version with `sed`, apply, wait for each rollout and assert every Service stays `ClusterIP` with only `gateway` as an Ingress backend |
| `deploy.yml`                   | manual                                       | Deploy an already-published image to `test`, `uat` or `prod`                                                                                                                                                                                                                           |
| `release.yml`                  | manual                                       | Approve, run the gates, tag `main`, publish all deployable services, deploy the selected scope                                                                                                                                                                                         |
| `opencode-review.yml.disabled` | None                                         | PR review definition is preserved but disabled: GitHub ignores the non-`.yml` filename, so it triggers nothing                                                                                                                                                                         |

`publish-images.yml` and `deploy-k3s.yml` carry no trigger of their own. They are reusable
capabilities: `release.yml` and `deploy.yml` are their only callers.

## The two entry points

| Input           | `release.yml`                                                       | `deploy.yml`                                        |
| --------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| Environment     | `prod` only                                                         | `test` \| `uat` \| `prod`                           |
| Service         | `all` \| `gateway` \| `core-service` \| `auth-service`              | same                                                |
| Version         | computed from the date tag                                          | optional; empty means the newest `v*` tag           |
| Builds an image | yes — every deployable service, regardless of the service selection | never                                               |
| Approval        | `prod` environment with required reviewers                          | `prod` environment, only when the target is `prod`  |
| What it changes | creates the tag, then publishes, then deploys the selected scope    | the platform manifests and the selected Deployments |

Service selection controls deployment scope, not what gets built: `release.yml` always publishes
every service that declares a deploy Dockerfile, then deploys the subset you picked.

`release.yml` runs from `main` only. A `prod` run of `deploy.yml` must also be dispatched from
`main` — its `resolve` job rejects any other ref for `prod` — while `test` and `uat` accept any ref
by design, so a branch can be promoted to a non-production namespace for verification.

## Where deploy assets live

Each service owns its deploy assets. There is no shared base and no kustomization step: a deploy
applies plain directories of YAML, each already pinned to one namespace.

```text
apps/backend/<service>/deploy/
├── Dockerfile
└── kubernetes/
    ├── test/
    ├── uat/
    └── prod/
        ├── deployment.yaml
        └── service.yaml

deploy/platform/
├── test/
├── uat/
└── prod/
    ├── namespace.yaml
    ├── network-policies.yaml
    └── serviceaccount.yaml
```

`deploy/platform/<env>` holds only what every service in that namespace shares: the Namespace, three
NetworkPolicies and the `pawhaven-runtime` ServiceAccount. Deployment and Service objects stay beside
the service that owns them, and their image tag is the placeholder `v0.0.0-unspecified` until a deploy
substitutes the version.

A service joins the pipeline by declaring `apps/backend/<service>/deploy/Dockerfile`; the resolvers
scan for that file rather than reading a list. A service whose deploy directory carries an
`.out-of-pipeline` marker is skipped by `deploy.yml` and `release.yml`, and `publish-images.yml`
publishes it only when `include_document_service` is `true`. document-service is that service: Vercel
is its production runtime.

`deploy.yml` and `release.yml` still carry the only static enumeration of services, in their `service`
choice lists, because GitHub computes `choice` options before the workflow runs. Adding a service
means adding its deploy assets and a choice entry.

## Release flow

`release.yml` runs in this order, and each stage depends on the previous one:

1. **Precheck** — the `precheck` job fails unless the dispatched ref is `refs/heads/main`.
2. **Approve** — the `approve` job binds to the `prod` environment, so the run waits for a required
   reviewer.
3. **Resolve** — computes the tag `vYY.MM.DD` in `Asia/Shanghai`; a second release the same day takes
   `-2`, then `-3`. If the candidate tag already points at the same commit, it is reused instead of
   duplicated.
4. **Gate** — `test.yml`, `storybook.yml` and `ui-library.yml` are called as reusable workflows.
   All three must pass.
5. **Tag** — creates and pushes an annotated tag. A tag that already points at another commit fails
   the run instead of being moved.
6. **Publish** — `publish-images.yml` builds every deployable service with `<version>` and `sha-<7>`
   tags. An image whose version tag already exists is left as published.
7. **Deploy** — `deploy-k3s.yml` deploys the selected services to `pawhaven-prod`.

## Tag and rollback discipline

Version tags are immutable image tags, not branches. A deployment always names an existing tag, so
rolling back is a forward deploy of an older version:

```bash
gh workflow run deploy.yml -f environment=prod -f service=all -f version=v26.11.10
```

There is no rebuild and no retag in a rollback. `deploy.yml` preflights that the requested version
exists in `ghcr.io` for every selected service before it touches the cluster.

## Concurrency and safety

- `release.yml` uses the fixed `pawhaven-prod` group with `cancel-in-progress: false`; `deploy.yml`
  uses `pawhaven-${{ inputs.environment }}` with the same policy. Both resolve to `pawhaven-prod` for
  production, so a prod release and a prod deploy cannot overlap.
- `release.yml` writes contents only in the tagging job; publishing adds `packages: write`; every
  other job is read-only.
- `deploy-k3s.yml` runs a guard after applying: every Service, including `gateway`, must be
  `ClusterIP`, and only `gateway` may be an Ingress backend.
- The PR reviewer definition must stay read-only for repository contents — `contents: read`, never
  `contents: write`.

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

## Adding a workflow

1. Reuse the version/install/corepack steps; do not hardcode a Node version.
2. Run `build:libs` and Prisma generation before anything that typechecks or tests.
3. Keep write permissions minimal; the PR reviewer stays read-only for repository contents.
4. Name the job after the invariant it proves, and make the failing step name the command it ran.
5. A workflow that deploys or publishes is a `workflow_call` capability with no trigger of its own;
   a dispatch-only entry point stays the only way to start it.
6. A gate workflow keeps its PR/push triggers and adds `workflow_call`; `release.yml` reuses the
   definition instead of copying steps.
