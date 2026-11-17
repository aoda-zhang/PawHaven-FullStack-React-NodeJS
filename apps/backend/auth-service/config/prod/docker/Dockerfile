# Build from the monorepo root:
# docker build -f apps/backend/auth-service/config/prod/docker/Dockerfile -t pawhaven-auth-service:prod .
FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm exec turbo run build --filter=@pawhaven/auth-service...
ENV NODE_ENV=production
WORKDIR /app/apps/backend/auth-service
EXPOSE 8082
CMD ["node", "dist/main.js"]
