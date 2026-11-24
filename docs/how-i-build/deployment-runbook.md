# Deployment runbook: release, deploy and roll back

> This document covers **operating the deployment**: the cluster prerequisites, the two dispatch
> workflows, rollback, and the failures worth recognising. Workflow structure and triggers live in
> [CI/CD](ci-cd.md); this is the procedure.

## Where each service runs

| Service            | Runtime                                     | Image                                                                                     | Dockerfile                                        |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `gateway`          | K3s, `ClusterIP`, reachable through Traefik | `crpi-1d0srkihv1btvqu3.cn-beijing.personal.cr.aliyuncs.com/pahaven/pawhaven-gateway`      | `apps/backend/gateway/deploy/Dockerfile`          |
| `core-service`     | K3s, `ClusterIP`, internal only             | `crpi-1d0srkihv1btvqu3.cn-beijing.personal.cr.aliyuncs.com/pahaven/pawhaven-core-service` | `apps/backend/core-service/deploy/Dockerfile`     |
| `auth-service`     | K3s, `ClusterIP`, internal only             | `crpi-1d0srkihv1btvqu3.cn-beijing.personal.cr.aliyuncs.com/pahaven/pawhaven-auth-service` | `apps/backend/auth-service/deploy/Dockerfile`     |
| `document-service` | Vercel — out of this pipeline               | —                                                                                         | `apps/backend/document-service/deploy/Dockerfile` |
| portal             | Cloudflare Pages                            | —                                                                                         | —                                                 |
| MongoDB            | Managed cluster, outside the host           | —                                                                                         | —                                                 |

The cluster is one Alibaba Cloud ECS host running K3s, and the images live in Alibaba Cloud Container
Registry (ACR): namespace `pahaven`, repository `pahaven/pawhaven-<service>`. ACR personal edition is
free and the registry instance sits in the same region as the ECS host. The instance exposes two
endpoints: the public host `crpi-1d0srkihv1btvqu3.cn-beijing.personal.cr.aliyuncs.com` and the VPC host
`crpi-1d0srkihv1btvqu3-vpc.cn-beijing.personal.cr.aliyuncs.com`. CI pushes images to the public host
because GitHub runners cannot reach the VPC address, while the cluster pulls from the VPC host, which
keeps pull traffic inside the VPC. `deploy-k3s.yml` therefore receives the VPC host as its `registry`
input and builds each image reference from it; the `acr-pull` secret it creates points at the same
host.

## Deploy asset layout

Each service owns its deploy assets. There is no shared base and no kustomization step: what a deploy
applies is plain directories of YAML, each already pinned to one namespace.

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

document-service keeps only `kubernetes/prod/` and is marked `.out-of-pipeline`; the
`test`/`uat`/`prod` tree describes the three in-pipeline services (`gateway`, `core-service` and
`auth-service`).

`deploy/platform/<env>` holds only cluster-wide objects: the Namespace, three NetworkPolicies and the
`pawhaven-runtime` ServiceAccount. A Deployment and its Service live in the `kubernetes/<env>`
directory beside the service's Dockerfile, and their committed image tag is the placeholder
`v0.0.0-unspecified`. The deploy copies that directory to a temporary location, substitutes the target
image there, and applies the copy, so the placeholder never reaches the cluster and no placeholder pod
is created.

`deploy-k3s.yml` runs two jobs, both with `azure/setup-kubectl` and a kubeconfig decoded from the
`KUBECONFIG_B64` secret: a `platform` job applies `deploy/platform/<env>` with `Azure/k8s-deploy`, and
a `services` job that needs it fans out over the `services` JSON array as a matrix, rendering each
service's release image into a temporary copy of its directory, applying that copy with
`kubectl apply`, then waiting for the rollout with `kubectl rollout status --timeout=600s`. After the
rollout, a smoke-check step runs Node's global `fetch` inside the container against the service's own
port (gateway 8080, core-service 8081, auth-service 8082), retrying for a minute: any response below
500 counts as healthy, including a 404, because an answer proves the listener is up.

A service joins the pipeline by appearing in the `service` choice lists in `deploy.yml` and
`release.yml` — the only enumeration, because GitHub cannot compute `choice` options at run time.
document-service runs on Vercel, is not listed in either, and its deploy directory carries an
`.out-of-pipeline` marker.

## Environments

