# 🧑‍💻 PawHaven — Local Development

How to build and run PawHaven on your machine.

## Prerequisites

- **Node.js**: `25.x`
- **pnpm**: `11.x`

See [`README.MD`](./README.MD) for details. Install dependencies once:

```bash
pnpm install
```

## Build everything first

Before starting the dev servers, build all shared packages and applications. This compiles the `packages/*` libraries and every app so the workspace is internally consistent:

```bash
pnpm build:local
```

`build:local` runs `build:libs` (all `packages/*`) followed by `build` (all apps via Turborepo).

## Start the dev servers

```bash
pnpm dev:local
```

`dev:local` (`scripts/restart-dev.sh`) kills any PawHaven processes still holding the local dev ports, then starts every service and the web app with file watching (`turbo run dev`). Use it whenever you want a clean restart.

## Dev ports

| Service          | Port |
| ---------------- | ---- |
| gateway          | 8080 |
| core-service     | 8081 |
| auth-service     | 8082 |
| document-service | 8083 |
| portal (Vite)    | 3001 |

## Other useful scripts

| Script            | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `pnpm build`      | Build all apps (Turborepo)                                          |
| `pnpm build:libs` | Build only the `packages/*` shared libraries                        |
| `pnpm typecheck`  | Type-check every workspace                                          |
| `pnpm lint`       | Lint every workspace                                                |
| `pnpm test`       | Run unit/integration tests                                          |
| `pnpm test:e2e`   | Run Playwright end-to-end tests                                     |
| `pnpm dev:all`    | Build libs and start all dev servers (no port-kill pre-step)        |

## Notes

- `document-service` launches headless Chromium (Puppeteer) at runtime to render PDFs. Make sure the Chromium binary is available in your environment.
- When you add or change a shared package, re-run `pnpm build:local` so downstream apps pick up the new build.
