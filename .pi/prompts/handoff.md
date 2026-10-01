---
description: Produce a review handoff — proposed commit split, pasted evidence, doc impact
---

# Review Handoff

You own this task. Plan, review, verify. Delegate implementation to subagents, stay in the lead.

The work stops here, ready for a human. You propose; the human commits, pushes, and opens the
PR. Committing is not yours to do — see [`references/git.md`](../skills/project-rules/references/git.md).

## Steps

1. **Propose small, ordered commits — do not run them.** Suggest a split where each commit tells
   one part of the story, and give the message for each, per **sequence-verifiable-units** and the
   git rule (`../skills/project-rules/references/git.md`). Then leave the changes in the working
   tree.
2. **Green check, one last time.** Run `pnpm typecheck`, the targeted tests for this change, and a
   full `pnpm build`. A failing check — including a build that doesn't package — means go back and
   fix, not hand off.
3. **Write the handoff summary.** In the reply, state:
   - **Doc Impact**: classify as `none` (no docs need updating), `update` (existing docs need
     updating), or `create` (new docs needed). This is mandatory for every handoff.
   - What changed and why, one sentence per proposed commit or slice.
   - How it was verified, with the evidence pasted verbatim (failing-then-passing output,
     before/after numbers, the green pin).
   - What remains unverified or risky, named explicitly.
   - A suggested PR title and description, framing impact for the consumer and the maintainer.
   - If Doc Impact is `update` or `create`, which documents need updating or creating, and the exact
     `docs/` edits the change invalidated. The main session owns those edits — it routes them to the
     implementation lane that made the change, so the doc update ships in the same change
     (`AGENTS.md`: "update the matching doc in the same change"). There is no separate
     documentation agent.

## Reply

The handoff summary above: what changed, the evidence, what is unverified, and the suggested PR
description. Name the principles that changed a decision.