| Environment | Namespace       | Kubeconfig secret | GitHub approval                                                  |
| ----------- | --------------- | ----------------- | ---------------------------------------------------------------- |
| `test`      | `pawhaven-test` | `KUBECONFIG_TEST` | none                                                             |
| `uat`       | `pawhaven-uat`  | `KUBECONFIG_UAT`  | none                                                             |
| `prod`      | `pawhaven-prod` | `KUBECONFIG_PROD` | `prod` environment with required reviewers, gating `release.yml` |

Each environment is a namespace on the same cluster, so the same host, Traefik and MongoDB serve all
three. The NetworkPolicy allows same-namespace traffic, which is why separate namespaces also keep
the environments apart.

## One-time setup per environment

Run these once per namespace, before the first deploy. The deploy workflow applies
`deploy/platform/<env>`, which creates the namespace and the `pawhaven-env` ConfigMap, and it maintains
the `acr-pull` pull secret and the `pawhaven-secrets` Secret from repository secrets. A missing or
invalid repository secret still surfaces as a Pod that cannot start or cannot pull its image, after the
Deployment is applied. The commands below are the manual or break-glass fallback for a cluster outside
the pipelines.

Create the namespace first: every namespaced command below passes `-n pawhaven-prod` and fails with
`NotFound` while the namespace does not exist.

### Namespace

```bash
kubectl apply -f deploy/platform/prod
```

`deploy/platform/prod` applies the Namespace, the `pawhaven-runtime` ServiceAccount and three
NetworkPolicies: default-deny ingress, a same-namespace allowance, and port 8080 on the gateway for
whichever ingress or tunnel controller fronts it. Run it once per environment by substituting `test`
or `uat`.

The deploy workflow applies the same directory on every run, so it stays authoritative: a policy
edited by hand in the cluster is reverted by the next deploy.

### Runtime ConfigMap

Keys read through `envFrom` by all three services:

| Key                     | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`              | `test`, `uat` or `prod` — matches the namespace; missing/unknown fails startup |
| `AUTH_SERVICE_HOST`     | `http://auth-service:8082`                                                     |
| `CORE_SERVICE_HOST`     | `http://core-service:8081`                                                     |
| `DOCUMENT_SERVICE_HOST` | `https://<document-service>.vercel.app`                                        |

`NODE_ENV` selects the per-environment config directory (`config/<env>/env/index.json`) in every
service, so apply the name of the namespace: `test`, `uat`, or `prod`. The resolver also accepts
`production` for `prod`.

One ConfigMap serves every Deployment in the namespace; the per-service ConfigMaps from the earlier
manifests (`gateway-config`, `core-service-config`, and so on) are gone.

The ConfigMap lives in `deploy/platform/<env>/configmap.yaml`, and the platform job applies it on every
deploy, so a hand-edited ConfigMap is reverted by the next run. Editing the file does not restart
anything by itself: the values reach the pods through `envFrom`, and a running pod keeps the environment
it started with. Run `kubectl -n <namespace> rollout restart deployment/<service>` or deploy again to
pick up a change.

The two in-cluster hosts include the scheme and port: the gateway proxy uses the configured host
verbatim as its target (`apps/backend/gateway/src/proxy/proxy.service.ts`), and the shared HTTP
client appends `port` only for `localhost`/`127.0.0.1`
(`packages/backend-core/modules/http-client/httpClientInstance.ts`).

`DOCUMENT_SERVICE_HOST` must be the public HTTPS Vercel origin — scheme, no port, no trailing slash.
The HTTP client strips a trailing slash but never adds a port to a non-localhost host, and
document-service runs on Vercel, not in the cluster.

The manifest carries a placeholder Vercel origin until the real one is substituted; replace it before
the first deploy of that environment. The command below is the break-glass fallback:

