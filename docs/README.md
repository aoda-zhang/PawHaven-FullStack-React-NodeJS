# PawHaven Documentation Index

> Unified entry point for all project documentation.

`docs/` is split by what a document is **for**, so you can tell from the path whether it is
authority, intent, or background.

| Directory               | Holds                                                                       | Read it when                                           |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `context/`              | The living architecture and development-pattern docs                        | You are about to write the next piece of it            |
| `features/`             | One **portal feature**'s frontend **and** backend detail, as built          | After the change lands, to update the record from code |
| `product/`              | The product blueprint that `features/` cite                                 | You need the "why" behind a feature, or the roadmap    |
| `architecture-reviews/` | The record of an architecture audit, and what was still open when it closed | You are acting on a finding an audit produced          |

Design-system documentation lives with its owner package: the [package README](../packages/design-system/README.md) defines token usage and handoff rules, and the [visual token catalog](../packages/design-system/docs/design-token/index.html) provides a searchable reference. Token values remain in the package's `src/tokens/` and `src/theme.css`, enforced by `pnpm token-check`.

---

## `features/` describes the running system — and is written after the code

Each document in `features/` describes what exists. Where the product blueprint promised more, the
gap is stated in that document's **What Does Not Exist** section rather than being left for a reader
to discover. [`product/`](./product/product-strategy.md) holds the full ambition, and every feature
doc links back to the section it came from.

Each document is keyed on one folder in `apps/frontend/portal/src/features/*`, and chapter 1 numbers
that page's sections. A backend module with no feature folder of its own is documented as a section
of the page that consumes it.

**Read them after the code, not before.** A feature doc is accurate as of the last change that
reconciled it with the code, so it is a record to update rather than a source to design from. When one
disagrees with the code, the code is right and the document is the thing that is out of date.

One structural fact worth knowing before reading any of them: **`animalReports` is both the report
and the case.** There is no `rescue_cases` table and no event that creates one.

---

## 1. Context — the living architecture

The docs every change is measured against. Read the one that covers the area you are touching
before designing anything.

| File                                                                           | Covers                                                                                                           |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [system-architecture-overview.md](./context/system-architecture-overview.md)   | The hub. Service decomposition, C4 model, data architecture, API gateway, security, deployment, design decisions |
| [backend-architecture.md](./context/backend-architecture.md)                   | `core-service` modular monolith, bounded contexts as NestJS modules, inter-service communication                 |
| [frontend-architecture.md](./context/frontend-architecture.md)                 | Feature-based module structure, state, routing, tokens, i18n                                                     |
| [frontend-development-patterns.md](./context/frontend-development-patterns.md) | What a frontend change must look like                                                                            |
| [backend-development-patterns.md](./context/backend-development-patterns.md)   | What a backend change must look like                                                                             |
| [development.md](./context/development.md)                                     | Prerequisites, build order, dev servers and ports, pnpm scripts                                                  |
| [agent-constraints.md](./context/agent-constraints.md)                         | The rules every AI change must obey                                                                              |

`[AGENTS.md](../AGENTS.md)` leads to these — it is the file an agent reads without choosing it.

## 2. Features

One doc per **portal feature folder** (`apps/frontend/portal/src/features/*`), covering both sides
of that feature. Within a document, chapter 1 breaks the page into numbered sections (1.1, 1.2, 1.3 …)
and the later chapters cover the data path underneath.

