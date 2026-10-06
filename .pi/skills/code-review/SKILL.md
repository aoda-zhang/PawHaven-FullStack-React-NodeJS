---
name: code-review
description: >
  Code Review Orchestrator. Two passes:
  TECH REVIEW — is the code written well? (typecheck/typescript/react/style/
  i18n/backend/test doctors, feature & logic deep review).
  PATTERN REVIEW — does the change fit the project? (boundary/architecture
  doctors, architecture & design, type contracts).
  style-doctor is the design gate: it is the only check against
  @pawhaven/design-system tokens. Each sub-skill is
  independently loadable by reading its SKILL.md path.
  test-doctor runs on EVERY review, every scope.
  Trigger: code review PR feedback quality check automated scans anti-pattern detection.
---

# Code Review Orchestrator

## Architecture

This skill is the **orchestration entry point** for code review. All rules live in sub-skills — this skill only coordinates which sub-skills to load and how to aggregate their output.

```
code-review (this skill)
  │
  ├── PASS A — TECH REVIEW (is the code written well?)
  │     ├── PARALLEL:
  │     │     ├── typecheck-doctor    — TypeScript compile check (mechanical)
  │     │     ├── typescript-doctor  — Type discipline: any, casts, shared-type placement
  │     │     ├── react-doctor        — React/Redux/Query/Form anti-patterns
  │     │     ├── style-doctor        — Styling & design token compliance (DESIGN GATE)
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

Each sub-skill is a standalone `SKILL.md` holding explicit rules with a runnable command or a file
path to read. No shell scripts. Load one by reading its path — the paths are in the Related section at
the bottom of this file — and they compose.

There are **nine**. Seven run in the TECH pass, two in the PATTERN pass. `react-doctor`,
`typescript-doctor`, `style-doctor`, and `i18n-doctor` were once agent-private skills nested under a
`review` lane that no longer exists. They are project skills now and load through this meta-skill by
path, exactly like the five that always lived here. Where a doctor sits in the tree is a fact about
where it used to be, not a difference in how it loads or how binding it is.

**Every rule names a command you can run.** A rule you cannot execute produces no finding while still
looking like a gate, so if a command in a sub-skill fails or is wrong, that is a finding about the
harness, and it gets fixed in the same change.

## Two Passes

Every review runs **two passes**, because they answer different questions:

| Pass               | Question                                                                                                                 | Findings from                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **TECH REVIEW**    | Is the code written well? Best practices, anti-patterns, code quality                                                    | typecheck/typescript/react/style/i18n/backend/test doctors + Layer 3 feature & logic deep review  |
| **PATTERN REVIEW** | Does the change fit the project? Follows the project's overall development rules/patterns, fits the current architecture | boundary/architecture doctors + Layer 2 architecture & design + Layer 4 type contract deep review |

**Neither pass emits a verdict.** Each reports findings with a severity, and the review role turns the
two groups into the single `VERDICT: PASS` or `VERDICT: FAIL` the workflow reads. A doctor that
produced a verdict of its own would make two verdict producers, and the workflow would no longer know
which one to obey.

Either pass can block independently. A change that is well-written but breaks the project's architecture is blocked by Pattern Review; a change that fits the architecture but is full of anti-patterns is blocked by Tech Review.

## Scope → Skills Mapping

| Scope        | TECH Review sub-skills                                       | PATTERN Review sub-skills |
| ------------ | ------------------------------------------------------------ | ------------------------- |
| `frontend`   | typecheck, typescript, react, style, i18n, **test**          | boundary, architecture    |
| `backend`    | typecheck, typescript, backend, **test**                     | boundary, architecture    |
| `full-stack` | typecheck, typescript, react, style, i18n, backend, **test** | boundary, architecture    |

Across the three scopes the table names all nine. `test-doctor` runs on EVERY review, every scope, and
is never skipped. `style-doctor` is the design gate: for UI scopes it is the only check against the
`@pawhaven/design-system` tokens, so a token violation blocks the TECH pass. There is no separate
Figma gate. Figma is not used in this project; the token CSS in
`packages/design-system/src/tokens/` is the design authority.

## Workflow

### Step 0: Determine scope

Ask the user or infer from changed files what is being built:

- **Scope**: frontend / backend / full-stack

### Step 1: Load all applicable sub-skills

Read each sub-skill's `SKILL.md` for the determined scope. The paths are in
[Related](#related). **test-doctor is always included** — every scope, frontend / backend /
full-stack. **style-doctor is the design gate** for frontend and full-stack scopes.

### Step 2: Execute each sub-skill's rules

Each sub-skill states a shell command or a file to read. Run them; independent checks SHOULD run
together in one batch.

### Step 3: Aggregate results and assign each finding to a pass

Collect all sub-skill outputs and categorize:

| Severity      | Meaning                    | Action                              |
| ------------- | -------------------------- | ----------------------------------- |
| ❌ Blocking   | Must fix, blocks merge     | Fix required                        |
| ⚠️ Warning    | Should fix, does not block | Fix recommended; track as follow-up |
| 💡 Suggestion | Optional improvement       | Informational only                  |

Then tag every finding with its pass (see Two Passes above): findings from the
typecheck/typescript/react/style/i18n/backend doctors belong to **TECH REVIEW**; findings from
boundary/architecture doctors belong to **PATTERN REVIEW**.

Severity is the severity of the finding. It is not the review's verdict. A single `❌ Blocking` in
either pass is what makes the reviewer emit `VERDICT: FAIL`, and nothing here emits a verdict at all.

### Step 4: TECH REVIEW deep pass — Layer 3, Feature & Logic

Verify the implementation quality itself:

1. **Feature completeness** against the original requirement
2. **Data flow** end-to-end
3. **Edge cases** — empty/null/error states, i18n 3-locale sync, a11y
4. **Adversarial pass** — try to break the change before confirming it
5. **Test completeness & quality** — delegated to **test-doctor** (loaded in
   Step 1, every scope). Its four checks: existence, meaningful assertions,
   execution, conventions. If test-doctor was not loaded, apply its rules
   manually — the checks themselves are mandatory on every review.

### Step 5: PATTERN REVIEW deep pass — Layer 2 + Layer 4, Architecture & Contracts

Verify the change fits the project's overall patterns and architecture:

1. **Architecture & Design (Layer 2)** — module placement, package layering, dependency direction, component graduation rules, API/event consistency, design tokens, server-driven data, decision coverage
2. **Type Contracts (Layer 4, full-stack only)** — frontend/backend type consistency, API route matching

### Step 6: Aggregate findings per pass

Present findings organized by sub-skill, with file paths, line numbers, and severity, grouped under
**TECH REVIEW** and **PATTERN REVIEW**. Each pass carries its own blocking state. The review role reads
the two groups and produces the one verdict the workflow consumes.

## Sub-Skill Composition

Each sub-skill is loadable on its own — read its `SKILL.md` — so a narrow review reads only the
doctors its scope needs, and a full review reads all of them.

**Why load on demand by path rather than granting in frontmatter.** Granting a skill loads its whole
body into the child's context up front, before the reviewer knows the scope. A backend-only review
would then carry the React and styling rules it will never apply, and the cost of that context grows
with every doctor added. This skill exists so a narrow review reads only the rules its scope needs.
Granting all nine in an agent's frontmatter undoes progressive disclosure and is not a fix for
anything; if a rule is being loaded and not applied, the finding is that the rule is unclear, not that
it needs to be granted.

## Related

- Parallel doctors: [typecheck-doctor](./typecheck-doctor/SKILL.md) · [typescript-doctor](./typescript-doctor/SKILL.md) · [react-doctor](./react-doctor/SKILL.md) · [style-doctor](./style-doctor/SKILL.md) · [boundary-doctor](./boundary-doctor/SKILL.md) · [i18n-doctor](./i18n-doctor/SKILL.md) · [backend-doctor](./backend-doctor/SKILL.md) · [test-doctor](./test-doctor/SKILL.md) (every review)
- Architecture deep review: [architecture-doctor](./architecture-doctor/SKILL.md)
- Frontend skills: [react](../react/SKILL.md) · [styling](../style/SKILL.md) · [i18n](../i18n/SKILL.md)
