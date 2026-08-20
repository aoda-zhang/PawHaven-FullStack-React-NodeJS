# Documentation Rules

> **Applies to**: All agents.
> **Purpose**: Define documentation standards — what gets documented, where, and how.

## 1. Code Comments

- Comments are a limited resource. Default is NOT to add a comment.
- Every comment must explain **why**, not **what**.
- Prefer self-explanatory code through naming, structure, and clarity.
- See workspace global rules for detailed comment guidelines.

## 2. Architecture Documentation

Location: `Harness/docs/`

- `PawHaven-System-Architecture-Overview.md` — Complete system C4 model
- `PawHaven-Frontend-Architecture.md` — Frontend architecture and conventions
- `PawHaven-Backend-Architecture.md` — Backend modules, events, enforcement
- `agent-communication-protocol.md` — How agents communicate structured outputs

These docs are the **single source of truth** for the project architecture. All agents reference them.

## 3. ADR (Architecture Decision Records)

Location: `Harness/docs/ADR/`

- ADRs document WHY a decision was made, not just WHAT was decided.
- Template: `ADR/ADR-001-template.md`.
- Every ADR includes: Context, Decision, Consequences, Alternatives Considered.
- Mark superseded ADRs — never delete old ADRs.

## 4. Workflow Documentation

Location: `Harness/workflows/`

- Feature development, bug fix, and architecture change workflows.
- Each workflow defines: pipeline steps, decision points, failure recovery.

## 5. ROOT READMEs

Location: Project root `README.MD` and `READMECN.MD`

- Documentation tables reference all knowledge files.
- Must stay in sync (EN ↔ CN translations).
- Updated by `knowledge-update` agent on cascade.

## 6. Inline API Documentation

- Public API methods (backend service facades): JSDoc for parameters and return types.
- Shared types (`packages/shared/`): JSDoc for non-obvious fields.
- Feature entry points (`index.tsx`): brief description of the feature.
