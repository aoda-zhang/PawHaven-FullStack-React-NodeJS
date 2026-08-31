---
name: code-review
description: >
  Code Review Orchestrator. Two passes:
  TECH REVIEW — is the code written well? (figma gate, typecheck/react/style/
  i18n/backend/test doctors, feature & logic deep review).
  PATTERN REVIEW — does the change fit the project? (boundary/architecture
  doctors, architecture & design, type contracts).
  GATE: figma-doctor verifies design spec match first. Each sub-skill is
  independently composable and can be loaded via use_skill.
  test-doctor runs on EVERY review, every scope.
  Trigger: code review PR feedback quality check automated scans anti-pattern detection.
version: 5.2
---

# Code Review Orchestrator

## Architecture

This skill is the **orchestration entry point** for code review. All rules live in sub-skills — this skill only coordinates which sub-skills to load and how to aggregate their output.

```
code-review (this skill)
  │
  ├── PASS A — TECH REVIEW (is the code written well?)
  │     ├── GATE: figma-doctor       — Design spec verification (runs FIRST)
  │     │     ├── ✅ PASS → continue
  │     │     └── ❌ FAIL → STOP, return to development
  │     ├── PARALLEL (only if gate passes):
  │     │     ├── typecheck-doctor    — TypeScript type check
  │     │     ├── react-doctor        — React/Redux/Query/Form anti-patterns
  │     │     ├── style-doctor        — Styling & design token compliance
  │     │     ├── i18n-doctor         — Hardcoded string detection
  │     │     ├── backend-doctor      — Backend code quality
  │     │     └── test-doctor         — Test coverage & quality (EVERY review, all scopes)
  │     └── Deep review: Layer 3 — feature & logic
  │           (completeness, data flow, edge cases, adversarial pass)
  │
  └── PASS B — PATTERN REVIEW (does the change fit the project?)
        ├── PARALLEL:
        │     ├── boundary-doctor     — Import boundaries & dependency direction
        │     └── architecture-doctor — Project architecture & design rules
        └── Deep review:
              ├── Layer 2 — architecture & design
              └── Layer 4 — type contract (full-stack only)
```

Each sub-skill is a standalone SKILL.MD containing explicit rules with exact tool invocations to use (search_content, execute_command, read_lints). No shell scripts. Each sub-skill can be loaded individually or composed.

## Two Passes

Every review produces **two verdicts**, because they answer different questions:

| Pass | Question | Findings from |
| ---- | -------- | ------------- |
| **TECH REVIEW** | Is the code written well? Best practices, anti-patterns, code quality | figma gate + typecheck/react/style/i18n/backend/test doctors + Layer 3 feature & logic deep review |
| **PATTERN REVIEW** | Does the change fit the project? Follows the project's overall development rules/patterns, fits the current architecture | boundary/architecture doctors + Layer 2 architecture & design + Layer 4 type contract deep review |

Either pass can block independently. A change that is well-written but breaks the project's architecture is blocked by Pattern Review; a change that fits the architecture but is full of anti-patterns is blocked by Tech Review.

## Scope → Skills Mapping

| Scope | Gate (TECH) | TECH Review sub-skills | PATTERN Review sub-skills |
|-------|-------------|------------------------|---------------------------|
| `frontend` | figma-doctor | typecheck, react, style, i18n, **test** | boundary, architecture |
| `backend` | (skip, no UI) | typecheck, backend, **test** | boundary, architecture |
| `full-stack` | figma-doctor | typecheck, react, style, i18n, backend, **test** | boundary, architecture |

Figma gate only applies to UI tasks (frontend / full-stack). Pure backend reviews skip the gate.
**test-doctor runs on EVERY review, every scope** — it is never skipped (unlike the figma gate).

## Workflow

### Step 0: Determine scope & target
Ask the user or infer from changed files what is being built:
- **Scope**: frontend / backend / full-stack
- **Target**: what specific feature/section (e.g., "footer", "hero section") — required for figma gate

