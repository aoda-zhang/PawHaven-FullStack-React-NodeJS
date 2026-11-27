# Build from the monorepo root:
# docker build -f apps/backend/core-service/deploy/Dockerfile -t pawhaven-core-service:local .

FROM node:24-bookworm-slim AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
# Only the manifests inside the service's workspace graph: when every workspace project is
# present, a production install also resolves the other projects' runtime dependencies.
# Keep this list in sync with core-service's workspace dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/core-service/package.json apps/backend/core-service/
COPY packages/backend-core/package.json packages/backend-core/
COPY packages/i18n/package.json packages/i18n/
COPY packages/shared/package.json packages/shared/
# `@prismaClient/index.js` is a `link:` dependency on the generated Prisma client, which this
# stage never generates; create the target directory the link points at.
RUN mkdir -p apps/backend/core-service/src/prisma/mongodb/client
# The service's postinstall runs `prisma generate` against a schema this manifest-only stage does
# not have, and the root prepare hook needs husky, which a production install drops.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter=@pawhaven/core-service...

FROM node:24-bookworm-slim AS builder
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
# Manifests before source, so the install layer survives source-only changes. This is every
# workspace project the build reads.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/core-service/package.json apps/backend/core-service/
COPY packages/backend-core/package.json packages/backend-core/
COPY packages/i18n/package.json packages/i18n/
COPY packages/shared/package.json packages/shared/
COPY libs/eslint-config/package.json libs/eslint-config/
COPY libs/tsconfig/package.json libs/tsconfig/
# The service's postinstall runs `prisma generate` against `src/prisma/mongodb/schema.prisma`,
# which does not exist until the source copy below, so the install itself skips scripts; the
# `prebuild` hook generates the client during `turbo run build` instead.
RUN pnpm install --frozen-lockfile --ignore-scripts --filter=@pawhaven/core-service...
COPY . .
# pnpm re-checks dependency state before running a script and reads the full workspace from the
# source copy as an out-of-date install, so it would reinstall every project inside this layer.
RUN pnpm_config_verify_deps_before_run=false pnpm exec turbo run build --filter=@pawhaven/core-service...

FROM node:24-bookworm-slim AS runtime
# `@pawhaven/i18n` is deliberately absent below: it has no build step, ships unbundled frontend
# sources, and this service never imports it. The deps stage carries its manifest only so the
# production install can resolve the workspace dependency.
WORKDIR /repo
COPY --from=deps /repo ./
COPY --from=builder /repo/apps/backend/core-service/dist apps/backend/core-service/dist
# `dist/main.js` requires the `@prismaClient/index.js` link, which resolves to this source
# directory rather than to the asset copy inside `dist`; it also carries the query engine.
COPY --from=builder /repo/apps/backend/core-service/src/prisma/mongodb/client \
    apps/backend/core-service/src/prisma/mongodb/client
COPY --from=builder /repo/packages/backend-core/dist packages/backend-core/dist
COPY --from=builder /repo/packages/shared/dist packages/shared/dist
ENV NODE_ENV=production
USER node
WORKDIR /repo/apps/backend/core-service
EXPOSE 8081
CMD ["node", "dist/main.js"]
