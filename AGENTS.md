# Project Instructions

OpenCode loads this file automatically. Treat it as the project-wide entry point, not a copy of the full engineering handbook.

## Before substantive work

1. Read [agent-constraints.md](./docs/context/agent-constraints.md) before proposing or making project changes.
2. Read only the architecture and development-pattern documents relevant to the task:
   - [System architecture](./docs/context/system-architecture-overview.md)
   - [Frontend architecture](./docs/context/frontend-architecture.md) and [frontend patterns](./docs/context/frontend-development-patterns.md)
   - [Backend architecture](./docs/context/backend-architecture.md) and [backend patterns](./docs/context/backend-development-patterns.md)
   - [Development workflow](./docs/context/development.md)
3. Inspect the current code and available scripts before deciding what to change or verify.

## Change-control baseline

- Read-only investigation and explanation do not require a plan approval.
- Before any code, configuration, test, or documentation file is modified, present a written plan and wait for explicit user approval in the current conversation.
- No exception for a change being small, reversible, urgent, or single-domain. Silence or a request to investigate is not approval to implement.
- Implement only the approved scope. If the approach or scope must change, stop and obtain approval for the revised plan.
- Do not commit, push, or create a PR unless explicitly requested.

The detailed, checkable rules live in [agent-constraints.md](./docs/context/agent-constraints.md). Keep this file short; do not duplicate the handbook here.
