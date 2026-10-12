---
description: Review a change and produce the single verdict that gates it
---

# Code Review

You own this task. Review, judge, and stop at the verdict.

A review is a **verification** workflow, not a planning one. It has no plan to approve and no product
question to ask, so it does not stop for a checkpoint of its own. Its only human gate is the final
review, and that belongs to the handoff, not here.

## Steps

1. **Resolve the target.** What is under review: a diff against a base ref, a working tree, or a named
   change. If the caller did not say, resolve it mechanically rather than guessing:

   ```bash
   node ../plugins/code-review/skills/code-review/scripts/detect-review-scope.mjs --base <base-ref>
   ```

   The detector resolves the base when you do not pass one, and prints which base it used. A review of
   the wrong diff is not a review.

2. **Read the diff and the surrounding code** before any check output. A diff out of context is
   unreadable, and a check run against a diff nobody has read produces findings nobody can weigh.

3. **Determine the applicable review dimensions.** The detector reports them. Code quality,
   architecture, security, and testing apply to any change in source; the frontend, backend, and
   TypeScript dimensions follow the areas actually touched.

4. **Run the deterministic checks**, and read their real output:

   ```bash
   node ../plugins/code-review/skills/code-review/scripts/run-project-checks.mjs --base <base-ref>
   ```

   Every hit is a **candidate**. Open the line and judge it against the rule its reference names. Paste
   the output; a check reported as clean without its output has asserted nothing. A check that did not
   run is `NOT RUN`, with the reason.

5. **Read the dimension references** for the dimensions in scope, and the implementation rules each
   one points at. Read the rules; do not review from memory of them.

6. **Review the change itself**, beyond the checks: feature completeness against the requirement, data
   flow end to end, the edge states, and an adversarial pass that tries to break the change before
   confirming it.

7. **Classify every finding** by severity. Every blocking and major finding carries a file, a line, a
   command output, or a named failing scenario. A severity claim with nothing behind it is a guess
   wearing a badge.

8. **Emit the verdict.** One `VERDICT: PASS` or `VERDICT: FAIL`, and the findings behind it. A `FAIL`
   with no actionable finding in it is a failed review, not a harsh one.

## What this workflow does not do

- **It does not fix.** Findings go back to the writing agent. An agent that edits the diff it is
  judging is no longer independent.
- **It does not decide whether the change should exist.** That was the plan's approval, upstream.
- **It does not produce a second verdict.** It produces the only one.
- **It does not accept a change nobody wrote.** Reviewing an unimplemented plan is planning.

## Reading order

The method, the severity vocabulary, the finding structure, and the verdict rule are in the
[`code-review`](../plugins/code-review/skills/code-review/SKILL.md) skill. Read it before the
first review of a session; it is short and it is the whole procedure. The per-dimension references are
read on demand, and only for the dimensions in scope.

## When the review fails

The findings go through the bounded fix loop, and the loop belongs to
[rules/failure.md](../rules/failure.md). A finding that says the **plan** is wrong — a boundary that
does not hold, an approved scope that cannot finish the task — returns to planning instead.

## Reply

The verdict, then the findings grouped by severity, the dimensions you ran and the references you
read, the checks you ran with their output, the checks you did not run with their reasons, what you
deliberately left alone, and what the writing agent should change first.
