---
description: Produce a review handoff — proposed commit split, pasted evidence, doc impact
---

# Review Handoff

You own this task. Plan, review, verify. Stay in the lead.

The work stops here, at `READY FOR HUMAN FINAL REVIEW`. You propose; the human commits, pushes, and
opens the PR. Committing is not yours to do — see [Commits](../../docs/development.md#commits).

**AI verification does not replace human approval.** Every gate before this one answers whether the
change does what it was asked to do; none of them answers whether this is what was wanted. Which
decisions are the human's alone is
[the human-gate rule](../rules/human-gates.md#what-is-never-the-agents-to-decide). Answering any
of them yourself is the failure this workflow exists to prevent.

## Steps

1. **Propose small, ordered commits — do not run them.** Each commit tells one part of the story; give
   the message for each, then leave the changes in the working tree. See
   [Commits](../../docs/development.md#commits).
2. **Green check, one last time.** Run, on the combined tree:

   ```bash
   pnpm typecheck
   pnpm build:local
   pnpm test
   ```

   Run the harness checks when the change touched the harness itself. A failing check — including a build that does not
   package — means go back and fix, not hand off.

3. **Docs are reconciled before the handoff, not during it.** By this point the feature doc, and
   `docs/architecture/` if the architecture moved, are already updated from the shipped code: the
   implementation lane did that as its last step. A handoff that finds a doc still describing the old
   behaviour caught it late.
4. **Write the handoff summary**, stating:
   - **Doc Impact**: `none`, `update`, or `create`. Mandatory for every handoff.
   - What changed and why, one sentence per proposed commit.
   - How it was verified, with the evidence pasted verbatim — failing-then-passing output, before/after
     numbers, the green pin.
   - What remains unverified or risky, named explicitly.
   - A suggested PR title and description, framing impact for the consumer and the maintainer.
   - If Doc Impact is `update` or `create`: which documents were updated and by which lane, plus anything
     that was **already stale before this change**, so the reviewer knows the drift is not new.
5. **Say `READY FOR HUMAN FINAL REVIEW` and stop.** The release proposal is exactly four things: the
   proposed commit split, the message for each commit, a PR title and description, and a summary of what
   was verified and what remains unverified. Propose them; do not perform them.

   A release step must not redesign application code, fix an unrelated bug found in passing, bypass
   `reviewer` because the change looks small, or treat its own verification as the human's approval. A
   defect you notice now is a finding, not a fix, and an unfixed defect that blocks the change sends it
   back to the workflow that shipped it.

## Reply

`READY FOR HUMAN FINAL REVIEW`, then the handoff summary: what changed, the evidence, what is
unverified, and the suggested PR description. Name the principle that changed a decision.
