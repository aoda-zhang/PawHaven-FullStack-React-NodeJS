# Skills

The **how-to layer** of the .codebuddy. Skills are composable, domain-specific playbooks that agents load on demand via `use_skill`. Each skill is a standalone `SKILL.MD` with explicit rules and tool invocations — no shell scripts, no prose-only guidance.

Skills are grouped by domain. Sub-skills (e.g. the review doctors) can be loaded individually or composed.

## Frontend Skills (`./frontend/`)

Loaded by the `frontend` agent while implementing UI work.

| Skill                                                  | Covers                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [react](./frontend/react/SKILL.MD)                     | React development standards: component architecture, state decision tree, effects, performance, a11y, error boundaries.    |
| [component](./frontend/component/SKILL.MD)             | Component design patterns & graduation rules: shared vs feature-private, APIs, composition, pure-component discipline.     |
| [style](./frontend/style/SKILL.MD)                     | Styling standards & design system enforcement: design tokens, Tailwind semantic utilities, no hardcoded values, dark mode. |
| [i18n](./frontend/i18n/SKILL.MD)                       | Enterprise i18n: `t()` for all user-facing copy, semantic keys, 3-locale sync, no hardcoded strings.                       |
| [react-query](./frontend/react-query/SKILL.MD)         | TanStack Query v5: server state only, query key factory, mutations & optimistic updates, infinite scroll.                  |
| [redux](./frontend/redux/SKILL.MD)                     | Redux Toolkit: client state only, typed hooks, slices & async thunks, memoized selectors, persistence.                     |
| [react-hook-form](./frontend/react-hook-form/SKILL.MD) | React Hook Form + Zod: schema-first validation, `useForm` patterns, field arrays, submission flows.                        |

## Code Review Skills (`./code-review/`)

Loaded by the `code-review` agent as a two-pass review.

| Skill                                                             | Pass    | Covers                                                                                           |
| ----------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| [code-review](./code-review/SKILL.MD)                             | —       | Orchestrator: Step 1 figma gate → Step 2 TECH pass → Step 3 PATTERN pass → Step 4 graded report. |
| [figma-doctor](./code-review/figma-doctor/SKILL.MD)               | GATE    | Design spec match against Figma (frontend, runs first).                                          |
| [typecheck-doctor](./code-review/typecheck-doctor/SKILL.MD)       | TECH    | TypeScript type check.                                                                           |
| [react-doctor](./code-review/react-doctor/SKILL.MD)               | TECH    | React/Redux/Query/Form anti-patterns.                                                            |
| [style-doctor](./code-review/style-doctor/SKILL.MD)               | TECH    | Styling & design token compliance.                                                               |
| [i18n-doctor](./code-review/i18n-doctor/SKILL.MD)                 | TECH    | Hardcoded string detection.                                                                      |
| [backend-doctor](./code-review/backend-doctor/SKILL.MD)           | TECH    | Backend code quality.                                                                            |
| [test-doctor](./code-review/test-doctor/SKILL.MD)                 | TECH    | Test completeness & quality (every review, every scope).                                         |
| [boundary-doctor](./code-review/boundary-doctor/SKILL.MD)         | PATTERN | Import boundaries & package dependency direction.                                                |
| [architecture-doctor](./code-review/architecture-doctor/SKILL.MD) | PATTERN | Project architecture & design rules.                                                             |

## Empty Directories

- `./backend/` — reserved for backend implementation skills (not yet authored).
- `./common/` — reserved for cross-stack shared skills (not yet authored).

**Related**: [Agents](../agents/README.md) · [Principles](../principles/README.md) · [Root README](../README.md)
