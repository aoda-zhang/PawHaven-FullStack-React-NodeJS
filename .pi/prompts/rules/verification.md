# Verification policy

The stable rules for **how a stage is verified, when a stage is required, and what a pass
requires**. Every workflow applies this file; none of them restates it.

Workflows own ordering. This file owns the thresholds and the evidence standard. When a
workflow says "the gate sequence's call", the sequence below is what it means.

## The gate sequence

Nine stages, in this order.

| #   | Stage                      | Lane                          | When it runs                                 |
| --- | -------------------------- | ----------------------------- | -------------------------------------------- |
| 1   | Plan                       | `scout`, `architect`          | Always beyond Trivial                        |
| 2   | Plan review                | `oracle`                      | Conditional, skipped for Trivial scope       |
| 3   | Human plan approval        | the human                     | Standard and Architectural scope             |
| 4   | Implementation             | `frontend-dev`, `backend-dev` | Always beyond Trivial                        |
| 5   | Developer self-test        | the writing lane              | Every implementation lane, before it reports |
| 6   | Independent verification   | `tester`                      | Conditional, `medium` or `high` complexity   |
| 7   | Independent review         | `reviewer`                    | Every mutating change                        |
| 8   | Combined-tree verification | `orchestrator`                | After the units are joined                   |
| 9   | Human final review         | the human                     | Every change that survives to a handoff      |

### Which stages are conditional

Three of the nine are conditional, and the classification is the entire trigger:

- **Stage 2 (plan review)** is skipped when the task classified as `Trivial`. A plan that
  reads small is not a reason to skip it, and a plan that reads large does not promote a
  Trivial task into a reviewed one.
- **Stage 3 (human plan approval)** is skipped for Trivial scope, because there is nothing
  to weigh. See [the human-gate rule](./human-gates.md#human-gates).
- **Stage 6 (independent verification)** runs when the task classified at `medium` or
  `high` **complexity OR at `high` or `critical` risk**, and is skipped otherwise. Risk is
  read on its own axis: a two-file change to authentication behavior is `low` complexity and
  still a `high`-risk task, so it gets an independent acceptance lane.

A `browser-verifier` pass is a fourth conditional act and is not one of the nine numbered
stages. It runs when the change touches a surface a user touches, and is skipped for a
backend-only change.

The rest are unconditional. Stage 5 runs on every implementation, because a lane that has
not run its own checks has no evidence to hand on. Stage 7 runs on every mutating change, no
matter how small, because a change nobody independent has read has not been reviewed.

### Lane shapes

The sequence specialised to a classification. `taskType` picks the workflow; `complexity`,
`risk`, and `domains` read together pick this shape. `domains` decides which workers appear,
and the other two decide how much surrounds them.

**`low` complexity, `low` risk, `domains: [frontend]`.** `orchestrator` → `frontend-dev` →
`reviewer` → the human. No planner, no plan review, no independent acceptance lane, because
the work sits in one layer with a straight verification. The developer self-test still runs.

**`medium` complexity, `medium` risk, `domains: [frontend, backend]`.** `orchestrator` →
`architect` → **the shared contract** → `frontend-dev` and `backend-dev`, in parallel only
where the dependencies permit → `tester` → `browser-verifier` on a user-facing surface →
`reviewer` → combined-tree verification. Plan review is conditional; human plan approval is
not, because a two-domain feature is Standard work at minimum.

**`low` complexity, `high` risk, `domains: [backend]`.** The strong path in full: planner,
plan review, a named validator per unit, an independent acceptance lane, review, and the
human gate, because high risk forces every one of them however small the diff is. This is
the shape the routing has to get right.

A full-stack task is **composed** from two domains, and no `fullstack-dev` worker exists or
should be created for it. Composition is what the orchestrator already does.

## Evidence: what a PASS requires

**Every verification result names the command that ran and the output it produced.** A check
whose command cannot be named has not been run. Every check reports one of three states:

| State     | Meaning                                                               |
| --------- | --------------------------------------------------------------------- |
| `PASS`    | The command ran and the output supports the claim. Quote the output.  |
| `FAIL`    | The command ran and contradicts the claim. Route it to the fix loop.  |
| `NOT RUN` | The check did not run. Give the reason. Never infer a pass from this. |

"It compiles", "looks good", "everything seems fine", and "should be fine" are not
verification. They are absence of evidence read as evidence.

**An unrun check is `NOT RUN`, never an inferred pass.** A check skipped because it was slow,
because the environment lacked a dependency, or because the lane judged it unnecessary is
`NOT RUN` with that reason attached. The one exception is a check that does not apply, and an
inapplicable check is named as inapplicable rather than left blank. Blank is how a skipped
check becomes a claimed pass.

**A lane with no named validator has not finished.** The dispatch names who verifies the lane
and what counts as passing, before the lane starts. If the lane cannot name the command it
would use, the prompt is at fault. Fix the prompt and re-dispatch.

Every lane returns a `<verification>` block inside its `<result>`: the implementation roles
report on implementation, the acceptance role on behaviour, and the review role on review.
Hold each to that shape.

**A bug's repro passes on the same surface that failed.** A check that runs against a
different surface proves something else, and reporting it as a pass is the failure this rule
exists to prevent.

## Stage 8: combined-tree verification

The orchestrator owns it, and it runs on the merged result rather than per unit, because a
change that typechecks per file and does not package is only visible once the units are
joined. A developer owns its own unit and stage 5 already covers that.

```bash
pnpm typecheck
pnpm build:local
pnpm test
```

`pnpm lint` exits non-zero on a clean tree. The baseline is in
[docs/quality](../../docs/quality/README.md); diff against it before calling a remaining
error a regression.

When the joined tree fails, the failure is classified and routed by
[the failure rule](./failure.md#when-combined-tree-verification-fails).

## Relaying what a lane reported

**A lane's evidence is relayed exactly as reported. The narrative across lanes is the
orchestrator's.** Two rules that look opposed and are not. Relay every command a lane names,
with the output it produced, at the strength the lane reported. `FAIL` does not become
"worth a look", and a `NOT RUN` does not become silent. Then write your own reading across
lanes: which findings interact, what the joined tree is, what no lane checked.

Both failure directions are named. Substituting your own wording for a lane's evidence
launders it, because the reader can no longer tell whose observation became whose conclusion.
Passing a lane's prose through as your own analysis hands back a list of reports with no
cross-lane reading, which is the one thing the orchestrator exists to add.
