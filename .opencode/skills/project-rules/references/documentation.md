# Documentation Rules

> **Applies to**: All agents.
> **Purpose**: Define documentation standards — what gets documented, where, and how.
> **Doc Impact**: Every handoff (`/handoff`) MUST classify documentation impact as `none` / `update` / `create`. If `update` or `create`, route to `knowledge-update` agent for permanent documentation.

## 1. Code Comments

- Comments are a limited resource. **DON'T write comments for unnecessary code.** Default is NOT to add a comment.
- Every comment must explain **why**, not **what**.
- Never comment self-evident code: structure markers (section separators), control flow, or obvious steps (`// update state`, `// loop through items`).
- Prefer self-explanatory code through naming, structure, and clarity.
- See workspace global rules for detailed comment guidelines.

## 2. Architecture Documentation

Location: `docs/`, split by purpose — read `docs/README.md` first.

- `docs/architecture/` — a technical point or a problem's design in this project. The hub is
  `PawHaven-System-Architecture-Overview.md` (C4 model); alongside it are the backend, frontend, auth,
  route-auth and PDF-generation docs.
- `docs/features/` — one feature's frontend and backend functional detail. **These are blueprint
  documents, not descriptions of the running system**: several modules they name do not exist, and the
  domain events they describe appear nowhere in the backend. Verify against code before relying on one.
- `docs/product/` — the product blueprint that `features/` cite.

These docs are the **single source of truth** for the project architecture. All agents reference them.

Design tokens are not documented here. Their authority is `packages/design-system/src/tokens/`,
enforced by `pnpm token-check`. A prose design spec (`docs/figma-design-spec.md`) was retired — it
named a canonical source that does not exist and had gone stale. Do not reintroduce it.

## 3. Architecture Decisions

No ADR records. Do NOT create or maintain `ADR/` files, and do not spend workflow steps on ADRs.

When a decision changes the architecture, reflect it directly in the living architecture docs under `docs/` (the single source of truth) so they stay current. Any pre-existing `ADR/` files are legacy and unmaintained.

## 4. Workflow Documentation

Location: `.opencode/command/`

- One file per slash command — `/feature-development`, `/bug-fix`, `/architecture-change`,
  `/design-decision`, `/investigation`, `/refactoring`, `/perf-issue`, `/parallel-execution`,
  `/handoff`.
- Each defines: numbered steps, decision points, failure recovery. Frontmatter `agent:` picks the
  runner.

## 5. ROOT READMEs

Location: Project root `README.md` and `README.cn.md`

- Documentation tables reference all knowledge files.
- Must stay in sync (EN ↔ CN translations).
- Updated by `knowledge-update` agent on cascade.

## 6. Inline API Documentation

- Public API methods (backend service facades): JSDoc for parameters and return types.
- Shared types (`packages/shared/`): JSDoc for non-obvious fields.
- Feature entry points (`index.tsx`): brief description of the feature.

## 7. Permanent vs Temporary Documentation

| Type          | Location                  | Persistence                           | Trigger                                    | Examples                                                                       |
| ------------- | ------------------------- | ------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| **Permanent** | `docs/`                   | Git-tracked, long-lived               | Architecture changes, API contract changes | System architecture, feature workflows, design specs                           |
| **Temporary** | _(none)_                  | Session-scoped, never written to disk | —                                          | Progress is reported in replies; there is no scratch file to drift out of sync |
| **Handoff**   | Workflows handoff summary | Ephemeral, per-task                   | End of every task                          | What changed, verification evidence, Doc Impact classification                 |

> **Rule**: permanent docs live in `docs/` and are maintained by the `knowledge-update` agent. There is no temporary-notes file — a previous version required a daily memory log at `.codebuddy/memory/YYYY-MM-DD.md` that never existed. Progress goes in replies. Do not reintroduce it, and do not mistake a chat reply for documentation: a reply that outlives the session must land in a doc.
