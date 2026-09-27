---
name: redux
description: >-
  Redux Toolkit standards for this project: store configuration, typed
  useAppDispatch/useAppSelector hooks, feature-scoped createSlice with
  extraReducers, createAsyncThunk, memoized createSelector, and redux-persist
  configuration. Use when adding or changing client-side global state — the
  store, a feature slice, a thunk, a selector, persistence, configureStore,
  RootState, AppDispatch, 全局状态, 客户端状态, 状态管理, 持久化.
  Not for server or API state, which react-query owns, nor for component-local
  state (react). react-doctor scans for Redux anti-patterns; this skill defines the
  standard.
---

# Purpose

Redux holds **client-side application state only**: the authenticated user,
feature flags, UI preferences, wizard progress. It never holds API response
data — that is `react-query`'s job, and putting it in Redux is the single most
common way this codebase ends up with two caches that disagree.

Apply it whenever a change touches:

- Store configuration (`configureStore`, middleware, devtools)
- Feature slices (`createSlice`, reducers, `extraReducers`)
- Async thunks (`createAsyncThunk`)
- Selectors (`createSelector`, memoized selectors)
- Redux Persist (whitelist, serialization)
- Typed hooks (`useAppDispatch`, `useAppSelector`)

---

# 1. When to Use Redux vs Other Solutions

Redux earns its cost when several features read and write the same state, need a
predictable action log, or need middleware. Below that bar it is a subscription
and a devtools entry that no one asked for.

| State Type                                      | Solution                  | Rationale                                                     |
| ----------------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| Component-local (form inputs, toggle)           | `useState` / `useReducer` | No need to leave the component                                |
| Cross-component UI state (theme, locale)        | React Context             | Simple read-only sharing                                      |
| **Global app state** (auth user, feature flags) | **Redux Toolkit**         | Debuggable, predictable, middleware                           |
| **Server/API state** (user list, posts)         | **TanStack Query**        | Caching, refetching, optimistic updates — Redux is wrong here |

**Golden rule: Redux is for client state only. Never store API response data in
Redux.** A Redux copy has no refetch, no dedupe, and no staleness signal, so it
serves yesterday's list while `react-query` serves today's.

---

# 2. Store Configuration

## 2.1 One store, types inferred from it

`configureStore` wires the default middleware, the immutability check, and the
devtools extension that make Redux debuggable; hand-rolled `createStore` gives
up all three. Derive `RootState` and `AppDispatch` from the store rather than
writing them by hand, so they cannot drift when a reducer is added.

## 2.2 Narrow the serializability check, do not disable it

`configureStore` already includes `redux-thunk` and devtools. Add middleware only
when a need is real. `serializableCheck` is the guard that catches an accidental
`Date`, class instance, or function landing in state — turning it off globally
removes the only signal that would tell you it happened.

Ignore specific action types instead:

```typescript
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
    },
  }),
```

---

# 3. Typed Hooks

`useDispatch()` returns `Dispatch<UnknownAction>`, which accepts any action shape
and dispatches nothing the store understands; `useSelector(state => ...)` infers
`unknown` state. Both errors surface as a runtime no-op, so the typed wrappers
are what turn a wrong dispatch into a compile error.

Define them once, in the store module:

