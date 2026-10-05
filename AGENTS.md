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

Agent config lives in `.pi/`, committed project-locally, so behaviour is the same for everyone
who clones the repo. **pi is the harness layer.** The `.opencode/` copy that preceded it was
legacy, has been deleted, and nothing in `.pi/` ever read from it.

- `.pi/skills/` — 18 project skills (9 top-level plus 9 doctors under `code-review/`), indexed by
  [`.pi/README.md`](.pi/README.md); 9 more are agent-private under
  `.pi/agents/frontend-dev/skills/`, loaded via `skillPath` frontmatter only into that agent's
  context.
  A skill's ID is its **directory name**, and `name:` in frontmatter must match it (lowercase
  `a-z`, `0-9`, hyphens only) — pi uses `name` as the `/skill:<name>` command, so a name with a
  slash in it silently breaks invocation. `project-rules` (10 constraint files), `frontend` (the shared portal facts a writer and a
  reviewer must agree on), `principles`
  (6 rules that need citing by name), and `task-classification` (routes a request to a
  workflow and names the `domains` it needs) are the three to load before non-trivial work. What a skill may assert — this repo's
  patterns now, general best practice only once a real change shows the gap — is
  [`project-rules`](.pi/skills/project-rules/references/skills.md).
- `.pi/prompts/` — 9 slash-command workflows: `/feature-development`, `/bug-fix`,
  `/architecture-change`, `/design-decision`, `/investigation`, `/refactoring`, `/perf-issue`,
  `/parallel-execution`, `/handoff`.
