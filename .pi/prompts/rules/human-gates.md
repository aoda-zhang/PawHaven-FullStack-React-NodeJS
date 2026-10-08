# Human gate policy

Where the human decides, and where they must not be asked. The human is the final authority;
the gate belongs where the decision is meaningful, not everywhere.

## The autonomy line — read this first

Two rules here look contradictory and are not. The line is **reversibility**, not risk.

| Situation                                     | What to do                                                       |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Trivial, reversible, no contract change       | Just do it. Do not ask.                                          |
| Standard or Architectural scope               | Present the classification and plan, get approval, then execute. |
| Any sub-step after approval, still reversible | Just do it. Do not re-ask. Approval is not per-step.             |

## Human gates

The human decides at exactly two points. Everywhere else the harness runs to the end.

**Plan approval.** A Standard or Architectural task stops before implementation and presents
the classification and the plan. Trivial work does not stop, because there is nothing to weigh.

**Final review.** Nothing is committed, pushed, or released without the human. The handoff is
the artifact they read. `/handoff` produces it and stops there.

## What the human decides

**Always ask**, before the work, not after:

- a Standard or Architectural plan
- a product or scope decision
- an architecture decision
- a material change to a shared contract
- anything irreversible: a commit, a push, a force-push, a destructive migration, a branch
  deletion

**Do not ask** about:

- a reversible sub-step after approval was given. Approval is not per-step, and re-asking
  trains the human to answer without reading.
- an ordinary implementation choice inside an approved scope. The lane decides and reports it.

Asking about every step is not rigour, it is friction. Asking before a force-push is rigour.

## What is never the agent's to decide

Four decisions belong to the human and are not delegable, whatever the evidence says:

1. Whether the change ships.
2. Whether the reported evidence is sufficient for them.
3. Every irreversible operation: committing, pushing, opening a PR, merging, deleting a branch.
4. Whether an accepted risk is accepted.

A green check is not an approval. **An AI-verified change is not a human-approved change**, and
the handoff is the artifact that asks for the difference.

## The handoff boundary

`/handoff` reports a verdict it does not produce, and it ends at `READY FOR HUMAN FINAL
REVIEW`. Propose the commit split; do not run it. Merging, committing, pushing, and opening a
PR are the human's.

A change that reaches this point carries: what changed, what was verified and how, what was
checked and deliberately left alone, and what needs a human.
