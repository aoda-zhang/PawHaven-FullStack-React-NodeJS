---
name: redux
description: >
  Redux Toolkit standards for the PawHaven portal. Client state only — cross-component and
  session-scoped. Server data belongs to TanStack Query. Typed hooks are the only access path.
  Use when deciding whether a value belongs in Redux at all, and when touching a slice.
  触发场景 / Trigger: redux store slice dispatch selector state global client 状态管理.
---

# Redux

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

## Structure

```ts
// store/reducerNames.ts
export const reducerNames = { global: 'global' } as const;

// features/<feature>/<feature>.slice.ts
export const globalSlice = createSlice({ name: reducerNames.global, initialState, reducers: { ... } });
```

- One slice per domain concern. Do not grow a single `appSlice` with everything.
- `name` comes from `reducerNames`, never a string literal.
- `initialState` is typed from the slice state interface. No `any` state.
- Actions are named for the event, not the setter: `profileLoaded`, not `setProfile`.

## Access

```tsx
const dispatch = useAppDispatch();
const userId = useAppSelector(selectUserId);
```

- `useAppDispatch` / `useAppSelector` from the store hooks module. Raw `useDispatch` /
  `useSelector` is a blocking finding — they lose the types.
- Read with a selector from `reselect` or a plain function. Do not select an object literal
  inline; it returns a new reference every render.
- Write with `dispatch`. No direct state mutation, no `store.getState()` in a component.

## Immutability

- Reducers are pure. No `Date.now()`, no `Math.random()`, no fetch, no side effect.
- Use `immer` through the toolkit, or a spread. Never mutate `state` by hand.
- Async work lives in `createAsyncThunk` or TanStack Query, never inside a reducer.

## Outside React

- `store.getState()` is allowed in a router loader or a non-React module.
  Cast through the exported `ReduxState` type. It is not allowed in a component.

## Persistence

- Persist only what a reload needs: session, locale, consent.
- Do not persist server data. It goes stale silently.

## Banned

| Banned                            | Use                                 |
| --------------------------------- | ----------------------------------- |
| API data in a slice               | TanStack Query                      |
| form values in a slice            | React Hook Form                     |
| raw `useDispatch` / `useSelector` | `useAppDispatch` / `useAppSelector` |
| inline object selector            | a memoized selector                 |
| side effect in a reducer          | thunk or Query                      |
| `store.getState()` in a component | `useAppSelector`                    |
| string literal slice name         | `reducerNames`                      |

## Doctor

[react-doctor](../../../review/skills/react-doctor/SKILL.md) · S1 server data in a Redux slice ·
S2 raw `useDispatch` / `useSelector`
