# PawHaven — Frontend Development Patterns

> **This document answers one question: what a change to this frontend must look like.**
> For where files live, read [Frontend Architecture](frontend-architecture.md) — §2.2 for directories, §8 for
> placement. This document contains no file map and repeats no architecture rule.

---

## 1. The shape of every change

1. **Narrow.** Touch only what the request needs. Exploring is free; extending the change is not.
2. **Semantics over comments.** Intent lives in names, types, and structure. Before writing a comment,
   ask whether well-named code says it better; if it does, do not write the comment. A comment earns its
   place only when the reason cannot be expressed in code, and then it states why, never what.
3. **One owner per fact.** A schema, a constant, a type, a token has exactly one home. Point at it; do
   not copy it.
4. **Gate-clean.** Every claim you make is checked by a command you can name and show output from.

## 2. Recipes

### 2.1 New page

1. Create `features/<kebab-name>/` with `route.tsx` and `<Name>.tsx`.
2. Add every URL to `routePaths.ts`; reference the constant, never a literal.
3. Export the route from `route.tsx`; the shell in `router/router.tsx` composes it.
4. Code-split with route-level `lazy:`; the page component is the lazy import.
5. Load route-critical data in the loader through `queryClient.ensureQueryData`, read it with
   `useLoaderData()` — not with a query hook.
6. Add the route to the authenticated parent only if it needs a session.

### 2.2 Requesting data

| File                  | Owns                      | Rule                                                           |
| --------------------- | ------------------------- | -------------------------------------------------------------- |
| `<name>.api.ts`       | the raw request functions | the **only** file in the app that touches `apiClient`          |
| `<name>.queries.ts`   | read hooks                | one per read; key factory decides cache identity               |
| `<name>.queryKeys.ts` | the key factory           | no string literals outside it; per-feature hierarchy           |
| `<name>.mutations.ts` | write hooks               | on success write the query or invalidate it — never leave both |

- The client unwraps the success envelope; a caller receives the payload, not the envelope.
- Errors arrive already normalized, carrying `traceId`. Display it on error surfaces.
- A `401` is handled globally by `frontend-core`, which redirects to login. Do not re-implement it.
- `Download`/`postBlob` responses bypass the envelope; nothing to unwrap.
- Server state never enters Redux.

### 2.3 Form

1. The schema is the contract and lives in `packages/shared/types/`. Both sides validate with it.
2. `react-hook-form` + `@hookform/resolvers/zod`; the resolver takes the shared schema directly.
3. Compose fields from `@pawhaven/ui/form`; do not write a new input primitive for a one-off.
4. Submit through a mutation; keep the payload in the schema's shape, not a hand-built object.
5. Photo and file inputs convert to data URLs in the feature's `utils/`, never in a component.

### 2.4 Component

| Situation                                         | Home                                                |
| ------------------------------------------------- | --------------------------------------------------- |
| Used by one feature                               | that feature's `components/`                        |
| Pure presentation, needed by a second feature     | `packages/ui`                                       |
| Business-common (guards, error surfaces, widgets) | `packages/frontend-core/src/components/`            |
| Shared logic, hooks, config                       | `packages/frontend-core/src/utils/` or `src/hooks/` |

Before moving a component into a package, remove its app dependencies: pass resolved hook state and
literal values as props, and pass render slots (`footer?: ReactNode`). A package must never import from
`apps/`.

### 2.5 Token or style

1. A new raw value → `packages/design-system/src/tokens/`.
2. A new semantic role → `theme.css`, mapped onto a primitive.
3. A repeated component pattern → `utilities.css` as an `@utility`.
4. Consume it as a Tailwind semantic utility; merge conflicting classes with `cn()`.
5. Class order is Prettier's job — do not hand-sort.

Forbidden everywhere: raw hex, a raw Tailwind palette name (`text-gray-500`), a CSS-variable bypass
(`bg-[var(--color-primary)]`), `px` inside an arbitrary value, and `style={{}}` for a static value.
`pnpm token-check` fails on all five.

