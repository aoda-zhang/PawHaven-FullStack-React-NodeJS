# PawHaven — Frontend Development Patterns

> **This document answers one question: what a change to this frontend must look like.**
> For what each unit owns and which way the dependencies run, read
> [Frontend Architecture](frontend-architecture.md) — §1 for the units, §2 for the direction. Every path
> below is a locator; the code at that path is the authority.

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

The app layer is `src/app/` in five segments. `init/` owns boot data — the bootstrap query, the
current-user query and the root loader. `layout/` renders what it is given and
fetches nothing: no `apiClient`, no query, no mutation. `providers/` composes the runtime, `router/`
holds the URL table and composes the routes, `store/` holds Redux.

A page slice is `pages/<slice>/`: `route.tsx` exports the routes, `index.tsx` is the page container,
and `api/`, `components/` and `tests/` sit beside them. A slice adds `types.ts`, `constants.ts` or
`utils/` only when it needs one. A slice with more than one route nests its containers in sub-folders;
`auth` holds `login/` and `register/`.

`components/` holds views. No `useQuery`, `useMutation` or Redux hook in a view — the owning hook lives
in the container above it, which is `index.tsx` or a component that is itself the container for its
children. Form-local `useState` and `react-hook-form` context reads are a view's own business.

1. Create `pages/<kebab-name>/` with `route.tsx` and `index.tsx`.
2. Add every URL to `app/router/routePaths.ts`; reference the constant, never a literal.
3. Export the route from `route.tsx`; the shell in `app/router/router.tsx` composes it.
4. Code-split with route-level `lazy:`; the page component is the lazy import.
5. Load route-critical data in the loader through `queryClient.ensureQueryData`, read it with
   `useLoaderData()` — not with a query hook.
6. Add the route to the authenticated parent only if it needs a session.

### 2.2 Requesting data

| File                  | Owns                      | Rule                                                                |
| --------------------- | ------------------------- | ------------------------------------------------------------------- |
| `<name>.api.ts`       | the raw request functions | the only place a page slice touches `apiClient`                     |
| `<name>.queries.ts`   | read hooks                | one per read; key factory decides cache identity                    |
| `<name>.queryKeys.ts` | the key factory           | no string literals outside it; private keys nest under the base key |
| `<name>.mutations.ts` | write hooks               | on success write the query or invalidate it — never leave both      |

- `apiClient` is reached from `*.api.ts` files and from `app/init/`. Nothing else imports it.
- The client unwraps the success envelope; a caller receives the payload, not the envelope.
- Errors arrive already normalized, carrying `traceId`. Display it on error surfaces.
- `frontend-core` normalizes a `401` to `httpRequestErrors.AUTH`. The portal decides what happens:
  `onAuthError` in `app/providers/QueryProvider.tsx` replaces the location, and `AuthenticatedLayout`
  in `pages/auth/route.tsx` renders a `<Navigate>` to the login page. Do not re-implement either.
- `download`/`postBlob` responses bypass the envelope; nothing to unwrap.
- A key belongs in `src/shared/constants/sharedQueryKeys.ts` only when something outside its owner must
  reach it — `sharedQueryKeys.rescueCases.all()`, because `report-animal` clears a slice it does not
  own. Every other key stays with its owner.
- Server state never enters Redux.

### 2.3 Form

1. The schema is the contract and lives in `packages/shared/types/`. Both sides validate with it.
2. `react-hook-form` + `@hookform/resolvers/zod`; the resolver takes the shared schema directly.
3. Compose fields from `@pawhaven/ui/form`; do not write a new input primitive for a one-off.
4. Submit through a mutation; keep the payload in the schema's shape, not a hand-built object.
5. Photo and file inputs convert to data URLs in the slice's `utils/`, never in a component.

### 2.4 Component

| Situation                                                                                                                | Home                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Used by one page slice                                                                                                   | that slice's `components/`                                                  |
| Pure presentation, needed by a second place                                                                              | `packages/ui`                                                               |
| Shell chrome and error surfaces — brand, language selector, image upload, not-found, system error, router error fallback | `packages/frontend-core/src/components/`                                    |
| Shared logic and hooks — date formatting, locale, storage, query defaults                                                | `packages/frontend-core/src/utils/` and `packages/frontend-core/src/hooks/` |
| Portal-only shared code                                                                                                  | `apps/frontend/portal/src/shared/`                                          |
| Environment config                                                                                                       | `src/config/`                                                               |

Before moving a component into a package, remove its app dependencies: pass resolved hook state and
literal values as props, and pass render slots (`footer?: ReactNode`). A package must never import from
`apps/`.

### 2.5 Token or style

1. A new raw value → `packages/design-system/src/tokens/`.
2. A new semantic role → `theme.css`, mapped onto a primitive.
3. A repeated component pattern → `utilities.css` as an `@utility`.
4. Consume it as a Tailwind semantic utility; merge conflicting classes with `cn()`, which
   `@pawhaven/ui` owns.
