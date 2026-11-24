# Build from the monorepo root:
# docker build -f apps/backend/auth-service/deploy/Dockerfile -t crpi-1d0srkihv1btvqu3.cn-beijing.personal.cr.aliyuncs.com/pahaven/pawhaven-auth-service:local .
FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile --filter=@pawhaven/auth-service... \
    && pnpm dlx turbo@2.11.10 run build --filter=@pawhaven/auth-service...

ENV NODE_ENV=production
USER node
WORKDIR /app/apps/backend/auth-service
EXPOSE 8082
CMD ["node", "dist/main.js"]
