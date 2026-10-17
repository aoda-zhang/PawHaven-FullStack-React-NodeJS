# Frontend Architecture

> **Scope.** What each unit owns, and which direction the dependencies run. Every path is a locator;
> the code at that path is the authority. When they disagree, the code is right and this document is
> stale.
> For what a change must look like, read [Frontend Development Patterns](frontend-development-patterns.md).

## 1. Summary

Two apps (one of them planned), five packages.

| Unit                      | Path                     | What it is for                                                                                                                                                                     |
| ------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pawhaven/portal`        | `apps/frontend/portal`   | The public site. Every user-facing feature — animal reports, guides, rescue cases — lives here.                                                                                    |
| `@pawhaven/admin`         | `apps/frontend/admin`    | The backoffice for this site. **Not started yet.**                                                                                                                                 |
| `@pawhaven/shared`        | `packages/shared`        | What both front and back end must agree on — Zod schemas, constants, pure utilities. It carries no UI code and no back-end code.                                                   |
| `@pawhaven/design-system` | `packages/design-system` | The visual source of truth. It holds no components — only the tokens, theme and utility classes every component and page builds its styling from.                                  |
| `@pawhaven/i18n`          | `packages/i18n`          | Where every string is maintained — on every component and page, plus the PDF templates and email content in the back end's `document-service`. Nothing renders a hardcoded string. |
| `@pawhaven/ui`            | `packages/ui`            | Pure components, no business logic. Where a component is used by more than one front-end place, this is where it lives.                                                            |
| `@pawhaven/frontend-core` | `packages/frontend-core` | The shared front-end layer: whatever more than one front-end place needs — the API client, error handling, storage, and the components that carry business meaning.                |

## 2. Dependencies

```
  packages/shared                packages/design-system
          │                                 │
          ▼                                 ▼
   packages/i18n          packages/ui
          │                        │
          └──────────┬─────────────┘
                     ▼
          packages/frontend-core
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
  apps/frontend/portal  apps/frontend/admin
```

`admin` is drawn at the same level as `portal` because it is the same kind of thing: an app that
consumes the packages below it and imports no other app.

`frontend-core` draws on all four packages above it; the apps draw on all five.

- `design-system` provides the styling for the whole system. Every front-end place draws on it —
  `portal`, `admin`, the shared components in `frontend-core`, and `ui`.
- `shared` is the only layer both front and back end read, so it carries neither. It depends on nothing
  in the workspace, and nothing may depend on it except `i18n`, `frontend-core` and the apps.
- `i18n` is read by `portal`, and by `frontend-core` where it turns error codes into messages.
- `ui` holds the pure components. `portal` picks from it, and `frontend-core` builds its own shared
  components on it.
- `frontend-core` is the shared front-end layer. `portal` reads it everywhere — the API client, the
  store setup, the router, the shell — and no package below it does.
- `portal` and `admin` are the only apps, and neither imports the other.

## 3. Related

- [Frontend Development Patterns](frontend-development-patterns.md) — what a change must look like.
- [Backend Architecture](backend-architecture.md) — the other half of the contract.
