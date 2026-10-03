# Documentation Rules

> **Applies to**: All agents.
> **Purpose**: Define documentation standards — what gets documented, where, in what order, and how.
> **Doc Impact**: Every handoff (`/handoff`) MUST classify documentation impact as `none` / `update` / `create`. If `update` or `create`, the main session routes the doc edits back to the lane that made the change, so the documentation ships in the same change. There is no separate documentation agent.

## 0. Read the code first, write the docs last

This is the order every task follows, and it is the rule most often got wrong.

1. **Entering a task**, read the architecture docs — `docs/architecture/PawHaven-System-Architecture-Overview.md`,
   then `PawHaven-Backend-Architecture.md` or `PawHaven-Frontend-Architecture.md` for the area in scope,
   plus `authentication-architecture.md` when anything auth-related is in play. Then read the **code**.
2. **`docs/features/**` is never an input to a decision.** It records the state of the system as of the
   last time somebody reconciled prose against code. Read it to learn what is already known — the gaps,
   the tabulated defects — and to check any claim it makes against the code before relying on it. When
   it disagrees with the code, **the code is right and the document is stale**: record that in the reply,
   and fix the document in step 4.
3. **Before implementing**, nothing under `docs/` may override what the code actually does.
4. **After the change is verified**, update the feature doc from the code that shipped, and the
   architecture doc if the architecture itself moved. That edit ships in the same change.

The failure this prevents: a feature doc read first seeds a design with a picture of the system that was
true at some earlier commit, and the change is then made to match the document instead of the code.

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
  route-auth and PDF-generation docs. **This is the entry read for any task** — §0 above.
- `docs/features/` — one feature's frontend and backend functional detail, keyed on
  `apps/frontend/portal/src/features/*`. These are **as-built records**: what exists, what does not, and
  a table of places where the implementation contradicts its own contract. They are only as current as
  the last change that reconciled them, which is exactly why §0 makes the code the input and the document
  the output. Do not reintroduce the older framing of these as blueprint documents.
- `docs/product/` — the product blueprint that `features/` cite. Intent, never a description of the
  running system.

The **code** is the single source of truth for what the system does. `docs/architecture/` is the source of
truth for why it is shaped that way. `docs/features/` is the record of the reconciliation between them,
and it is written last.

Design tokens are not documented here. Their authority is `packages/design-system/src/tokens/`,
enforced by `pnpm token-check`. A prose design spec (`docs/figma-design-spec.md`) was retired — it
named a canonical source that does not exist and had gone stale. Do not reintroduce it.

## 3. Architecture Decisions

No ADR records. Do NOT create or maintain `ADR/` files, and do not spend workflow steps on ADRs.

When a decision changes the architecture, reflect it directly in the living architecture docs under `docs/` (the single source of truth) so they stay current. Any pre-existing `ADR/` files are legacy and unmaintained.

## 4. Workflow Documentation

Location: `.pi/prompts/`

- One file per slash command — `/feature-development`, `/bug-fix`, `/architecture-change`,
  `/design-decision`, `/investigation`, `/refactoring`, `/perf-issue`, `/parallel-execution`,
  `/handoff`.
- Each defines: numbered steps, decision points, failure recovery. Frontmatter `description:` is the
  one-line text shown in the `/` menu; the prompt runs in the invoking session, it does not name a
  runner agent.

## 5. ROOT READMEs

Location: Project root `README.md` and `README.cn.md`

- Documentation tables reference all knowledge files.
- Must stay in sync (EN ↔ CN translations).
- The agent-control layer is `.pi/`, not `.opencode/` — `.opencode/` was retired and the directory does
  not exist. A link into it is a dead link a reader can copy.
- Updated by the lane that changed the contract, on cascade, when the main session's `/handoff` step
  classifies Doc Impact as `update`.

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

> **Rule**: permanent docs live in `docs/` and are updated in the same change as the code that
> invalidated them — the main session classifies Doc Impact at `/handoff` and routes the edits to the
> lane that made the change. There is no temporary-notes file — a previous version required a daily
> memory log at `.codebuddy/memory/YYYY-MM-DD.md` that never existed. Progress goes in replies. Do not
> reintroduce it, and do not mistake a chat reply for documentation: a reply that outlives the session
> must land in a doc.
