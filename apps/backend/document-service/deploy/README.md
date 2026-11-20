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
- The deployment also reads six Secret keys that the in-pipeline services do not
  use: `DOCUMENT_SERVICE_MONGODB`, `DOCUMENT_READ_WRITE_TOKEN`, `DOCUMENT_STORE_ID`,
  `EMAIL_SMTP_HOST`, `EMAIL_SMTP_USER` and `EMAIL_SMTP_PASSWORD`. Add them to the
  existing `pawhaven-secrets` Secret without removing the six in-pipeline keys
  (`JWT_SECRET`, `INTERNAL_JWT_PRIVATE_KEY`, `INTERNAL_JWT_PUBLIC_KEY`,
  `CORE_SERVICE_MONGODB`, `AUTH_SERVICE_MONGODB`, `BLOB_PUBLIC_BASE_URL`); the
  in-pipeline Deployments still read those, so removing them breaks the next
  deploy of `gateway`, `core-service` or `auth-service`.
- A writable `/tmp` is required by Puppeteer and is provided as an `emptyDir`
  volume.
- Apply the manifests directly, for example:
  `kubectl apply -f apps/backend/document-service/deploy/kubernetes/prod`
- The Dockerfile next to this file bundles the Debian runtime libraries plus a
  downloaded Chrome for Testing, because the service generates PDFs outside
  Vercel.
