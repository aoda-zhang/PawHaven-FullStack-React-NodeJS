# Client state — Redux Toolkit

Client state only — cross-component and session-scoped. Server data belongs to TanStack Query. The
router that names when to read this is [frontend-patterns](../SKILL.md).

## Does it belong here?

Redux holds **client state only**. Walk the list and stop at the first that fits.

| State                               | Owner                         |
| ----------------------------------- | ----------------------------- |
| From the API, cacheable             | TanStack Query — not Redux    |
| Form input                          | React Hook Form — not Redux   |
| URL-visible, shareable              | `useSearchParams` — not Redux |
| Derived during render               | no state at all               |
| **Cross-component, session-scoped** | **Redux**                     |
| UI-local, one component             | `useState`                    |

Two or three values that change together → `useReducer` in the component, not a slice.

**Today the store holds one slice.** `store/globalReducer.ts` is the only `createSlice` in the
portal, and it carries `profile`, `locale`, and `isSysMaintain` — session identity and a maintenance
flag, nothing else. Before adding a second slice, check whether the value is genuinely
cross-component and session-scoped; a second slice is not a default.

## Structure

Slices live in `apps/frontend/portal/src/store/`, not in the feature that uses them, and are
registered centrally in `reducerRegister.ts`:

```ts
// store/reducerNames.ts — the key, and the persistence key
export const reducerNames = {
  root: 'root',
  global: 'global',
  rescue: 'rescue',
  bootstrap: 'bootstrap',
} as const;

// store/globalReducer.ts
export const globalReducer = createSlice({
  name: reducerNames.global,
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
  },
});

// store/reducerRegister.ts — the only place a reducer becomes part of the tree
export const combinedReducers = {
  [reducerNames.global]: globalReducer.reducer,
};
```

- A slice is not wired in until `reducerRegister.ts` lists it. A slice that is not registered is dead
  code that typechecks.
- `name` comes from `reducerNames`, never a string literal.
- `initialState` is typed from the slice's state interface. No `any` state.
- Actions are named for the event, not the setter: `setProfile` matches the one existing action — do
  not invent a second naming convention for a single slice.

`reducerNames` also carries `rescue` and `bootstrap`, and `persistReducers.ts` whitelists `rescue`,
but only `global` is registered today. Treat the unused keys as a naming pool, not as existing
state: check `reducerRegister.ts` before reading or writing `[reducerNames.rescue]`.

### Immer mutation syntax

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

### Redux Persist wiring

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

## Access

The three typed paths and their **real names** are in [State access](../../../../docs/frontend-portal.md#state-access--the-real-names)
of the portal facts document. Read them there; do not retype them, because this file once taught
hook names that do not exist.

What is specific to **deciding** whether a value belongs in Redux at all:

- Prefer the per-slice hook when one exists: it names the state space at the call site and keeps
  `reducerNames` out of features.
- Do not select an object literal inline; it returns a new reference every render. This repo uses no
  `reselect` and no `createAsyncThunk` — do not cite either as the established pattern.
- Write with `dispatch`. No direct state mutation, and no `store.getState()` in a component.

## Immutability

- Reducers are pure. No `Date.now()`, no `Math.random()`, no fetch, no side effect.
- Immer comes through the toolkit; never mutate `state` by hand.
- Async work lives in TanStack Query. It does not go in a reducer.

## Outside React

`store.getState()` is used in exactly two places, both loaders: `layout/api/rootLayout.loader.ts`
and `features/auth/route.tsx`. Both cast through `ReduxState`. It is not used in a component, and
`useEffect` in a component reading it would be a finding.

## Persistence

`persistReducers.ts` whitelists what survives a reload — today `global` (and `rescue`, which is not
registered). Persist only what a reload needs: session, locale, consent. Server data must never be
persisted; it goes stale silently.

`configureStore` sets `serializableCheck: false` because `redux-persist` needs it. That is a store
config decision, not permission to put non-serializable values in state.

## Banned

| Banned                                  | Use                                     |
| --------------------------------------- | --------------------------------------- |
| API data in a slice                     | TanStack Query                          |
| form values in a slice                  | React Hook Form                         |
| raw `useDispatch` / `useSelector`       | a typed hook — see the portal facts doc |
| inline object selector                  | a selector function over a scalar       |
| side effect in a reducer                | TanStack Query                          |
| `store.getState()` in a component       | a loader, or the typed hook             |
| string literal slice name               | `reducerNames`                          |
| a slice with no `reducerRegister` entry | dead code — register it or drop it      |

## Doctor

[react-doctor](../../code-review/react-doctor/SKILL.md) · S1 server data in a Redux slice ·
S2 raw `useDispatch` / `useSelector`