```bash
kubectl -n pawhaven-prod create configmap pawhaven-env \
  --from-literal=NODE_ENV=prod \
  --from-literal=AUTH_SERVICE_HOST=http://auth-service:8082 \
  --from-literal=CORE_SERVICE_HOST=http://core-service:8081 \
  --from-literal=DOCUMENT_SERVICE_HOST=https://<document-service>.vercel.app \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Runtime Secret

All six keys are required in every namespace, whatever service a run deploys:

| Key                        | Consumed by                |
| -------------------------- | -------------------------- |
| `JWT_SECRET`               | gateway, auth-service      |
| `INTERNAL_JWT_PRIVATE_KEY` | gateway, core-service      |
| `INTERNAL_JWT_PUBLIC_KEY`  | auth-service, core-service |
| `CORE_SERVICE_MONGODB`     | core-service               |
| `AUTH_SERVICE_MONGODB`     | auth-service               |
| `BLOB_PUBLIC_BASE_URL`     | core-service               |

The deploy workflow creates or updates this Secret in the target namespace on every run from the
repository secret `PAWHAVEN_SECRETS_JSON`, a JSON object holding exactly these six keys. The platform
job fails before it applies any service when that secret is unset or empty:

```json
{
  "JWT_SECRET": "<value>",
  "INTERNAL_JWT_PRIVATE_KEY": "<value>",
  "INTERNAL_JWT_PUBLIC_KEY": "<value>",
  "CORE_SERVICE_MONGODB": "<uri>",
  "AUTH_SERVICE_MONGODB": "<uri>",
  "BLOB_PUBLIC_BASE_URL": "<url>"
}
```

```bash
gh secret set PAWHAVEN_SECRETS_JSON < pawhaven-secrets.json
```

All environments currently read the same repository secret. To rotate a value, update the GitHub secret
and re-run the deploy: the platform job replaces `pawhaven-secrets`, and the new pods pick up the new
values. The command below is the break-glass fallback:

```bash
kubectl -n pawhaven-prod create secret generic pawhaven-secrets \
  --from-literal=JWT_SECRET='<value>' \
  --from-literal=INTERNAL_JWT_PRIVATE_KEY='<value>' \
  --from-literal=INTERNAL_JWT_PUBLIC_KEY='<value>' \
  --from-literal=CORE_SERVICE_MONGODB='<uri>' \
  --from-literal=AUTH_SERVICE_MONGODB='<uri>' \
  --from-literal=BLOB_PUBLIC_BASE_URL='<url>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Image pull secret

