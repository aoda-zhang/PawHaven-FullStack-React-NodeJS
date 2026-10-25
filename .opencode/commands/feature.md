---
description: Plan, obtain explicit approval, implement, and verify a feature
agent: orchestrator
---

# Feature

Use the approval-first project workflow.

1. Confirm this is a feature request. If it is a defect, route to `/bug-fix`; if it is a question or investigation, remain read-only.
2. Inspect the relevant architecture, existing code, shared contracts, UI components, localization, and tests. Gather evidence before proposing a solution.
3. Produce one written plan before changing any file. Include:
   - User/problem and expected behavior.
   - Data shape and affected package/service boundaries.
   - Exact intended scope and implementation units.
   - Design choices, trade-offs, dependencies, and risks.
   - Acceptance criteria, relevant states (loading, empty, error, offline), and verification commands.
4. **Human approval gate:** present the plan and wait for explicit approval in the current conversation. Do not edit files or dispatch implementation/test/review agents before approval. There are no exceptions for small, reversible, urgent, or single-domain changes.
5. After approval, implement only the approved scope. If new evidence requires a material plan or scope change, stop and obtain approval for the revision.
6. Verify against each acceptance criterion on the relevant surface. For UI, routing, forms, or auth changes, use browser verification where available. Report actual command output and distinguish PASS, FAIL, NOT RUN, N/A, and unverifiable criteria.
7. Run the appropriate test/review workflow. For broad or cross-boundary changes, perform combined-tree verification. On failure, fix and re-verify for at most three cycles, then report `WORKFLOW BLOCKED`.
8. Update feature documentation only when the shipped behavior makes it necessary. Stop at handoff; do not commit or push unless explicitly requested.

## Reply

Before approval: provide evidence, the plan, trade-offs, risks, acceptance criteria, and checks, then wait. After approval: summarize the shipped behavior, actual verification evidence, and remaining risks.
