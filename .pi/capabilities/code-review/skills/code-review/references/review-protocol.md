# Review protocol

The process of a review: what to read, in what order, what a finding is, how severe it is, and how
the verdict is reached. This file is the **how**. What each dimension checks is in its own reference.

This is process knowledge. It does not name a workflow, a retry loop, or a human gate — those are
[rules](../../../../../rules/verification.md), [rules](../../../../../rules/failure.md), and
[rules](../../../../../rules/human-gates.md), and they apply whatever produced the review.

## 1. Scope

The scope is the diff you were asked to review, and it decides everything downstream.

Resolve it mechanically first:

```bash
node ../scripts/detect-review-scope.mjs --base <base-ref>
```

The detector resolves the changed files, the packages they belong to, the capabilities they sit in,
and the review dimensions that follow. Read its output; do not re-derive it by eye.

Three shapes, and what each one means:

| Scope        | What is in the diff                                           | Dimensions that follow                                                                                            |
| ------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `frontend`   | `apps/frontend/**`, `packages/ui`, `packages/frontend-core`   | code quality · architecture · frontend · TypeScript · testing · security                                          |
| `backend`    | `apps/backend/**`, `packages/shared`, `packages/backend-core` | code quality · architecture · backend · TypeScript · testing · security                                           |
| `full-stack` | both                                                          | all of the above, plus performance when a hot path moves                                                          |
| `docs`       | only documentation                                            | code quality is not applicable; architecture is, because a document can describe a boundary that no longer exists |

**A `full-stack` change is two domains, not a third domain.** Read both domain references. Do not
look for a full-stack dimension; there is none, because composition is not a distinct question.

## 2. Order

Read and run in this order. Each step's output is an input to the next.

1. **Scope** — the detector's output, above.
2. **Deterministic checks** — the commands, before any judgement. A failing check is a finding with
   a severity, not a discussion.
3. **Dimension references** — in the scope's order, then
   [frontend.md](./frontend.md) or [backend.md](./backend.md), then
   [typescript.md](./typescript.md) when the typed surface moved.
4. **The implementation rules** each reference points at. Read the owning skill; do not review from
   memory of a rule you have not re-read.
5. **The diff, then the code around it.** A diff out of context is unreadable, and most defects are
   only visible in the surrounding code.
6. **Findings**, then severity, then the verdict.

## 3. Severity

Severity is the severity of the **finding**, not of the review. One `BLOCKING` or `MAJOR` finding is
what makes the verdict `FAIL`.

| Severity     | Means                                                                                                 | Verdict effect | Action                    |
| ------------ | ----------------------------------------------------------------------------------------------------- | -------------- | ------------------------- |
| `BLOCKING`   | Must fix before the change ships. Correctness, a security hole, a broken boundary, a failing check.   | `FAIL`         | Fix required              |
| `MAJOR`      | Should not ship as written. A real defect with contained blast radius, or a hard constraint violated. | `FAIL`         | Fix required              |
| `MINOR`      | A defect that is real but low-impact, or a rule violation that does not change behaviour.             | no effect      | Fix recommended, track it |
| `SUGGESTION` | An improvement, not a defect.                                                                         | no effect      | Informational             |

**Security findings are always `BLOCKING`.** A missing auth declaration, an unvalidated boundary, an
exposed secret, or an injection vector is blocking however contained it looks. See
[security.md](./security.md).

## 4. Deterministic checks

Anything a command decides runs before judgement, through
`../scripts/run-project-checks.mjs`:

```bash
node ../scripts/run-project-checks.mjs --base <base-ref>
```

It runs the checks this scope makes applicable and prints one finding per hit, already carrying a
severity, a file and a line, and the command that produced it.

Three states, always. What each means is
[rules/verification.md](../../../../../rules/verification.md#evidence-what-a-pass-requires):

- the command ran and supports the claim → report the output
- the command ran and contradicts the claim → it is a finding
- the command did not run → `NOT RUN`, with the reason. Never an inferred pass.

**Paste the raw output for every check you call.** A review that says "the React gate is clean"
without the scan output has asserted nothing. A check you skipped because it was slow is `NOT RUN`,
not a pass.

A check whose command you cannot name is `NOT RUN`. A rule that names no command is a finding about
the harness, not a pass.

## 5. What a finding is

A finding is a defect with evidence. Not an observation, not a preference, not a style opinion the
project has not ruled on.

```
<severity>BLOCKING | MAJOR | MINOR | SUGGESTION
<file>path:line
<issue>what is wrong, and what it breaks
<evidence>the command, output, or failing scenario that establishes it
<fix>what the writing agent should change
```

Every `BLOCKING` and `MAJOR` finding is backed by a file, a line, a command output, or a named
failing scenario. A severity claim with nothing behind it is a guess wearing a badge, and it sends
the fix loop after the wrong thing.

Rules that catch candidates rather than decide:

- A grep returns a **candidate list**, not a finding. Some of its hits are correct code. Open the
  line, judge it, and keep or drop it with the reasoning written down. A grep that decides nothing is
  still worth running; a grep whose output you paste unjudged is not.
- A rule with an accepted exception names it. Check the match against the exception before reporting.

**A dimension finding you cannot evidence is not a finding.** Drop it, or report it as unverified with
the check that would settle it.

## 6. Pre-existing findings

A review must not attribute a pre-existing defect to the diff it is reviewing. Report it once, marked
pre-existing, and move on — otherwise every review of the same file re-reports the same lines and the
real finding gets lost.

The pre-existing findings these rules return, and the command that produces each one, are recorded in
[docs/quality](../../../../../../docs/quality/README.md).

## 7. Independence

The reviewer did not write the code and does not fix it. The separation is what makes the review
worth running: the writer cannot catch a self-consistent mistake, and a reviewer that edits what it
judged has stopped being a check.

This is also why no dimension produces a verdict. Dimensions report findings; the reviewer produces
the verdict. Two verdict producers means two standards for what counts as one.

## 8. Verdict

```
VERDICT: PASS
```

`PASS` means no finding blocked it, and it is the only thing that completes a review workflow.
Anything else is `FAIL`, and the change goes back to the writing agent.

`FAIL` is not a verdict on the author and not a verdict on the design. It says the diff is not
acceptable as written, and it lists what would make it acceptable. A `FAIL` with no actionable
finding in it is a failed review.

State, alongside the verdict:

- what you checked, and what you deliberately left alone
- every check you ran, and every check that is `NOT RUN` with its reason
- what no check covers