5. Class order is Prettier's job — do not hand-sort.

Forbidden everywhere: raw hex, a raw Tailwind palette name (`text-gray-500`), a CSS-variable bypass
(`bg-[var(--color-primary)]`), `px` inside an arbitrary value, and `style={{}}` for a static value.
`pnpm token-check` fails on all five.

### 2.6 Locale key

1. Add it to the slice's namespace file in **all three** languages in the same change —
   `en-US`, `zh-CN`, `de-DE`. A key present in one and missing in another is a defect.
2. Inside a file keys are `snake_case`; across files they are accessed as `camelCase`, so
   `rescueCases.json` holds the top-level key `rescue_cases`.
3. Store the **key** in constants and option arrays and translate at render. Never store a rendered
   translation — it makes the stored value depend on the submitter's locale.
4. Read it through `useTranslation`/`t()`; a slice does not import `@pawhaven/i18n` directly.
5. A new language is a new folder plus an entry in `supportedLngs.js`.

### 2.7 Test

- Vitest 4 + `@testing-library/react`; jsdom is already configured.
- Location: a page slice has exactly one `tests/` directory, directly under `pages/<slice>/`, and every
  test file sits flat inside it. No `api/tests/`, no nested directory. `*.test.ts(x)`.
- A component test asserts what a user can observe. A bug's reproduction must fail before the fix and
  pass after it, on the same surface.
- Do not restate the implementation in a test.

### 2.8 When the change belongs in a package

A change graduates out of a page slice when a second consumer needs it, or when it encodes a rule that
must hold for everyone. Before it moves: no app imports, its own tests, and its place in the dependency
direction ([Frontend Architecture](frontend-architecture.md) §2).

## 3. State access

- Typed Redux hooks only: `useReduxDispatch`, `useReduxSelector` from `@/app/store/reduxHooks`. Raw
  `useDispatch`/`useSelector` outside that file is a defect.
- `useGlobalState` from `@/app/store/globalReducer` is the per-slice convenience hook.
- `useGlobalContext` from `@/app/providers/GlobalProvider` is the only place the UI language and the
  signed-in user are read. Do not mirror either into Redux or a second context.
- `store.getState()` appears in loaders, never in a component.
- Query cache persistence is opt-in per query with `meta.persist = true`; the default keeps nothing on
  disk.
- Query cache persistence and Redux persistence are different systems — the whitelist in
  `persistReducers.ts` decides Redux, nothing decides Query.

## 4. Types

| Situation                   | Home                                     | Import                   |
| --------------------------- | ---------------------------------------- | ------------------------ |
| Used in more than one place | `packages/shared/types/<Name>.schema.ts` | `@pawhaven/shared/types` |
| Used by exactly one slice   | `pages/<slice>/types.ts`                 | relative                 |

- Zod is the source of truth; the TS type is `z.infer` of the schema. Read enum members off the schema
  instead of repeating the literal union.
- Banned: `any`, an `as` cast that silences an error, `!`, and the `enum` keyword.
- React 19: `forwardRef` is obsolete — a function component takes `ref` implicitly; declare
  `ref?: Ref<T>` in props.
- A type in `frontend-core` is app infrastructure, never a domain contract.

## 5. Boundaries while coding

- No page slice imports another page slice. When one seems necessary, it is either a shared component
  (§2.4) or a missing package export — decide which before writing the import.
- Every deviation is an explicit entry in the `A2` allowlist of `scripts/check-architecture.mjs` and a
  note in the affected slice's document. An unlisted deviation fails the gate.
- No package imports from `apps/`. No app imports from another app.

## 6. Hand off

| Check                  | Command                                    | Scope                                                                                                       |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Types                  | `pnpm --filter @pawhaven/portal typecheck` | the app and its imports                                                                                     |
| Lint and format        | `pnpm lint`                                | turbo across workspaces; the portal extends `@pawhaven/eslint-config/web` and has no lint script of its own |
| Tests                  | `pnpm --filter @pawhaven/portal test`      | the app; packages carry their own                                                                           |
| Styling                | `pnpm token-check`                         | hardcoded colours, bypasses, `style={{}}`                                                                   |
| Boundaries             | `pnpm architecture-check`                  | A1–A6                                                                                                       |
| Documentation links    | `pnpm check:links`                         | every relative link resolves                                                                                |
| Shared package changed | `pnpm build:libs`                          | downstream apps consume `dist`/`build`, not source — run it before portal typecheck or test                 |

Report what you checked and what you deliberately left alone. Name the command and its output for every
claim; a plausible summary is not a pass.

## 7. Related

- [Frontend Architecture](frontend-architecture.md) — what each unit owns, and which direction the
  dependencies run.
