# Principles

The **decision-forcing layer** of the Harness. Principles are leaf skills: small, one-idea files that agents must _apply by name_ when a decision point matches them. When a workflow or review changes a decision, the agent must name the principle that changed it.

Principles are **thin and always loaded conceptually** — they are not workflows, they are the _why_ behind decisions. Workflows and agents reference them by name (`principle: prove-it-works`).

| Principle                                                                               | Core Idea                                                                           |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [never-block-on-the-human](./never-block-on-the-human.md)                               | Proceed on reversible work; present the result, let the human course-correct.       |
| [prove-it-works](./prove-it-works.md)                                                   | Verify against the real artifact, not "it compiles" or "looks right".               |
| [boundary-discipline](./boundary-discipline.md)                                         | Guards at system boundaries; trust internal types; keep business logic pure.        |
| [experience-first](./experience-first.md)                                               | Choose user delight over implementation convenience.                                |
| [model-the-domain](./model-the-domain.md)                                               | Encode the domain in a structure instead of scattered conditionals.                 |
| [make-operations-idempotent](./make-operations-idempotent.md)                           | Converge to the same end state, no matter how many times the operation runs.        |
| [fix-root-causes](./fix-root-causes.md)                                                 | Trace each symptom to its root cause. Reproduce first, ask why until you reach it.  |
| [outcome-oriented-execution](./outcome-oriented-execution.md)                           | Converge on the target architecture; don't preserve throwaway compatibility states. |
| [laziness-protocol](./laziness-protocol.md)                                             | Bias to deletion and the smallest change that solves the problem.                   |
| [guard-the-context-window](./guard-the-context-window.md)                               | Route bulk to subagents; keep summaries in the main thread.                         |
| [migrate-callers-then-delete-legacy-apis](./migrate-callers-then-delete-legacy-apis.md) | Introduce the new API, migrate all callers, delete the legacy one in one wave.      |
| [sequence-verifiable-units](./sequence-verifiable-units.md)                             | Break work into small units that each end in a check. Verify each before the next.  |
| [subtract-before-you-add](./subtract-before-you-add.md)                                 | Remove dead weight first, then build on the simpler base.                           |

## How They Enforce

- Agents declare their **strongest principles** in `### 1a. Wiring` and must apply them by name.
- Code review's **PATTERN REVIEW** pass checks that a change still honors the project's principles.
- A decision that goes against a principle must be flagged explicitly, not silently bent.

**Related**: [Agents](../agents/README.md) · [Skills](../skills/README.md) · [Root README](../README.md)
