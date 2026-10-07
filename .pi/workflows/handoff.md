---
description: Produce a review handoff — proposed commit split, pasted evidence, doc impact
---

# Review Handoff

You own this task. Plan, review, verify. Delegate implementation to subagents, stay in the lead.

The work stops here, at `READY FOR HUMAN FINAL REVIEW`. You propose; the human commits, pushes,
and opens the PR. Committing is not yours to do — see
[Commits](../../docs/development.md#commits).

**AI verification does not replace human approval.** Every automated gate before this one answers one
question: does the change do what it was asked to do? None of them answers whether this is what was
wanted. Four decisions are the human's alone, and they are the reason this workflow ends rather than
continues:

- Is this what was actually wanted? Scope, framing, and priority are product judgments a passing test
  cannot make.
- Is the behavior correct? `VERDICT: PASS` means no finding blocked it, not that every case is right.
- Is the scope acceptable? The pin that turned green may have been narrower than the problem.
- Should it be merged or released, and when?

Answering any of those yourself is the failure this step exists to prevent.

## Steps

1. **Propose small, ordered commits — do not run them.** Suggest a split where each commit tells
   one part of the story, and give the message for each, per **sequence-verifiable-units** and the
   git rule (`../../docs/development.md#commits`). Then leave the changes in the working
   tree.
2. **Green check, one last time.** Run `pnpm typecheck`, the targeted tests for this change, and a
   full `pnpm build`. A failing check — including a build that doesn't package — means go back and
   fix, not hand off.
3. **Docs are reconciled before the handoff, not during it.** By this point the feature doc and, if
   the architecture moved, `docs/architecture/` are already updated from the shipped code — the
   implementation lane did that as its last step. A handoff that finds a doc still describing the
   old behaviour caught it late; fix it before stopping here.
4. **Write the handoff summary.** In the reply, state:
   - **Doc Impact**: classify as `none` (no docs need updating), `update` (existing docs need
     updating), or `create` (new docs needed). This is mandatory for every handoff.
   - What changed and why, one sentence per proposed commit or slice.
   - How it was verified, with the evidence pasted verbatim (failing-then-passing output,
     before/after numbers, the green pin).
   - What remains unverified or risky, named explicitly.
   - A suggested PR title and description, framing impact for the consumer and the maintainer.
   - If Doc Impact is `update` or `create`, which documents were updated and by which lane, plus
     anything you found that was **already stale before this change**, so the reviewer knows the
     drift is not new. The implementation lane owns those edits so the doc ships in the same change
     (`AGENTS.md`: "update the matching doc in the same change"). There is no separate
     documentation agent.
5. **Say `READY FOR HUMAN FINAL REVIEW` and stop.** The release proposal is complete at this point,
   and it consists of exactly four things: the proposed commit split, the message for each commit, a
   PR title and description, and a summary of what was verified and what remains unverified. Propose
   them, do not perform them.

   A release step must not redesign application code, fix an unrelated bug found in passing, bypass
   `reviewer` because the change looks small, or treat its own verification as the human's approval.
   A defect you notice now is reported as a finding, not fixed here. An unfixed defect that blocks
   the change sends it back to the workflow that shipped it, not into this summary.

## Reply

`READY FOR HUMAN FINAL REVIEW`, then the handoff summary: what changed, the evidence, what is
unverified, and the suggested PR description. Name the principles that changed a decision.
