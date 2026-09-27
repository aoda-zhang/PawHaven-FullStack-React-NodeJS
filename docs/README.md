# PawHaven Documentation Index

> Unified entry point for all project documentation.

`docs/` is split by what a document is **for**, so you can tell from the path whether it is
authority, intent, or background.

| Directory       | Holds                                                                       | Read it when                                             |
| --------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| `architecture/` | A technical point, or the design of a specific problem, **in this project** | You are about to design or change something in that area |
| `features/`     | One **portal feature**'s frontend **and** backend detail                    | You are building or changing that feature                |
| `product/`      | The product blueprint that `features/` cite                                 | You need the "why" behind a feature, or the roadmap      |

Design tokens are deliberately **not** documented here. They live in
[`packages/design-system/src/tokens/`](../packages/design-system/src/tokens) and are enforced by
`pnpm token-check`. Read the token source; do not read a prose copy of it.

---

## `features/` describes the running system

Each document in `features/` describes what exists. Where the product blueprint promised more, the
gap is stated in that document's **What Does Not Exist** section rather than being left for a reader
to discover. [`product/`](./product/PawHaven-Product-Strategy-EN.md) holds the full ambition, and
every feature doc links back to the section it came from.

Each document is keyed on one folder in `apps/frontend/portal/src/features/*`, and chapter 1 numbers
that page's sections. A backend module with no feature folder of its own is documented as a section
of the page that consumes it.

One structural fact worth knowing before reading any of them: **`animalReports` is both the report
and the case.** There is no `rescue_cases` table and no event that creates one.

---

## 1. Architecture

A technical point or a problem's design in this project. These are the docs to read before
designing anything.

| File                                                                                                | Covers                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [PawHaven-System-Architecture-Overview.md](./architecture/PawHaven-System-Architecture-Overview.md) | The hub. Service decomposition, C4 model, data architecture, API gateway, security, deployment, design decisions            |
| [PawHaven-Backend-Architecture.md](./architecture/PawHaven-Backend-Architecture.md)                 | `core-service` modular monolith, bounded contexts as NestJS modules, inter-service communication                            |
| [PawHaven-Frontend-Architecture.md](./architecture/PawHaven-Frontend-Architecture.md)               | Feature-based module structure, state, routing, tokens, i18n                                                                |
| [authentication-architecture.md](./architecture/authentication-architecture.md)                     | **The auth trust model.** Gateway-owned browser cookies, the internal ES256 JWT, downstream verification, the `roles` claim |
| [route_authentication.md](./architecture/route_authentication.md)                                   | Frontend route guards — the authenticated parent route, `requireUser`, `/auth/me` priming                                   |
| [PawHaven-PDF-Generation.md](./architecture/PawHaven-PDF-Generation.md)                             | Why PDFs render through React + Puppeteer instead of a template library, and the constraints that bite                      |
| [PawHaven-System-Architecture.md](./architecture/PawHaven-System-Architecture.md)                   | Legacy redirect map from the pre-split document to the three above. No content of its own.                                  |

`authentication-architecture.md` and `route_authentication.md` are the pair to read before touching
anything auth-related — one covers the server trust boundary, the other the client route guard.

## 2. Features

One doc per **portal feature folder** (`apps/frontend/portal/src/features/*`), covering both sides
of that feature. Within a document, chapter 1 breaks the page into numbered sections (1.1, 1.2,
1.3 …) and the later chapters cover the data path underneath.

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

| File                                                                         | Covers                                                                        |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [PawHaven-Product-Strategy-EN.md](./product/PawHaven-Product-Strategy-EN.md) | Product blueprint v2.0 — animal lifecycle, personas, feature map, MVP roadmap |

## 4. Design system — source, not documentation

| Path                                                                           | Type | Description                        |
| ------------------------------------------------------------------------------ | ---- | ---------------------------------- |
| [src/tokens/](../packages/design-system/src/tokens)                            | CSS  | 12 design-token CSS variable files |
| [src/theme.css](../packages/design-system/src/theme.css)                       | CSS  | Global theme definitions           |
| [src/utilities.css](../packages/design-system/src/utilities.css)               | CSS  | Utility classes                    |
| [scripts/build-tokens.mjs](../packages/design-system/scripts/build-tokens.mjs) | JS   | Token build script                 |

Enforced by `pnpm token-check`. The project uses Tailwind semantic utilities over these tokens; do
not introduce raw colour values or magic numbers.

## 5. Development

Operational docs for running the thing locally. Not design material — this is the setup reference.

| File                                     | Covers                                                          |
| ---------------------------------------- | --------------------------------------------------------------- |
| [development.md](./development.md)       | Prerequisites, build order, dev servers and ports, pnpm scripts |
| [development.cn.md](./development.cn.md) | The same guide in Chinese; kept in sync with the English file   |

## 6. Agent harness

The agent control layer lives in `.opencode/`, not here.

| Path                                                                              | Covers                                              |
| --------------------------------------------------------------------------------- | --------------------------------------------------- |
| [skills/README.md](../.opencode/skills/README.md)                                 | Index of all 22 skills                              |
| [orchestrator_append.md](../.opencode/oh-my-opencode-slim/orchestrator_append.md) | Complexity classification, dispatch lanes, autonomy |
| [command/](../.opencode/command)                                                  | Slash-command workflows                             |

Engineering standards are the `project-rules` skill; see
[skills/README.md](../.opencode/skills/README.md).

---

## Suggested reading order

Product blueprint → `architecture/PawHaven-System-Architecture-Overview.md` → the specific
architecture doc for your area → the `features/` doc for what you are building.

**Verify before you trust.** The architecture docs carry a `v3.11 / 2026-09-25` stamp and were
checked against the code at that time. The `features/` docs were not, and diverge from it as
described above.
