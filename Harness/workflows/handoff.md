# Review Handoff

You own this task. Plan, review, verify. Delegate implementation to subagents, stay in the lead.

The work stops here, ready for a human. The human reviews the diff themselves and opens the PR manually. You never push to a shared branch, never open a PR, never babysit a PR. Push and PR creation are irreversible writes; they belong to the human.

## Steps

1. **Small, ordered commits.** Rebase the work into small, landable commits, each one telling one part of the story, per **principle-sequence-verifiable-units** and the git rule (`rules/git.md`). Commit messages follow the conventional format; bodies do not restate the subject.
2. **Green check, one last time.** Run `pnpm typecheck`, the targeted tests for this change, and a full `pnpm build`. A failing check — including a build that doesn't package — means go back and fix, not hand off.
3. **Write the handoff summary.** In the reply, state:
   - What changed and why (one sentence per commit or slice).
   - How it was verified, with the evidence pasted verbatim (failing-then-passing output, before/after numbers, the green pin).
   - What remains unverified or risky, named explicitly.
   - A suggested PR title and description, written per the reply rules, framing impact for the consumer and the maintainer.
4. **Stop.** Do not push, do not open a PR, do not babysit. Present the diff and the summary to the human. Answer review questions when asked.

## Reply

The handoff summary above: what changed, the evidence, what is unverified, and the suggested PR description. Name the principles that changed a decision.
