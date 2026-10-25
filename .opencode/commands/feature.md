---
description: Plan, obtain approval, implement, verify, and review a feature
agent: orchestrator
---

# Feature

1. Confirm this is a feature request. Route defects to `/bug-fix`; keep questions/investigations read-only.
2. Gather code evidence and inspect relevant architecture, patterns, shared contracts, components, localization, and tests.
3. Present one plan with expected behavior, affected boundaries, intended scope, trade-offs, risks, acceptance criteria, relevant states, and verification commands.
4. Wait for explicit user approval before editing or dispatching implementation/test/review agents.
5. After approval, implementer selects development Skills from actual scope. Tester selects test Skills from diff and risk. Reviewer selects specialist review Skills from the actual diff. Do not force fixed frontend/backend lanes.
6. If new evidence requires a material scope change, stop and obtain approval for a revised plan.
7. Verify each criterion and report PASS, FAIL, NOT RUN, N/A, or unverifiable with actual evidence.
8. Stop at handoff. Do not commit, push, or create a PR unless explicitly requested.
