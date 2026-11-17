# Build from the monorepo root:
# docker build -f apps/backend/core-service/config/prod/docker/Dockerfile -t pawhaven-core-service:prod .
FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm exec turbo run build --filter=@pawhaven/core-service...
ENV NODE_ENV=production
WORKDIR /app/apps/backend/core-service
EXPOSE 8081
CMD ["node", "dist/main.js"]
