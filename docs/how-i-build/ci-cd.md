# CI/CD: what runs, and how a service ships

> This document covers **the workflows and the deployment model**. Gate semantics live in
> [Quality Gates](quality-gates.md); the commands, cluster setup and failure modes live in the
> [deployment runbook](deployment-runbook.md). Repository settings — branch protection and required
> status checks — are in [Repository protection](#repository-protection).

## Principle

CI proves; a release tags what already passed and pushes it to GHCR; a deploy builds the selected
branch as `sha-<7>` and ships it. The quality gate is the merge-readiness signal and reproduces the
checks a developer runs locally.

There are exactly two deployment entry points — `release.yml` and `deploy.yml` — and both are
`workflow_dispatch` only. No push, tag, schedule or pull request deploys anything.

## Workflows

| Workflow                       | Trigger                              | What it does                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml`                     | PR, push to `main`, `workflow_call`  | Install (frozen lockfile) → generate Prisma clients → `build:libs` → architecture/token/quality gates → lint, typecheck, `check:i18n`, Storybook axe tests (Chromium), test, build; a separate job installs dependencies, builds the workspace packages, installs Chromium and runs Playwright E2E |
| `ui-library.yml`               | PR/push on UI paths, `workflow_call` | `token-check` → build `@pawhaven/ui` and workspace deps → `verify:package` → UI tests → Portal CSS contract checks                                                                                                                                                                                 |
| `storybook.yml`                | PR/push on UI paths, `workflow_call` | Install Chromium → `test-storybook` (Storybook tests in a real browser) → build Storybook → verify required stories                                                                                                                                                                                |
| `react-doctor.yml`             | PR, push to `main`                   | React Doctor scan (`millionco/react-doctor@v2`, version pinned to `0.9.12`)                                                                                                                                                                                                                        |
| `deploy-k3s.yml`               | `workflow_call` only                 | Apply `deploy/platform/<env>`, then copy each selected service's `<env>` manifests to a temp dir, substitute the version with `sed`, apply and wait for each rollout                                                                                                                               |
| `deploy.yml`                   | manual                               | Select an environment, one service and a branch (default `develop`), build and push that branch head as `sha-<7>`, then deploy it; `prod` waits for environment approval                                                                                                                           |
| `release.yml`                  | manual                               | Approve, run the gates, tag `main`, push every deployable service to GHCR in the `push-ghcr` matrix job, deploy the selected scope                                                                                                                                                                 |
| `opencode-review.yml.disabled` | None                                 | PR review definition is preserved but disabled: GitHub ignores the non-`.yml` filename, so it triggers nothing                                                                                                                                                                                     |

`deploy-k3s.yml` carries no trigger of its own. It is a reusable capability, and `release.yml` and
`deploy.yml` are its only callers.

`test.yml` and `deploy-k3s.yml` each accept an optional `ref`, and the caller passes the branch it
selected, so a run checks and deploys the same commit instead of whatever ref started the dispatch.

The three gate workflows are not dispatchable. They run on their pull request and `main` push
events, and `release.yml` calls the same definitions through `workflow_call`. `deploy.yml` calls
none of them: it builds and pushes the selected branch head, then deploys it, so a deploy from a
branch that never passed the gates is unproven until that change merges.

## The two entry points

| Input           | `release.yml`                                                         | `deploy.yml`                                                              |
| --------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Environment     | `prod` only                                                           | `test` \| `uat` \| `prod`                                                 |
| Service         | `all` \| `gateway` \| `core-service` \| `auth-service`                | `gateway` \| `core-service` \| `auth-service` — one per run, no `all`     |
| Branch          | `main` only                                                           | `branch` input, default `develop`                                         |
| Image tag       | the computed date tag                                                 | `sha-<7>` of the branch head, built on every run                          |
| Approval        | `prod` environment with required reviewers                            | `prod` environment, only when the target is `prod`                        |
| What it changes | creates the tag, then pushes to GHCR, then deploys the selected scope | pushes the image, then the platform manifests and the selected Deployment |

In `release.yml`, service selection controls deployment scope, not what gets pushed: it always pushes
every service that declares a deploy Dockerfile to GHCR, then deploys the subset you picked.

`release.yml` runs from `main` only. `deploy.yml` checks out its `branch` input, builds that head as
`sha-<7>` and deploys it, so the image and the manifests come from the same commit. `test` and `uat`
accept any branch by design, so a branch can be promoted to a non-production namespace for
verification. `prod` waits for the `prod` environment approval but does not restrict the branch, so
choose the branch deliberately: nothing checks it before the image is built and pushed.

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
`.out-of-pipeline` marker is left out of that scan and the `service` choice lists. document-service
is that service: Vercel is its production runtime.

Vercel sets `NODE_ENV=production` itself; the shared resolver maps `production` to `prod`, so a
PawHaven Vercel project needs no extra variable to select the production config bundle. An
auth-service or core-service Vercel project left from before the ECS migration cannot select `test`
or `uat` that way and should be retired.

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
   duplicated. The same job discovers every deployable service for the `push-ghcr` matrix and maps
   the service selection to the deploy scope.
4. **Gate** — `test.yml`, `storybook.yml` and `ui-library.yml` are called as reusable workflows.
   All three must pass.
5. **Tag** — creates and pushes an annotated tag. A tag that already points at another commit fails
   the run instead of being moved.
6. **Push to GHCR** — the `push-ghcr` matrix job (`Push <service> to GHCR`) builds every deployable
   service with `docker/build-push-action` and `push: true`, tagging only `<version>` (the date tag).
7. **Deploy** — `deploy-k3s.yml` deploys the selected services to `pawhaven-prod` from the `<version>`
   tag.

## Tag and rollback discipline

Release tags are immutable image tags, not branches: a release always names the date tag it just
pushed to GHCR.

`deploy.yml` has no tag input. Every run builds `sha-<7>` from the branch it checks out, so rolling
back means deploying a known-good commit again: revert the faulty change on `main` and run
`release.yml`, or dispatch `deploy.yml` from a branch whose head is that commit.

```bash
git revert <faulty-commit>
gh workflow run release.yml -f service=all
```

Immutability is enforced by the `v*` tag ruleset in [Tag protection](#tag-protection), not by branch
protection. Choose the target commit explicitly — the newest tag may be the broken release — by
listing tags and checking the candidate's commits, as the [runbook](deployment-runbook.md#roll-back)
describes.

## Concurrency and safety

- `release.yml` uses the fixed `pawhaven-prod` group with `cancel-in-progress: false`; `deploy.yml`
  uses `pawhaven-${{ inputs.environment }}` with the same policy. Both resolve to `pawhaven-prod` for
  production, so a prod release and a prod deploy cannot overlap.
- `release.yml` writes contents only in the tagging job; the `push-ghcr` job adds `packages: write`;
  every other job is read-only.
- The PR reviewer definition must stay read-only for repository contents — `contents: read`, never
  `contents: write`.

## Repository protection

`release.yml` rejects a non-`main` dispatch, but only after a run starts, and `deploy.yml` does not
restrict its branch at all. Protect `main` itself so a direct push or a stale pull request cannot
reach the commit the deploy workflows trust. GitHub keys a required status check by job name, not by
workflow file, so these are the gate jobs from [Quality Gates](quality-gates.md):

| Workflow           | Job (required-check name)                        | Required on `main` | Why                                                                       |
| ------------------ | ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------- |
| `test.yml`         | `Lint, typecheck, test, accessibility and build` | yes                | Lint, typecheck, tests, accessibility and build                           |
| `test.yml`         | `Critical journeys (chromium)`                   | yes                | Playwright E2E, runs after the quality job                                |
| `react-doctor.yml` | `react-doctor`                                   | yes                | React Doctor scan on every pull request                                   |
| `ui-library.yml`   | `UI package, accessibility tests and Portal CSS` | no                 | Path-filtered: reports only when UI, design-system or Portal paths change |
| `storybook.yml`    | `Build component catalogue`                      | no                 | Path-filtered the same way                                                |

A required context that never reports holds a pull request at `Expected` and blocks it forever,
which is why the path-filtered UI jobs are not global requirements. They still run on any pull
request that touches their paths, and a failure is a merge blocker; making them hard requirements
needs an always-running reporter job in the same workflow, which is a workflow change, not a
settings change.

Apply the branch rule:

```bash
gh api --method PUT repos/aoda-zhang/PawHaven/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint, typecheck, test, accessibility and build",
      "Critical journeys (chromium)",
      "react-doctor"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

`required_approving_review_count: 1` assumes a second reviewer; set it to `0` on a single-maintainer
repository to require a pull request without a second approval. Read the result back:

```bash
gh api repos/aoda-zhang/PawHaven/branches/main/protection --jq \
  '{checks: .required_status_checks.contexts, strict: .required_status_checks.strict, force_push: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled}'
```

`strict: true` is GitHub's "Require branches to be up to date before merging", so a green check
proves the merge result rather than the pull request's old base. `enforce_admins: true` applies the
rule to the people most able to bypass it.

### Tag protection

Release tags are a different object with a different rule: branch protection does not cover tags,
and a tag ruleset does not gate merges. Create a tag ruleset once (Settings → Rules → Rulesets → New
tag ruleset, or the API call below) so a `v*` tag cannot be moved or deleted:

```bash
gh api --method POST repos/aoda-zhang/PawHaven/rulesets --input - <<'JSON'
{
  "name": "Immutable release tags",
  "target": "tag",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["refs/tags/v*"], "exclude": [] }
  },
  "rules": [{ "type": "deletion" }, { "type": "update" }]
}
JSON
```

Confirm it with
`gh api repos/aoda-zhang/PawHaven/rulesets --jq '.[] | select(.target == "tag") | {name, target, enforcement}'`.

## Version and install discipline

Workflows that install workspace dependencies set up pnpm with `pnpm/action-setup@v4`, which reads
the `packageManager` field from `package.json`, then set up Node with `actions/setup-node@v4` using
`node-version-file: package.json` and `cache: pnpm`, then run `pnpm install --frozen-lockfile`;
`react-doctor.yml` only runs the pinned scanner. The lockfile is the contract; CI never updates it.

## Build order

Downstream apps consume **built** packages, not source. Every workflow therefore runs
`pnpm build:libs` (or a filtered `...` build) before typecheck, test or build. Prisma clients are
generated explicitly (`prisma:generate-mongodb` for `core-service` and `auth-service`) before any
typecheck or test.

## Adding a workflow

1. Reuse the pnpm and Node setup steps; do not hardcode a Node or pnpm version.
2. Run `build:libs` and Prisma generation before anything that typechecks or tests.
3. Keep write permissions minimal; the PR reviewer stays read-only for repository contents.
4. Name the job after the invariant it proves, and make the failing step name the command it ran.
5. A workflow that deploys is a `workflow_call` capability with no trigger of its own; a
   dispatch-only entry point stays the only way to start it.
6. A gate workflow keeps its PR/push triggers and adds `workflow_call`; `release.yml` reuses the
   definition instead of copying steps.