```typescript
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

Feature code imports only these. A raw `import { useDispatch } from
'react-redux'` anywhere outside the store module is the defect this rule exists
to prevent.

---

# 4. Slices (`createSlice`)

## 4.1 One slice per feature

Organize by feature, not by state type. A feature folder holds its slice, its
memoized selectors, and its thunks together, so a feature's state change is one
file's diff rather than a search across `actions/`, `reducers/`, and `types/`.

Each slice file exports the reducer, the action creators destructured from
`slice.actions`, and any feature-specific selector hooks.

## 4.2 Write Immer syntax, not manual spreads

Redux Toolkit runs reducers through Immer, so `state.x = y` produces an
immutable update. Hand-rolled spreads and `map` for nested updates duplicate what
Immer already does, and get deeper nesting wrong more often than not.

## 4.3 `extraReducers` uses the builder callback

The builder form is typed against the slice, so a typo in an action name is a
compile error; the legacy object map is not.

```typescript
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => { ... })
    .addCase(fetchUser.fulfilled, (state, action) => { ... })
    .addCase(fetchUser.rejected, (state, action) => { ... });
},
```

Always handle all three cases. A thunk with no `rejected` branch leaves `loading`
stuck true forever, which reads as a hung page.

---

# 5. Async Thunks (`createAsyncThunk`)

Use a thunk when an async side effect must update Redux state. For anything that
fetches data to display, `react-query` owns it instead.

| Practice       | ✅ Do                     | ❌ Don't                         |
| -------------- | ------------------------- | -------------------------------- |
| Naming         | `'feature/actionName'`    | `'FETCH_USER'` (old Redux style) |
| Error handling | `rejectWithValue(err)`    | `throw err`                      |
| Return type    | Plain serializable object | Class instances, functions       |
| Server data    | Use TanStack Query        | `createAsyncThunk` for CRUD      |

`throw err` rejects with a serialized message and loses the original object, so
the reducer ends up stringifying an error it cannot inspect. `rejectWithValue`
carries a structured, serializable payload into `action.payload`.

---

# 6. Selectors

## 6.1 Memoize anything derived

A selector that builds a new object or array re-renders every subscribed
component on every store change, because `useSelector` compares by reference and
the reference is always new. `createSelector` caches on the input selectors, so
the result is referentially stable until an input actually changes.

```typescript
export const selectFilteredPosts = createSelector(
  [selectAllPosts, selectSearchFilter],
  (posts, filter) => {
    /* ... */
  },
);
```

## 6.2 Inline selectors are fine for plain reads

Reading a field with no transformation needs no memoization, and a named selector
per field is noise:

```typescript
const currentUser = useAppSelector((state) => state.user.currentUser);
```

## 6.3 Never synchronize state with `useEffect`

Dispatching from an effect to mirror one slice into another produces a second
source of truth and a cascading re-render. Derive the second value in a selector
instead. The same applies to deriving component state from store state — see the
`react` skill §4.

---

# 7. File Structure

Feature folders, not type folders. The type-grouped layout is a pre-Redux-Toolkit
habit: it spreads one feature's state machine across four directories that must be
edited together.

```
src/store/
├── index.ts                      # configureStore, RootState, AppDispatch
├── hooks.ts                      # useAppDispatch, useAppSelector
├── features/
│   ├── user/                     # slice + selectors + thunks co-located
│   └── ui/                       # cross-cutting UI state
```

Avoid `src/redux/actions/`, `src/redux/reducers/`, `src/redux/types/`.

---

# 8. Redux Persist

## 8.1 What to Persist

| Persist                          | Don't Persist                          |
| -------------------------------- | -------------------------------------- |
| Auth token / user profile        | Loading/error states                   |
| User preferences (theme, locale) | Transient UI state (modal open, toast) |
| Feature flags                    | Derived data                           |

Persisted loading flags make the first paint after reload wait on a request that
has not started, and derived data is recomputed on rehydrate anyway — persisting
it only adds a way for the two copies to disagree.

## 8.2 Rules

1. **Always use `whitelist`.** Persist only the reducers you mean to persist.
   Persisting the root writes every transient slice to `localStorage` on each
   change.
2. **Never persist `loading`/`error` states.** They should reset on page load.
3. **Keep persisted state small.** `localStorage` caps around 5–10MB, and large
   payloads slow rehydration on every app start.
4. **Handle rehydration.** If the first render depends on persisted state, show a
   loading state until `persist/REHYDRATE` completes.

---

# 9. Related skills

| Domain                                  | Skill                            |
| --------------------------------------- | -------------------------------- |
| Server/API state (anything from an API) | `react-query` skill              |
| Component-local state, effects, render  | `react` skill                    |
| Detecting Redux anti-patterns in code   | `code-review/react-doctor` skill |

## References

- [references/patterns.md](references/patterns.md) — worked code for §2.1 store
  setup, §3 typed hooks, §4.1 a full feature slice, §4.3 thunk reducers, §5
  thunk definitions, §6.1 memoized selectors, and §8 redux-persist wiring. Read
  it when creating a new slice, thunk, selector, or store rather than adapting an
  existing one, so the file layout and export surface match.
