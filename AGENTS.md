# AGENTS.md

Instructions for AI agents (and humans) working in this repository.

## What this is

PawHaven is an animal rescue & adoption platform — reporting stray animals, tracking rescue
cases, adoption, and community stories. Monorepo: **pnpm workspaces + Turborepo**, TypeScript.

## Layout

```
apps/
├── frontend/
│   └── portal/           # Main user-facing app (React + TS, Vite, port 3001)
└── backend/              # NestJS microservices
    ├── gateway/          # :8080  API gateway — auth guard, rate limit, proxy, CORS
    ├── core-service/     # :8081  Modular monolith: 7 feature modules
    ├── auth-service/     # :8082  Register, login, JWT issue/refresh, User.roles
    └── document-service/ # :8083  Upload, PDF generation, email, image processing

packages/                 # shared/ types+Zod, backend-core, frontend-core,
                          # design-system, i18n, ui
libs/                     # eslint configs (web/ + node/), shared tooling
```

## Toolchain — read this before assuming versions

| Thing      | Required | Enforced by                                     |
| ---------- | -------- | ----------------------------------------------- |
| Node       | **24.x** | `.nvmrc`, `package.json` `engines`, CI          |
| pnpm       | **12.x** | `package.json` `packageManager` (`pnpm@12.4.1`) |
| TypeScript | 5.9      | root `devDependencies`                          |

`.nvmrc` and `engines.node` must stay equal — CI reads `engines.node` at runtime — and stay in sync with both READMEs and both `docs/development` guides.

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

**Rebuild shared packages after changing anything in `packages/*`** — downstream apps consume
the built output, not source. `document-service` needs a Chromium binary at runtime for PDF rendering.

## Authentication architecture — non-negotiable invariant

**The gateway alone owns browser cookies and browser JWTs.** Per request it signs a
**short-lived ES256 internal JWT** for the target service into `x-gateway-jwt`. Downstream services
**never** see browser tokens (`InternalJwtGuard` fails closed); handlers read identity via `@InternalJwt()`.

Full detail: `docs/architecture/authentication-architecture.md`.

## The agent harness

Agent config lives in `.pi/`, committed project-locally — pi is the harness layer. The map is
[`.pi/README.md`](.pi/README.md); `pnpm pi-check` and `pnpm check:links` validate it.

## Documentation

`docs/` is split by what a document is **for** — start at [`docs/README.md`](docs/README.md).
Operational portal facts are in [`docs/frontend-portal.md`](docs/frontend-portal.md).

### Read the code first, write the feature docs last

Entering a task, read the architecture docs for the area in scope, then the **code**.
`docs/features/**` is never an input to a decision. Code and document disagree, the code is right.
After the change is verified, update the feature doc from the code that shipped. Same change, same lane.

## Hard constraints

Behavioural rules — the ones an agent gets wrong without being told.

### Git

- **No agent commits anything unless the user explicitly asks.** Every agent alike, and source,
  scripts, tests, config, and docs. Being asked to _make a change_ is not permission to commit.
- Never push, open a PR, or babysit one. Never force-push, `reset --hard`, `clean`, or delete a
  branch without asking.

### Code

- **Don't write comments for unnecessary code.** The default is to add none. Every comment explains
  **why**, not **what**.
- **React 19: `forwardRef` is obsolete.** Functions accept `ref` implicitly; declare
  `ref?: Ref<T>` in props.
- Styling goes through `@pawhaven/design-system` tokens as Tailwind utilities. No hardcoded
  colours, no `style={{}}`, no magic numbers.
- **Vitest, not Jest** — Jest is not installed. Test files sit beside the source as `foo.test.ts`.
  No coverage threshold is enforced anywhere.
- Shared types and Zod schemas live in `packages/shared`. No hardcoded user-facing strings —
  use `packages/i18n`. Locales `en-US`, `zh-CN`, `de-DE`, updated together.
- **No hardcoded business values.** A limit, quota, baseline, or page size comes from config —
  `getOrThrow`, fail fast at startup, never a silent default — not from a literal in source.

### Dispatch and verification

- **Never implement it yourself.** Features, fixes, refactors, one-line patches — all go through
  a lane. You review diffs; you do not write them.
- **Every mutating change gets an independent review.** Dispatch `reviewer` as a separate context;
  a change nobody independent has read has not been reviewed. `reviewer` is the only lane that
  emits a verdict about code.
- **Never micro-manage.** A dispatch names a scope, a data shape, and observable success criteria
  — not a file list.
- Classify before planning (Trivial / Standard / Architectural). Approval is not per-step: once
  given, reversible sub-steps just get done.
- **A lane with no named validator has not finished.** Every check reads `PASS | FAIL | NOT RUN`,
  and anything unrun carries the reason. A failed check routes back to the **developer** lane, in
  a loop capped at 3 cycles. A finding that says the plan is wrong returns to planning instead.
- **No plausibility passes.** If you cannot name the command that ran and the output it produced,
  it did not pass. A bug's repro must pass on the same surface that failed.
- Verify the **combined** tree, not just the units. `pnpm lint` already fails from 13 pre-existing
  errors (3 in `gateway`, 10 in `backend-core`) — diff against baseline before calling anything a
  regression.
- **A worker that cannot build what it was handed stops and signals** `CONTRACT_CHANGE_REQUIRED`
  rather than quietly redefining a boundary.
- **Never hand-edit the harness or `docs/architecture/` as a side effect of a feature task**;
  those changes deserve their own commit.
- **Never ask the user for Figma files or screenshots** — Figma is not used here; the token source
  is `packages/design-system/src/tokens/`.

### Reporting

- State what you checked **and what you deliberately left alone**. Link only artifacts you
  produced or read this session; no fabricated references.
- Every handoff classifies Doc Impact as `none` / `update` / `create`.
- A principle cited without naming the choice it changed counts as unverified.

## Working in this repo

- `pnpm-workspace.yaml` includes `apps/**`, `packages/**`, and `libs/**`, and deliberately
  **excludes** `**/prisma/**/client` and `**/src/prisma/**/client` (generated clients aren't packages).
- `overrides` pins `@vitest/coverage-v8` to `4.1.11`. Do not "upgrade" this casually.
- `.npmrc` points at `registry.npmmirror.com`.
- Prefer reading existing code and `docs/` over inventing new patterns.
