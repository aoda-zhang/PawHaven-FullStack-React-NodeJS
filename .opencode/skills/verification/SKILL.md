---
name: verification
description: Select and run checks that prove acceptance criteria for backend, frontend, browser, or static layers.
---

# Verification

Load for any verification work. The Tester chooses the layer-specific reference; this skill defines shared evidence and status rules.

## Required actions

1. Identify the verification layer(s) from the acceptance criteria: backend/API, frontend/UI, browser/E2E, or static/build.
2. For each layer, load the corresponding reference under `references/` and follow its checklist.
3. Apply the shared rules in this skill: select the lowest layer that proves each criterion, run only existing checks, record exact commands and evidence, classify failures with evidence.
4. Account for every acceptance criterion, including criteria with no executable check.

## Navigation

- `references/backend-verification.md` — APIs, services, persistence, auth, shared contracts
- `references/frontend-verification.md` — React UI, routes, forms, shared UI
- `references/browser-verification.md` — Real user journeys across UI, routes, auth, services
- `references/static-verification.md` — Typecheck, lint, architecture checks, build

## Shared rules

- Choose the lowest layer that proves the criterion; add boundary checks by risk.
- Avoid duplicate checks that add no confidence. A passing build does not prove runtime behavior.
- Inspect project rules, actual scripts, test setup, and affected package boundaries before running.
- Run only existing relevant checks. Do not install a new framework or bypass a project gate.
- Record the exact command/journey, exit status, and relevant observed evidence.
- Classify failures as product, test, infrastructure, flaky, or baseline only when evidence supports it.
- Status: PASS / FAIL / NOT RUN / N/A / Unverifiable (with required method and owner).
- Never infer PASS from source inspection, compilation alone, a skipped command, or an unrelated check.

## Boundary

Verification inspects and runs checks. It does not implement fixes or modify tests unless the approved workflow explicitly assigns that work. The Reviewer owns the final verdict.
