# CI/CD: what runs, and how a service ships

> This document covers **the workflows and the deployment model**. Gate semantics live in
> [Quality Gates](quality-gates.md). Repository settings — branch protection and required status
> checks — are in [Repository protection](#repository-protection).

## Principle

CI proves; a deploy publishes. Every gate runs on a pull request and again after the merge, and
production is never a side effect of a push: a release takes a deployment a human verified and
promotes that exact artifact, so the thing that ships is the thing that was reviewed.

Container images are still part of the repository — one Dockerfile per service — because they are
the portable artifact for any container runtime (AKS, EKS, ECS, Fly, a self-hosted cluster). No
registry is wired into CI today; see [Container images](#container-images).

## Workflows

| Workflow                       | Trigger                      | What it does                                                                                                                       |
| ------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `quality-gate.yml`             | PR to `develop`/`main`, push | Classifies the diff, runs only the checks the change can affect, and reports one required check, `Gate`                            |
| `build.yml`                    | `workflow_call`              | Platform-neutral compile: install, `turbo run build`, `turbo run typecheck` for one workspace package                              |
| `deploy.yml`                   | manual                       | Vercel **preview**: install, `vercel build`, `vercel deploy --prebuilt`, then prints the preview URL and the release command       |
| `release.yml`                  | manual                       | Vercel **production**: promotes the deployment URL you pass, after the `prod` environment approval. No rebuild                     |
| `sonar.yml`                    | `workflow_call`              | SonarQube Cloud analysis (code smells, duplication, maintainability), called by the gate. Blocking only when `SONAR_REQUIRED=true` |
| `opencode-review.yml.disabled` | None                         | Preserved but disabled: GitHub ignores the non-`.yml` filename                                                                     |

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

| Input        | `deploy.yml` (preview)                        | `release.yml` (production)                          |
| ------------ | --------------------------------------------- | --------------------------------------------------- |
| Service      | `gateway` \| `core-service` \| `auth-service` | same                                                |
| Branch       | any ref                                       | `main` only (precheck)                              |
| Build        | `vercel build` for the selected project       | **none** — `vercel promote`                         |
| Approval     | none                                          | `prod` environment with required reviewers          |
| What changes | a new immutable preview deployment            | the production alias of the selected Vercel project |

`deploy.yml` prints the preview URL in the job summary together with the exact command that releases
it:

```bash
gh workflow run deploy.yml --ref main -f service=gateway
gh workflow run release.yml --ref main \
  -f service=gateway \
  -f deployment=https://pawhaven-gateway-<id>-pawhaven.vercel.app
```

Promotion is the whole point: no second build, so production runs the artifact that was reviewed.
Rolling back is promoting an older deployment URL, or reverting on `main` and previewing again.

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

- `deploy.yml` uses `vercel-preview-<service>`; `release.yml` uses `vercel-prod-<service>`, both with
  `cancel-in-progress: false`, so two runs of the same service never race on the same alias.
- Neither workflow writes repository contents; both declare `contents: read`.
- `release.yml` refuses a non-`main` dispatch before anything else runs.

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
