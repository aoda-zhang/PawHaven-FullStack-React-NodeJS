# redux — Patterns

Worked code for `SKILL.md`. Every rule stays in `SKILL.md`; this file is only
the code, so a model can read the rule inline and open this when it is creating
something new rather than adapting an existing file.

## Contents

| Section                                         | SKILL.md rule |
| ----------------------------------------------- | ------------- |
| [Store setup](#store-setup)                     | §2.1          |
| [Typed hooks](#typed-hooks)                     | §3            |
| [A feature slice](#a-feature-slice)             | §4.1          |
| [Immer mutation syntax](#immer-mutation-syntax) | §4.2          |
| [Thunk reducers](#thunk-reducers)               | §4.3          |
| [A thunk definition](#a-thunk-definition)       | §5            |
| [Memoized selectors](#memoized-selectors)       | §6.1          |
| [Redux Persist wiring](#redux-persist-wiring)   | §8            |

## Store setup

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

## Typed hooks

```typescript
// src/store/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

```typescript
// ✅ feature code
import { useAppDispatch, useAppSelector } from '@/store/hooks';
const dispatch = useAppDispatch();
const user = useAppSelector((state) => state.user.currentUser);
```

```typescript
// ❌ untyped — the dispatch accepts actions the store does not handle
import { useDispatch, useSelector } from 'react-redux';
const dispatch = useDispatch();
```

## A feature slice

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

## Immer mutation syntax

```typescript
// ✅ looks like mutation, safe under Immer
state.currentUser = action.payload;
state.items.push(newItem);
state.items[index].completed = true;
```

```typescript
// ❌ manual spread for nested state — Immer already produced this
return {
  ...state,
  items: state.items.map((item, i) =>
    i === index ? { ...item, completed: true } : item,
  ),
};
```

## Thunk reducers

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

## A thunk definition

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
  },
);
```

## Memoized selectors

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
      post.title.toLowerCase().includes(filter.toLowerCase()),
    );
  },
);

// Selector factory — when you need to pass arguments
export const selectPostsByAuthor = createSelector(
  [selectAllPosts, (_state: RootState, authorId: string) => authorId],
  (posts, authorId) => posts.filter((post) => post.authorId === authorId),
);
```

```typescript
const filteredPosts = useAppSelector(selectFilteredPosts);
const userPosts = useAppSelector((state) => selectPostsByAuthor(state, userId));
```

## Redux Persist wiring

```typescript
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'preferences'], // ONLY persist these reducers
};

const rootReducer = combineReducers({
  user: userReducer,
  preferences: prefsReducer,
  ui: uiReducer,
});
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
      },
    }),
});

export const persistor = persistStore(store);
```
