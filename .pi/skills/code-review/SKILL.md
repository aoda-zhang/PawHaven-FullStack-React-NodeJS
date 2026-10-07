---
name: code-review
description: >
  Code review criteria and doctor selection. TECH REVIEW — is the code written well?
  (typecheck/typescript/react/style/i18n/backend/test doctors, feature and logic deep review).
  PATTERN REVIEW — does the change fit the project? (boundary/architecture doctors, architecture and
  design, type contracts). style-doctor is the design gate: the only check against
  @pawhaven/design-system tokens. test-doctor runs on EVERY review, every scope. Each doctor is
  independently loadable by reading its SKILL.md path.
  Trigger: code review PR feedback quality check automated scans anti-pattern detection.
---

# Code Review

Review methodology, doctor selection, and how to aggregate findings. The rules themselves live in the
doctors — this skill states which doctor covers a scope and how its findings are classified.

Every doctor is a standalone `SKILL.md` holding explicit rules with a runnable command or a file path
to read. No shell scripts. Load one by reading its path, and they compose.

**Every rule names a command you can run.** A rule you cannot execute produces no finding while still
looking like a gate. If a command in a doctor fails or is wrong, that is a finding about the harness,
and it is fixed in the same change.

## Two passes

Every review runs two passes, because they answer different questions:

| Pass               | Question                                                                                                 | Findings from                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **TECH REVIEW**    | Is the code written well? Best practices, anti-patterns, code quality                                    | typecheck / typescript / react / style / i18n / backend / test doctors + feature and logic deep review |
| **PATTERN REVIEW** | Does the change fit the project? Follows the project's rules and patterns, fits the current architecture | boundary / architecture doctors + architecture and design + type contract deep review                  |

**Neither pass emits a verdict.** Each reports findings with a severity, and the review role turns the
two groups into the single `VERDICT: PASS` or `VERDICT: FAIL` the process reads. A doctor that produced
a verdict of its own would make two verdict producers.

Either pass can block independently. Well-written code that breaks the architecture is blocked by
Pattern Review. Code that fits the architecture but is full of anti-patterns is blocked by Tech
Review.

## Severity

| Severity      | Meaning                    | Action                              |
| ------------- | -------------------------- | ----------------------------------- |
| ❌ Blocking   | Must fix, blocks merge     | Fix required                        |
| ⚠️ Warning    | Should fix, does not block | Fix recommended; track as follow-up |
| 💡 Suggestion | Optional improvement       | Informational only                  |

**Security findings are always Blocking.** A missing auth guard, unvalidated input, an exposed secret,
or an injection vector is ❌ Blocking regardless of how contained it looks.

Severity is the severity of the finding, not the review's verdict. A single ❌ Blocking in either pass
is what makes the review lane emit `VERDICT: FAIL`.

## Scope → doctors

| Scope        | TECH Review                                                  | PATTERN Review         |
| ------------ | ------------------------------------------------------------ | ---------------------- |
| `frontend`   | typecheck, typescript, react, style, i18n, **test**          | boundary, architecture |
| `backend`    | typecheck, typescript, backend, **test**                     | boundary, architecture |
| `full-stack` | typecheck, typescript, react, style, i18n, backend, **test** | boundary, architecture |

`test-doctor` runs on every review, every scope, and is never skipped. `style-doctor` is the design
gate: for UI scopes it is the only check against the `@pawhaven/design-system` tokens, so a token
violation blocks the TECH pass. There is no separate Figma gate — Figma is not used in this project,
and the token CSS in `packages/design-system/src/tokens/` is the design authority.

## Deep review criteria

Beyond the doctor checks, review the change itself against these. Findings from the
typecheck/typescript/react/style/i18n/backend doctors belong to **TECH REVIEW**; findings from the
boundary/architecture doctors belong to **PATTERN REVIEW**.

- **Feature completeness** — against the original requirement
- **Data flow** — end to end
- **Edge cases** — empty/null/error states, i18n 3-locale sync, a11y
- **Adversarial pass** — try to break the change before confirming it
- **Test completeness and quality** — `test-doctor`'s four checks
- **Architecture and design** — module placement, package layering, dependency direction, component
  graduation, API consistency, design tokens, server-driven data, decision coverage
- **Type contracts** (full-stack only) — frontend/backend type consistency, API route matching

## Load doctors on demand

Read the `SKILL.md` of each doctor the scope needs. A narrow review reads only those.

Do not grant all nine doctors in an agent's frontmatter. Granting a skill loads its whole body up
front, before the scope is known, so a backend-only review would carry the React and styling rules it
will never apply. If a rule is loaded and not applied, the finding is that the rule is unclear, not
that it needs to be granted.

## Related

- Doctors: [typecheck](./typecheck-doctor/SKILL.md) · [typescript](./typescript-doctor/SKILL.md) · [react](./react-doctor/SKILL.md) · [style](./style-doctor/SKILL.md) · [boundary](./boundary-doctor/SKILL.md) · [i18n](./i18n-doctor/SKILL.md) · [backend](./backend-doctor/SKILL.md) · [test](./test-doctor/SKILL.md) (every review) · [architecture](./architecture-doctor/SKILL.md)
- Frontend rules these doctors check: [frontend-patterns](../frontend-patterns/SKILL.md)
- Current pre-existing findings: [docs/quality](../../../docs/quality/README.md)
