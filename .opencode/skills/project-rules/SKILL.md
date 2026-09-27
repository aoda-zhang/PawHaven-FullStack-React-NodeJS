---
name: project-rules
description: >
  PawHaven's hard constraints — the repo facts that must always hold, independent of task.
  Read this before planning or implementing any change that touches architecture, packages, API
  contracts, React components, security, tests, documentation, or commits. A change that violates a
  rule is a blocking finding in review, no matter how well it works otherwise.
  触发场景 / Trigger: rules constraints hard rules repo facts conventions policy architecture boundary
  package dependency direction service map monorepo layout, security auth authorization secrets input
  validation injection exposure, testing coverage test placement test strategy, documentation docs sync
  doc impact, git commit conventional commits branch strategy, react component props styling a11y
  forwardRef, orchestrator dispatch planning approval verification reporting, before implementing
  before code review blocking finding compliance must always hold.
---

# Project Rules

The hard constraints of this repo. Unlike [principles](../principles/SKILL.md), which are
decision-forcing _why_, rules are _what must always hold_. They do not change per task.

**How to use this skill:** identify which domains the change touches, then read only those reference
files. Do not load all nine. The full set is ~780 lines and most tasks need two or three.

| Rule                                                   | Read it when the change touches                                     | Covers                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [architecture](./references/architecture.md)           | **almost always** — any cross-package, cross-service, or new module | Service map, package boundaries, monorepo layout, dependency direction.              |
| [services](./references/services.md)                   | any change inside `apps/backend/*`                                  | The four services, shared bootstrap, auth boundary, each service's real shape.       |
| [components](./references/components.md)               | any React/TSX in `apps/` or `packages/`                             | React 19 (no `forwardRef`), props, styling, a11y, types.                             |
| [security](./references/security.md)                   | auth, secrets, input handling, any backend endpoint                 | Auth & authorization, secrets, input validation, injection, exposure.                |
| [testing](./references/testing.md)                     | writing or changing tests, or deciding what needs one               | What must be tested, coverage expectations, test placement.                          |
| [documentation](./references/documentation.md)         | any behavior, contract, or architecture change                      | What must be documented, where, and how it stays in sync. Doc Impact classification. |
| [git](./references/git.md)                             | staging commits, branching, or anything touching git                | Commit discipline, branch rules, what is never pushed.                               |
| [orchestrator](./references/orchestrator.md)           | planning, dispatching subagents, or reporting                       | Planning & approval, scope & ownership, verification & reporting.                    |
| [harness-validator](./references/harness-validator.md) | before committing changes to agent config or docs                   | Broken links, stale references, name consistency, directory existence.               |

## How they enforce

- **Hard gates** — a change that violates a rule is a blocking finding, regardless of how well it
  works otherwise.
- **Domain-scoped** — load a rule when the task touches its domain, not before every step.
- **Subagents inherit** — a subagent must obey the rules for its own scope without being reminded.

## Notes

- `harness-validator` checks the integrity of the agent-control layer itself (`.codebuddy/` and
  `.opencode/`). Its original form only scanned `.codebuddy/`, which is now incomplete — the skills,
  commands, and rule references live under `.opencode/`. Treat it as a starting checklist, not a
  complete one.
- The most important invariant — the gateway owns browser auth, downstream services verify an
  internal ES256 JWT — is also stated in the root `AGENTS.md` and
  [`docs/architecture/authentication-architecture.md`](../../../docs/architecture/authentication-architecture.md).
  Those two are authoritative; this skill is the working checklist.