- `.pi/agents/` — 9 subagent definitions run by pi-subagents (installed via `packages` in
  `.pi/settings.json`): `orchestrator` (plans, dispatches, verifies, and hands off — holds no
  dedicated `edit`/`write` tool, though it does hold `bash`, which is a write channel, so staying
  out of the source is discipline rather than a guarantee), `scout` (fast read-only recon),
  `architect` (read-only plan author), `oracle` (independent read-only plan review), `frontend-dev`
  (the React/TypeScript writer and its self-test), `backend-dev` (the NestJS writer and its self-test),
  `tester` (acceptance verification, read-only toward source: a criterion with no executable check
  comes back as a report naming the missing test, and the writing lane authors it), `reviewer` (the only lane that
  emits `VERDICT: PASS|FAIL`, read-only toward source), `browser-verifier` (drives the running
  portal in a real browser and edits no source). `frontend-dev` lives under
  `.pi/agents/frontend-dev/` with its private skills. `orchestrator` is the entry point for a task
  needing more than one lane; its `defaultContext: fresh` is what lets a task start from a clean
  context and still dispatch the project's own lanes. Every agent sets `inheritSkills: false` and
  declares its own `skills:`, so a lane receives exactly its grants.
  **Implementation is a role, not an agent name**, and `frontend-dev` / `backend-dev` are its first
  two domain workers: role `implementation`, domains `frontend` and `backend`. A new domain such as
  `devops` adds an agent and a grant set, not a new workflow — see
  [.pi/README.md](.pi/README.md#roles-domains-and-the-knowledge-boundary).
- `.pi/handoffs/` — structured handoff artifacts for work that spans sessions or lanes, so a
  fresh context reads one instead of re-deriving.
- `.pi/settings.json` — points pi at the directories above. **The 9 `code-review/<doctor>`
  skills are listed individually and must stay that way:** pi stops recursing at any directory
  containing `SKILL.md`, so the doctors nested under the `code-review` parent are only found via
  those explicit entries. Dropping one silently drops a skill. The four frontend doctors (react,
  style, i18n, typescript) were promoted out of the retired `review` lane and are project skills
  now. `frontend-dev` grants `react-doctor` by name because it runs it as a mandatory self-check;
  the eight doctors it does not grant are reached through `code-review`'s dispatch table and named
  in the validator's `CATALOG_ONLY_SKILLS` allowlist.
- `pnpm pi-check` — the harness validator. Imports pi's own loaders and asserts 18 project skills,
  9 agent-private skills, 9 prompts, and 9 agents load with zero diagnostics. It also resolves every
  agent's `allowedAgents`, every `agentOverrides` key, every `skillPath`, and every
  `requiredAgents` name in a skill body, and it flags any project skill that no agent grants. Run it after touching anything in `.pi/`.
- `pnpm check:links` — resolves every relative markdown link **and anchor** across `.pi/`,
  `AGENTS.md`, `docs/`, and both root READMEs. It skips any directory named `npm`, `handoffs`,
  `node_modules`, `dist`, or `build`, at any depth rather than by path prefix — so `.pi/npm` and
  `.pi/handoffs` go unscanned, and so would a `docs/build` created tomorrow. Run it alongside
  `pi-check`: a harness change that breaks an anchor into another file passes every count.

`/trust` once so project config loads, then `/reload` after changing `.pi/`.

Plan then dispatch for feature work: classify the request, present an agent-level plan, get
approval, then dispatch. Ask before Standard and Architectural scope; do not re-ask for reversible
sub-steps afterwards; always ask before a push or force-push.

**Dispatch is real: pi runs named sub-agents.** The 9 agents in `.pi/agents/` execute in
isolated contexts via pi-subagents — `orchestrator` is the only one holding `subagent`, and it
dispatches the other eight. Dispatch through the subagent tool with a scope, a data shape, and
observable success criteria — never a file list. The lane rules under
[Dispatch and verification](#dispatch-and-verification) govern what every lane must return, and
the verification discipline is unchanged.

**Every mutating change gets an independent review.** A lane that reviews its own work cannot catch
a self-consistent mistake. Dispatch `reviewer` as a separate context; a change nobody independent
has read has not been reviewed. `reviewer` is the only lane that emits a verdict **about code**
(`oracle` emits one about a plan, which is not the same thing), so it is also the only verdict a
report can end on.

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

### Read the code first, write the feature docs last

This order is not a preference. It is the difference between a design that matches the system and
one that matches a stale paragraph.

1. **Entering a task**: read `PawHaven-System-Architecture-Overview.md`, then
   `PawHaven-Backend-Architecture.md` or `PawHaven-Frontend-Architecture.md` for the area in scope
   (`authentication-architecture.md` when auth is in play). Then read the **code**.
2. **`docs/features/**` is not an input to a decision.** It is as-built _as of the last change that
   reconciled it_. Read it to learn what is already known — the gaps, the tabulated defects — and
   check any claim against the code before relying on it. Code and document disagree, the code is
   right; say so in the reply and fix the document in step 4.
3. **Before implementing**, nothing under `docs/` overrides what the code does.
4. **After the change is verified**, update the feature doc from the code that shipped, and the
   architecture doc if the architecture moved. Same change, same lane.

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

- **No agent commits anything unless the user explicitly asks.** Every agent alike — main
  session or subagent — and source, scripts, tests, config, and docs. Being asked to _make a
  change_ is not permission to commit. Leave changes in the working tree or staged.
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
  what counts as passing; a lane returns a `<verification>` block in which each check reads
  `PASS | FAIL | NOT RUN`, and anything unrun carries the reason it was not run. A failed check or a
  `FAIL` review routes back to the **developer** lane, which fixes and re-runs its own self-test,
  in a loop capped at 3 cycles. It does not route back to `reviewer`, which does not edit the diff.
  A finding that says the plan is wrong returns to planning instead, and a combined-tree failure is
  classified before it is routed, so an environment block is reported rather than sent back to a
  developer. The full router is in
  [orchestrator.md](.pi/skills/project-rules/references/orchestrator.md#when-combined-tree-verification-fails).
- **No plausibility passes.** If you cannot name the command that ran and the output it produced,
  it did not pass. "It compiles" is not a pass. A bug's repro must pass on the same surface that
  failed.
- Verify the **combined** tree, not just the units, and the orchestrator owns that stage. A developer
  self-tests its own unit and nothing more. `pnpm lint` already fails from 13 pre-existing
  errors (3 in `gateway`, 10 in `backend-core`) — diff against baseline before calling anything a
  regression.
- **A worker that cannot build what it was handed stops and signals.** It emits
  `CONTRACT_CHANGE_REQUIRED` with the current contract, the proposed change, the reason, the
  affected domains, the affected files, and the risk, rather than quietly redefining a boundary at
  its own edge. See
  [the contract change gate](.pi/skills/project-rules/references/orchestrator.md#the-contract-change-gate).
- **Never hand-edit the harness or `docs/architecture/` as a side effect of a feature task**; those
  changes deserve their own commit. Keep `AGENTS.md` and `docs/architecture/` matching reality in
  a separate change.
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
