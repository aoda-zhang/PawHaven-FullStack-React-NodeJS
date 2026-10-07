---
name: code-review
description: >
  Code review criteria. TECH REVIEW — is the code written well? (typecheck/typescript/react/style/
  i18n/backend/test doctors, feature & logic deep review).
  PATTERN REVIEW — does the change fit the project? (boundary/architecture
  doctors, architecture & design, type contracts).
  style-doctor is the design gate: it is the only check against
  @pawhaven/design-system tokens. Each sub-skill is
  independently loadable by reading its SKILL.md path.
  test-doctor runs on EVERY review, every scope.
  Trigger: code review PR feedback quality check automated scans anti-pattern detection.
---

# Code Review

Review dimensions, review criteria, how to reason about findings, severity definitions, and evidence
requirements. All rules live in sub-skills — this skill only states which sub-skills cover a scope
and how to aggregate their output.

Each sub-skill is a standalone `SKILL.md` holding explicit rules with a runnable command or a file
path to read. No shell scripts. Load one by reading its path — the paths are in the Related section at
the bottom of this file — and they compose.

There are **nine**. `react-doctor`,
`typescript-doctor`, `style-doctor`, and `i18n-doctor` were once agent-private skills nested under a
`review` lane that no longer exists. They are project skills now and load through this meta-skill by
path, exactly like the five that always lived here. Where a doctor sits in the tree is a fact about
where it used to be, not a difference in how it loads or how binding it is.

**Every rule names a command you can run.** A rule you cannot execute produces no finding while still
looking like a gate, so if a command in a sub-skill fails or is wrong, that is a finding about the
harness, and it gets fixed in the same change.

## Two passes

Every review runs **two passes**, because they answer different questions:

| Pass               | Question                                                                                                                 | Findings from                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **TECH REVIEW**    | Is the code written well? Best practices, anti-patterns, code quality                                                    | typecheck/typescript/react/style/i18n/backend/test doctors + feature & logic deep review |
| **PATTERN REVIEW** | Does the change fit the project? Follows the project's overall development rules/patterns, fits the current architecture | boundary/architecture doctors + architecture & design + type contract deep review        |

**Neither pass emits a verdict.** Each reports findings with a severity, and the review role turns the
two groups into the single `VERDICT: PASS` or `VERDICT: FAIL` the workflow reads. A doctor that
produced a verdict of its own would make two verdict producers, and the workflow would no longer know
which one to obey.

Either pass can block independently. A change that is well-written but breaks the project's architecture is blocked by Pattern Review; a change that fits the architecture but is full of anti-patterns is blocked by Tech Review.

## Severity

| Severity      | Meaning                    | Action                              |
| ------------- | -------------------------- | ----------------------------------- |
| ❌ Blocking   | Must fix, blocks merge     | Fix required                        |
| ⚠️ Warning    | Should fix, does not block | Fix recommended; track as follow-up |
| 💡 Suggestion | Optional improvement       | Informational only                  |

**Security findings are always Blocking** — a security issue (missing auth guard, unvalidated input,
exposed secret, injection vector) is a ❌ Blocking finding regardless of how contained it looks
(carried over from the former `security.md` §7).

Severity is the severity of the finding. It is not the review's verdict. A single `❌ Blocking` in
either pass is what makes the reviewer emit `VERDICT: FAIL`, and nothing here emits a verdict at all.

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

## Deep review criteria

Beyond the doctor checks, review the change itself against these criteria. Findings from the
typecheck/typescript/react/style/i18n/backend doctors belong to **TECH REVIEW**; findings from
boundary/architecture doctors belong to **PATTERN REVIEW**.

- **Feature completeness** — against the original requirement
- **Data flow** — end to end
- **Edge cases** — empty/null/error states, i18n 3-locale sync, a11y
- **Adversarial pass** — try to break the change before confirming it
- **Test completeness & quality** — test-doctor's four checks: existence, meaningful assertions,
  execution, conventions
- **Architecture & design** — module placement, package layering, dependency direction, component
  graduation rules, API/event consistency, design tokens, server-driven data, decision coverage
- **Type contracts** (full-stack only) — frontend/backend type consistency, API route matching

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
- Frontend skill: [frontend-patterns](../frontend-patterns/SKILL.md) — one router; per-area rules in its `references/` (`react-standards`, `styling`, `i18n`, `forms`, `data-fetching`, `client-state`, `component-placement`)
