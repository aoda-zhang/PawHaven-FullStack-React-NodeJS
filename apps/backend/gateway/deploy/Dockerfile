# Build from the monorepo root:

FROM node:24-bookworm-slim AS dependencies
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
# Only the manifests inside the gateway's workspace graph: when every workspace project is
# present, a production install also resolves the other projects' runtime dependencies.
# Keep this list in sync with the gateway's workspace dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/gateway/package.json apps/backend/gateway/
COPY packages/backend-core/package.json packages/backend-core/
COPY packages/shared/package.json packages/shared/
# The root prepare hook needs husky, which a production install drops; the shipped graph has
# no build steps because its native packages ship prebuilt binaries.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter=@pawhaven/gateway...

FROM node:24-bookworm-slim AS builder
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
# Manifests before source, so the install layer survives source-only changes. The gateway's
# workspace graph is every project the build reads.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/gateway/package.json apps/backend/gateway/
COPY packages/backend-core/package.json packages/backend-core/
COPY packages/shared/package.json packages/shared/
COPY libs/eslint-config/package.json libs/eslint-config/
COPY libs/tsconfig/package.json libs/tsconfig/
RUN pnpm install --frozen-lockfile --filter=@pawhaven/gateway...
COPY . .
# pnpm re-checks dependency state before running a script and reads the full workspace from the
# source copy as an out-of-date install, so it would reinstall every project inside this layer.
RUN pnpm_config_verify_deps_before_run=false pnpm exec turbo run build --filter=@pawhaven/gateway...

FROM node:24-bookworm-slim AS runtime
WORKDIR /repo
COPY --from=dependencies /repo ./
COPY --from=builder /repo/apps/backend/gateway/dist apps/backend/gateway/dist
COPY --from=builder /repo/packages/backend-core/dist packages/backend-core/dist
COPY --from=builder /repo/packages/shared/dist packages/shared/dist
ENV NODE_ENV=production
USER node
WORKDIR /repo/apps/backend/gateway
EXPOSE 8080
CMD ["node", "dist/main.js"]