The `pahaven` repositories are private, so the namespace needs a registry credential named `acr-pull`.
The `pawhaven-runtime` ServiceAccount from
[Namespace](#namespace) references it as `imagePullSecrets`, and every Deployment runs as that account.

The deploy workflow creates or updates this secret on every run from the `ACR_USERNAME` and
`ACR_PASSWORD` repository secrets, pointing it at the VPC host
`crpi-1d0srkihv1btvqu3-vpc.cn-beijing.personal.cr.aliyuncs.com`, so you do not create it by hand. The
command below is the local or break-glass fallback for a cluster outside the pipelines, which reaches
the public host instead:

```bash
kubectl -n pawhaven-prod create secret docker-registry acr-pull \
  --docker-server=crpi-1d0srkihv1btvqu3.cn-beijing.personal.cr.aliyuncs.com \
  --docker-username='<ACR_USERNAME>' \
  --docker-password='<ACR_PASSWORD>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

### GitHub secrets and approval

```bash
base64 < ~/.kube/config | tr -d '\n' | gh secret set KUBECONFIG_PROD
```

Create the `prod` environment under Settings → Environments and add the required reviewers there;
that environment is what gates `release.yml`, pausing the run after the image is built and before it
is pushed. The approval job is the only job bound to it; the deploy jobs read the
kubeconfig from repository scope.
`KUBECONFIG_TEST`, `KUBECONFIG_UAT` and `KUBECONFIG_PROD` are therefore **repository** secrets, not
environment secrets — `gh secret set` without `--env` stores them at repository scope. The `prod`
environment supplies the human approval gate only; it does not inject any kubeconfig. `test` and
`uat` have no environment gate.

The push job authenticates against ACR with two more repository secrets, not with `GITHUB_TOKEN`:

```bash
gh secret set ACR_USERNAME
gh secret set ACR_PASSWORD
```

`ACR_PASSWORD` is the ACR registry password for that user; rotating it in ACR means setting the
secret again, and the next deploy refreshes `acr-pull` in each namespace.

The deploy jobs fail fast with an explicit error when the kubeconfig secret is empty or the cluster
is unreachable, because kubectl otherwise falls back to `localhost:8080`. When a rollout fails, the
services job prints pods, `describe` output, container logs and recent events into the job log; the
platform job prints the namespace objects and events.

That repository scope is an accepted risk. Anyone with write access can read a repository secret by
pushing a branch whose workflow prints it, so write access is itself part of the production boundary:
limit it to the people who may deploy, and protect `main` as described in
[CI/CD](ci-cd.md#repository-protection) so a pushed branch cannot become the deployed commit. The
`prod` release is main-only and approval-gated, but neither check helps if an untrusted writer can
read the kubeconfig. If stronger isolation is required, move the kubeconfigs to environment-scoped
secrets and accept the approval-flow change: every job that needs one must bind to that environment,
so `test` and `uat` need their own environment objects and `release.yml` keeps a dedicated approved
job for `prod`.

Registry authentication is separate: the cluster pulls private
`crpi-1d0srkihv1btvqu3-vpc.cn-beijing.personal.cr.aliyuncs.com` images with the `acr-pull` Kubernetes
secret that the deploy workflow maintains in the namespace, not with a GitHub environment secret. Tag protection is separate too:
releases currently create no git tag, so protect the `v*` tag pattern with a tag ruleset, as described
in [CI/CD](ci-cd.md#tag-protection), for any tag created manually. Tag protection does not gate merges, and branch protection does not cover tags.

## Release procedure

Use this to build and ship a new version. It runs from `main` only: the `precheck` job rejects any
other ref.

```bash
gh workflow run release.yml -f service=<service>
gh run watch
```

1. Merge the change to `main` and confirm the commit to ship.
2. Dispatch `release.yml` from `main`; pick one service for the build, push and deploy scope. The run
   appears as `Release-<service>`.
3. The run builds the selected service into an `image.tar` artifact, then pauses.
4. Approve the `prod` environment.
5. The run pushes the image to ACR and deploys the selected service.
6. Verify: `kubectl -n pawhaven-prod get deploy` and `kubectl rollout status deployment/<service> -n pawhaven-prod`.

If the approval is granted after the artifact expired (7 days after the build), the push job fails and
nothing has been published. Re-dispatch `release.yml`: `resolve` recomputes the same version for that
commit, so the run retries the same image tag.

## Deploy a service build

Use this to build and deploy the head of `main`. One run deploys one service.

```bash
gh workflow run deploy.yml -f environment=test -f service=gateway
gh workflow run deploy.yml -f environment=uat -f service=gateway
```

`deploy.yml` offers only `test` and `uat`; production is not selectable. It fails a dispatch that is
not from `main`, so the deployed commit is the `main` head at dispatch time. It then builds the
selected service as `sha-<7>` through the `build-image` composite action
(`./.github/actions/build-image`, which runs `docker/build-push-action@v6` with `load: true` and
`push: false`) into `pawhaven-<service>:sha-<7>`, saves it with `docker save` and uploads `image.tar`
as an artifact. A separate `push-image` job calls the `push-image` composite action
(`./.github/actions/push-image`), which downloads that artifact, restores the image with `docker load`,
retags it with `docker tag` and publishes it with `docker push`, logging in through
`docker/login-action@v3`. The run then calls `deploy-k3s.yml`, which applies
`deploy/platform/<env>` in a `platform` job and then each selected service in a matrix `services` job,
rendering the release image into that service's manifests and waiting for every rollout — so the
manifests it applies come from the same commit as the image.

Neither composite action hardcodes a registry: `build-image` names none, and `push-image` receives
`registry`, `repository`, `username` and `token` as inputs. Pointing the pipeline at a different
registry therefore means changing only those inputs in `push-image` and the `registry` input of
`deploy-k3s.yml`, which builds each service's image reference from it. The artifact hop is the price
of that separation: each image is uploaded to artifact storage and downloaded again before it is
pushed, which a `retention-days: 7` policy keeps cheap to store.

`deploy.yml` targets `test` and `uat`, and neither needs approval. The workflow runs from `main`
only, and it runs no tests and no cluster preflight: the gates are merge-time checks, so deploy a
commit that has already passed CI. Production ships only through `release.yml`.

Each Deployment runs one replica with `maxSurge: 0`, so a rollout briefly replaces the old pod
instead of overlapping it.

## Roll back

A rollback is a forward deploy of a known-good commit. `deploy.yml` has no version input: every run
builds `sha-<7>` from `main`, so the way back is to revert the faulty change on `main` and deploy the
resulting head.

Identify the faulty commit and the previous known-good commit on `main`:

```bash
git log --oneline origin/main
```

The running image confirms which release is live, and its image tag names the computed version to
compare against:

```bash
kubectl -n pawhaven-prod get deploy/pawhaven-<service> -o jsonpath='{..image}'
```

Revert the faulty change and release again:

```bash
git revert <faulty-commit>
gh workflow run release.yml -f service=<service>
```

For a single service in `test` or `uat`, revert the faulty commit on `main` and dispatch `deploy.yml`;
the run builds `main`'s head as `sha-<7>` and deploys it:

```bash
gh workflow run deploy.yml -f environment=uat -f service=gateway
```

A production rollback is the revert-and-release path above: `deploy.yml` cannot target `prod`. To roll
back a single production service, revert and run
`release.yml -f service=<service>`. `deploy.yml` deploys one service per run, so roll back each
affected service in `test` or `uat` with its own dispatch. Record which commit you deployed and why
in the incident notes.

## Gateway exposure

The gateway Service is `ClusterIP`. Nothing in this repository publishes it: the k3s-bundled Traefik
ingress controller sits in front of the cluster, and Cloudflare Tunnel terminates public TLS and
forwards to it. That routing (IngressRoute or Helm values) is platform configuration outside this
repo, which is why `kubectl get ingress -n pawhaven-prod` on a fresh environment is expected to be
empty.

On the host, the ECS security group should expose only 80/443 to the internet, with 22 and 6443
restricted to operator addresses. Those rules live in Alibaba Cloud, not in this repository.

The deploy workflows connect from GitHub's runners, not from an operator laptop, so the operator
allowlist on 6443 does not by itself make a deploy possible. This repository does not record which
arrangement is in use and assumes no endpoint: choose one of the following, apply it, and verify it
from a runner of the same kind before relying on a deploy.

1. **Public API endpoint plus a runner egress allowance.** Keep the operator allowlist on 6443 and
   add the GitHub Actions address ranges published at `https://api.github.com/meta` (the `actions`
   key) as a second explicit source; refresh the rule when GitHub changes the ranges. Never replace
   the allowlist with `0.0.0.0/0`.
