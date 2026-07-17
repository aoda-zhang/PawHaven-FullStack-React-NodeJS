# react-hook-form — Best Practices

Companion to `SKILL.MD`. Load when building or auditing forms.

## Golden rules

- Zod schema is the single source of truth; infer types via `z.infer<typeof schema>` only.
- `useForm` always gets `resolver`, `defaultValues`, and explicit `mode`.
- Native inputs use `register` (uncontrolled, best perf); `Controller`/`useController` only for custom components.
- `<form noValidate>` — disable native validation so Zod is the only validator.

## Mode

- `onSubmit` / `onBlur` for most forms. Avoid `onChange` for large forms (re-validates every keystroke).

## formState

- Destructure `formState` properties before render (Proxy tracking breaks on conditional access).
- Depend on the whole `formState` object in `useEffect`, not individual fields.
- `watch('field')` scoped, never `watch()` (re-renders on every keystroke).

## Submission

- Disable submit + show loading during `isSubmitting`.
- `reset()` on success; map server errors to fields via `setError` (or `errors.root.serverError`).
- `setValue` only in handlers/`useEffect` — never in render.

## Field arrays

- `useFieldArray`; key on `field.id` (never array index); never mutate `fields` directly.

## Anti-patterns

`useState` per input · manual validation · dual TS types · `watch()` global · conditional formState ·
`Controller` on native inputs · index as key · missing `defaultValues` · `mode:'onChange'` large forms ·
missing `noValidate` · `setValue` in render.