### 2.6 Locale key

1. Add it to the feature's namespace file in **all three** languages in the same change —
   `en-US`, `zh-CN`, `de-DE`. A key present in one and missing in another is a defect.
2. Inside a file keys are `snake_case`; across files they are accessed as `camelCase`, so
   `rescueCases.json` holds the top-level key `rescue_cases`.
3. Store the **key** in constants and option arrays and translate at render. Never store a rendered
   translation — it makes the stored value depend on the submitter's locale.
4. Read it through `useTranslation`/`t()`; features do not import `@pawhaven/i18n` directly.
5. A new language is a new folder plus an entry in `supportedLngs.js`.

### 2.7 Test

- Vitest 4 + `@testing-library/react`; jsdom is already configured.
- Location: `tests/` beside the code, or `api/tests/` for API files. `*.test.ts(x)`.
- A component test asserts what a user can observe. A bug's reproduction must fail before the fix and
  pass after it, on the same surface.
- Do not restate the implementation in a test.

### 2.8 When the change belongs in a package

A change graduates out of a feature when a second consumer needs it, or when it encodes a rule that
must hold for everyone. Before it moves: no app imports, its own tests, and its place in the dependency
direction (`shared → design-system → ui → frontend-core`).

## 3. State access

- Typed Redux hooks only: `useReduxDispatch`, `useReduxSelector` from `@/hooks/reduxHooks`. Raw
  `useDispatch`/`useSelector` outside that file is a defect.
- `useGlobalState` from `@/store/globalReducer` is the per-slice convenience hook.
- `store.getState()` appears in loaders, never in a component.
- Query cache persistence is opt-in per query with `meta.persist = true`; the default keeps nothing on
  disk.
- Query cache persistence and Redux persistence are different systems — the whitelist in
  `persistReducers.ts` decides Redux, nothing decides Query.

## 4. Types

| Situation                   | Home                                     | Import                   |
| --------------------------- | ---------------------------------------- | ------------------------ |
| Used in more than one place | `packages/shared/types/<Name>.schema.ts` | `@pawhaven/shared/types` |
| Used by exactly one feature | `features/<feature>/types.ts`            | relative                 |

- Zod is the source of truth; the TS type is `z.infer` of the schema. Read enum members off the schema
  instead of repeating the literal union.
- Banned: `any`, an `as` cast that silences an error, `!`, and the `enum` keyword.
- React 19: `forwardRef` is obsolete — a function component takes `ref` implicitly; declare
  `ref?: Ref<T>` in props.
- A type in `frontend-core` is app infrastructure, never a domain contract.

## 5. Boundaries while coding

- No feature imports another feature. When one seems necessary, it is either a shared component
  (§2.4) or a missing package export — decide which before writing the import.
- Every deviation is an explicit entry in the `A2` allowlist of `scripts/check-architecture.mjs` and a
  note in the affected feature's document. An unlisted deviation fails the gate.
- No package imports from `apps/`. No app imports from another app.

## 6. Hand off

| Check                  | Command                                    | Scope                                                                                                       |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Types                  | `pnpm --filter @pawhaven/portal typecheck` | the app and its imports                                                                                     |
| Lint and format        | `pnpm lint`                                | turbo across workspaces; the portal extends `@pawhaven/eslint-config/web` and has no lint script of its own |
| Tests                  | `pnpm --filter @pawhaven/portal test`      | the app; packages carry their own                                                                           |
| Styling                | `pnpm token-check`                         | hardcoded colours, bypasses, `style={{}}`                                                                   |
| Boundaries             | `pnpm architecture-check`                  | A1–A5                                                                                                       |
| Documentation links    | `pnpm check:links`                         | every relative link resolves                                                                                |
| Shared package changed | `pnpm build:libs`                          | downstream apps consume `dist`/`build`, not source                                                          |

Report what you checked and what you deliberately left alone. Name the command and its output for every
claim; a plausible summary is not a pass.

## 7. Related

- [Frontend Architecture](frontend-architecture.md) — where files live, what owns them.
