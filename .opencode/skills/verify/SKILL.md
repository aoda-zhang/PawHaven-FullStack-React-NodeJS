---
name: verify
description: Choose proportionate verification checks and report only reproducible evidence for implementation changes.
---

# Verification standards

Use this skill whenever a task needs verification. The Tester owns the verification mode and final evidence summary. This skill defines shared standards, not a fixed command list.

## Select evidence by acceptance criterion

For every acceptance criterion, identify an observable result and a check that would fail if the criterion were false. Prefer the lowest test layer that proves the behaviour, then add boundary checks in proportion to risk.

- **Unit:** business rules, transformations, validation, state transitions, boundary and error branches.
- **Component:** rendered states, user-visible content, interactions, disabled states, and accessible semantics.
- **Integration / HTTP:** module collaboration, request/response shapes, status codes, authentication, persistence, and error mapping.
- **Contract:** runtime compatibility between producers and consumers. TypeScript compilation alone does not prove runtime payload compatibility.
- **Browser E2E:** real user journeys across UI, routing, forms, authentication, and backend integration.
- **Static checks:** typecheck, lint, architecture/quality checks, and build. Report these separately from behavioural tests.
- **Specialist checks:** security, accessibility, performance, visual regression, migration, concurrency, and recovery checks when required by a criterion or risk.

Avoid duplicate checks that add no confidence. Do not substitute a passing build for behaviour evidence.

## Execute responsibly

1. Inspect the actual package scripts, existing test setup, project rules, and affected package boundaries before choosing commands.
2. Run only commands that exist. Prefer focused checks first; add broader checks according to the mode selected by Tester and project workflow.
3. Do not install a new test framework or bypass an existing CI gate to get a green result.
4. Capture the exact command or journey, exit status, and relevant observed output. Never claim a check ran unless it ran in this session.
5. On a failure, distinguish a product defect from a test defect, infrastructure problem, flaky result, or unrelated baseline failure only when evidence supports that distinction. Preserve retry outcomes.
6. Include every acceptance criterion in the report, even when no executable check exists.

## Status definitions

- **PASS:** the check ran and observed evidence supports the criterion.
- **FAIL:** the check ran and observed evidence contradicts the criterion.
- **NOT RUN:** the check did not run; state why.
- **N/A:** the check does not apply; state why.
- **Unverifiable:** no available check directly establishes the criterion. Name the needed test method and owning package; do not write the missing test as part of verification.

Never infer PASS from source inspection, compilation alone, a skipped command, or a check that does not exercise the criterion.

## Boundaries

Verification agents inspect and execute checks. They do not implement fixes, edit application files, or write/modify tests unless the approved workflow explicitly assigns that work. The Reviewer owns the final acceptance verdict; verification supplies evidence and gaps.
