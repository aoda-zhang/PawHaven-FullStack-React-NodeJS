[English](./README.md) | [中文](./README.cn.md)

# 🐾 PawHaven - Animal Rescue Platform

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![pnpm](https://img.shields.io/badge/Package-pnpm-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Community-7289DA?logo=discord&logoColor=white)](https://discord.gg/znnG258E)

**PawHaven** is a full-stack platform designed to support **stray animal rescue and adoption**, connecting volunteers, adopters, and the community.

The platform allows users to report rescue cases, track rescue progress, share rescue stories, and improve the visibility and coordination of rescue efforts.

In addition to the application itself, PawHaven also serves as a **practice of modern full-stack engineering**, focusing on scalable architecture, maintainable code, and efficient development workflows.

---

# 🛠 Prerequisites

| Requirement  | Version / notes                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Node.js**  | `24.x` — pinned by `.nvmrc` and `engines.node`, read by CI at runtime                                               |
| **pnpm**     | `12.x` — `packageManager: pnpm@12.4.1`; enable it with `corepack enable && corepack install`                        |
| **MongoDB**  | One reachable instance; `core-service`, `auth-service`, and `document-service` each use their own connection string |
| **Chromium** | Pulled in by `puppeteer` — `document-service` launches headless Chromium at runtime to render PDFs                  |

Verify the toolchain before continuing:

```bash
node -v   # v24.x
pnpm -v   # 12.x
```

---

# 📦 Installation

### 1. Clone and install dependencies

```bash
git clone https://github.com/aoda-zhang/PawHaven-Enterprise-FullStack-React-NestJS.git
cd PawHaven-Enterprise-FullStack-React-NestJS
pnpm install
```

`pnpm install` also runs the Prisma `postinstall` hook in `core-service` and `auth-service`. If you
skip it or the generated client is stale, regenerate explicitly:

```bash
pnpm --filter @pawhaven/core-service --filter @pawhaven/auth-service prisma:generate-mongodb
```

### 2. Generate the shared internal JWT keypair

Every service shares **one** ES256 (P-256) keypair: the gateway signs the short-lived internal JWT,
the downstream services verify it. Per-service keys would break cross-service verification.

```bash
node scripts/generate-internal-jwt-keys.mjs
```

It prints two base64-encoded PEM values. Put them in the env files of the services that need them:

| Variable                   | Set on                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| `INTERNAL_JWT_PRIVATE_KEY` | `gateway`, `core-service` (the signers)                            |
| `INTERNAL_JWT_PUBLIC_KEY`  | `auth-service`, `core-service`, `document-service` (the verifiers) |

### 3. Create the env files

Each app loads `.env.local.<env>` → `.env.<env>` → `.env.local` → `.env` from its own directory on
top of `src/config/<env>/env/index.json`. Copy the shipped examples and fill them in:

```bash
for app in gateway core-service auth-service document-service; do
  cp "apps/backend/$app/.env.example" "apps/backend/$app/.env"
done
cp apps/frontend/portal/.env.example apps/frontend/portal/.env
```

| Variable                                                                     | App                                                  | Purpose                                        |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `CORE_SERVICE_MONGODB` / `AUTH_SERVICE_MONGODB` / `DOCUMENT_SERVICE_MONGODB` | `core-service` / `auth-service` / `document-service` | MongoDB connection strings                     |
| `CORE_SERVICE_DB`                                                            | `gateway`                                            | Session store connection string                |
| `JWT_SECRET`                                                                 | `gateway`, `auth-service`                            | Signs/verifies the browser session JWT         |
| `AUTH_PRIVATEKEY`                                                            | `gateway`                                            | Gateway-side auth key                          |
| `CORE_SERVICE_HOST` / `AUTH_SERVICE_HOST` / `DOCUMENT_SERVICE_HOST`          | `gateway` (and `core-service` for the auth host)     | Upstream service origins                       |
| `INTERNAL_JWT_PRIVATE_KEY` / `INTERNAL_JWT_PUBLIC_KEY`                       | see the table above                                  | Internal ES256 service-to-service JWT          |
| `PAWHAVEN_USER_API_BASE_URL`                                                 | `portal`                                             | Gateway base URL (`http://localhost:8080/api`) |

### 4. Build, then start

```bash
pnpm build:local   # build packages/* first, then every app — run this before the first dev start
pnpm dev:local     # kill stale port holders, then start everything with file watching
```

Apps are built from `packages/*` output, not from source — **re-run `pnpm build:local` whenever you
change anything under `packages/`**.

Once up:

| App               | URL                            |
| ----------------- | ------------------------------ |
| Portal (frontend) | http://localhost:3001          |
| Gateway           | http://localhost:8080          |
| core-service      | http://localhost:8081/api-docs |
| auth-service      | http://localhost:8082/api-docs |
| document-service  | http://localhost:8083/api-docs |

Swagger UI is mounted at `/api-docs` on every service, but is disabled when `NODE_ENV=production`.

---

# ✨ Key Features

- **Rescue Case Management**  
  Create and track rescue cases, helping volunteers coordinate rescue operations.

- **Authentication & Authorization**  
  Secure authentication with JWT and role-based access control.

- **Knowledge Base**  
  Provide rescue guides and adoption knowledge through a centralized content system.

- **Community Interaction**  
  Share rescue stories and exchange experiences within the community.

---

# 🚀 Tech Stack & Highlights

| Layer        | Technology                                      | Highlights                                                      |
| ------------ | ----------------------------------------------- | --------------------------------------------------------------- |
| Frontend     | React, TypeScript, React Query, React Hook Form | Scalable component-based architecture                           |
| Backend      | NestJS, Node.js                                 | Microservices for service isolation                             |
| Architecture | Monorepo + `pnpm workspace`                     | Full-stack TypeScript with shared types across frontend/backend |
| Code Quality | ESLint, Prettier, Husky                         | Enforced standards, pre-commit hooks                            |
| CI/CD        | GitHub Actions                                  | Automated pipelines                                             |

---

# 💡 Usage Examples

### Walk through the portal

Start with `pnpm dev:local`, then open http://localhost:3001.

| Page             | Route                      | Auth           |
| ---------------- | -------------------------- | -------------- |
| Home             | `/`                        | public         |
| Login            | `/auth/login`              | public         |
| Register         | `/auth/register`           | public         |
| Rescue guides    | `/rescue/guides`           | public         |
| Rescue cases     | `/rescue-cases`            | public         |
| Case detail      | `/rescue/detail/:animalID` | public         |
| Report an animal | `/report-animal`           | requires login |

The Vite dev server proxies `/api` to the gateway on `http://localhost:8080`, so the frontend only
ever talks to the gateway.

### Call the API through the gateway

The gateway is the single entry point and rewrites each prefix onto its target service:

| Public prefix   | Target service           |
| --------------- | ------------------------ |
| `/api/core`     | `core-service` :8081     |
| `/api/auth`     | `auth-service` :8082     |
| `/api/document` | `document-service` :8083 |

Authentication is cookie-based: `POST /api/auth/login` sets `access_token` and `refresh_token`
cookies, and everything downstream reads them.

```bash
# 1. Register — the response carries the user, and the session is set as cookies
curl -c cookies.txt -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"volunteer@example.com","password":"Str0ng!Passw0rd"}'

# 2. Read the identity the gateway resolved for that session
curl -b cookies.txt http://localhost:8080/api/auth/me

# 3. Report a rescue case (authenticated)
curl -b cookies.txt -X POST http://localhost:8080/api/core/rescues \
  -H 'Content-Type: application/json' \
  -d '{
        "animalType": "cat",
        "age": "baby",
        "locationObj": { "address": "Green Park, north entrance", "latitude": 31.2304, "longitude": 121.4737 },
        "description": "Injured stray kitten, cannot walk",
        "size": "small",
        "animalCount": 1,
        "appearance": { "color": "orange" },
        "reporterPhotos": []
      }'

# 4. List cases — public, with optional filters
curl 'http://localhost:8080/api/core/rescues?status=PENDING&limit=10'

# 5. Refresh the session, then log out
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/auth/refresh
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/auth/logout
```

Other endpoints you can reach the same way:

| Method | Path                                 | Notes                          |
| ------ | ------------------------------------ | ------------------------------ |
| `POST` | `/api/auth/login`                    | Body: `email`, `password`      |
| `GET`  | `/api/auth/volunteer-count`          | public                         |
| `POST` | `/api/auth/volunteer/opt-in`         | authenticated                  |
| `POST` | `/api/core/report-animal`            | Body: `AnimalReportSchema`     |
| `GET`  | `/api/core/rescues/:id`              | Case detail                    |
| `GET`  | `/api/core/rescues/:id/photo/:index` | Streams a reporter photo       |
| `POST` | `/api/document/pdf/download`         | Renders a PDF (needs Chromium) |
| `POST` | `/api/document/email/send`           | Sends a templated email        |

### Run the checks

```bash
pnpm typecheck      # tsc --noEmit across every workspace
pnpm lint           # eslint — diff against the known baseline before calling anything new a regression
pnpm test           # vitest unit/integration suites
pnpm test:e2e       # Playwright; boots the portal itself at http://localhost:3001
```

Extra guards worth running before a PR: `pnpm token-check`, `pnpm architecture-check`,
`pnpm quality-check`, `pnpm harness:verify`.

---

# 🤖 AI Driver

**`harness-core/`** is the **AI-driven development engine** behind PawHaven — an agent harness that turns every coding request into a structured pipeline: `classify → plan → dispatch lanes → verify → review against architecture & patterns → update docs`.

👉 [Enter the harness](./harness-core/README.md) — 9 capabilities, 16 skills, 12 workflows, 4 rules, and 9 agents. `pnpm harness:verify` validates it.

---

# 🤝 Community

PawHaven is an open and evolving project.  
If you are interested in animal rescue, open-source development, or project architecture discussions, you are welcome to join the community.

💬 **Discord**  
👉 https://discord.gg/znnG258E

You can use the Discord server to:

- discuss project ideas and features
- talk about technical architecture
- ask development questions
- collaborate with other contributors

---

# 📚 Documentation

Documentation lives in [`docs/`](./docs/README.md), split by what each document is **for**:
`architecture/` (a technical point or a problem's design), `features/` (one portal feature's
frontend and backend detail), `product/` (the blueprint `features/` cite).

> `docs/features/` is **as-built** — one document per portal feature folder, each verified against
> the code. Gaps are recorded per feature, and
> [known defects](./docs/features/README.md#known-defects-in-the-code) are tabulated in the index.
> A feature doc is only as current as the last change that reconciled it, which is why the workflow
> reads the architecture docs and the code first, and writes these last.

### Product & Architecture

| Document                                                                            | Description                                                                       |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Product Strategy](./docs/product/PawHaven-Product-Strategy-EN.md)                  | Complete product blueprint — 7 modules, personas, value flywheel, roadmap         |
| [System Architecture](./docs/architecture/PawHaven-System-Architecture-Overview.md) | 4-service architecture, modular monolith, C4, gateway, security, design decisions |
| [Design System](./packages/design-system/README.md)                                 | Design tokens, Tailwind v4 theme, CSS utilities                                   |

### Authentication at a Glance

Browser JWT / cookies are owned by the **gateway** only. Per request it resolves the caller identity (F1–F4), refreshes when needed, and signs a short-lived **ES256 internal JWT** for the target service into the `x-gateway-jwt` header. Downstream services never see browser tokens — a global `InternalJwtGuard` verifies the internal JWT (fail closed) and handlers read the identity via `@InternalJwt()`, with endpoint policy expressed by `@Public()` / `@OptionalAuth()` / default-authenticated.

→ Full detail: [Authentication & Authorization Architecture](./docs/architecture/authentication-architecture.md).

### Engineering

| Document                                                                                          | Description                                                                             |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [AGENTS.md](./AGENTS.md) · [Harness](./harness-core/README.md)                                    | Hard constraints every agent holds, and the agent harness that enforces them            |
| [Authentication & Authorization Architecture](./docs/architecture/authentication-architecture.md) | Gateway-owned cookie JWT + internal ES256-JWT (InternalJwt) service auth, `roles` claim |
| [Route-Level Authentication](./docs/architecture/route_authentication.md)                         | Frontend route guard implementation                                                     |

---

# 🧑‍💻 Local Development

See [docs/development.md](./docs/development.md).

---

# 🌟 Contributing

Contributions are welcome — bug reports, features, docs, and architecture discussions alike.

### 1. Start with an issue

Open an issue before a non-trivial change so the approach can be agreed first. For anything
architectural, read [`docs/architecture/`](./docs/architecture/) first — those documents describe the
boundaries the code is expected to keep.

### 2. Fork, branch, commit

```bash
git checkout -b feat/rescue-case-filters
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`

- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- **Active scopes**: `auth`, `rescue`, `pdf`, `email`, `home`, `stats`, `docs`, `chore`

Husky runs commitlint on `commit-msg` and rejects non-conforming messages. One commit per logical
change. Changes to `harness-core/`, `adapters/`, or `validation/` are `docs(harness): …` or
`chore(harness): …` and ship on their own, never inside a feature change.

### 3. Meet the quality gate before you open a PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI (`.github/workflows/test.yml`) runs the same four, then Playwright. `pnpm lint` already exits
non-zero on a clean tree against a known baseline — diff against that baseline rather than "fixing"
a pre-existing finding that your change did not introduce.

If your change touches shared packages, also run `pnpm token-check`, `pnpm architecture-check`, and
`pnpm build:local` so downstream apps pick it up.

### 4. Follow the house rules

[`AGENTS.md`](./AGENTS.md) is the authoritative list; the ones that catch people out:

- Types and Zod schemas live in `packages/shared`, user-facing strings in `packages/i18n`
  (`en-US`, `zh-CN`, `de-DE` updated together).
- Styles come from `@pawhaven/design-system` tokens — no hardcoded colours, no `style={{}}`, no
  magic numbers. `pnpm token-check` enforces the tokens.
- Business values (limits, quotas, page sizes) come from config via `getOrThrow` — fail fast at
  startup, never a silent default literal.
- Tests are Vitest, colocated as `foo.test.ts`. React 19: no `forwardRef`, declare `ref?: Ref<T>`.
- **Docs are written last, from the code.** If you changed a portal feature, update its
  `docs/features/*.md` in the same change.

### 5. Open the pull request

Describe what changed and the command you ran to verify it — "it should work" is not verification.
Every mutating change gets an independent review before merge.

💬 Questions are welcome on [Discord](https://discord.gg/znnG258E).

---
