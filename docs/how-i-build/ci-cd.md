# CI/CD: what runs, and how a service ships

> This document covers **the workflows and the deployment model**. Gate semantics live in
> [Quality Gates](quality-gates.md); the commands, cluster setup and failure modes live in the
> [deployment runbook](deployment-runbook.md). Repository settings — branch protection and required
> status checks — are in [Repository protection](#repository-protection).

## Principle

CI proves; a release builds `main`'s head into an image artifact, waits for a human approval, then
pushes it to Alibaba Cloud Container Registry (ACR); a deploy builds `main`'s head as `sha-<7>` and
ships it. The quality gate is the merge-readiness signal and reproduces the checks a developer runs
locally.

There are exactly two deployment entry points — `release.yml` and `deploy.yml` — and both are
`workflow_dispatch` only. No push, tag, schedule or pull request deploys anything.

## Workflows

| Workflow                       | Trigger              | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test.yml`                     | PR, push to `main`   | Install (frozen lockfile) → generate Prisma clients → `build:libs` → architecture/token/quality gates → lint, typecheck, `check:i18n`, Storybook axe tests (Chromium), test, build; a separate job installs dependencies, builds the workspace packages, installs Chromium and runs Playwright E2E                                                                                                                                                                                                                                  |
| `ui-library.yml`               | PR/push on UI paths  | `token-check` → build `@pawhaven/ui` and workspace deps → `verify:package` → UI tests → Portal CSS contract checks                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `storybook.yml`                | PR/push on UI paths  | Install Chromium → `test-storybook` (Storybook tests in a real browser) → build Storybook → verify required stories                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `react-doctor.yml`             | PR, push to `main`   | React Doctor scan (`millionco/react-doctor@v2`, version pinned to `0.9.12`)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `deploy-k3s.yml`               | `workflow_call` only | Ensure the namespace, apply `deploy/platform/<env>` through `Azure/k8s-deploy` and ensure the `acr-pull` image pull secret and the `pawhaven-secrets` runtime secret (from `PAWHAVEN_SECRETS_JSON`), then a per-service matrix job that renders the release image into a temporary copy of the selected service's `<env>` manifests, applies it with `kubectl apply` and waits for its rollout, then smoke-checks the deployed service over HTTP from inside its container; failures print pods, `describe` output, logs and events |
| `deploy.yml`                   | manual               | Runs from `main` only: select an environment and one service, build `main`'s head as `sha-<7>` into an image artifact, push the loaded artifact to ACR, then deploy it to `test` or `uat`                                                                                                                                                                                                                                                                                                                                           |
| `release.yml`                  | manual               | Resolve the date-and-commit version, build the selected service into an image artifact, wait for the `prod` approval, push the image to ACR in the `push-image` matrix job, deploy the selected service; the run is named `Release-<service>`                                                                                                                                                                                                                                                                                       |
| `opencode-review.yml.disabled` | None                 | PR review definition is preserved but disabled: GitHub ignores the non-`.yml` filename, so it triggers nothing                                                                                                                                                                                                                                                                                                                                                                                                                      |

`deploy-k3s.yml` carries no trigger of its own. It is a reusable capability, and `release.yml` and
`deploy.yml` are its only callers.

`deploy-k3s.yml` accepts an optional `ref`, and the two deploy workflows pass the commit to deploy, so
a run uses one commit rather than whatever ref started the dispatch. Both of its jobs write the
kubeconfig into the workspace and verify it first: an empty secret or an unreachable cluster fails
fast with an explicit error, because kubectl otherwise falls back to `localhost:8080`. The platform
job ensures the namespace, applies the platform manifests (including the `pawhaven-env` ConfigMap),
creates or updates the `acr-pull` image pull secret from the registry credential secrets, creates
or updates the `pawhaven-secrets` runtime secret from the `PAWHAVEN_SECRETS_JSON` repository secret,
and, when the optional `CF_ORIGIN_CERT` and `CF_ORIGIN_KEY` secrets are set, installs them as the
`cloudflare-origin` TLS secret (empty values log a warning and skip it). The
`services` job renders the release image into a temporary copy of each service's manifests before it
applies them, so the committed placeholder never reaches the cluster and no placeholder pod is created.
After the rollout, the same job smoke-checks the service from inside its container: `kubectl exec` runs
Node's global `fetch` against the service's port, retrying for a minute so a slow start is not a false
failure. Any status below 500 passes — the route may answer 404 — while a 5xx, a refused connection or
a container that never answers fails the job.

A failed job dumps pods, `describe` output, logs and events into the job log. Changing the ConfigMap
does not restart pods by itself: run a rollout restart or a new deploy to apply it.

The three gate workflows are not dispatchable. They run on pull requests and `main` pushes only;
`release.yml` does not re-run them, so a release ships a commit the merge-time gates already
checked. `deploy.yml` calls none of them either: it builds and pushes `main`'s head, which the
merge-time gates already checked.

## The two entry points

| Input           | `release.yml`                                                                                   | `deploy.yml`                                                              |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Environment     | `prod` only                                                                                     | `test` \| `uat`                                                           |
| Service         | `gateway` \| `core-service` \| `auth-service` — one per run                                     | `gateway` \| `core-service` \| `auth-service` — one per run, no `all`     |
| Branch          | `main` only                                                                                     | `main` only                                                               |
| Image tag       | the computed `vYY.MM.DD-<sha7>` version                                                         | `sha-<7>` of `main`'s head, built on every run                            |
| Approval        | `prod` environment with required reviewers, after the image is built and before it is published | none — production ships through `release.yml`                             |
| What it changes | pushes the image to ACR, then deploys the selected service                                      | pushes the image, then the platform manifests and the selected Deployment |

In `release.yml`, the service selection controls what is built, pushed and deployed in that run: a
release builds, pushes and deploys exactly one service, and `all` is not offered. The run is named
`Release-<service>`.

Both entry points run from `main` only, each with a precheck that fails unless the dispatch ref is
`refs/heads/main`, so the image and the manifests come from the same `main` commit. `deploy.yml`
targets `test` or `uat`, and it has no approval gate. Production is released through `release.yml`,
which requires the `prod` environment approval. An unmerged branch therefore cannot be deployed to a
cluster namespace, so unmerged work is verified locally, not in `test` or `uat`.

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
    ├── serviceaccount.yaml
    └── ingress.yaml
```

`deploy/platform/<env>` holds what every service in that namespace shares: the Namespace, three
NetworkPolicies and the `pawhaven-runtime` ServiceAccount. `prod` additionally carries
`ingress.yaml`, which routes `api.pawhaven.work` to the gateway Service. Deployment and Service
objects stay beside the service that owns them, and their committed image tag is the placeholder
`v0.0.0-unspecified`; the `services` job substitutes the release image in a temporary copy before
`kubectl apply`, so the placeholder never reaches the cluster.

A service joins the pipeline by declaring `apps/backend/<service>/deploy/Dockerfile` and appearing in
both `service` choice lists. document-service runs on Vercel, so it is absent from those lists and its
deploy directory carries an `.out-of-pipeline` marker.

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
2. **Resolve** — computes the version `vYY.MM.DD-<sha7>` in UTC: the date plus the first
   seven characters of the dispatched commit, so the same commit always yields the same version and
   two commits never collide. No remote-tag lookup. The same job resolves the single selected service
   into the `services` list that drives `build`, `push-image` and `deploy`.
3. **Build** — the `build` matrix job (`Build <service>`) calls the `build-image` composite action
   (`./.github/actions/build-image`) with the service, the tag and the Dockerfile. The action builds
   with `docker/build-push-action@v6` (`push: false`, `load: true`) as the local tag
   `pawhaven-<service>:<version>`, saves it with `docker save` and uploads `image.tar` through
   `actions/upload-artifact@v4`. It never names a registry.
4. **Approve** — the `approve` job binds to the `prod` environment, so the run pauses after the image
   is built and waits for a required reviewer before anything is published.
5. **Push to ACR** — the `push-image` matrix job (`Push <service> to ACR`) calls the `push-image`
   composite action (`./.github/actions/push-image`) with the service, tag, registry, repository,
   username and token. The action downloads that artifact, loads it with `docker load`, logs in with
   `docker/login-action@v3`, retags it with `docker tag` and publishes it with `docker push`. See
   [Image build and registry push](#image-build-and-registry-push).
6. **Deploy** — `deploy-k3s.yml` deploys the selected service to `pawhaven-prod` from the `<version>`
   tag.

## Image build and registry push

Both entry points separate building an image from publishing it, and each half is its own composite
action. `build-image` (`./.github/actions/build-image`) is registry-agnostic: it builds with
`docker/build-push-action@v6` using `push: false` and `load: true`, so the image lands in the local
Docker daemon as `pawhaven-<service>:<tag>`, then `docker save` writes `image.tar` and
`actions/upload-artifact@v4` uploads it under `pawhaven-<service>-<tag>`. Nothing in that action names
a registry.

`push-image` (`./.github/actions/push-image`) takes `registry`, `repository`, `username` and `token` as
inputs and does the registry work. `actions/download-artifact@v4` fetches the artifact, `docker load`
restores the image, `docker/login-action@v3` authenticates, `docker tag` adds the registry name and
`docker push` publishes it. Docker publishes no official action that pushes a prebuilt local image, so
the official pieces are setup, build, upload/download and login, and the transfer itself is the Docker
CLI.

Images must stay small: ship production dependencies only and build in multiple stages, so
compilers, source and devDependencies never reach the image the cluster runs. The node pulls the
changed image on every deploy, so a large image is not only a registry and artifact cost — every
megabyte is paid again on each rollout, and a pull that outlasts the deploy job's timeout fails the
release.

The gateway image also caches work between builds: its builder installs the gateway's workspace
graph from manifests alone, before the source copy, so a commit that changes source reuses that
layer and only reruns the build. The context is trimmed the same way — `docs`, `e2e`, Playwright
output and local editor or agent directories never leave the runner.

Both workflows push to Alibaba Cloud Container Registry: the public host
`crpi-1d0srkihv1btvqu3.cn-beijing.personal.cr.aliyuncs.com`, namespace `pahaven`, repository
`pahaven/pawhaven-<service>`. Login uses the repository secrets `ACR_USERNAME` and `ACR_PASSWORD`
instead of the workflow's `GITHUB_TOKEN`, so the push job declares only `contents: read` and no
`packages` scope. ACR personal edition is free and the registry lives in the same region as the ECS
host. CI must push through the public host because GitHub runners cannot reach the VPC address; the
cluster pulls from the VPC host `crpi-1d0srkihv1btvqu3-vpc.cn-beijing.personal.cr.aliyuncs.com`,
which `deploy-k3s.yml` receives as its `registry` input and uses both for each `images` reference and
for the `acr-pull` docker-registry secret referenced by the `pawhaven-runtime` ServiceAccount. The
[deployment runbook](deployment-runbook.md#image-pull-secret) covers creating that secret.

Changing registry — to a private registry, ECR, or anything else — touches only the registry inputs:
the `registry`, `repository`, `username` and `token` passed to `push-image`, and the VPC `registry`
passed to `deploy-k3s.yml`. The build action, its cache and the deploy version stay as they are.

The artifact is a cost to weigh: each image travels from the build runner to artifact storage and
back to the push runner, so a three-service release moves every image twice before it reaches the
registry. `retention-days: 7` bounds the stored copies and covers realistic approval latency, but
GitHub lets an environment gate wait up to 30 days, so a long wait can outlive the artifact. If the
approval lands after it expires, only the push job fails and nothing has been published; re-dispatching
recomputes the same version for that commit and retries the same image tag. The shared build cache
keeps the rebuild cheap.

### Mirroring upstream images

Not every image the cluster runs is built here: Traefik and other upstream components ship from
Docker Hub, which the cluster cannot reach. `mirror-image.yml` is the manual bridge — dispatch
`Mirror image to ACR` with three inputs: `source`, the fully qualified upstream image
(`registry/repository:tag`), `target_repository`, the ACR path such as `pahaven/traefik`, and
`target_tag`. The job logs in with the same `ACR_USERNAME` and `ACR_PASSWORD` secrets, then runs
`docker pull`, `docker tag` and `docker push` unchanged, so the cluster pulls the copy from the
region-local registry like any service image. It has no cache, no buildx and no repository checkout:
it moves bytes, it does not build.

## Image versions and rollback discipline

Release images carry the computed `vYY.MM.DD-<sha7>` version as their image tag; `release.yml` does
not create a git tag. `deploy.yml` has no version input: it builds `main`'s head as `sha-<7>`, while
`release.yml` builds the same head under its computed version. Rolling back therefore means reverting
the faulty change on `main` and re-dispatching `release.yml` for production, or `deploy.yml` for `test`
or `uat`. There is no arbitrary-commit dispatch and no tag to redeploy.

```bash
git revert <faulty-commit>
gh workflow run release.yml -f service=<service>
```

## Concurrency and safety

- `release.yml` serializes only its `deploy` job, on the fixed `pawhaven-prod` group with
  `cancel-in-progress: false`, so a run waiting for the `prod` approval does not block later
  releases: they build and wait independently, then queue at the deploy step only. `deploy.yml`
  uses `pawhaven-${{ inputs.environment }}` with the same policy, which resolves to `pawhaven-test`
  or `pawhaven-uat`; the groups are independent, so a prod deploy does not serialize against a
  `test` or `uat` deploy.
- Neither workflow writes repository contents now; the `push-image` job declares only
  `contents: read`, and the `build` jobs stay read-only (`contents: read`) and receive no registry
  credential — the push job authenticates against ACR with its own secrets.
- The PR reviewer definition must stay read-only for repository contents — `contents: read`, never
  `contents: write`.

## Repository protection

Both `release.yml` and `deploy.yml` reject a non-`main` dispatch, but only after a run starts. Protect
`main` itself so a direct push or a stale pull request cannot reach the commit the deploy workflows
trust. GitHub keys a required status check by job name, not by workflow file, so these are the gate
jobs from [Quality Gates](quality-gates.md):

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

Releases currently publish images only and create no git tag; keep this ruleset for any `v*` tag
created manually. Release tags are a different object with a different rule: branch protection does
not cover tags, and a tag ruleset does not gate merges. Create a tag ruleset once (Settings → Rules →
Rulesets → New tag ruleset, or the API call below) so a `v*` tag cannot be moved or deleted:

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
6. A gate workflow runs on pull requests and pushes to `main`; a release does not re-run it, so the
   gate must block merges, not publishing.
