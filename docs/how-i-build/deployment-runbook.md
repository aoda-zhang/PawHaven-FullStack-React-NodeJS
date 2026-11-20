# Deployment runbook: release, deploy and roll back

> This document covers **operating the deployment**: the cluster prerequisites, the two dispatch
> workflows, rollback, and the failures worth recognising. Workflow structure and triggers live in
> [CI/CD](ci-cd.md); this is the procedure.

## Where each service runs

| Service            | Runtime                                     | Image                                                   | Dockerfile                                        |
| ------------------ | ------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `gateway`          | K3s, `ClusterIP`, reachable through Traefik | `ghcr.io/aoda-zhang/pawhaven-gateway`                   | `apps/backend/gateway/deploy/Dockerfile`          |
| `core-service`     | K3s, `ClusterIP`, internal only             | `ghcr.io/aoda-zhang/pawhaven-core-service`              | `apps/backend/core-service/deploy/Dockerfile`     |
| `auth-service`     | K3s, `ClusterIP`, internal only             | `ghcr.io/aoda-zhang/pawhaven-auth-service`              | `apps/backend/auth-service/deploy/Dockerfile`     |
| `document-service` | Vercel — out of this pipeline               | `ghcr.io/aoda-zhang/pawhaven-document-service` (opt-in) | `apps/backend/document-service/deploy/Dockerfile` |
| portal             | Cloudflare Pages                            | —                                                       | —                                                 |
| MongoDB            | Managed cluster, outside the host           | —                                                       | —                                                 |

The cluster is one Alibaba Cloud ECS host running K3s.

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
directory beside the service's Dockerfile, and they keep the image placeholder `v0.0.0-unspecified`
until a deploy substitutes a version.

A service joins the pipeline by declaring a Dockerfile in its deploy directory; the workflows
discover services by scanning for that file, not by reading a list. An `.out-of-pipeline` marker
beside the Dockerfile keeps the service out of the `release.yml` discovery and out of both `service`
choice lists, and `publish-images.yml` publishes it only when it receives
`include_document_service: true`. document-service is the one service marked that way, so
`release.yml` skips it even when the deploy scope is `all`, and `deploy.yml` — which deploys one
service per run and has no `all` — never offers it. The `service` choice lists in `deploy.yml` and
`release.yml` remain the only static enumeration, because GitHub cannot compute `choice` options at
run time.

## Environments

| Environment | Namespace       | Kubeconfig secret | GitHub approval                            |
| ----------- | --------------- | ----------------- | ------------------------------------------ |
| `test`      | `pawhaven-test` | `KUBECONFIG_TEST` | none                                       |
| `uat`       | `pawhaven-uat`  | `KUBECONFIG_UAT`  | none                                       |
| `prod`      | `pawhaven-prod` | `KUBECONFIG_PROD` | `prod` environment with required reviewers |

Each environment is a namespace on the same cluster, so the same host, Traefik and MongoDB serve all
three. The NetworkPolicy allows same-namespace traffic, which is why separate namespaces also keep
the environments apart.

## One-time setup per environment

Run these once per namespace, before the first deploy. The deploy workflow creates the namespace
itself, then fails preflight if any item below is missing — an incomplete setup stops before the
platform manifests or any Deployment is applied. The steps below reproduce the same objects by hand.

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

The deploy workflow applies the same directory on every run after preflight, so it stays
authoritative: a policy edited by hand in the cluster is reverted by the next deploy.

### Runtime ConfigMap

Keys read through `envFrom` by all three services:

| Key                     | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`              | `test`, `uat` or `prod` — matches the namespace; missing/unknown fails startup |
| `AUTH_SERVICE_HOST`     | `http://auth-service:8082`                                                     |
| `CORE_SERVICE_HOST`     | `http://core-service:8081`                                                     |
| `DOCUMENT_SERVICE_HOST` | `https://<document-service>.vercel.app`                                        |

`NODE_ENV` selects the per-environment config directory (`config/<env>/env/index.json`) in every
service, so apply the name of the namespace: `test`, `uat`, or `prod`. Preflight also requires it to
resolve to the target environment; the resolver also accepts `production` for `prod`.

One ConfigMap serves every Deployment in the namespace; the per-service ConfigMaps from the earlier
manifests (`gateway-config`, `core-service-config`, and so on) are gone.

The two in-cluster hosts include the scheme and port: the gateway proxy uses the configured host
verbatim as its target (`apps/backend/gateway/src/proxy/proxy.service.ts`), and the shared HTTP
client appends `port` only for `localhost`/`127.0.0.1`
(`packages/backend-core/modules/http-client/httpClientInstance.ts`).

`DOCUMENT_SERVICE_HOST` must be the public HTTPS Vercel origin — scheme, no port, no trailing slash.
The HTTP client strips a trailing slash but never adds a port to a non-localhost host, and
document-service runs on Vercel, not in the cluster.

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