A backend module with no feature folder of its own is documented as a section of the page that
consumes it — `adoption` inside [Home](./features/02-home.md#4-adoptable-pets-read-only),
`animal-follow` inside [Rescue Detail](./features/05-rescue-detail.md#14-follow).

| File                                                              | Portal feature              | Route                           |
| ----------------------------------------------------------------- | --------------------------- | ------------------------------- |
| [README.md](./features/README.md)                                 | Index, service map, defects | —                               |
| [01-auth.md](./features/01-auth.md)                               | `auth`                      | `/auth/login`, `/auth/register` |
| [02-home.md](./features/02-home.md)                               | `home`                      | `/`                             |
| [03-report-animal.md](./features/03-report-animal.md)             | `report-animal`             | `/report-animal`                |
| [04-rescue-cases.md](./features/04-rescue-cases.md)               | `rescue-cases`              | `/rescue-cases`                 |
| [05-rescue-detail.md](./features/05-rescue-detail.md)             | `rescue-detail`             | `/rescue/detail/:animalID`      |
| [06-rescue-guide.md](./features/06-rescue-guide.md)               | `rescue-guide`              | `/rescue/guides`                |
| [07-app-shell-bootstrap.md](./features/07-app-shell-bootstrap.md) | _(none — `layout/`)_        | wraps every route               |

Every document was verified against the code, and each records two kinds of absence: **What Does
Not Exist** for gaps in the design, and the index's _Known defects_ table for places where the
implementation contradicts its own contract — a required field that is never persisted, a timeline
that is a projection rather than history, a `NotFound` that 13 broken links all land on.

## 3. Product

| File                                                 | Covers                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| [product-strategy.md](./product/product-strategy.md) | Product blueprint — animal lifecycle, personas, feature map, MVP roadmap |

## 4. Architecture reviews

Each document is the record of one audit: what was found, what was changed, and what was left open.
They are records, not living docs — the living docs are in `context/`.

| File                                                                                        | Covers                                                                                              |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [02-feature-org.md](./architecture-reviews/02-feature-org.md)                               | Feature-organisation evidence note — partial, not a completed audit                                 |
| [03-server-state.md](./architecture-reviews/03-server-state.md)                             | Server-state inventory checklist — not yet filled in                                                |
| [04-ui-library.md](./architecture-reviews/04-ui-library.md)                                 | UI-library audit record — describes the `refactor/ui-library-audit` branch, not every state on main |
| [09-final-architecture-backlog.md](./architecture-reviews/09-final-architecture-backlog.md) | Final synthesis: scorecard, Top 20, P0–P3 backlog, 3-month roadmap, ADRs, top-10 issues             |

The remaining specialized reviews — `01-tech-selection`, `04-state-ownership`, and `05`–`08` — exist
only as unfilled checklists on their `review/*` branches and are not on `main`. The numbering differs
between `artec.md`, the branches, and this index; treat the file names as identifiers. The final
synthesis was rebuilt from the code and the feature records; §1.1 of the 09 record states exactly what
was available and what was not.

[`artec.md`](./artec.md) holds the prompt handbook those audits are run from.
[`how-i-build/`](./how-i-build/how-i-build-my-agent-team.md) holds the working notes on how the
agent team itself is put together.

## 5. Design system

The design-system source and its documentation live together in [`packages/design-system/`](../packages/design-system/README.md). Use the [design-system README](../packages/design-system/README.md) for token-layer and cross-package rules, and the [visual token catalog](../packages/design-system/docs/design-token/index.html) to browse the current token inventory. Token changes are enforced by `pnpm token-check`; use semantic utilities rather than raw colours or magic numbers.

## 6. Agent harness

The agent control layer lives in [`.opencode/`](../.opencode) — the agents, the slash-command
workflows, the skills and the model-filter plugins.

| Path                               | Covers                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| [agents/](../.opencode/agents)     | The roles a request is dispatched to                                                            |
| [commands/](../.opencode/commands) | The slash-command workflows (`feature`, `bug-fix`, `refactor`, …)                               |
| [skills/](../.opencode/skills)     | The task skills, including the [UI component catalog](../.opencode/skills/ui-component-catalog) |
| [plugins/](../.opencode/plugins)   | The model-filter and model-switch plugins                                                       |

## 7. Documentation standards

- **Read the code first, write the docs last.** Architecture docs and code are the input;
  `docs/features/` is the output, updated in the same change that invalidated them. A feature doc is
  never an input to a decision.
- **No ADR records.** When a decision changes the architecture, update the living docs under
  `docs/context/` directly.
- **Code comments explain why, not what.** Default to none; never comment self-evident code.
- **Permanent docs live in `docs/`** and ship in the same change as the code that invalidated them.
  Progress goes in replies — there is no temporary-notes file.
- **Every handoff classifies Doc Impact** as `none` / `update` / `create`; the main session routes
  doc edits to the lane that made the change.
- **Root READMEs (EN ↔ CN) stay in sync** and reference all knowledge files.

## 8. Repository quality

The repository's mechanical invariants are checked by `pnpm quality-check`
([`scripts/check-quality.mjs`](../scripts/check-quality.mjs)): orphaned docs, references to retired
resources, and duplicate-rule candidates, folding in `architecture-check` and the markdown link
check ([`scripts/check-docs-links.mjs`](../scripts/check-docs-links.mjs)).

## Suggested reading order

The architecture documents, then the code, then — after the change is verified — the feature
doc.

```
system-architecture-overview.md
  → frontend-architecture.md  | backend-architecture.md
    (+ frontend-development-patterns.md / backend-development-patterns.md when the change is in scope)
  → the code in apps/ and packages/
  → update docs/features/<feature>.md from what shipped
```

**Verify before you trust.** The context docs carry a `v3.11 / 2026-09-25` stamp and were checked
against the code at that time. A feature doc is as-built as of the last change that reconciled it.
