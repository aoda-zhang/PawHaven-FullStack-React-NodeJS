# Build from the monorepo root:
# docker build -f apps/backend/core-service/deploy/Dockerfile -t registry.cn-beijing.aliyuncs.com/pawhaven/pawhaven-core-service:local .
FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile --filter=@pawhaven/core-service... \
    && pnpm dlx turbo@2.11.10 run build --filter=@pawhaven/core-service...

ENV NODE_ENV=production
USER node
WORKDIR /app/apps/backend/core-service
EXPOSE 8081
CMD ["node", "dist/main.js"]
