# Skills

The **how-to layer** for this project. Skills are composable, domain-specific playbooks that agents load on demand via the `skill` tool. Each skill is a standalone `SKILL.md` with explicit rules and tool invocations — no shell scripts, no prose-only guidance.

Skills are grouped by domain. Sub-skills (e.g. the review doctors) can be loaded individually or composed.

> A skill's **ID is its directory name**; the `name:` field in its frontmatter is only the display label. So `frontend/style/` is the skill `style`, even though its frontmatter reads `name: styling`.

## Frontend Skills (`./frontend/`)

Granted to `designer` and `fixer` while implementing UI work.

| Skill                                                  | Covers                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [react](./frontend/react/SKILL.md)                     | React development standards: component architecture, state decision tree, effects, performance, a11y, error boundaries.    |
| [component](./frontend/component/SKILL.md)             | Component design patterns & graduation rules: shared vs feature-private, APIs, composition, pure-component discipline.     |
| [style](./frontend/style/SKILL.md)                     | Styling standards & design system enforcement: design tokens, Tailwind semantic utilities, no hardcoded values, dark mode. |
| [i18n](./frontend/i18n/SKILL.md)                       | Enterprise i18n: `t()` for all user-facing copy, semantic keys, 3-locale sync, no hardcoded strings.                       |
| [react-query](./frontend/react-query/SKILL.md)         | TanStack Query v5: server state only, query key factory, mutations & optimistic updates, prefetching.                      |
| [redux](./frontend/redux/SKILL.md)                     | Redux Toolkit: client state only, typed hooks, slices & async thunks, memoized selectors, persistence.                     |
| [react-hook-form](./frontend/react-hook-form/SKILL.md) | React Hook Form + Zod: schema-first validation, `useForm` patterns, field arrays, submission flows.                        |

## Code Review Skills (`./code-review/`)

`code-review` is the two-pass review pipeline, reachable by the orchestrator. The individual doctors are granted to `oracle`.

| Skill                                                             | Pass    | Covers                                                                                                                   |
| ----------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| [code-review](./code-review/SKILL.md)                             | —       | Orchestrator: Step 1 load sub-skills → Step 2 execute → Step 3 aggregate → Steps 4–5 deep passes → Step 6 graded report. |
| [typecheck-doctor](./code-review/typecheck-doctor/SKILL.md)       | TECH    | TypeScript type check.                                                                                                   |
| [react-doctor](./code-review/react-doctor/SKILL.md)               | TECH    | React/Redux/Query/Form anti-patterns.                                                                                    |
| [style-doctor](./code-review/style-doctor/SKILL.md)               | GATE    | Styling & design-token compliance. The design gate for UI scopes — Figma is not used in this project.                    |
| [i18n-doctor](./code-review/i18n-doctor/SKILL.md)                 | TECH    | Hardcoded string detection.                                                                                              |
| [backend-doctor](./code-review/backend-doctor/SKILL.md)           | TECH    | Backend code quality.                                                                                                    |
| [test-doctor](./code-review/test-doctor/SKILL.md)                 | TECH    | Test completeness & quality (every review, every scope).                                                                 |
| [boundary-doctor](./code-review/boundary-doctor/SKILL.md)         | PATTERN | Import boundaries & package dependency direction.                                                                        |
| [architecture-doctor](./code-review/architecture-doctor/SKILL.md) | PATTERN | Project architecture & design rules.                                                                                     |

## Repo-wide Skills

Granted to `designer`, `fixer`, and `oracle` — every lane needs these, and they are what makes the
rest of this directory meaningful rather than generic.

| Skill                                             | Covers                                                                                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [project-rules](./project-rules/SKILL.md)         | The hard constraints that always hold. A router to 9 reference files — architecture, services, components, security, testing, docs, git, orchestration, harness validation. |
| [principles](./principles/SKILL.md)               | Six decision-forcing rules plus the self-audit duty to name the one that changed a decision. Sourced from the former `.codebuddy/principles/`.                              |
| [writing-standards](./writing-standards/SKILL.md) | How to write prose a human has to read: sentence rules, reply language, framing for the consumer and the maintainer, candor over sycophancy.                                |

## Backend & Verification Skills

Granted to `fixer` for implementation and to `oracle` for review. Every factual claim in these was
read out of the running codebase, and each carries a "Corrections to the old docs" section naming
what the retired `.codebuddy/agents/` files asserted that turned out to be false.

| Skill                                                 | Covers                                                                                                                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [backend-standards](./backend-standards/SKILL.md)     | The flat core-service module shape, the `@pawhaven/backend-core` export surface, MongoDB via `@InjectPrisma`, Zod at both edges, and the gateway-owned auth boundary.      |
| [testing-standards](./testing-standards/SKILL.md)     | Vitest everywhere (Jest is not installed), hand-built Prisma doubles, jsdom browser-API polyfills, the `unplugin-swc` requirement, and what the e2e harness really covers. |
| [architecture-design](./architecture-design/SKILL.md) | Where a feature belongs, API and database impact against the real service map, risk classification, and the decision record to hand back.                                  |

`backend-standards` and `testing-standards` carry full `references/` files with annotated real code.
`architecture-design` is a single file — it is a method, not a lookup table.

## Retired

`figma-doctor` is deleted. Figma is not used in this project — there is no Figma dependency, no
Figma config, and no `packages/design-system/figma/`. Its Tier-1 path (open the live Figma page via
Playwright) had nothing to open, and its Tier-2 fallback read a `docs/figma-design-spec.md` whose
declared canonical source did not exist. `style-doctor` already covers the surviving job: it is the
check against the `@pawhaven/design-system` tokens, and it is the design gate for UI scopes.

The token CSS headers still say "from Figma". That is provenance — where the values were originally
drawn — and it is accurate. It is not a claim that Figma is a live dependency.

A custom agent in `.opencode/agent/` **cannot be granted project skills**. Its skill list is the
global set only, regardless of what its own frontmatter or the plugin config says. If a custom agent
needs a rule, the rule goes in its own body, or the orchestrator pastes it into the dispatch prompt.

**Related**: [Architecture docs](../../docs/README.md) · [Project rules index](./project-rules/references/) · [Principles index](./principles/references/)
