# Retained for the optional document-service image; the ECS/K3s pipeline does not
# build or deploy it. See apps/backend/document-service/deploy/README.md.
# Build from the monorepo root:
# docker build -f apps/backend/document-service/deploy/Dockerfile -t ghcr.io/aoda-zhang/pawhaven-document-service:local .
FROM node:24-bookworm-slim

WORKDIR /app

# Puppeteer downloads Chrome for Testing at install time. These are its runtime
# libraries on Debian; document-service uses this browser outside Vercel.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Keep Puppeteer's downloaded browser available to the non-root runtime user.
ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer
RUN mkdir -p "$PUPPETEER_CACHE_DIR" && chown -R node:node /home/node

RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

COPY . .

# The prebuild step compiles the PDF stylesheet and copies its CJK font.
RUN pnpm install --frozen-lockfile --filter=@pawhaven/document-service... \
    && pnpm dlx turbo@2.11.10 run build --filter=@pawhaven/document-service... \
    && chown -R node:node "$PUPPETEER_CACHE_DIR"

USER node
WORKDIR /app/apps/backend/document-service

EXPOSE 8083
CMD ["node", "dist/main.js"]
