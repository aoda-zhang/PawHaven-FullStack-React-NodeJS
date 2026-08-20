# Workflow: Bug Fix

> **Applies to**: Bug fixes and patches
> **Trigger**: User reports a bug or requests a fix
> **Owner**: PawHaven Orchestrator

## Pipeline

```
BUG REPORT
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 0: TRIAGE (Orchestrator)               │
│                                             │
│ - Classify: frontend / backend / both?      │
│ - Severity: critical / major / minor?       │
│ - Is this a regression? (was it working?)   │
│ - Present fix plan → WAIT for approval      │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 1: DIAGNOSE (Orchestrator or Agent)     │
│                                             │
│ - Read relevant code around the bug         │
│ - Trace the data flow that produces the bug │
│ - Identify the root cause                   │
│ - Confirm: is this truly a bug or a         │
│   misunderstanding of intended behavior?    │
│                                             │
│ For simple bugs: diagnose + fix in one step │
│ For complex bugs: escalate to architect     │
│   for impact analysis before fixing         │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 2: FIX (Frontend or Backend Agent)      │
│                                             │
│ - Apply the minimal fix for the root cause  │
│ - Do NOT refactor unrelated code            │
│ - If the fix requires architectural change: │
│   → route through architect agent first     │
│ - Validate: typecheck + lint                │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 3: REGRESSION TEST (Testing Agent)      │
│                                             │
│ - Write a test that reproduces the bug      │
│   (fails before fix, passes after fix)      │
│ - Run existing test suite for the module    │
│ - Check: did any other tests break?         │
│ - Report: pass/fail + any regressions       │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 4: CODE REVIEW (Code Review Agent)      │
│                                             │
│ - Review the fix for correctness            │
│ - Check: no side effects introduced?        │
│ - Check: edge cases covered?                │
│ - Check: is there a deeper issue to fix?    │
│   (report as Suggestion if so)             │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 5: SUMMARIZE (Orchestrator)             │
│                                             │
│ - Root cause identified                     │
│ - Fix applied (file + description)          │
│ - Regression test added                     │
│ - Code review passed                        │
│ - Any follow-up issues flagged              │
└─────────────────────────────────────────────┘
```

## Severity Classification

| Severity     | Examples                                      | Urgency               | Process                               |
| ------------ | --------------------------------------------- | --------------------- | ------------------------------------- |
| **Critical** | Auth broken, data loss, crash on load         | Fix immediately       | Diagnose → Fix → Test → Review        |
| **Major**    | Feature broken, incorrect data, missing state | Fix in current sprint | Diagnose → Fix → Test → Review        |
| **Minor**    | Visual glitch, typo, suboptimal UX            | Fix when convenient   | Diagnose → Fix (skip test if trivial) |

## Special Cases

### Regression (was working before)

1. Check git history for when it was introduced (`git bisect` if needed)
2. Write regression test FIRST (it will fail)
3. Apply fix (test now passes)
4. This test stays in the suite permanently

### Security Bug

1. Do NOT discuss details in public channels
2. Fix directly — skip the plan presentation step
3. Add security test to prevent re-introduction
4. Consider if this warrants an ADR

## Failure Recovery

Bug fixes have a tighter recovery loop due to urgency:

```
IF ANY STEP FAILS:

1. Regression test failure after fix:
   → Fix introduced a new bug → re-analyze the fix, apply corrected fix → re-test
   → Max 2 attempts before escalating for a different approach

2. Review finds the fix is incomplete or wrong:
   → Review reports specific issue → implementing agent corrects → re-test → re-review
   → Max 2 review rounds

3. Root cause misidentified:
   → Symptoms fixed but root cause remains → back to Step 1 (Diagnose)
   → This is a blocking issue — do not close the bug

4. Fix is confirmed but requires architecture change:
   → Route through architecture-change workflow instead
   → Flag as "Fix requires architectural change — see ADR-XXX"
```

### Critical Bug Recovery

For critical bugs (auth broken, data loss, crash on load):

- Skip plan → diagnose → fix → minimal test → review
- If fix fails first attempt: escalate to architect immediately
- Document the root cause after the fix is deployed (not before)
