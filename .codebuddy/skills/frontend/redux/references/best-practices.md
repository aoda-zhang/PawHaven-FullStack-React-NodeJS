# redux — Best Practices

Companion to `SKILL.MD`. Load when configuring store / slices / thunks / selectors / persist.

## Golden rule

Redux is for client state only. Never store API response data (that's TanStack Query).

## Required patterns

- `configureStore` (never `createStore`); infer `RootState`/`AppDispatch` from the store.
- Typed hooks `useAppDispatch`/`useAppSelector` defined once; never raw `useDispatch`/`useSelector` in feature code.
- One slice per feature (feature-folder, not type-folder).
- `extraReducers` builder callback; handle `pending`/`fulfilled`/`rejected`.
- Async thunks use `rejectWithValue` (never `throw`); return serializable plain objects.
- Memoized selectors (`createSelector`) for derived/transformed data only.

## Immer

Write "mutable" syntax inside reducers; never manual spreads for nested state.

## Persist

- Use `whitelist` — persist only `user`/`preferences`. Never the whole root.
- Never persist `loading`/`error`/transient UI/derived data.
- Keep persisted state small (localStorage 5–10MB limit).
- Ignore only specific persist actions in `serializableCheck` — never disable globally.

## Anti-patterns

API data in Redux · monolithic slice · dispatch-in-effect sync · new-object selectors ·
mutating outside Immer · raw hooks · skipping `rejectWithValue` · global serializableCheck off.
