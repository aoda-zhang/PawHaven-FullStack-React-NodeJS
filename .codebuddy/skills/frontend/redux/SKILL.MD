---
name: redux
description: >
  Redux Toolkit 客户端状态管理规范 / Redux Toolkit Enterprise Patterns.
  定义客户端全局状态管理全流程标准：Store 配置、类型化 Hooks（useAppDispatch/useAppSelector — 禁止裸 useDispatch/useSelector）、createSlice 切分与 extraReducers（builder 模式）、createAsyncThunk 异步操作、memoized 记忆化 Selectors、redux-persist 持久化配置、状态设计原则（只放客户端状态，不放服务端数据）。
  触发场景 / Trigger: Redux Redux Toolkit RTK global store state management predictable container, 全局状态 global state application-wide shared cross-component cross-feature, 客户端状态 client state UI state app state only client-side not server data, Store configureStore combineReducers middleware enhancer devTools preloadedState, createSlice name initialState reducers extraReducers builder addCase addMatcher addDefaultCase, createAsyncThunk async thunk action creator pending fulfilled rejected extraReducers, useAppDispatch useAppSelector typed hooks RootState AppDispatch never use bare useDispatch useSelector, 持久化 persist redux-persist persistReducer persistStore FLUSH PAUSE PERSIST PURGE REGISTER REHYDRATE, middleware redux-thunk redux-logger custom middleware enhancer applyMiddleware, 状态管理 state management reducer action dispatch selector getState subscribe, reducer pure function state transition immutable update switch case immer, action type payload action creator dispatch action object flux pattern, dispatch trigger action event fire emit send invoke redux devtools, selector memoized createSelector reselect memoization derived data computed, Immutable immer produce draft state mutable immutable update immutability, slice concept modular ducks pattern feature folder co-located slice, only client state principle never put server data in Redux use TanStack Query, type-safe store RootState AppDispatch typed useSelector typed useDispatch.
version: 1.0
---

# Purpose

This skill defines Redux Toolkit standards for the project. Redux manages **client-side application state** only — never server state (that's TanStack Query's job).

Apply this skill whenever working on:

- Store configuration (`configureStore`, middleware, devtools)
- Feature slices (`createSlice`, reducers, `extraReducers`)
- Async thunks (`createAsyncThunk`)
- Selectors (`createSelector`, memoized selectors)
- Redux Persist (whitelist, serialization)
- Typed hooks (`useAppDispatch`, `useAppSelector`)

---

# 1. When to Use Redux vs Other Solutions

| State Type | Solution | Rationale |
|-----------|----------|-----------|
| Component-local (form inputs, toggle) | `useState` / `useReducer` | No need to leave the component |
| Cross-component UI state (theme, locale) | React Context | Simple read-only sharing |
| **Global app state** (auth user, feature flags) | **Redux Toolkit** | Debuggable, predictable, middleware |
| **Server/API state** (user list, posts) | **TanStack Query** | Caching, refetching, optimistic updates — Redux is wrong here |

**Golden Rule: Redux is for client state only. Never store API response data in Redux.**

---

# 2. Store Configuration

## 2.1 Basic Setup

Always use `configureStore` — never manual `createStore`.

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';
import userReducer from './features/user/userSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 2.2 Middleware

`configureStore` automatically includes `redux-thunk` and devtools. Only add middleware when necessary:

```typescript
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      // Ignore redux-persist actions (they contain non-serializable values)
      ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
    },
  }),
```

❌ **Do NOT disable `serializableCheck` globally.** Only ignore specific action types that are known non-serializable.

---

# 3. Typed Hooks

Create typed wrappers once, use everywhere. **Never import raw `useDispatch`/`useSelector` in feature code.**

```typescript
// src/store/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

✅ **Good** — typed hooks everywhere:
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
const dispatch = useAppDispatch();
const user = useAppSelector((state) => state.user.currentUser);
```

❌ **Avoid** — raw hooks in feature code:
```typescript
import { useDispatch, useSelector } from 'react-redux'; // BAD
const dispatch = useDispatch(); // untyped
```

---

# 4. Slices (`createSlice`)

## 4.1 One Slice Per Feature

Organize by feature, not by type. Each slice file exports:
- The reducer (default or named)
- Action creators (destructured from `slice.actions`)
- Custom typed selector hooks (optional, for complex selectors)

```typescript
// src/store/features/user/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
```

## 4.2 Immer "Mutations"

Redux Toolkit uses Immer — write "mutable" syntax. Immer produces immutable updates.

✅ **Good**:
```typescript
state.currentUser = action.payload;   // looks like mutation, safe under Immer
state.items.push(newItem);
state.items[index].completed = true;
```

❌ **Avoid** — manual spread for nested state (unnecessary with Immer):
```typescript
return {
  ...state,
  items: state.items.map((item, i) =>
    i === index ? { ...item, completed: true } : item
  ),
};
```

## 4.3 `extraReducers` for Async Thunks

Use the builder callback pattern (not the object map):

```typescript
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchUser.fulfilled, (state, action) => {
      state.loading = false;
      state.currentUser = action.payload;
    })
    .addCase(fetchUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Unknown error';
    });
},
```

✅ Always handle all three cases: `pending`, `fulfilled`, `rejected`.

---

# 5. Async Thunks (`createAsyncThunk`)

Use `createAsyncThunk` for async side effects that need to update Redux state. Use TanStack Query for server data fetching.

```typescript
// src/store/features/auth/thunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.login(credentials);
      return response.data;
    } catch (error) {
      // Always use rejectWithValue for structured error handling
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
```

