# document-service deploy assets (out of pipeline)

document-service is not built or deployed by the ECS/K3s pipeline. Vercel is its
production runtime; this directory only keeps the container path reproducible for
local or break-glass use. The empty `.out-of-pipeline` marker lets tooling skip
this service when it enumerates `apps/backend/*/deploy`.

- The image tag `v0.0.0-unspecified` is a placeholder. Set a real tag in
  `kubernetes/prod/deployment.yaml` before applying it.
- The manifests pin namespace `pawhaven-prod` and expect the same cluster objects
  as the in-pipeline services: ConfigMap `pawhaven-env`, Secret `pawhaven-secrets`,
  image pull secret `ghcr-pull`, and ServiceAccount `pawhaven-runtime`.
- A writable `/tmp` is required by Puppeteer and is provided as an `emptyDir`
  volume.
- Apply the manifests directly, for example:
  `kubectl apply -f apps/backend/document-service/deploy/kubernetes/prod`
- The Dockerfile next to this file bundles the Debian runtime libraries plus a
  downloaded Chrome for Testing, because the service generates PDFs outside
  Vercel.
