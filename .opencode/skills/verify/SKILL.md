---
name: verify
description: Select evidence that directly proves acceptance criteria and report reproducible results.
---

# Verification Standards

Use for verification work. The Tester chooses the mode; this Skill defines shared evidence and status rules.

## Select checks

For every acceptance criterion, name an observable result and a check that could fail if the criterion were false. Choose the lowest layer that proves it, then add boundary checks according to risk.

- Unit/component: business rules, state transitions, rendered states, and interactions.
- Integration/contract: module collaboration, payload compatibility, status/error behavior, and producer-consumer agreement.
- Browser/E2E: real user journeys across UI, routes, auth, and services.
- Static/build: typecheck, lint, architecture checks, and build. Report these separately from behavioral tests.
- Specialist: security, accessibility, performance, visual regression, migration, concurrency, or recovery when required by scope or risk.

Avoid duplicate checks that add no confidence. A passing build does not prove runtime behavior.

## Execute and report

1. Inspect project rules, actual scripts, test setup, and affected package boundaries.
2. Run only existing relevant checks. Do not install a new framework or bypass a project gate.
3. Record the exact command/journey, exit status, and relevant observed evidence.
4. Classify failures as product, test, infrastructure, flaky, or baseline only when evidence supports the classification.
5. Account for every acceptance criterion, including criteria with no executable check.

## Status

- **PASS:** the check ran and evidence supports the criterion.
- **FAIL:** the check ran and evidence contradicts it.
- **NOT RUN:** the check did not run; state why.
- **N/A:** the check does not apply; state why.
- **Unverifiable:** no available check proves the behavior; name the required method and owner.

Never infer PASS from source inspection, compilation alone, a skipped command, or an unrelated check.

## Boundary

Verification inspects and runs checks. It does not implement fixes or modify tests unless the approved workflow explicitly assigns that work. The Reviewer owns the final verdict.
