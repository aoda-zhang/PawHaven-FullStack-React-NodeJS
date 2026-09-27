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
│   └── portal/           # Main user-facing app (React + TS, Vite, port 3001)
└── backend/              # NestJS microservices
    ├── gateway/          # :8080  API gateway — auth guard, rate limit, proxy, CORS
    ├── core-service/     # :8081  Modular monolith: Rescue, Reporting, Adoption,
    │                            Content, Volunteer, Community, Notification
    ├── auth-service/     # :8082  Register, login, JWT issue/refresh, User.roles
    ├── document-service/ # :8083  Upload, PDF generation, email, image processing

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

These are the single source of truth. `.nvmrc` and `engines.node` must stay equal
— CI (`.github/workflows/test.yml`, `.github/actions/install-build`) reads
`engines.node` at runtime and pipes it into `setup-node`, so **`engines.node` is
what actually builds and tests every PR**. Keep `README.md` / `README.cn.md` /
`docs/development.md` / `docs/development.cn.md` in sync with it.

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

### Commits

Husky `commit-msg` runs commitlint and **rejects** non-conforming messages. The
full policy — including the standing rule that no agent commits without being
asked — is in [Hard constraints](#hard-constraints).

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

Shared types in `packages/shared`, no hardcoded user-facing strings, design-system
tokens only — all stated in [Hard constraints](#hard-constraints).

## Authentication architecture — non-negotiable invariant

**The gateway alone owns browser cookies and browser JWTs.**

Per request the gateway resolves the caller identity (F1–F4), refreshes the
token when needed, then signs a **short-lived ES256 internal JWT** for the target
service into the `x-gateway-jwt` header.

- Downstream services **never** see browser tokens.
- A global `InternalJwtGuard` verifies the internal JWT and **fails closed**.
- Handlers read identity via the `@InternalJwt()` decorator — never by parsing
  cookies or trusting headers directly.
- Endpoint policy is declared with `@Public()`, `@OptionalAuth()`, or nothing at
  all (default = authenticated).

Full detail: `docs/architecture/authentication-architecture.md`.

## The agent harness

Agent config lives in `.opencode/`, driven by the `oh-my-opencode-slim` plugin. Committed
project-locally, so behaviour is the same for everyone who clones the repo.

- `.opencode/skills/` — 22 skills, indexed by [`.opencode/skills/README.md`](.opencode/skills/README.md).
  A skill's ID is its **directory name**. `project-rules` (9 constraint files) and `principles`
  (6 rules that need citing by name) are the two to load before non-trivial work.
- `.opencode/command/` — 9 slash-command workflows: `/feature-development`, `/bug-fix`,
  `/architecture-change`, `/design-decision`, `/investigation`, `/refactoring`,
  `/perf-issue`, `/parallel-execution`, `/handoff`.
- `.opencode/agent/knowledge-update.md` — the one custom agent; keeps docs matching reality.
- `.opencode/oh-my-opencode-slim*.md` — prompt appends for orchestrator, oracle, fixer, designer.

Plan then dispatch for feature work: classify the request, present an agent-level plan, get
approval, then dispatch. Ask before Standard and Architectural scope; do not re-ask for reversible
sub-steps afterwards; always ask before a push or force-push.

**A custom agent in `.opencode/agent/` cannot be granted project skills** — its own `skills:`
frontmatter is ignored, and so is a config entry naming it, because the plugin's filter hook only
iterates agents it knows. It gets the global skill set. So the orchestrator inlines the governing
rule text into the dispatch prompt rather than naming a skill.

### Documentation

`docs/` is split by what a document is **for** — start at [`docs/README.md`](docs/README.md):

| Directory            | Holds                                                               |
| -------------------- | ------------------------------------------------------------------- |
| `docs/architecture/` | A technical point or a problem's design in this project             |
| `docs/features/`     | One **portal feature**'s frontend and backend detail — **as-built** |
| `docs/product/`      | The product blueprint `features/` cite                              |

`docs/features/` is keyed on `apps/frontend/portal/src/features/*` — the axis a user moves
along. Chapter 1 of each document numbers the page's sections (1.1, 1.2, …); a backend module with
no feature folder of its own is a section of the page that consumes it. Each document records what
is missing, and the index tabulates where the implementation contradicts its own contract.

Key architecture docs:

| Doc                                                          | Covers                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `docs/architecture/PawHaven-System-Architecture-Overview.md` | 4 services, modular monolith, C4, gateway, security, design decisions |
| `docs/architecture/PawHaven-Backend-Architecture.md`         | NestJS services, modules, data flow                                   |
| `docs/architecture/PawHaven-Frontend-Architecture.md`        | React app structure, state, routing                                   |
| `docs/architecture/authentication-architecture.md`           | Gateway-owned cookies + internal ES256 JWT, the `roles` claim         |
| `docs/architecture/route_authentication.md`                  | Frontend route guards                                                 |

Design tokens are **not** documented. Their authority is
`packages/design-system/src/tokens/`, enforced by `pnpm token-check`.

When architecture changes, update the matching doc in `docs/architecture/` in the same change.
Engineering standards live in the `project-rules` skill, not in `docs/`.

## Hard constraints

Behavioural rules — the ones an agent gets wrong without being told. Repo facts, architecture,
and API contracts live in `docs/` and the `project-rules` skill; do not restate them here.

### Git

- **No agent commits anything unless the user explicitly asks.** Orchestrator and every subagent
  alike, and source, scripts, tests, config, and docs. Being asked to _make a change_ is not
  permission to commit. Leave changes in the working tree or staged.
- Never push, open a PR, or babysit one. Never force-push, `reset --hard`, `clean`, or delete a
  branch without asking.

### Code

- **Don't write comments for unnecessary code.** The default is to add none. Every comment explains
  **why**, not **what**. Never comment self-evident code — section separators, control flow, or
  steps like `// update state`.
- **React 19: `forwardRef` is obsolete.** Functions accept `ref` implicitly; declare
  `ref?: Ref<T>` in props. You will otherwise reach for it out of habit.
- Styling goes through `@pawhaven/design-system` tokens as Tailwind utilities. No hardcoded
  colours, no `style={{}}`, no magic numbers. `pnpm token-check` enforces it.
- **Vitest, not Jest** — Jest is not installed. Test files sit beside the source as `foo.test.ts`.
  No coverage threshold is enforced anywhere, so never quote a target percentage as project policy.
- Shared types and Zod schemas live in `packages/shared`. No hardcoded user-facing strings —
  use `packages/i18n`. Locales `en-US`, `zh-CN`, `de-DE`, updated together.

### Dispatch and verification

- **Never implement it yourself.** Features, fixes, refactors, one-line patches — all go through
  a lane. You review diffs; you do not write them. The only exception is joining a merge conflict
  between two dispatched units, which is coordination.
- **Never micro-manage.** A dispatch names a scope, a data shape, and observable success criteria
  — not a file list.
- Classify before planning (Trivial / Standard / Architectural) and name the principle that drove
  it. Approval is not per-step: once given, reversible sub-steps just get done.
- **A lane with no named validator has not finished.** Every dispatch states who verifies it and
  what counts as passing; `fixer` returns a `<verification>` block.
- **No plausibility passes.** If you cannot name the command that ran and the output it produced,
  it did not pass. "It compiles" is not a pass. A bug's repro must pass on the same surface that
  failed.
- Verify the **combined** tree, not just the units. `pnpm lint` already fails from 14 pre-existing
  errors — diff against baseline before calling anything a regression.
- **Never hand-edit the harness or `docs/architecture/` as a side effect of a feature task**; those
  changes deserve their own commit. Dispatch `knowledge-update` for architecture docs.
- **Never ask the user for Figma files or screenshots** — Figma is not used here; the token source
  is `packages/design-system/src/tokens/`.

### Reporting

- State what you checked **and what you deliberately left alone** — silence is indistinguishable
  from not looking. Link only artifacts you produced or read this session; no fabricated references.
- Every handoff classifies Doc Impact as `none` / `update` / `create`.
- A principle cited without naming the choice it changed counts as unverified.

## Working in this repo

- `pnpm-workspace.yaml` includes `apps/**`, `packages/**`, and `libs/**`, and
  deliberately **excludes** `**/prisma/**/client` and `**/src/prisma/**/client`
  so generated Prisma clients are not treated as workspace packages.
- `overrides` pins `@vitest/coverage-v8` to `4.1.11` — vitest 4 requires a
  matching coverage provider major, otherwise coverage refuses to run. Do not
  "upgrade" this casually.
- `.npmrc` points at `registry.npmmirror.com`.
- Prefer reading existing code and `docs/` over inventing new
  patterns. Consistency with the existing architecture matters more than
  personal preference.
