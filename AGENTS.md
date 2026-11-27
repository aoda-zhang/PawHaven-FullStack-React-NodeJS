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
- Before any code, configuration, test, or documentation file is modified, present a written plan and wait for explicit user approval in the current conversation. No exception, no implicit approval, no scope expansion without renewed approval.
- Do not commit, push, or create a PR unless explicitly requested.

The rules live in [agent-constraints.md](./docs/context/agent-constraints.md); [the flow-gate plugin README](./.opencode/plugins/flow-gate/README.md) describes how the publishing gate is enforced — grant state, TTL, `/approve-commit`, and what it does not cover — and the orchestrator has no write path at all. Point at these, never restate them.
