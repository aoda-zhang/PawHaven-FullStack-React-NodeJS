# Rules

The **always-on constraints** of the Harness. Rules are repo facts — they do not change per task. Unlike principles (decision-forcing _why_), rules are hard constraints (_what_ must always hold). The orchestrator loads the rules relevant to the current task; subagents must obey them without being reminded.

| Rule                                | Covers                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [architecture](./architecture.md)   | PawHaven's architectural facts: service map, package boundaries, monorepo layout, dependency direction. |
| [security](./security.md)           | Security constraints: auth, secrets, input validation, injection, exposure.                             |
| [testing](./testing.md)             | Testing constraints: what must be tested, coverage expectations, test placement.                        |
| [documentation](./documentation.md) | Documentation constraints: what must be documented, where, and how it stays in sync.                    |
| [git](./git.md)                     | Git constraints: commit discipline, branch rules, what is never pushed.                                 |
| [orchestrator](./orchestrator.md)   | Orchestrator dispatch discipline: planning & approval, scope & ownership, verification & reporting.     |

## How They Enforce

- Always-on: loaded whenever the current task touches their domain.
- Hard gates: a change that violates a rule is a blocking finding, regardless of how well it works otherwise.
- The orchestrator checks rule compliance at every stage transition (STEP 5b of `main-agent.md`).

**Related**: [Agents](../agents/README.md) · [Workflows](../workflows/README.md) · [Root README](../README.md)