2. **A private route or tunnel.** The runner joins a private network (WireGuard, Tailscale,
   Cloudflare Tunnel or equivalent) and the kubeconfig points at a private address, so 6443 stays
   closed to the internet.
3. **A self-hosted runner inside the VPC.** The runner reaches the private API address directly, and
   the hosted-runner egress question disappears.

A kubeconfig whose `server` is a private ECS address cannot work from a GitHub-hosted runner without
option 2 or 3. Verify the chosen arrangement with a trivial dispatched job on the same runner type
that runs `kubectl get ns`; a timeout there is a network rule, not a deploy bug. Record the verified
arrangement here so the next operator does not rediscover it.

The gateway NetworkPolicy `pawhaven-allow-gateway-ingress` in
`deploy/platform/<env>/network-policies.yaml` admits TCP 8080 without a `from` peer, so any ingress
or tunnel controller reaches the gateway whatever namespace it runs in; a separate allowance admits
same-namespace pods. If the tunnel targets a different port, add it to that policy.

## Verify internal-only

```bash
kubectl get svc -n pawhaven-prod
```

Expected: every Service in the namespace is `ClusterIP`, including `gateway`; no `NodePort` or
`LoadBalancer`. Nothing in the deploy workflow checks this, so run it after a Service or platform
manifest change.

```bash
kubectl get ingress -n pawhaven-prod
```

Expected: `No resources found`. If an Ingress appears, confirm its backend is `gateway`; nothing in
the deploy workflow checks that for you.

```bash
kubectl -n default run curl-probe --rm -it --restart=Never --image=curlimages/curl -- \
  curl -sS -m 5 http://core-service.pawhaven-prod.svc.cluster.local:8081/api/core
```

Expected: the request times out or the connection is refused — default-deny ingress, with no
cross-namespace allowance.

```bash
kubectl -n pawhaven-prod exec deployment/gateway -- node -e \
  "fetch('http://core-service:8081/api/core').then(r => console.log(r.status)).catch(e => { console.error(e.cause?.code ?? e.message); process.exit(1); })"
```

Expected: an HTTP status. Any status proves the connection; the route itself may answer 404. This
works because `pawhaven-allow-namespace-ingress` admits same-namespace pods.

## Failure modes

