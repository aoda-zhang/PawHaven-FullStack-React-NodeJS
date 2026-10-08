---
name: code-review
description: >
  How to review a change and reach a verdict. Selects the review dimensions a change's scope makes
  applicable, routes each to the reference that owns it, runs the deterministic checks, and turns
  findings into one verdict. Review the change against correctness, architecture, domain standards,
  security, testability, and performance.
  Trigger: code review pr feedback quality check automated scan anti-pattern detection verdict pass
  fail findings severity architecture security performance correctness maintainability accept reject.
---

# Code Review

Review is one capability with several **dimensions**, not one skill per rule. A dimension is a
question you ask of a change; the reference under `references/` is how you ask it.

The rule being checked has exactly one owner, and it is an **implementation** skill:
[`frontend-patterns`](../../../frontend-development/skills/frontend-patterns/SKILL.md),
[`typescript`](../../../javascript-typescript/skills/typescript/SKILL.md),
[`backend`](../../../backend-development/skills/backend/SKILL.md), and
[`testing-standards`](../../../testing/skills/testing-standards/SKILL.md). This skill never restates
a rule. It tells you which reference to read, and how to judge a violation of it.

## Purpose

Review a change against:

- **correctness** — does it do what it was asked to do
- **project architecture** — does it fit the boundaries this repository draws
- **domain standards** — does it follow the conventions of the stack it touches
- **security** — does it hold the trust model
- **testability** — is the behaviour actually covered
- **performance** — does it introduce a cost the change did not intend

## Review sequence

1. **Determine the change scope.** Run the scope detector; read
   [review-protocol.md](./references/review-protocol.md#1-scope) for what counts as the diff.
2. **Determine the applicable dimensions.** Read the same section. A backend-only diff does not need
   the frontend dimension, and loading it costs context and produces nothing.
3. **Run the deterministic checks.** `scripts/run-project-checks.mjs` executes them and returns
   machine-readable findings. Read
   [review-protocol.md](./references/review-protocol.md#4-deterministic-checks) first.
4. **Read the dimension references** for the dimensions in scope. Each names the implementation skill
   whose rules it is checking. Read those rules there; do not work from memory of them.
5. **Inspect the diff and the code around it.** A diff out of context is unreadable.
6. **Produce findings.** One per defect, with evidence.
7. **Apply severity** per [review-protocol.md](./references/review-protocol.md#3-severity).
8. **Emit the verdict** per [review-protocol.md](./references/review-protocol.md#8-verdict).

## Review dimensions

| Dimension                   | Reference                                       | Rules it checks live in                                                                                                                                           |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code quality                | [code-quality.md](./references/code-quality.md) | this skill                                                                                                                                                        |
| Architecture and boundaries | [architecture.md](./references/architecture.md) | [architecture-design](../../../architecture/skills/architecture-design/SKILL.md)                                                                         |
| Frontend                    | [frontend.md](./references/frontend.md)         | [frontend-patterns](../../../frontend-development/skills/frontend-patterns/SKILL.md) · [react-doctor](../../../frontend-development/skills/react-doctor/SKILL.md) |
| Backend                     | [backend.md](./references/backend.md)           | [backend](../../../backend-development/skills/backend/SKILL.md)                                                                                                   |
| TypeScript                  | [typescript.md](./references/typescript.md)     | [typescript](../../../javascript-typescript/skills/typescript/SKILL.md)                                                                                         |
| Testing                     | [testing.md](./references/testing.md)           | [testing-standards](../../../testing/skills/testing-standards/SKILL.md)                                                                                           |
| Security                    | [security.md](./references/security.md)         | this skill                                                                                                                                                        |
| Performance                 | [performance.md](./references/performance.md)   | this skill                                                                                                                                                        |

**Always applicable**, whatever the scope: code quality, architecture, security, and testing.
**Conditional**: frontend when the change touches frontend source or user-visible behaviour,
backend when it touches backend source, TypeScript when it changes a typed surface, performance when
it introduces or alters a hot path.

## Two passes

Every review runs two passes, because they answer different questions. Either can block on its own.

| Pass               | Question                                                                          | Dimensions                                                                             |
| ------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Tech review**    | Is the code written well? Correct, disciplined, safe, covered, and fast enough?   | code quality · TypeScript · testing · security · performance, plus frontend or backend |
| **Pattern review** | Does the change fit the project? Boundaries, ownership, direction, documentation. | architecture, plus the domain standards of whichever stack the change touches          |

**Neither pass emits a verdict.** Each produces findings with a severity; the reviewer turns them
into the single verdict the process reads. Well-written code that breaks the architecture is blocked
by pattern review. Code that fits the architecture and is full of defects is blocked by tech review.

## Deterministic checks are scripts, not skills

Anything a command can decide belongs in `scripts/`, not in a reference:

```bash
node scripts/detect-review-scope.mjs --base HEAD~1
node scripts/run-project-checks.mjs --base HEAD~1
```

- `detect-review-scope.mjs` resolves the diff, the affected packages, and the applicable dimensions.
- `run-project-checks.mjs` runs typecheck, the React gate, the project's deterministic greps, and
  the locale parity check, and prints each result as a finding with a severity.

A script executes a rule. It does not own one: the rule text stays in the skill or reference that
states it, and the script only runs the command that proves it. Do not put project architecture into a
script.

**Every rule names a command you can run.** A rule you cannot execute produces no finding while still
looking like a gate. If a command in this skill or a reference fails or is wrong, that is a finding
about the harness, and it is fixed in the same change.

## Do not load dimensions you will not use

Load a dimension reference when the scope calls for it. A narrow review reads only those. Carrying a
reference you never apply costs context on every task and invites a finding you did not earn. If a
rule is loaded and not applied, the finding is that the rule is unclear, not that it was needed.

## Independent by construction

You did not write the code you are reviewing, and you do not fix it. Findings go back to the writing
agent. An agent that reviews its own diff cannot catch a self-consistent mistake, and one that edits
what it judges has stopped being independent.

## Related

- Review entry point as a workflow: [code-review.md](../../../../workflows/code-review.md)
- Pre-existing findings and the measured baseline: [docs/quality](../../../../../docs/quality/README.md)
- What evidence means: [rules/verification.md](../../../../rules/verification.md)