| Practice | ✅ Do | ❌ Don't |
|----------|------|---------|
| Naming | `'feature/actionName'` | `'FETCH_USER'` (old Redux style) |
| Error handling | `rejectWithValue(err)` | `throw err` |
| Return type | Plain serializable object | Class instances, functions |
| Server data | Use TanStack Query | `createAsyncThunk` for CRUD |

---

# 6. Selectors

## 6.1 Memoized Selectors (`createSelector`)

Always use `createSelector` for derived/transformed data — it prevents unnecessary recomputation:

```typescript
// src/store/features/posts/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../index';

const selectAllPosts = (state: RootState) => state.posts.items;
const selectSearchFilter = (state: RootState) => state.posts.searchFilter;

export const selectFilteredPosts = createSelector(
  [selectAllPosts, selectSearchFilter],
  (posts, filter) => {
    if (!filter) return posts;
    return posts.filter((post) =>
      post.title.toLowerCase().includes(filter.toLowerCase())
    );
  }
);

// Selector factory — when you need to pass arguments
export const selectPostsByAuthor = createSelector(
  [selectAllPosts, (_state: RootState, authorId: string) => authorId],
  (posts, authorId) => posts.filter((post) => post.authorId === authorId)
);
```

Usage:
```typescript
const filteredPosts = useAppSelector(selectFilteredPosts);
const userPosts = useAppSelector((state) => selectPostsByAuthor(state, userId));
```

## 6.2 Simple Accessors

For direct state access without transformation, inline selectors are fine:

```typescript
const currentUser = useAppSelector((state) => state.user.currentUser);
```

❌ **Do NOT create selectors per component** for trivial lookups. Use `createSelector` only when deriving/transforming data.

---

# 7. File Structure

Organize by feature, NOT by file type:

```
src/store/
├── index.ts                      # configureStore, RootState, AppDispatch
├── hooks.ts                      # useAppDispatch, useAppSelector
├── features/
│   ├── user/
│   │   ├── userSlice.ts          # slice + reducers + extraReducers
│   │   ├── selectors.ts          # memoized selectors
│   │   ├── thunks.ts             # createAsyncThunk definitions
│   │   └── types.ts              # feature-specific types
│   ├── auth/
│   │   ├── authSlice.ts
│   │   ├── selectors.ts
│   │   └── thunks.ts
│   └── ui/                       # cross-cutting UI state
│       └── uiSlice.ts
```

❌ **Avoid** — type-based grouping (anti-pattern from old Redux):
```
src/redux/actions/          # DON'T DO THIS
src/redux/reducers/
src/redux/types/
```

---

# 8. Redux Persist

## 8.1 What to Persist

| Persist | Don't Persist |
|---------|---------------|
| Auth token / user profile | Loading/error states |
| User preferences (theme, locale) | Transient UI state (modal open, toast) |
| Feature flags | Derived data |

## 8.2 Setup

```typescript
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'preferences'],  // ONLY persist these reducers
  // blacklist: ['ui'],                // alternative: exclude specific reducers
};

const rootReducer = combineReducers({ user: userReducer, preferences: prefsReducer, ui: uiReducer });
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);
```

## 8.3 Rules

1. **Always use `whitelist`** — persist only what you explicitly intend to persist. Never persist the entire root.
2. **Never persist `loading`/`error` states** — they should reset on page load.
3. **Keep persisted state small** — localStorage has a 5–10MB limit. Large data slows rehydration.
4. **Handle rehydration** — show a loading state until `persist/REHYDRATE` completes if your app depends on persisted state for initial render.

---

# 9. Common Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|-------------|---------------|-----|
| Storing API data in Redux | Duplicates TanStack Query cache; stale data risk | Use TanStack Query for server state |
| Large monolithic slice | Hard to maintain, unnecessary re-renders | Split into feature slices |
| Dispatching in `useEffect` to sync state | Causes cascading re-renders | Derive state via selectors |
| `useSelector` returning new objects | Causes re-render on every state change | Use memoized `createSelector` |
| Mutating state outside Immer | Breaks Redux devtools/time-travel | Always mutate inside `createSlice` reducers only |
| Raw `useDispatch`/`useSelector` | Un-typed, error-prone | Use typed `useAppDispatch`/`useAppSelector` |
| Skipping `rejectWithValue` in thunks | Error object is non-serializable | Always use `rejectWithValue(getErrorMessage(err))` |
| Disabling `serializableCheck` globally | Hides real serialization bugs | Only ignore specific persist action types |

---

# 10. Definition of Done

A Redux change is complete when:

- [ ] Store types (`RootState`, `AppDispatch`) are derived from `store.getState()` / `typeof store.dispatch`
- [ ] All hooks use `useAppDispatch` / `useAppSelector` (never raw imports)
- [ ] Each slice is in its own feature folder under `store/features/`
- [ ] `extraReducers` uses builder callback pattern, not object map
- [ ] Async thunks use `rejectWithValue` for error handling
- [ ] Memoized selectors used for derived/transformed data
- [ ] Redux Persist `whitelist` explicitly specifies persisted reducers
- [ ] No server/API data stored in Redux (use TanStack Query instead)
- [ ] No raw `useSelector` returning new object references without `createSelector`

## Related

- Best practices: [references/best-practices.md](references/best-practices.md)
- Server state (use TanStack Query instead): [react-query](../react-query/SKILL.MD)
- React core: [react](../react/SKILL.MD)
