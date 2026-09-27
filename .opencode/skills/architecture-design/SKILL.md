---
name: architecture-design
description: >
  PawHaven's architecture decision method. Where a feature belongs (extend vs new module vs new
  service), how to assess API and database impact against the real service map, how to classify
  risk, and the decision-record format to hand back. Read before designing any change that crosses
  a module, package, service, or API boundary, and before approving someone else's design.
  触发场景 / Trigger: architecture design technical design system design solution planning decision,
  架构设计 技术方案评估 决策, module assignment new module extend existing service split bounded
  context, API design contract endpoint contract change database schema migration impact analysis,
  risk assessment impact dependency technical debt, cross-module cross-package boundary refactor
  restructure, design review architecture approval 设计评审 影响评估 风险.
---

# Architecture Design

A design is a decision, not a description. The output must say **where the work goes and what it
breaks** — a proposal that lists options without choosing one has not been designed.

Verified against the repo. Where `.codebuddy/agents/architect.md` disagreed with the code, the code
won; see [Corrections](#corrections-to-the-old-docs).

## The real map

```
apps/backend/
├── gateway/           :8080  auth guard, rate limit, proxy, CORS — the ONLY service that sees browser tokens
├── auth-service/      :8082  register, login, JWT issue/refresh, token rotation, User.roles
├── core-service/      :8081  modular monolith — the default workspace for backend work
│   └── src/modules/   adoption · animal-follow · bootstrap · guide · home · report-animal · rescue
├── document-service/  :8083  email, PDF generation (headless Chromium)
└── config-service/            NOT a service — no package.json, no src/, nothing imports it
                               per-env config lives at <service>/src/config/<env>/env/

packages/
├── shared/            types + Zod schemas + constants — the wire contract, both sides
├── backend-core/      @InjectPrisma, InternalJwtGuard, decorators, config, trace, logging
├── frontend-core/     shared client logic
├── design-system/     Tailwind v4 + MUI v7 tokens
├── i18n/              en-US · zh-CN · de-DE
└── ui/                shared React components
```

Two corrections against older diagrams: **`packages/backend-core` exists** and is a substantial
package with ten subpath exports, and **`apps/frontend/admin` does not exist** — `portal` is the only
frontend app.

**Discover the module list at runtime.** `ls apps/backend/core-service/src/modules/`. It changes as
features ship; any inventory you hold in your head is stale.

## Where does this belong?

```
Q1  Does an existing module already own this?
    → ls the modules directory and compare against the feature's domain
    → YES: extend it. Stop.

Q2  Is this a genuinely new bounded context?
    → Own aggregate root? Own business rules that change independently?
    → YES: new module in core-service
    → NO: extend the closest existing module. Stop.

Q3  Does it need its own deployable?
    → Independent scaling? Separate database? Different runtime constraints?
    → YES: new service — RARE, and a real cost
    → NO: new module in core-service. This is the default.
```

**Default to a new module in `core-service`.** A new service is the expensive answer; reach for it
only when a module boundary genuinely cannot hold the coupling. Auth, document, and config are the
only services that are _not_ core modules — do not add core modules to them.

Per `laziness-protocol`: an abstraction with one caller is a candidate for inlining, not extraction.
A new module for a single feature is usually premature.

## Impact analysis

### API

| Question                 | Check                                                                       |
| ------------------------ | --------------------------------------------------------------------------- |
| New endpoints?           | method, path, purpose, request body, response                               |
| Modified endpoints?      | what changes, and who consumes the old shape                                |
| New shared types?        | Zod schemas to add in `packages/shared` — **never redefine a DTO per side** |
| Auth policy per endpoint | default-authenticated, `@OptionalAuth()`, or `@Public()`                    |
| Gateway route changes?   | a new path needs a proxy entry in `gateway`                                 |

There is **no event bus** in this codebase. `@nestjs/event-emitter` is not installed. Cross-module
communication goes through an exported service method. If a design calls for events, that is a
proposal to build the bus, not a pattern to follow.

### Database

MongoDB via Prisma, schema at `apps/backend/core-service/src/prisma/mongodb/schema.prisma`.

- `id` is `String @id @default(auto()) @map("_id") @db.ObjectId`.
- `createdAt` / `updatedAt` / `deletedAt` on every model. **`deletedAt` is soft delete** — every
  query needs `deletedAt: { isSet: false }`, and a new query that forgets it ships deleted rows.
- Index anything you filter or sort on.
- `npx prisma generate` after a schema change; `db push` against a shared environment is destructive
  — confirm first.

→ Load the `backend-standards` skill for the full data and validation rules.

### Frontend

- Feature module in `apps/frontend/portal/src/features/<name>/`.
- Server state is TanStack Query. Client state is Redux. **Never put server data in Redux.**
- Every user-facing string goes through `t()`; all three locales ship together.
- Styling uses `@pawhaven/design-system` tokens. A hardcoded hex is a blocking violation.

## Classify the risk

| Level      | Criteria                                                                                       | Example                                   |
| ---------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **High**   | Breaking migration, auth flow change, cross-service dependency, changing a core model's schema | A new JWT requirement                     |
| **Medium** | New module others depend on, performance-critical endpoint, contract change on a shared type   | A new field on a shared DTO               |
| **Low**    | Isolated new feature, no existing data or contract affected                                    | A standalone module with no inbound calls |

For anything above Low, state **what could go wrong**, **the mitigation**, and **the rollback**. A
design with no rollback story for a High-risk change is not finished.

## Hand back

```markdown
# Architecture Design: {feature}

## 1. Problem

What this solves, in one paragraph.

## 2. Current architecture

What exists today that is in scope — modules, models, endpoints. Cite real paths.

## 3. Decision

### 3.1 Placement

Which module or service owns it, and why (the Q1/Q2/Q3 answer).

### 3.2 API

| Method | Path | Purpose | Request | Response | Auth policy |

### 3.3 Data

Prisma diff, or "no schema change" with the reason.

### 3.4 Shared types

New or changed Zod schemas in packages/shared, and every consumer.

### 3.5 Alternatives

What else was considered and why it lost. A design with one option considered is not a decision.

## 4. Impact

Frontend · Backend · cross-module, each with the concrete files or contracts touched.

## 5. Risk

Level, what could go wrong, mitigation, rollback.

## 6. Verification

How this will be proven — the command, the surface, the observable result.
```

Section 3.1 and 3.5 are the ones that carry the decision. Do not pad the rest to make it look
thorough.

## Non-negotiables

- **The gateway alone owns browser cookies and JWTs.** A design that lets a downstream service read a
  browser token is `MUST FIX` however clean it looks. See
  `docs/authentication-architecture.md`.
- **Shared types live in `packages/shared`** and are consumed by both sides. A DTO redefined on one
  side is `MUST FIX`.
- **No cross-module internal imports.** A module exposes its service and nothing else. This is a
  convention with no lint rule behind it — you have to catch it.
- **Do not plan on an event bus.** It does not exist.
- **Architecture changes update `docs/` in the same change.** A design that lands without
  its documentation is half-delivered.

## Corrections to the old docs

Checked against the code; all false:

- The repo anatomy omitted `packages/backend-core`, which exists and is central to backend work.
- The API impact table asked for "event contracts (publisher module, event name, payload)". There is
  no event bus.
- The risk table's Low example was "adding a standalone content module". There is no `content`
  module, and adding one is not automatically low-risk.