`ghcr.io` packages are private, so the namespace needs a registry credential named `ghcr-pull`. The
`pawhaven-runtime` ServiceAccount from [Namespace](#namespace) references it as `imagePullSecrets`,
and every Deployment runs as that account.

```bash
kubectl -n pawhaven-prod create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username='<github-user>' \
  --docker-password='<PAT with read:packages>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

### GitHub secrets and approval

```bash
base64 < ~/.kube/config | tr -d '\n' | gh secret set KUBECONFIG_PROD
```

Create the `prod` environment under Settings → Environments and add the required reviewers there;
that environment is what gates `release.yml` and a production `deploy.yml` run. The approval job is
the only job bound to it; the deploy jobs read the kubeconfig from repository scope.
`KUBECONFIG_TEST`, `KUBECONFIG_UAT` and `KUBECONFIG_PROD` are therefore **repository** secrets, not
environment secrets — `gh secret set` without `--env` stores them at repository scope. The `prod`
environment supplies the human approval gate only; it does not inject any kubeconfig. `test` and
`uat` have no environment gate.

That repository scope is an accepted risk. Anyone with write access can read a repository secret by
pushing a branch whose workflow prints it, so write access is itself part of the production boundary:
limit it to the people who may deploy, and protect `main` as described in
[CI/CD](ci-cd.md#repository-protection) so a pushed branch cannot become the deployed commit. The
`prod` deploy is main-only and approval-gated, but neither check helps if an untrusted writer can
read the kubeconfig. If stronger isolation is required, move the kubeconfigs to environment-scoped
secrets and accept the approval-flow change: every job that needs one must bind to that environment,
so `test` and `uat` need their own environment objects and the `prod` deploy keeps a dedicated
approved job.

Registry authentication is separate: the cluster pulls private `ghcr.io` images with the `ghcr-pull`
Kubernetes secret created in the namespace, not with a GitHub environment secret. Tag protection is
separate too: protect the `v*` tag pattern with a tag ruleset, as described in
[CI/CD](ci-cd.md#tag-protection), so a release tag cannot be moved or deleted. Tag protection does not
gate merges, and branch protection does not cover tags.

## Release procedure

Use this to build and ship a new version. It runs from `main` only: the `precheck` job rejects any
other ref.

```bash
gh workflow run release.yml -f service=all
gh run watch
```

1. Merge the change to `main` and confirm the commit to ship.
2. Dispatch `release.yml` from `main`; pick `all` or a single service for the deploy scope.
3. Approve the `prod` environment when the run pauses.
4. The run gates, tags, publishes every deployable service, then deploys the selected services.
5. Verify: `kubectl -n pawhaven-prod get deploy` and `kubectl rollout status deployment/<service> -n pawhaven-prod`.

## Deploy a service build

Use this to build and deploy the head of a branch, or to redeploy an existing image. One run deploys
one service.

```bash
gh workflow run deploy.yml -f environment=test -f service=gateway -f branch=develop
gh workflow run deploy.yml -f environment=prod -f service=gateway -f branch=main
gh workflow run deploy.yml -f environment=test -f service=gateway -f branch=develop -f version=v26.11.17
```

`branch` defaults to `develop` and must exist on `origin`; an unknown branch fails the run and lists
the branches that do. The run resolves that branch's head, checks the selected service with a
service-scoped `typecheck`/`test`/`lint` (it does not reuse `test.yml` and runs no Playwright E2E,
Storybook or full-repo gate), builds the selected service as `sha-<7>`, pushes it, then deploys it —
so the manifests it applies come from the same commit as the image.

`prod` requires `branch=main` and waits for the `prod` environment approval; `test` and `uat` accept
any branch and need no approval. Pass `version` to skip the check and the build and redeploy an image
that is already in `ghcr.io`, which is how a release is promoted or a rollback is run. The tag must
match `vYY.MM.DD`, `vYY.MM.DD-<n>` or `sha-<7>`, and the run fails before it connects to the cluster
if the tag is missing for the selected service.

Each Deployment runs one replica with `maxSurge: 0`, so a rollout briefly replaces the old pod
instead of overlapping it.

## Roll back

Rollback is a deploy of an older version tag; nothing is rebuilt or retagged.

Identify the previous known-good release explicitly. Do not take the newest tag blindly — during an
incident the newest `vYY.MM.DD` tag is usually the broken release, and it is not necessarily the tag
you want:

```bash
git tag --list 'v*' --sort=-creatordate | head -n 10
```

Read the list, exclude the broken release and any tag cut from the faulty commit, and confirm the
candidate contains the last good change before deploying it:

```bash
git log --oneline -5 <known-good-tag>
```

Then deploy that tag by name:

```bash
gh workflow run deploy.yml -f environment=prod -f service=gateway -f branch=main -f version=<known-good-tag>
```

With `version` set, the run skips the check and the build, so nothing is rebuilt or retagged; the
branch supplies the manifests and must be `main` for `prod`. `deploy.yml` deploys one service per
run, so roll back each affected service with its own dispatch.

If the broken change was already released as an image, reverting the commit on `main` and running
`release.yml` produces a new tag; the rollback command above is faster when the previous image is
still the one you want. Record which tag you deployed and why in the incident notes.

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
`LoadBalancer`. After deploying, the workflow requires every Service, including `gateway`, to be
`ClusterIP` and fails the run otherwise; only the Ingress-backend check names `gateway`.

```bash
kubectl get ingress -n pawhaven-prod
```

Expected: `No resources found`. The deploy workflow also fails the run if any Ingress backend is not
`gateway`.

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

| Symptom                                                                   | Cause and fix                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preflight names a missing ConfigMap/Secret key                            | The key is absent or the object lacks data. Create or patch it, then rerun; the platform manifests are applied, but no Deployment was applied.                                                                                                                                                                                                                                                                          |
| A pod exits at startup naming `NODE_ENV`                                  | `NODE_ENV` in `pawhaven-env` is missing or unrecognised; the shared resolver has no fallback, so the service stops at startup instead of loading another environment's config. Set it to `test`, `uat` or `prod` per namespace, then run `kubectl -n <namespace> rollout restart deployment/<service>`: a ConfigMap edit does not change the Pod template, so running pods keep the old value until they are recreated. |
| Preflight reports `ghcr-pull` missing                                     | The registry secret was never created in that namespace, or has the wrong name. Recreate it as a `docker-registry` secret.                                                                                                                                                                                                                                                                                              |
| `does not exist; leave version empty to build it or pass a published tag` | The `version` you passed is not in `ghcr.io` for the selected service. Pass a tag that a release published, or clear `version` so the run builds `sha-<7>` from the selected branch.                                                                                                                                                                                                                                    |
| Pods stuck in `ImagePullBackOff` after a green deploy                     | The node cannot pull the image: expired PAT, wrong scope, or package visibility. Preflight proves the tag exists, not that this node may pull it. Recreate `ghcr-pull` and delete the pod.                                                                                                                                                                                                                              |
| Release fails on an existing tag                                          | The candidate tag points at another commit. Same-day repeats get `-2`, `-3`; a tag is never moved. Re-dispatch from the intended commit.                                                                                                                                                                                                                                                                                |
| A hand-run `kubectl apply -f` leaves pods in `ImagePullBackOff`           | The committed manifests still carry the placeholder `v0.0.0-unspecified`. That is deliberate: the deploy workflow copies the service directory to a temp dir, replaces the placeholder with `sed`, and applies that copy, so a manual apply fails loudly instead of deploying an arbitrary image. Replace the tag yourself before applying by hand.                                                                     |
| Rollout times out after 300 s                                             | One replica with `maxSurge: 0` means the old pod is gone during the replace. Check `kubectl -n <ns> describe pod` and the image tag in `kubectl get deploy -o yaml`.                                                                                                                                                                                                                                                    |
| Gateway unreachable while every pod is Ready                              | The gateway policy admits port 8080, and the namespace allowance covers same-namespace pods. Check that the ingress or Tunnel controller targets the port the policy names (see [Gateway exposure](#gateway-exposure)).                                                                                                                                                                                                 |

A NetworkPolicy cannot block traffic that originates on the node itself, so kubelet TCP probes are
never filtered by the policy. If the CNI treats host traffic as external, add the node CIDR as an
extra `from` peer on the gateway policy — the comment in `network-policies.yaml` records this.

## Sizing

2 vCPU / 2 GiB is tight for K3s, Traefik and three services: the manifests alone request 200m CPU
and 256Mi, with limits up to 1.1 CPU and 768Mi, before system pods and page cache. Prefer 2 vCPU /
4 GiB, and watch `kubectl top node` after the first prod release.

## document-service

document-service stays on Vercel in production, with Vercel Blob for uploaded files; its Dockerfile
and manifests are kept for local or break-glass use. An empty `.out-of-pipeline` marker in its deploy
directory keeps it out of the `release.yml` discovery and both `service` choice lists, so no
`release.yml` run and no `deploy.yml` run selects it; `publish-images.yml` can still build it through
its `include_document_service` input, which `release.yml` does not set. The optional manifests also
reference secret keys the cluster secret does not carry (`DOCUMENT_SERVICE_MONGODB`,
`DOCUMENT_READ_WRITE_TOKEN`, `DOCUMENT_STORE_ID` and the `EMAIL_SMTP_*` credentials); see
[`apps/backend/document-service/deploy/README.md`](../../apps/backend/document-service/deploy/README.md)
before applying them.

Vercel forces `NODE_ENV=production` and does not let a project override it; the shared resolver maps
`production` to `prod`, so the document-service Vercel project selects its production config bundle
with no extra variable. An auth-service or core-service Vercel project left from before the ECS
migration cannot select `test` or `uat` that way and should be retired; the cluster services read
`NODE_ENV` from `pawhaven-env`.
