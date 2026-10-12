# Context

Project-level context documents: how the system is put together and how it is built.

| Kind                               | Lives in                 |
| ---------------------------------- | ------------------------ |
| Architecture + development context | `context/` (this folder) |
| Per-feature as-built documentation | `docs/features/`         |
| Operational setup (run it locally) | `docs/development.md`    |

## What belongs here

1. **System architecture** — services, containers, data, gateway, security, deployment.
2. **Frontend architecture** — feature modules, packages, routing, state, tokens, i18n.
3. **Backend architecture** — bounded contexts, module boundaries, shared kernel.
4. **Frontend development patterns** — page/feature layout, styling gate, state access,
   data-fetch conventions, forms, i18n contract, testing.
5. **Backend development patterns** — module anatomy, validation flow, auth boundary,
   config discipline, testing.

Architecture docs answer _why something is shaped this way and where the boundary is_.
Development-pattern docs answer _how to write the next one_. Feature docs stay in
`docs/features/`, one per feature folder, written from the code after it lands.

## Rules

- **Read the code first, write these docs last.** When a doc and the code disagree, the
  code is right and the doc is what is out of date.
- No ADR records. When a decision changes the architecture, update the living document.
- A new key in a locale file ships in all three languages in the same change.
- Nothing here documents the design tokens in prose — the source is
  `packages/design-system/src/tokens/`, enforced by `pnpm token-check`.
