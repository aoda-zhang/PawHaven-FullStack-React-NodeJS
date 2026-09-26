# AGENTS.md

Instructions for AI agents (and humans) working in this repository.

## What this is

PawHaven is an animal rescue & adoption platform — reporting stray animals,
tracking rescue cases, adoption, and community stories. It is also a
deliberate exercise in enterprise-grade full-stack engineering.

Monorepo: **pnpm workspaces + Turborepo**, TypeScript across the whole stack.

## Layout

```
apps/
├── frontend/
│   ├── portal/           # Main user-facing app (React + TS, Vite, port 3001)
│   └── admin/            # Admin dashboard (React + TS)
└── backend/              # NestJS microservices
    ├── gateway/          # :8080  API gateway — auth guard, rate limit, proxy, CORS
    ├── core-service/     # :8081  Modular monolith: Rescue, Reporting, Adoption,
    │                            Content, Volunteer, Community, Notification
    ├── auth-service/     # :8082  Register, login, JWT issue/refresh, RBAC
    ├── document-service/ # :8083  Upload, PDF generation, email, image processing
    └── config-service/   #        Configuration management

packages/                 # shared/ types+Zod, frontend-core, design-system, i18n, ui
libs/                     # eslint configs (web/ + node/), shared tooling
```

## Toolchain — read this before assuming versions

| Thing      | Required | Enforced by                                     |
| ---------- | -------- | ----------------------------------------------- |
| Node       | **24.x** | `.nvmrc`, `package.json` `engines`, CI          |
| pnpm       | **12.x** | `package.json` `packageManager` (`pnpm@12.4.1`) |
| TypeScript | 5.9      | root `devDependencies`                          |

These are the single source of truth. `.nvmrc` and `engines.node` must stay equal
— CI (`.github/workflows/test.yml`, `.github/actions/install-build`) reads
`engines.node` at runtime and pipes it into `setup-node`, so **`engines.node` is
what actually builds and tests every PR**. Keep `README.MD` / `READMECN.MD` /
`DEVELOPMENT.MD` / `DEVELOPMENTCN.MD` in sync with it.

## Commands

```bash
pnpm install

pnpm build:local     # build packages/* THEN all apps — run this first
pnpm dev:local       # kill stale port holders, then turbo run dev (clean restart)
pnpm dev:all         # build libs + start dev servers, no port-kill pre-step

pnpm typecheck       # turbo run typecheck
pnpm lint            # turbo run lint
pnpm test            # turbo run test
pnpm test:e2e        # playwright
pnpm build:libs      # only packages/*
```

**Rebuild shared packages after changing anything in `packages/*`** —
downstream apps consume the built output, not source. `pnpm build:local` is
the safe move.

`document-service` launches headless Chromium at runtime for PDF rendering, so
the Chromium binary must be present in the environment.

## Conventions

### Commits — Conventional Commits, enforced

Husky `commit-msg` runs commitlint and **rejects** non-conforming messages.

```
feat(auth): add login via email
fix(rescue:status): correct status transition logic
refactor(pdf): extract template registry
```

Scopes in active use: `auth`, `rescue`, `pdf`, `email`, `home`, `stats`, `docs`,
`chore`.

### Lint & format

- ESLint centralized in `libs/eslint` — `web` for frontend, `node` for backend.
  Apps import the matching config; do not add a bespoke config to an app.
- Prettier at root (`.prettierrc`), Tailwind class sorting via
  `prettier-plugin-tailwindcss`.
- Husky `pre-commit` runs `lint-staged`: `eslint --fix` then `prettier --write`
  on staged `js/jsx/ts/tsx/mjs/cjs` and `json`, `prettier --write` on `md`.
- Design tokens are enforced — `pnpm token-check` validates
  `packages/design-system`. Do not hardcode magic values in styles.

### Code style

- Shared types, Zod schemas, and constants belong in `packages/shared` and are
  consumed by both sides. Do not redefine a DTO on one side.
- No hardcoded user-facing strings in the frontend — use `packages/i18n` and the
  `t()` function. Locales: `en-US`, `zh-CN`, `de-DE`.
- Styling goes through `packages/design-system` tokens (Tailwind v4 + MUI v7).

## Authentication architecture — non-negotiable invariant

**The gateway alone owns browser cookies and browser JWTs.**

Per request the gateway resolves the caller identity (F1–F4), refreshes the
token when needed, then signs a **short-lived HS256 internal JWT** for the target
service into the `x-gateway-jwt` header.

- Downstream services **never** see browser tokens.
- A global `InternalJwtGuard` verifies the internal JWT and **fails closed**.
- Handlers read identity via the `@InternalJwt()` decorator — never by parsing
  cookies or trusting headers directly.
- Endpoint policy is declared with `@Public()`, `@OptionalAuth()`, or nothing at
  all (default = authenticated).

Full detail: `.codebuddy/docs/authentication-architecture.md`.

## The `.codebuddy` AI engine

This repo ships its own agent orchestrator in `.codebuddy/`, and it is the
intended way to drive larger changes:

```
request → plan → dispatch agents → verify with tests → review → update knowledge
```

- `agents/` — `pawhaven` (main orchestrator), `frontend`, `backend`, `architect`,
  `code-review`, `testing`, `knowledge-update`
- `skills/` — `frontend`, `code-review`
- `docs/` — architecture docs; **read these before designing anything**
- `principles/`, `rules/`, `workflows/`, `memory/`

Follow the orchestrator's plan-then-dispatch protocol for feature work: classify
the request, present an agent-level plan, wait for approval, then dispatch.

### Key documents

| Doc                                                 | Covers                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `.codebuddy/docs/PawHaven-System-Architecture.md`   | 5 services, modular monolith, DDD, event-driven, design decisions |
| `.codebuddy/docs/PawHaven-Backend-Architecture.md`  | NestJS services, modules, data flow                               |
| `.codebuddy/docs/PawHaven-Frontend-Architecture.md` | React app structure, state, routing                               |
| `.codebuddy/docs/authentication-architecture.md`    | Gateway-owned cookies + internal HS256 JWT, RBAC                  |
| `.codebuddy/docs/route_authentication.md`           | Frontend route guards                                             |
| `.codebuddy/docs/project_standards.md`              | Lint, format, hooks, commit rules                                 |

When architecture changes, update the matching doc in `.codebuddy/docs/` in the
same change.

## Working in this repo

- `pnpm-workspace.yaml` includes `apps/**`, `packages/**`, and `libs/**`, and
  deliberately **excludes** `**/prisma/**/client` and `**/src/prisma/**/client`
  so generated Prisma clients are not treated as workspace packages.
- `overrides` pins `@vitest/coverage-v8` to `4.1.11` — vitest 4 requires a
  matching coverage provider major, otherwise coverage refuses to run. Do not
  "upgrade" this casually.
- `.npmrc` points at `registry.npmmirror.com`.
- Prefer reading existing code and `.codebuddy/docs/` over inventing new
  patterns. Consistency with the existing architecture matters more than
  personal preference.
