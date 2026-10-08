---
name: react-doctor
description: >
  How to run the external React analysis CLI this project pins, and what it does and does not cover.
  A tool integration, not a review method: the React review procedure lives in the code-review
  capability's frontend dimension, and the frontend implementation rules live in frontend-patterns.
  Read before running the React gate, and whenever the scan is suspected of having found nothing.
  Trigger: react doctor react-doctor scan react cli gate a11y bundle size react lint static
  analysis component audit.
---

# React Doctor

This skill exists to run one external tool correctly. It holds the pinned invocation, what the tool
covers, and what it cannot know about this repository.

**It is not a review.** The review method is the `code-review` skill's frontend dimension. The
project's React rules are `frontend-patterns`. Keeping the three apart is what stops a tool's output
from being mistaken for the project's standards.

## The pinned gate

```bash
npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked
```

**The version is pinned to `0.9.12`** because that is the version CI runs. Never `@latest`: it drifts
ahead of the pin and the local scan stops agreeing with CI. Bumping it requires explicit approval
**and** a matching bump in the CI workflow. Both sides move together or neither does.

`-y` is not optional. Without it the CLI prompts for a project and, in an agent context, silently
scans a subset. That is the single most common cause of "the gate found nothing".

→ [references/cli-reference.md](./references/cli-reference.md) — the full flag table, the full-scan
and `--project` variants, the triage playbook, and rule explanation.

## What the tool covers

Security, performance, correctness, architecture, accessibility, and bundle size in React code. All
of its output is treated as a blocking finding in a review.

## What the tool cannot know

Project conventions a generic analyser has no way to infer: which store file holds the typed hooks,
where the query-key factory lives, which form library a feature uses, and what the design tokens are
called. Those are checked by the project's own deterministic checks and by reading the diff. The
review dimension owns both.

## Reading a scan

1. **Paste the raw output**: the command, the project list it scanned, and the findings.
2. **Check the project list contains the app you expect.** An incomplete project list invalidates
   the scan, and an empty scan is the most common false pass.
3. **A clean scan means the tool found nothing**, not that the React code is correct. It is one
   input to a review, not the review.

## Running it during implementation

It is the mandatory self-check before reporting a change that touched a React page, component, hook,
or UI state. Report it as `PASS`, `FAIL`, or `NOT RUN` with the reason — a check you did not run is
never an inferred pass. What each state means is in the harness's verification rule.

## Related

- React implementation rules: [frontend-patterns](../frontend-patterns/SKILL.md)
- The review procedure that uses this tool: [code-review → frontend](../../../code-review/skills/code-review/references/frontend.md)
