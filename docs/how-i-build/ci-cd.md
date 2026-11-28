# CI/CD: what runs, and how a service ships

> This document covers **the workflows and the deployment model**. Gate semantics live in
> [Quality Gates](quality-gates.md). Repository settings — branch protection and required status
> checks — are in [Repository protection](#repository-protection).

## Principle

CI proves; a build produces an artifact; a deploy publishes it. Every gate runs on a pull request and
again after the merge, and production is never a side effect of a push: a backend release promotes
the verified preview, which Vercel rebuilds from the same commit with the production environment,
and a portal release re-uploads the verified `portal-build` artifact.

Container images are still part of the repository — one Dockerfile per service — because they are
the portable artifact for any container runtime (AKS, EKS, ECS, Fly, a self-hosted cluster). No
registry is wired into CI today; see [Container images](#container-images).

## Workflows

| Workflow                         | Trigger                      | What it does                                                                                                                       |
| -------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `quality-gate.yml`               | PR to `develop`/`main`, push | Classifies the diff, runs only the checks the change can affect, and reports one required check, `Gate`                            |
| `deploy.yml`                     | manual                       | Preview entry point: builds the service, then backend services call `deploy-vercel.yml`, `portal` calls `deploy-cloudflare.yml`    |
| `deploy-vercel.yml`              | `workflow_call`              | Downloads `vercel-build-<service>` and runs `vercel deploy --prebuilt`, or promotes a preview URL for production                   |
| `deploy-cloudflare.yml`          | `workflow_call`              | Downloads and uploads `portal-build` to a Cloudflare Pages preview, or deploys an earlier run's artifact to production             |
| `release.yml`                    | manual                       | Production entry point: calls `deploy-vercel.yml` or `deploy-cloudflare.yml` after the `prod` environment approval. No build       |
| `configure-vercel-retention.yml` | manual                       | Applies a deployment-retention profile to every configured Vercel project                                                          |
| `sonar.yml`                      | `workflow_call`              | SonarQube Cloud analysis (code smells, duplication, maintainability), called by the gate. Blocking only when `SONAR_REQUIRED=true` |
| `opencode-review.yml.disabled`   | None                         | Preserved but disabled: GitHub ignores the non-`.yml` filename                                                                     |

## Build and deploy are separate stages

`deploy.yml` builds first and deploys second, so a compile never runs inside a deploy job. The two
build stages are composite actions, like `./.github/actions/build-image`:

| Action                               | Scope            | Produces                                  |
| ------------------------------------ | ---------------- | ----------------------------------------- |
| `./.github/actions/build-vercel`     | backend services | `vercel-build-<service>`, retained 7 days |
| `./.github/actions/build-cloudflare` | `portal`         | `portal-build`, retained 7 days           |

Both actions run `./.github/actions/setup` (pnpm, Node, frozen install), so the caller only
checks out the repository.

- **Vercel.** `vercel build` writes the prebuilt deployment to `.vercel/output` and links the
  project in `.vercel/project.json`. The action copies both into a non-hidden `vercel-artifact`
  directory and uploads it as `vercel-build-<service>`; `artifactRetentionDays` defaults to 7 so a
  release has time to happen. The upload sets `include-hidden-files: true` because every Vercel
  function carries a `.vc-config.json`, which the default upload would drop. The job gets
  `VERCEL_{ORG_ID,PROJECT_ID,TOKEN}` from the action's inputs and fails naming any missing value.
- **Cloudflare.** The action receives `appEnv`, `version` and `apiBaseUrl` as required inputs and
  writes them to `apps/frontend/portal/.env.production` for the commit, then runs
  `pnpm --filter @pawhaven/portal run turbo:build` and typechecks the portal. `deploy.yml` passes
  `appEnv: prod` literally, `version: ${{ github.sha }}` and
  `apiBaseUrl: ${{ vars.PAWHAVEN_PORTAL_API_BASE_URL }}`, so setting the target up means creating one
  repository variable, `PAWHAVEN_PORTAL_API_BASE_URL=https://pawhaven.work/api`;
  `PAWHAVEN_PORTAL_APP_ENV` is fixed at `prod` in the workflow and `PAWHAVEN_PORTAL_VERSION` is
  `github.sha`. Vite bakes the URL into the public bundle, so a repository variable is the right
  place for it. An empty input fails the build naming the missing value, and the action rejects an app
  env outside `dev|uat|test|prod` or an API base that does not start with `http://`/`https://` before
  it writes the file. `.gitignore`
  excludes `.env.*`, so the generated file is never committed. It uploads `apps/frontend/portal/build` as
  `portal-build` and deliberately restores no Turbo cache: the environment file is not part of
  Turbo's task hash, and a replayed cache entry could ship a stale environment. The build step also
  sets `TURBO_FORCE: 'true'`, so it never replays a cache entry that appears anyway.

The preview deploy only downloads the artifact and pushes it: `deploy-vercel.yml` restores
`vercel-build-<service>` into `.vercel` and runs `vercel deploy --prebuilt`, and
`deploy-cloudflare.yml` restores `portal-build` into `build` and runs `wrangler pages deploy`. A
download from the same run needs no `run-id` or GitHub token, and neither preview job compiles or
installs workspace dependencies. Keep producer and consumer names in step: the artifact name and the
download path are a contract.

## The Quality Gate

`quality-gate.yml` is the merge gate and the only required check. Its jobs are named after the
invariant they prove, and the `changes` job decides which of them run:

| Job                   | Runs when                                   | Proves                                                                                                          |
| --------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Static checks`       | always                                      | Architecture boundaries, repository rules, and — by path — i18n keys/duplicates, design tokens, lint, typecheck |
| `Unit tests`          | code or dependency files changed            | Vitest across every workspace package                                                                           |
| `Build`               | code or dependency files changed            | `turbo run build` for every package                                                                             |
| `Accessibility`       | `packages/ui` or `apps/frontend` changed    | axe over every portal route through `e2e/a11y.spec.ts`; story-axe lives in `Component catalogue`                |
| `Component catalogue` | `packages/ui` or dependency files changed   | Chromium → `test-storybook` over every story → Storybook build → required-story check                           |
| `UI package`          | `apps/frontend` or dependency files changed | `@pawhaven/ui` + workspace build → `verify:package` → Portal bundle CSS contract                                |
| `React Doctor`        | `apps/frontend` or `packages/ui` changed    | React-specific security, performance and bundle checks                                                          |
| `Security`            | pull requests only                          | `dependency-review` blocks a PR that introduces a high-severity advisory; push runs skip it                     |
| `OSV scan`            | any pull request, or a dependency change    | Lockfile CVE scan against OSV, uploaded as SARIF; report-only while the tree has open advisories                |
| `SonarQube Cloud`     | always                                      | Platform analysis; blocking only when `SONAR_REQUIRED=true`                                                     |
| `Gate`                | always (`if: always()`)                     | Fails if any relevant job failed or was cancelled                                                               |

The repository variable `SONAR_REQUIRED` decides whether Sonar's verdict is binding:

| `SONAR_REQUIRED` | Effect                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| unset or `false` | The scan still runs and reports on the PR; `Gate` ignores its result.      |
| `true`           | A failed or cancelled scan fails `Gate`, so the pull request cannot merge. |

It lives in Settings → Secrets and variables → Actions → Variables, so flipping the switch needs no
branch-protection change and no workflow edit.

Because unrelated jobs are skipped, branch protection requires **`Gate` only**. A skipped job is
irrelevant to the diff and `Gate` treats it as passing; a missing required check could never be
distinguished from a pending one, which is why the fan-in job exists.

## The two entry points

`deploy.yml` and `release.yml` are the only manual entry points. Each one calls a reusable per-target
workflow, so the preview and production jobs of a target share one implementation.

| Input        | `deploy.yml` (preview)                                      | `release.yml` (production)                                                                                             |
| ------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Service      | `gateway` \| `core-service` \| `auth-service` \| `portal`   | same                                                                                                                   |
| Branch       | any ref                                                     | `main` only (precheck)                                                                                                 |
| Target       | Vercel for backend services, Cloudflare Pages for `portal`  | same                                                                                                                   |
| Build        | `build-vercel` or `build-cloudflare` action, in its own job | **no CI build**; Vercel rebuilds on promote with the production environment, Cloudflare re-uploads the portal artifact |
| Approval     | none                                                        | `prod` environment with required reviewers                                                                             |
| What changes | a new immutable preview deployment, or a Pages preview URL  | the production alias, or the Pages production deployment                                                               |

`release.yml` takes a different input per target, because the two targets reuse the preview in
different ways:

| Input           | Backend services              | `portal`                      |
| --------------- | ----------------------------- | ----------------------------- |
| `deployment`    | Vercel preview URL to promote | left empty                    |
| `deploy_run_id` | left empty                    | `deploy.yml` run ID to deploy |

`deploy.yml` prints the preview URL in the job summary together with the exact command that releases
it:

```bash
gh workflow run deploy.yml --ref main -f service=gateway
gh workflow run release.yml --ref main \
  -f service=gateway \
  -f deployment=https://pawhaven-gateway-<id>-pawhaven.vercel.app

gh workflow run deploy.yml --ref main -f service=portal
gh workflow run release.yml --ref main -f service=portal -f deploy_run_id=<run id>
```

Promotion is the whole point: a backend release promotes the preview URL, and Vercel rebuilds the
same commit with the production environment. Production therefore runs the reviewed commit, not a
byte-identical preview artifact. If an exact-artifact release is required, stage a production
deployment — build with the production environment and `--skip-domain` — and promote that instead.
Rolling back is promoting an older deployment URL, or reverting on `main` and previewing again.

### Portal artifact reuse

The portal cannot be promoted, so the build job's output is what both the preview and the production
run publish:

1. `deploy.yml`'s `build-cloudflare` job runs `./.github/actions/build-cloudflare`, which builds the
   portal once and uploads `apps/frontend/portal/build` as the `portal-build` artifact, kept for 7
   days.
2. The preview job in `deploy-cloudflare.yml` downloads `portal-build` from the same run and uploads
   it to the `preview` branch.
3. `release.yml -f service=portal` receives that run's ID as `deploy_run_id`.
4. The production job re-reads the run through the API and refuses it unless the workflow path is
   `.github/workflows/deploy.yml`, the branch is `main`, the commit is the current `main` SHA and the
   conclusion is `success`.
5. It downloads `portal-build` from that run to `build` and uploads it to Pages on `main`.

The `prod` approval must therefore land within those 7 days: an artifact that expired before the
release starts fails the run instead of shipping a stale bundle.

The portal therefore ships the exact bundle the preview served, not a build of whatever `main` looks
like at release time.

## Cloudflare Pages

The portal is a static Vite bundle on the Pages project `pawhaven-portal`:

- production is the `main` branch, preview deployments are the `preview` branch. Before deploying,
  the workflow reads the Pages project through the API and refuses to run unless its production
  branch is exactly `main`, so `--branch preview` cannot publish to production and `--branch main`
  cannot publish anywhere else;
- deploys are direct uploads from CI through the official `cloudflare/wrangler-action`, pinned to
  `v4.1.3` with `wranglerVersion: 4.168.0` and `packageManager: npm`. The action runs in an isolated
  temporary working directory, so the wrangler install never lands in the pnpm workspace or the
  downloaded bundle. The build runs in `./.github/actions/build-cloudflare` on GitHub Actions with
  the same toolchain as every other job, and it deliberately restores no Turbo cache: Vite reads a
  `.env.production` the action writes at build time from the caller's `appEnv`, `version` and
  `apiBaseUrl` inputs, that file is excluded by `.gitignore` and is not part of Turbo's task hash,
  so a replayed cache entry could ship a stale environment; the build step therefore sets
  `TURBO_FORCE: 'true'`;
- the action supplies `deployment-url`, `pages-deployment-alias-url` and `pages-environment` as step
  outputs, so the workflow reads them instead of parsing wrangler's output;
- `gitHubToken` is not passed to the action, so it creates no GitHub Deployment and the job needs no
  `deployments: write` permission;
- deep links resolve through Pages' built-in SPA fallback: with no top-level `404.html` in the bundle,
  an unmatched path serves `index.html`. A `_redirects` file is not needed — a catch-all rewrite can be
  rejected as an infinite loop, and the built-in fallback already covers deep links. Do not add a
  `404.html` unless a replacement fallback is introduced;
- secrets are `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`;
- **Cloudflare Pages automatic deployments must stay off** for the project (Settings → Builds &
  deployments → Automatic deployments). Otherwise a push to `main` publishes a bundle that skipped
  the quality gate and the artifact validation above.

The preview is visual only: the bundle calls the same-origin `/api` path, and Pages serves no API
proxy, so API-backed flows need the production host or a local gateway.

## Container images

Each service owns a Dockerfile at `apps/backend/<service>/deploy/Dockerfile`:

- multi-stage: a production-dependency stage, a build stage, and a runtime stage that carries only
  the built output and production dependencies;
- manifests are copied before source, so a source-only change reuses the install layer;
- `core-service` and `auth-service` copy their generated Prisma client and query engine from the
  build stage, which is why the install skips scripts.

Nothing in CI builds, tags or pushes these images today. When a container runtime is chosen, the
existing `./.github/actions/build-image` and `./.github/actions/push-image` composites still work:
the first is registry-agnostic (`docker/build-push-action@v6`, `push: false`, `load: true`, then
`docker save` and an artifact upload), the second takes `registry`, `repository`, `username` and
`token` and publishes the loaded image.

## Kubernetes manifests

`apps/backend/<service>/deploy/kubernetes/{test,uat,prod}/` holds the Deployment and Service for
each environment, pinned to its namespace, with the placeholder image tag `v0.0.0-unspecified`.
No workflow applies them today, and nothing builds or pushes the images they name, so treat them as
templates: set the tag in each `deployment.yaml` by hand before `kubectl apply`. No Ingress,
namespace or Platform manifest is committed any more — the ECS-era `deploy/platform` tree is gone.

## Concurrency and safety

- The reusable jobs own the groups, one per target and mode: `vercel-preview-<service>`,
  `vercel-prod-<service>`, `cloudflare-preview-<project>` and `cloudflare-prod-<project>`, all with
  `cancel-in-progress: false`, so two runs of the same target never race on the same alias. The
  retention job owns `vercel-retention`, also non-cancelling, so two profile runs never interleave.
- No workflow writes repository contents: every workflow here declares `contents: read`. The jobs that
  read another run's artifact — `production` in `deploy-cloudflare.yml` and `cloudflare` in
  `release.yml` — add `actions: read` at job level, so preview and precheck jobs never request it.
  Preview downloads happen within the same run, so a preview job needs no `actions: read`.
  `cloudflare` in `deploy.yml` grants `actions: read` too: GitHub validates the whole declared job
  graph of a called workflow, so even a preview-only call has to cover the `production` job it
  declares.
- `release.yml` refuses a non-`main` dispatch before anything else runs.

## Deployment retention and Functions Storage

Vercel bills per deployment artifact; a project that keeps every preview forever grows its Functions
Storage even when the code is tiny. `configure-vercel-retention.yml` is a dispatch-only workflow that
applies one of two profiles to every configured Vercel project: `gateway`, `core-service`,
`auth-service`, and `document-service` when `VERCEL_PROJECT_ID_DOCUMENT_SERVICE` is set:

| Profile        | `expiration` | `expirationProduction` | `expirationCanceled` | `expirationErrored` |
| -------------- | ------------ | ---------------------- | -------------------- | ------------------- |
| `conservative` | `1w`         | `1m`                   | `1d`                 | `1w`                |
| `aggressive`   | `1d`         | `1w`                   | `1d`                 | `1d`                |

It `PATCH`es `https://api.vercel.com/v9/projects/<project>/deployment-expiration` with the profile and
reads `.deploymentExpiration` back from that response, falling back to
`GET https://api.vercel.com/v2/projects/<project>` when the `PATCH` body carries no value, so the
summary shows the stored values; if neither yields one the run fails naming the project. A project
whose ID secret is empty is skipped with a warning; if no project ID is configured at all the run
fails. The job runs in the `prod` environment, so it needs the same reviewer approval as a release.

The metric is not immediate: deletions free storage at once, but usage can take 24–48h to catch up.
A long reporting delay is not the only reason storage stays high: retention exceptions can keep a
deployment stored beyond the configured window — a deployment kept by an active production alias, or
the recent-deployment minimum, for example. If storage stays high, inspect the project's retention
exceptions and deployments instead of waiting for a fixed 30-day window, and only then consider
reducing a bundle size or a function region.

## Repository protection

GitHub keys a required status check by job name, so the only required context is `Gate` from
`quality-gate.yml`. Apply the rule:

```bash
gh api --method PUT repos/aoda-zhang/PawHaven-FullStack-React-NodeJS/branches/develop/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["Gate"] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

`strict: true` is "Require branches to be up to date before merging", so a green check proves the
merge result rather than the pull request's old base. `enforce_admins: true` applies the rule to the
people most able to bypass it.

### Tag protection

Releases create no git tag today. If `v*` tags are ever introduced, protect them separately — branch
protection does not cover tags:

```bash
gh api --method POST repos/aoda-zhang/PawHaven-FullStack-React-NodeJS/rulesets --input - <<'JSON'
{
  "name": "Immutable release tags",
  "target": "tag",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/tags/v*"], "exclude": [] } },
  "rules": [{ "type": "deletion" }, { "type": "update" }]
}
JSON
```

## Version and install discipline

Workflows that install workspace dependencies set up pnpm with `pnpm/action-setup@v4` (which reads
`packageManager` from `package.json`), then Node with `actions/setup-node@v4` using
`node-version-file: package.json` and `cache: pnpm`, then `pnpm install --frozen-lockfile`. The
shared preamble lives in `./.github/actions/setup`. The lockfile is the contract; CI never updates it.

## Build order

Downstream apps consume **built** packages, not source, so `pnpm build:libs` runs before anything
that typechecks or tests. Prisma clients are generated explicitly
(`prisma:generate-mongodb` for `core-service` and `auth-service`) before any typecheck or test.

## Adding a workflow

1. Reuse `./.github/actions/setup`; do not hardcode a Node or pnpm version.
2. Run `build:libs` and Prisma generation before anything that typechecks or tests.
3. Keep write permissions minimal.
4. Name the job after the invariant it proves, and make the failing step name the command it ran.
5. A workflow that deploys stays a dispatch-only entry point; it never runs on push.
