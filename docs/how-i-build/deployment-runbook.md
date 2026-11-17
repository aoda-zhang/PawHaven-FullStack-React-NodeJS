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
beside the Dockerfile removes the service from `deploy.yml` and `release.yml`, and
`publish-images.yml` publishes it only when it receives `include_document_service: true`.
document-service is the one service marked that way, so `release.yml` and a `deploy.yml` run with
`service: all` skip it. The `service` choice lists in `deploy.yml` and `release.yml` remain the only
static enumeration, because GitHub cannot compute `choice` options at run time.

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
itself, then fails preflight if any item below is missing — so an incomplete setup stops before the
platform manifests or any Deployment is applied.

### Runtime ConfigMap

Keys read through `envFrom` by all three services:

| Key                     | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`              | `test`, `uat` or `prod` — matches the namespace; missing/unknown fails startup |
| `AUTH_SERVICE_HOST`     | `http://auth-service:8082`                                                     |
| `CORE_SERVICE_HOST`     | `http://core-service:8081`                                                     |
| `DOCUMENT_SERVICE_HOST` | `https://<document-service>.vercel.app`                                        |

`NODE_ENV` selects the per-environment config directory (`config/<env>/env/index.json`) in every
service, so apply the name of the namespace: `test`, `uat`, or `prod`.

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

### Image pull secret and ServiceAccount

`ghcr.io` packages are private, so the namespace needs a registry credential named `ghcr-pull`. The
platform manifests create the ServiceAccount `pawhaven-runtime`, which references that secret as its
`imagePullSecrets`, and every Deployment runs as it.

```bash
kubectl -n pawhaven-prod create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username='<github-user>' \
  --docker-password='<PAT with read:packages>' \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f deploy/platform/prod
```

`deploy/platform/prod` applies the Namespace, the ServiceAccount and three NetworkPolicies:
default-deny ingress, a same-namespace allowance, and port 8080 on the gateway for whichever ingress
or tunnel controller fronts it. Run it once per environment by substituting `test` or `uat`.

The deploy workflow applies the same directory on every run, so it stays authoritative: a policy
edited by hand in the cluster is reverted by the next deploy.

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

Registry authentication is separate: the cluster pulls private `ghcr.io` images with the `ghcr-pull`
Kubernetes secret created in the namespace, not with a GitHub environment secret. Protect the `v*`
tag pattern with a ruleset so a release tag cannot be moved or deleted.

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

## Deploy an existing version

Use this to promote a version that is already published, or to move an environment without a
release. It never builds.

```bash
gh workflow run deploy.yml -f environment=test -f service=all
gh workflow run deploy.yml -f environment=prod -f service=gateway -f version=v26.11.17
```

Leave `version` empty to deploy the newest `v*` tag by creation date. `deploy.yml` checks that the
tag exists in `ghcr.io` for every selected service before it connects to the cluster, and `prod`
waits for the same `prod` environment approval. A `prod` deploy must be dispatched from `main`; the
`resolve` job rejects any other ref for `prod`. `test` and `uat` accept any ref by design.

Each Deployment runs one replica with `maxSurge: 0`, so a rollout briefly replaces the old pod
instead of overlapping it.

## Roll back

Rollback is a deploy of an older version tag; nothing is rebuilt or retagged.

```bash
gh workflow run deploy.yml -f environment=prod -f service=all -f version=v26.11.10
```

Pick the previous `vYY.MM.DD` tag from `git tag --sort=-creatordate | head`. If the broken change was
already released as an image, reverting the commit on `main` and running `release.yml` produces a
new tag; the rollback command above is faster when the previous image is still the one you want.

## Gateway exposure

The gateway Service is `ClusterIP`. Nothing in this repository publishes it: the k3s-bundled Traefik
ingress controller sits in front of the cluster, and Cloudflare Tunnel terminates public TLS and
forwards to it. That routing (IngressRoute or Helm values) is platform configuration outside this
repo, which is why `kubectl get ingress -n pawhaven-prod` on a fresh environment is expected to be
empty.

On the host, the ECS security group should expose only 80/443 to the internet, with 22 and 6443
restricted to operator addresses. Those rules live in Alibaba Cloud, not in this repository.

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

| Symptom                                                         | Cause and fix                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preflight names a missing ConfigMap/Secret key                  | The key is absent or the object lacks data. Create or patch it, then rerun; nothing was applied.                                                                                                                                                                                                                                                    |
| A pod exits at startup naming `NODE_ENV`                        | `NODE_ENV` in `pawhaven-env` is missing or unrecognised; the shared resolver has no fallback, so the service stops at startup instead of loading another environment's config. Set it to `test`, `uat` or `prod` per namespace.                                                                                                                     |
| Preflight reports `ghcr-pull` missing                           | The registry secret was never created in that namespace, or has the wrong name. Recreate it as a `docker-registry` secret.                                                                                                                                                                                                                          |
| `does not exist; publish it through release.yml first`          | The version tag is not in `ghcr.io` for a selected service. Run `release.yml`, or pass a tag that exists.                                                                                                                                                                                                                                           |
| Pods stuck in `ImagePullBackOff` after a green deploy           | The node cannot pull the image: expired PAT, wrong scope, or package visibility. Preflight proves the tag exists, not that this node may pull it. Recreate `ghcr-pull` and delete the pod.                                                                                                                                                          |
| Release fails on an existing tag                                | The candidate tag points at another commit. Same-day repeats get `-2`, `-3`; a tag is never moved. Re-dispatch from the intended commit.                                                                                                                                                                                                            |
| A hand-run `kubectl apply -f` leaves pods in `ImagePullBackOff` | The committed manifests still carry the placeholder `v0.0.0-unspecified`. That is deliberate: the deploy workflow copies the service directory to a temp dir, replaces the placeholder with `sed`, and applies that copy, so a manual apply fails loudly instead of deploying an arbitrary image. Replace the tag yourself before applying by hand. |
| Rollout times out after 300 s                                   | One replica with `maxSurge: 0` means the old pod is gone during the replace. Check `kubectl -n <ns> describe pod` and the image tag in `kubectl get deploy -o yaml`.                                                                                                                                                                                |
| Gateway unreachable while every pod is Ready                    | The gateway policy admits port 8080, and the namespace allowance covers same-namespace pods. Check that the ingress or Tunnel controller targets the port the policy names (see [Gateway exposure](#gateway-exposure)).                                                                                                                             |

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
directory keeps it out of `deploy.yml` and `release.yml`; `publish-images.yml` can still build it
through its `include_document_service` input, which `release.yml` does not set. The optional
manifests also reference secret keys the cluster secret does not carry (`DOCUMENT_SERVICE_MONGODB`,
`DOCUMENT_STORE_ID`, SMTP credentials, and others); see
[`apps/backend/document-service/deploy/README.md`](../../apps/backend/document-service/deploy/README.md)
before applying them.
