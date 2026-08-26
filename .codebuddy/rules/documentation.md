# Documentation Rules

> **Applies to**: All agents.
> **Purpose**: Define documentation standards — what gets documented, where, and how.
> **Doc Impact**: Every handoff (workflows/handoff.md) MUST classify documentation impact as `none` / `update` / `create`. If `update` or `create`, route to `knowledge-update` agent for permanent documentation.

## 1. Code Comments

- Comments are a limited resource. **DON'T write comments for unnecessary code.** Default is NOT to add a comment.
- Every comment must explain **why**, not **what**.
- Never comment self-evident code: structure markers (section separators), control flow, or obvious steps (`// update state`, `// loop through items`).
- Prefer self-explanatory code through naming, structure, and clarity.
- See workspace global rules for detailed comment guidelines.

## 2. Architecture Documentation

Location: `.codebuddy/docs/`

- `PawHaven-System-Architecture-Overview.md` — Complete system C4 model
- `PawHaven-Frontend-Architecture.md` — Frontend architecture and conventions
- `PawHaven-Backend-Architecture.md` — Backend modules, events, enforcement
- `agent-communication-protocol.md` — How agents communicate structured outputs

These docs are the **single source of truth** for the project architecture. All agents reference them.

## 3. ADR (Architecture Decision Records)

Location: `.codebuddy/docs/ADR/`

- ADRs document WHY a decision was made, not just WHAT was decided.
- Template: `ADR/ADR-001-template.md`.
- Every ADR includes: Context, Decision, Consequences, Alternatives Considered.
- Mark superseded ADRs — never delete old ADRs.
- **If `.codebuddy/docs/ADR/` does not exist, create it when the first ADR is needed.** The directory is part of the permanent documentation structure.

## 4. Workflow Documentation

Location: `.codebuddy/workflows/`

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

## 7. Permanent vs Temporary Documentation

| Type          | Location                  | Persistence                 | Trigger                                              | Examples                                                       |
| ------------- | ------------------------- | --------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **Permanent** | `.codebuddy/docs/`        | Git-tracked, long-lived     | Architecture changes, new ADRs, API contract changes | System architecture, ADRs, feature workflows, design specs     |
| **Temporary** | `.codebuddy/task-log.md`  | Git-ignored, session-scoped | Every task execution                                 | Runtime logs, task execution traces                            |
| **Handoff**   | Workflows handoff summary | Ephemeral, per-task         | End of every task                                    | What changed, verification evidence, Doc Impact classification |

> **Rule**: Permanent docs live in `.codebuddy/docs/` and are maintained by the `knowledge-update` agent. Temporary logs live in `task-log.md` and are cleared per session. Never confuse the two — a task log is not documentation, and documentation is not a task log.
