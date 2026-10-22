# State in React

> This document covers **where each piece of state lives** and **which API touches it**. It is not a
> Redux tutorial or a TanStack Query tutorial — those live in their own docs. This is the decision
> map: when you add state, which bucket does it go in?

## The four buckets

| Bucket              | Tool                                              | Owns                                                                    | Survives refresh?    |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| **App context**     | `GlobalProvider` + `useGlobalContext()` (Context) | `locale`, `userInfo`, `isAuthenticated`, `isPending`, `login`, `logout` | Yes (`localStorage`) |
| **Global UI state** | Redux Toolkit + `redux-persist`                   | `isSysMaintain`                                                         | Yes (`localStorage`) |
| **Server state**    | TanStack Query (`useQuery`, `useMutation`)        | API data, bootstrap, rescue cases, reports                              | No (re-fetched)      |
| **Component state** | `useState` + `react-hook-form`                    | Form values, toggles, local loading                                     | No                   |

## App context: `GlobalProvider` / `useGlobalContext()`

The two app-wide facts — **the language the user picked** and **who is signed in** — live in one
context: `apps/frontend/portal/src/app/providers/GlobalProvider.tsx`, exposed as
`useGlobalContext()`:

```tsx
const {
  locale,
  setLocale,
  userInfo,
  isAuthenticated,
  isPending,
  login,
  logout,
} = useGlobalContext();
```

### What it owns

- `locale` — the active UI language, mirrored from `i18n.language`; `setLocale(lng)` delegates to
  `i18n.changeLanguage`, which is what persists the choice under `i18nextLng`
- `userInfo` — the identity hint `{ userId, expiresAt }`, seeded from `localStorage` when the
  provider mounts. It is not a credential and not the authority: it only says which id to paint the
  shell with until `/auth/me` answers. A hint past `expiresAt` — or one written by an older release
  without that field — is discarded on read by `app/providers/sessionHint.ts`
- `isAuthenticated` — derived: `!!userInfo`
- `isPending` — true while a login or logout call is in flight
- `login(credentials, callbacks?)` — `POST /auth/login`, writes the hint with
  `expiresAt = now + expires_in`, seeds `currentUser` in the query cache, invalidates and refetches
  `bootstrap`
- `logout(callbacks?)` — `POST /auth/logout`, clears the hint, removes the `bootstrap`,
  `rescueCases` and `home` query caches

The hint is also cleared by `QueryProvider`'s `onAuthError`, so a `401` from any request drops it
instead of leaving a signed-in shell behind. Only the id is stored — no email, no status, no token.

The register call stays a page-local mutation (`useRegister`); it does not establish a session.

### Why Context, not Redux

These facts are **broadly shared** (header, footer, every page), **low-frequency** (the language
changes when the user picks one, the user changes once per session), and **read consistently** by
unrelated components. Context reads are direct and re-render only the components that call
`useGlobalContext()`. Writing them into Redux added a dispatch, a selector and a persisted
serialisation layer for values that were read once and written once.

### Where it is mounted

`GlobalProvider` sits in `apps/frontend/portal/src/app/providers/AppProvider.tsx`, inside
`I18nProvider` (it mirrors `i18n.language`) and inside `QueryProvider` (login and logout are
mutations):

```tsx
export const AppProvider = ({ children }) => (
  <ErrorBoundary FallbackComponent={SystemErrorFallback}>
    <I18nProvider loadingFallback={<Loading />}>
      <StoreProvider>
        <QueryProvider>
          <GlobalProvider>
            {' '}
            ← locale + session
            <QueryErrorBoundary>{children}</QueryErrorBoundary>
          </GlobalProvider>
        </QueryProvider>
      </StoreProvider>
    </I18nProvider>
  </ErrorBoundary>
);
```

## Global UI state: Redux Toolkit + `redux-persist`

`apps/frontend/portal/src/app/store/` now holds a single flag:

- `global.isSysMaintain` — system-maintenance flag, read by `RootLayout`

Language and the signed-in user are **not** here; they are in the app context above. Redux remains
because the flag is read by the shell rather than by a page, and a second cross-cutting flag should
not need a new state tool.

Persistence is via `redux-persist` with a **whitelist**: only `global` is persisted, never the whole
tree:

```js
export const persistConfig = {
  key: reducerNames.root,
  storage, // localStorage
  whitelist: ['global'], // isSysMaintain only
};
```

### How to read / write

```tsx
// read
const { isSysMaintain } = useGlobalState();
```

### What does NOT go here

Server data, form values, page filters, and component toggles never touch Redux. If a piece of state
is read by fewer than three unrelated components, or changes more than once per session, it does not
belong in the global store.

## Server state: TanStack Query

`useQuery`, `useMutation`, `queryClient` — owned by `QueryProvider`
(`apps/frontend/portal/src/app/providers/QueryProvider.tsx`).

- **Queries**: current user, bootstrap data, rescue cases, home data, PDF guides
- **Mutations**: login, logout, register, create report, follow/unfollow animal
- **Error handling**: `MutationCache.onError` → `handleError` → `showErrorToast` with
  `errorMessage.<CODE>` i18n keys; `401` triggers `onAuthError` → redirect to login

Server state is **not** persisted across refreshes — it is re-fetched. The only cross-refresh state
is the app context (`locale`, `userInfo`) and the Redux-held `isSysMaintain` flag.

## Component state: `useState` + `react-hook-form`

- **Form values**: `react-hook-form` with Zod resolvers, owned by the form component
- **Toggles / modals / local loading**: `useState` inside the component that needs it
- **Page-specific filters**: URL search params (`useSearchParams`), not state

## What does not belong anywhere new

If you are tempted to add a fifth state tool (Zustand, Jotai, another Redux slice), stop. The four
buckets above cover every state need in this codebase. Adding a fifth tool means two ways to read the
same thing, and the next contributor will not know which one to use.

## Related documents

- `docs/context/frontend-development-patterns.md` — component rules, form patterns, mutation hooks
- `docs/how-i-build/eslint-config.md` — the lint rules that keep state-related code consistent
- `docs/how-i-build/i18n.md` — how language state (`locale`) is persisted and read
- `libs/eslint-config/web.js` — the React + TanStack Query ESLint rules