### Step 1 (GATE): Run figma-doctor
If scope includes frontend, run figma-doctor FIRST (sequential). It reads the design spec, finds the matching section, and compares every property against the implementation.

- **✅ PASS** → go to Step 2
- **❌ FAIL** → **STOP**. Report all mismatches. Do NOT continue. Return to development.

### Step 2: Parallel-load all applicable sub-skills
Use `use_skill` to load each sub-skill for the determined scope. This MUST be done in parallel — all sub-skill loads in one batch.
**test-doctor is always included** — load it for every scope (frontend / backend / full-stack).

### Step 3: Execute each sub-skill's rules
Each sub-skill's SKILL.MD lists explicit check rules. Execute them using the tools specified:
- `search_content` — for regex-based pattern detection
- `execute_command` — for typecheck, format check, etc.
- `read_lints` — for compiler/linter diagnostics

All independent checks within and across sub-skills SHOULD run in parallel.

### Step 4: Aggregate results and assign each finding to a pass
Collect all sub-skill outputs and categorize:

| Severity | Meaning | Action |
|----------|---------|--------|
| ❌ Blocking | Must fix, blocks merge | Fix required |
| ⚠️ Warning | Should fix, does not block | Fix recommended; track as follow-up |
| 💡 Suggestion | Optional improvement | Informational only |

Then tag every finding with its pass (see Two Passes above): findings from the gate and the typecheck/react/style/i18n/backend doctors belong to **TECH REVIEW**; findings from boundary/architecture doctors belong to **PATTERN REVIEW**.

### Step 5: TECH REVIEW deep pass — Layer 3, Feature & Logic
Verify the implementation quality itself:
1. **Feature completeness** against the original requirement
2. **Data flow** end-to-end
3. **Edge cases** — empty/null/error states, i18n 3-locale sync, a11y
4. **Adversarial pass** — try to break the change before confirming it
5. **Test completeness & quality** — delegated to **test-doctor** (loaded in
   Step 2, every scope). Its four checks: existence, meaningful assertions,
   execution, conventions. If test-doctor was not loaded, apply its rules
   manually — the checks themselves are mandatory on every review.

### Step 6: PATTERN REVIEW deep pass — Layer 2 + Layer 4, Architecture & Contracts
Verify the change fits the project's overall patterns and architecture:
1. **Architecture & Design (Layer 2)** — module placement, package layering, dependency direction, component graduation rules, API/event consistency, design tokens, server-driven data, ADR coverage
2. **Type Contracts (Layer 4, full-stack only)** — frontend/backend type consistency, API route matching

### Step 7: Output graded report with per-pass verdicts
Present findings organized by sub-skill, with file paths, line numbers, and severity. Report **two verdicts** — Tech Review verdict and Pattern Review verdict — plus the overall verdict. Either pass can block independently.

## Sub-Skill Composition

Each sub-skill is a true CodeBuddy skill and can be:
- Loaded individually via `use_skill("code-review/react-doctor")`
- Combined on demand — load only the sub-skills needed
- Parallel-loaded by pawhaven for full reviews

## Related

- Gate: [figma-doctor](./figma-doctor/SKILL.MD)
- Parallel doctors: [typecheck-doctor](./typecheck-doctor/SKILL.MD) · [react-doctor](./react-doctor/SKILL.MD) · [style-doctor](./style-doctor/SKILL.MD) · [boundary-doctor](./boundary-doctor/SKILL.MD) · [i18n-doctor](./i18n-doctor/SKILL.MD) · [backend-doctor](./backend-doctor/SKILL.MD) · [test-doctor](./test-doctor/SKILL.MD) (every review)
- Architecture deep review: [architecture-doctor](./architecture-doctor/SKILL.MD)
- Frontend skills: [react](../frontend/react/SKILL.MD) · [styling](../frontend/style/SKILL.MD) · [i18n](../frontend/i18n/SKILL.MD)
