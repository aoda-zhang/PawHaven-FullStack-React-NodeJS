# Build from the monorepo root:
# docker build -f apps/backend/gateway/config/prod/docker/Dockerfile -t pawhaven-gateway:prod .
FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm exec turbo run build --filter=@pawhaven/gateway...
ENV NODE_ENV=production
WORKDIR /app/apps/backend/gateway
EXPOSE 8080
CMD ["node", "dist/main.js"]
