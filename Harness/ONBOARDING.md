# Harness — System Onboarding

Orientation for any agent or session entering this repository. Read this first; load the rest on demand.

## What this folder is

`Harness` is the project's agent + skill operating system:

- **`agents/`** — role definitions (pawhaven, architect, frontend, backend, testing, code-review, knowledge-update). Each has a scope and escalation path.
- **`skills/`** — self-contained skill folders, each with a `SKILL.MD` (frontmatter `name`/`description`/`version`) plus optional `references/`.
- **`workflows/`** — end-to-end processes (feature-development, bug-fix, architecture-change).
- **`rules/`** — always-on repo context (architecture, security, testing, documentation, git).
- **`knowledge/`** — shared reference: glossary, communication protocol, ADRs, design spec.

## Load order (recommended)

1. **This file** — orientation.
2. **`knowledge/glossary.md`** — shared terminology so all agents agree on words.
3. **`knowledge/agent-communication-protocol.md`** — the structured output formats every agent uses to interoperate.
4. **`rules/`** — the always-on constraints for the current task.
5. **The relevant agent + skill** — only what the task needs (progressive disclosure).

## Skill contract (Anthropic Agent Skills model)

Every skill is a folder containing `SKILL.MD`:

- **Frontmatter** (`name`, `description`, `version`) — `description` is also the trigger: what it does AND when to use it.
- **Body** — purpose, core rules, examples.
- **`references/`** — bulky lookup material (best-practices, decision trees, forbidden patterns). Loaded on demand, not every time.

Skills cross-reference each other via a `## Related` section. Do not duplicate a sibling skill's content — link to it.

## Skill index

### Code review (`skills/code-review/`)

Entry point: `SKILL.MD` (orchestrator). Runs `figma-doctor` gate, then parallel doctors:
`typecheck-doctor` · `react-doctor` · `style-doctor` · `boundary-doctor` · `i18n-doctor` · `backend-doctor` · `architecture-doctor` (deep review).

### Frontend (`skills/frontend/`)

`react` · `styling` · `i18n` · `component` · `redux` · `react-query` · `react-hook-form`.
Each links to its `references/best-practices.md`.

## Golden rules

- Keep state local; server state → TanStack Query, client state → Redux, forms → React Hook Form.
- All styles via `@pawhaven/design-system` tokens — no hardcoded colors, no magic numbers.
- All user-visible text via `t()` in `zh-CN` / `en-US` / `de-DE`.
- Components graduate to a package only when 2+ features use them.
- Communicate in the structured formats from the communication protocol.
- Follow the glossary — one term, one meaning, across the whole system.
