# Build from the monorepo root:
# docker build -f apps/backend/gateway/deploy/Dockerfile -t registry.cn-beijing.aliyuncs.com/pawhaven/pawhaven-gateway:local .
FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile --filter=@pawhaven/gateway... \
    && pnpm dlx turbo@2.11.10 run build --filter=@pawhaven/gateway...

ENV NODE_ENV=production
USER node
WORKDIR /app/apps/backend/gateway
EXPOSE 8080
CMD ["node", "dist/main.js"]