| Symptom                                                         | Cause and fix                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A pod never becomes Ready and logs a config error               | A `pawhaven-env` or `pawhaven-secrets` key is missing in that namespace. Nothing checks the keys before the Deployment is applied, so the container starts and fails. Create or patch the object, then `kubectl -n <namespace> rollout restart deployment/<service>`.                                                                                                                                                   |
| A pod exits at startup naming `NODE_ENV`                        | `NODE_ENV` in `pawhaven-env` is missing or unrecognised; the shared resolver has no fallback, so the service stops at startup instead of loading another environment's config. Set it to `test`, `uat` or `prod` per namespace, then run `kubectl -n <namespace> rollout restart deployment/<service>`: a ConfigMap edit does not change the Pod template, so running pods keep the old value until they are recreated. |
| Pods stuck in `ImagePullBackOff` after a green deploy           | The node cannot pull the image: a rotated or wrong `ACR_PASSWORD`, a missing `acr-pull` secret in that namespace, or a personal-edition ACR access rule that omits the node. Recreate `acr-pull` as a `docker-registry` secret and delete the pod.                                                                                                                                                                      |
| Push fails after approval (artifact expired)                    | The image artifact expired before the approval (7 days). Nothing was published; re-dispatch `release.yml` for the same commit to rebuild and retry the same image tag.                                                                                                                                                                                                                                                  |
| A hand-run `kubectl apply -f` leaves pods in `ImagePullBackOff` | The committed manifests still carry the placeholder `v0.0.0-unspecified`. That is deliberate: the deploy workflow substitutes the release tag into a temporary copy and leaves the committed file alone, so a manual apply fails loudly instead of deploying an arbitrary image. Replace the tag yourself before applying by hand.                                                                                      |
| A rollout or platform apply times out                           | The `services` job waits 600 s for the rollout (`kubectl rollout status --timeout=600s`) and the `platform` job waits 900 s through `Azure/k8s-deploy`. One replica with `maxSurge: 0` means the old pod is gone during the replace. Check `kubectl -n <ns> describe pod` and the image tag in `kubectl get deploy -o yaml`.                                                                                            |
| A `Smoke check …` step fails                                    | The container started and its rollout completed, but it did not answer HTTP on its own port within a minute. The pods are Ready, yet the deploy is not usable; inspect it as described below.                                                                                                                                                                                                                           |
| Gateway unreachable while every pod is Ready                    | The gateway policy admits port 8080, and the namespace allowance covers same-namespace pods. Check that the ingress or Tunnel controller targets the port the policy names (see [Gateway exposure](#gateway-exposure)).                                                                                                                                                                                                 |

A failed smoke check means the service did not serve HTTP: either nothing answered or the server
returned a 5xx. Read its logs and repeat the request by hand, substituting the service and its port:

```bash
kubectl -n <namespace> logs deployment/<service>
kubectl -n <namespace> exec deployment/<service> -- node -e \
  "fetch('http://127.0.0.1:<port>/').then(r => console.log(r.status)).catch(e => { console.error(e.message); process.exit(1) })"
```

A 5xx is a server that answered and then failed the request; a connection error means nothing is
listening, so look for a crash after startup, a config error or a port that does not match the
Deployment.

A NetworkPolicy cannot block traffic that originates on the node itself, so kubelet TCP probes are
never filtered by the policy. If the CNI treats host traffic as external, add the node CIDR as an
extra `from` peer on the gateway policy — the comment in `network-policies.yaml` records this.

## Sizing

2 vCPU / 2 GiB is tight for K3s, Traefik and three services: the manifests alone request 200m CPU
and 256Mi, with limits up to 1.1 CPU and 768Mi, before system pods and page cache. Prefer 2 vCPU /
4 GiB, and watch `kubectl top node` after the first prod release.

## document-service

document-service stays on Vercel in production, with Vercel Blob for uploaded files; its Dockerfile
and manifests are kept for local or break-glass use. Those optional manifests still name their own
registry image and pull secret, because no workflow publishes this service — the
[document-service deploy README](../../apps/backend/document-service/deploy/README.md) is the
authority for them, not this runbook. No workflow scans for Dockerfiles; the service is absent from
both `service` choice lists, so no run selects it, and the empty `.out-of-pipeline` marker records
that intent. The optional manifests also reference secret keys the cluster secret does not carry
(`DOCUMENT_SERVICE_MONGODB`, `DOCUMENT_READ_WRITE_TOKEN`, `DOCUMENT_STORE_ID` and the
`EMAIL_SMTP_*` credentials); see
[`apps/backend/document-service/deploy/README.md`](../../apps/backend/document-service/deploy/README.md)
before applying them.

Vercel forces `NODE_ENV=production` and does not let a project override it; the shared resolver maps
`production` to `prod`, so the document-service Vercel project selects its production config bundle
with no extra variable. An auth-service or core-service Vercel project left from before the ECS
migration cannot select `test` or `uat` that way and should be retired; the cluster services read
`NODE_ENV` from `pawhaven-env`.
