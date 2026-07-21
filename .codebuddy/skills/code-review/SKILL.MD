---
name: code-review
description: >
  Code Review Orchestrator. GATE: figma-doctor verifies design spec match first.
  On PASS, loads 6 sub-skills in parallel based on scope
  (frontend|backend|full-stack): typecheck-doctor, react-doctor, style-doctor,
  boundary-doctor, i18n-doctor, backend-doctor.
  Each sub-skill is independently composable and can be loaded via use_skill.
  Trigger: code review PR feedback quality check automated scans anti-pattern detection.
version: 5.0
---

# Code Review Orchestrator

## Architecture

This skill is the **orchestration entry point** for code review. All rules live in sub-skills — this skill only coordinates which sub-skills to load and how to aggregate their output.

```
code-review (this skill)
  │
  ├── GATE: figma-doctor       — Design spec verification (runs FIRST)
  │     ├── ✅ PASS → continue
  │     └── ❌ FAIL → STOP, return to development
  │
  └── PARALLEL (only if gate passes):
        ├── typecheck-doctor    — TypeScript type check
        ├── react-doctor        — React/Redux/Query/Form anti-patterns
        ├── style-doctor        — Styling & design token compliance
        ├── boundary-doctor     — Import boundaries & package dependency direction
        ├── i18n-doctor         — Hardcoded string detection
        └── backend-doctor      — Backend code quality
```

Each sub-skill is a standalone SKILL.MD containing explicit rules with exact tool invocations to use (search_content, execute_command, read_lints). No shell scripts. Each sub-skill can be loaded individually or composed.

## Scope → Skills Mapping

| Scope | Gate | Parallel Sub-skills |
|-------|------|---------------------|
| `frontend` | figma-doctor | typecheck-doctor, react-doctor, style-doctor, boundary-doctor, i18n-doctor |
| `backend` | (skip, no UI) | typecheck-doctor, boundary-doctor, backend-doctor |
| `full-stack` | figma-doctor | All 6 |

Figma gate only applies to UI tasks (frontend / full-stack). Pure backend reviews skip the gate.

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

### Step 3: Execute each sub-skill's rules
Each sub-skill's SKILL.MD lists explicit check rules. Execute them using the tools specified:
- `search_content` — for regex-based pattern detection
- `execute_command` — for typecheck, format check, etc.
- `read_lints` — for compiler/linter diagnostics

All independent checks within and across sub-skills SHOULD run in parallel.

### Step 4: Aggregate results
Collect all sub-skill outputs and categorize:

| Severity | Meaning | Action |
|----------|---------|--------|
| ❌ Blocking | Must fix, blocks merge | Fix required |
| ⚠️ Warning | Should fix, does not block | Fix recommended; track as follow-up |
| 💡 Suggestion | Optional improvement | Informational only |

### Step 5: Output graded report
Present findings organized by sub-skill, with file paths, line numbers, and severity.

### Step 6: Deep Review (Optional, for thorough reviews)
After the rule-based scan, manually verify:
1. **Architecture** — module placement, package layering, component graduation rules
2. **Feature** — feature completeness, data flow, edge cases, i18n 3-locale sync, a11y
3. **Type Contracts** — frontend/backend type consistency, API route matching (full-stack only)

## Sub-Skill Composition

Each sub-skill is a true CodeBuddy skill and can be:
- Loaded individually via `use_skill("code-review/react-doctor")`
- Combined on demand — load only the sub-skills needed
- Parallel-loaded by the main agent for full reviews

## Related

- Gate: [figma-doctor](./figma-doctor/SKILL.MD)
- Parallel doctors: [typecheck-doctor](./typecheck-doctor/SKILL.MD) · [react-doctor](./react-doctor/SKILL.MD) · [style-doctor](./style-doctor/SKILL.MD) · [boundary-doctor](./boundary-doctor/SKILL.MD) · [i18n-doctor](./i18n-doctor/SKILL.MD) · [backend-doctor](./backend-doctor/SKILL.MD)
- Architecture deep review: [architecture-doctor](./architecture-doctor/SKILL.MD)
- Frontend skills: [react](../frontend/react/SKILL.MD) · [styling](../frontend/style/SKILL.MD) · [i18n](../frontend/i18n/SKILL.MD)
