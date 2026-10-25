---
description: Reproduce a defect, propose a root-cause fix, wait for approval, then verify
agent: orchestrator
---

# Bug Fix

Use the approval-first project workflow. A defect report authorizes investigation, not implementation.

1. Confirm this is a defect rather than a performance issue or a "where does this live" question. State the route and why.
2. Reproduce the issue on the matching surface and capture before evidence. Record one of:
   - **Reproduced:** surface, input, and observed output are available.
   - **Not reproduced:** continue investigating or report that the trigger could not be reproduced; do not propose an evidence-free patch as a confirmed fix.
   - **Unable to verify:** state the environmental blocker and stop short of claiming a fix.
3. Investigate candidate causes using runtime evidence, logs, tests, and code paths. Use `scout` when the surface is broad; distinguish observed facts from hypotheses.
4. Produce a written fix plan before editing. Include the supported root-cause hypothesis, evidence, exact scope, intended fix, risks/regression surfaces, acceptance criteria, and the same-surface reproduction/regression checks.
5. **Human approval gate:** present the plan and wait for explicit approval in the current conversation. Do not edit files before approval. This applies to every fix, including apparently trivial or reversible fixes.
6. After approval, implement the smallest root-cause fix. If evidence disproves the approved diagnosis or requires material scope changes, stop and request approval for a revised plan.
7. Re-run the same reproduction path on the same surface, capture after evidence, and add a regression check. Review the complete diff. On failure, fix and re-verify for at most three cycles, then report `WORKFLOW BLOCKED`.
8. Reconcile affected feature documentation last. Stop at handoff. Do not commit or push unless explicitly requested.

## Reply

Before approval: report the reproduction status, evidence, root-cause hypothesis, proposed change, risks, and verification plan, then wait. After approval: report the root cause, fix, before/after evidence, exact checks, and any environment that prevented verification.
