---
name: react-hook-form
description: >-
  Form standards for React Hook Form + Zod in this project's React frontend:
  schema-first validation, z.infer type inference, useForm options, register
  versus Controller field rendering, formState subscription rules, useFieldArray,
  submission state, noValidate, and mapping server errors onto fields. Use when
  building or fixing a form, choosing a validation mode, wiring a custom input,
  adding or removing dynamic fields, or mapping API validation errors; React Hook
  Form, useForm, register, Controller, useFieldArray, zodResolver, 表单, 表单验证,
  动态表单, 表单提交. Not for server-side schemas shared over the wire
  (packages/shared and backend-standards own those). react-doctor scans for
  violations of this; this skill defines them.
---

# Purpose

React Hook Form owns **form state**: input values, validation, and submission, with
re-renders scoped to the field that changed. Zod owns the rules. The defect this
skill prevents is a second, hand-maintained copy of either — a hand-written type
beside the schema, or validation logic inside a component.

Apply it whenever a change touches:

- A form component, or the schema behind one
- Choosing `register` or `Controller` for a field
- Validation mode, error display, or submission state
- Dynamic field lists (`useFieldArray`)
- Mapping a server response onto form fields

---

# 1. Schema-First: Zod Is the Single Source of Truth

## 1.1 Write the schema first

The schema defines the form's shape, its rules, and — through inference — its
TypeScript type. Written first, it is reviewable on its own; written after the JSX,
it inherits whatever the markup happened to allow.

```typescript
import { z } from 'zod';

const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    age: z.number().min(18, 'Must be at least 18 years old').max(120),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // attach the error to a field
  });

type SignUpFormData = z.infer<typeof signUpSchema>;
```

Cross-field rules use `.refine()` or `.superRefine()` with a `path`, so the message
lands on the input the user has to fix rather than on the form. `z.literal(true)` is
how a checkbox asserts "must be accepted" — a `z.boolean()` accepts `false`.

The schema lives in `features/{Feature}/schemas/`, not inside the form component.
The layout, and the three things that separation buys, are in
[references/file-layout.md](references/file-layout.md).

## 1.2 File inputs

A `File` is not a string, so validate it as an instance and constrain it by size and
MIME type — the browser's `accept` attribute is a hint, not a check.

```typescript
const avatarSchema = z.object({
  avatar: z
    .instanceof(File, { message: 'Please select a file' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File must be under 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP are allowed',
    ),
});
```

An `<input type="file">` yields a `FileList`, so preprocess it to the single file
the schema describes:

```typescript
const profileSchema = z.object({
  avatar: z.preprocess(
    (val) => (val instanceof FileList && val.length > 0 ? val[0] : undefined),
    z.instanceof(File, { message: 'Avatar is required' }).optional(),
  ),
});
```

## 1.3 Infer the type, never declare it

```typescript
// The type comes from the schema
type FormData = z.infer<typeof mySchema>;

// A hand-written interface drifts from the schema on the first new field
interface FormData {
  email: string;
  password: string;
}
```

---

# 2. Wiring the Form

## 2.1 Three options are mandatory

- **`resolver`** — connects the schema. Without it the form validates nothing.
- **`defaultValues`** — without it the first input is uncontrolled, React warns on
  the switch to controlled, and `isDirty` has no baseline to compare against.
- **`mode`** — the library's default is `'onSubmit'`, which is rarely what a form
  with inline errors wants. Stating it makes the cost of each keystroke a decision.

## 2.2 The standard setup

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      age: 18,
      acceptTerms: false,
    },
    mode: 'onBlur',
  });
```

The options table, the mode mapping by form size, and the `reset` variants are in
[references/form-setup.md](references/form-setup.md).

## 2.3 Validation mode

Prefer `'onSubmit'` for short forms and `'onBlur'` for everything else. `'onChange'`
re-validates the whole form on every keystroke, so it belongs to a small form whose
point is instant feedback — a password strength meter — and nowhere else.

---

# 3. Rendering Fields

## 3.1 Native inputs: `register`

`register` hands the field to the DOM, so a keystroke re-renders the field's
sibling error message and nothing else. That is the whole performance argument for
uncontrolled fields, and it costs nothing to keep.

```tsx
<input
  {...register('email')}
  type="email"
  className={errors.email ? 'border-red-500' : ''}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>;
{
  errors.email && (
    <p id="email-error" className="text-sm text-red-500" role="alert">
      {errors.email.message}
    </p>
  );
}
```

## 3.2 Custom components: `Controller` or `useController`

A controlled component — a date picker, a rich text editor, a third-party widget —
keeps its value in its own state, so it needs the `field` object wired in by hand.
Wrapping a native `<input>` in `Controller` instead re-renders the form component on
every keystroke for no gain.

```tsx
import { Controller } from 'react-hook-form';

<Controller
  name="birthDate"
  control={control}
  render={({ field }) => (
    <DatePicker
      selected={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      name={field.name}
      ref={field.ref}
    />
  )}
/>;
```

`useController` is the same thing as a hook, for a custom input that is reused
across forms:

```tsx
import { useController, type Control, type Path } from 'react-hook-form';

function CustomDateInput({
  control,
  name,
}: {
  control: Control<FormData>;
  name: Path<FormData>;
}) {
  const { field } = useController({ name, control });
  return <DatePicker {...field} />;
}
```

---

# 4. Subscription Rules

`formState` is a Proxy that tracks which properties are read, and `watch`
subscribes to whatever it is given. How they are read decides whether an update
arrives at all, so this section governs subscriptions. Render performance beyond
this — memoization, list keys, code splitting — is the `react` skill's §7.

## 4.1 Destructure `formState` before render

```tsx
const { errors, isDirty, isValid } = formState; // subscribes to all three
return <button disabled={!isDirty || !isValid}>Submit</button>;
```

```tsx
// The proxy cannot see a property read behind a condition, so a later render
// may not register the subscription and the update is missed.
return (
  <button disabled={!formState.isDirty || !formState.isValid}>Submit</button>
);
```

## 4.2 `watch` vs `getValues`

| Method               | Behaviour                                | Use case                              |
| -------------------- | ---------------------------------------- | ------------------------------------- |
| `watch('field')`     | Subscribes to changes → re-renders       | Live preview, dependent fields        |
| `getValues('field')` | Reads the current value, no subscription | `onSubmit`, event handlers, callbacks |

```tsx
// Live preview
const password = watch('password');

// A read inside a handler costs no render
const onSubmit = (data: FormData) => {
  const currentEmail = getValues('email');
  submitToApi(data, currentEmail);
};

// Re-renders on every keystroke of every field
const allValues = watch();
```

## 4.3 Depend on the whole `formState` object

```tsx
// Correct — a new object identity when any part of formState changes
useEffect(() => {
  if (formState.errors.firstName) {
    focusField('firstName');
  }
}, [formState]);

// Wrong — a nested property's identity does not change when its contents do
useEffect(() => {
  if (formState.errors.firstName) {
    /* ... */
  }
}, [formState.errors.firstName]);
```

---

# 5. Dynamic Fields — `useFieldArray`

## 5.1 The pattern

```typescript
import { useFieldArray } from 'react-hook-form';

const schema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        quantity: z.number().min(1),
      }),
    )
    .min(1, 'At least one item is required'),
});

function ItemForm() {
  const { register, control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`items.${index}.name`)} />
          <input {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: '', quantity: 1 })}>
        Add Item
      </button>
    </div>
  );
}
```

The array itself is validated by the schema, so "at least one item" is a rule on
`items`, not a check in the click handler.

## 5.2 The rules

- Key on `field.id`, never the array index. React Hook Form generates a stable id
  per row; an index key reuses the DOM of a row that just moved, so the values end
  up on the wrong line.
- One `useFieldArray` per array — two hooks with the same `name` fight over the
  same rows.
- Change rows through `append` / `remove` / `insert` / `move` / `swap`, never by
  mutating `fields`, which is a snapshot of the last render.
- Batch where you can: several `append` calls in a row re-render once per call.

---

# 6. Submission

## 6.1 The standard pattern

```tsx
const onSubmit: SubmitHandler<FormData> = async (data) => {
  try {
    await mutation.mutateAsync(data);
    reset(); // clear the form on success
    toast.success(t('common.saved'));
  } catch (error) {
    setError('email', { message: 'This email is already taken' });
  }
};

return (
  <form onSubmit={handleSubmit(onSubmit)} noValidate>
    {/* ... fields, plus the submit control from §6.2 */}
  </form>
);
```

`noValidate` is not optional. Without it the browser runs its own validation and
shows its own messages, so a form can be blocked by a rule Zod does not have and by
one Zod does — with the user seeing only the browser's.

Reset on success, not on submit: a failed submit must leave the user's input alone.

## 6.2 Pending state

Disable the submit control and show progress for the whole await, so a slow network
cannot produce a second submit.

```tsx
<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Spinner className="mr-2" />
      {t('common.saving')}
    </>
  ) : (
    t('common.save')
  )}
</button>
```

---

# 7. Server Responses

## 7.1 Field errors

A server that validates knows which field failed. `setError` puts that message on
the field so it renders through the same path as a client-side error, instead of a
second banner that duplicates the form's error UI.

## 7.2 Form-level errors

An error that belongs to no field — a 500, a rate limit — goes to
`errors.root.serverError`, which the form renders once above the fields. Attaching
it to an arbitrary field teaches the user that field is the problem.

The `ValidationError` mapping and the root-error alert are in
[references/server-errors.md](references/server-errors.md).

---

# 8. Cascading Fields

## 8.1 Reset the dependent field

When one field's options invalidate another's value — a country change makes the
chosen city meaningless — reset the dependent value in an effect keyed on the
field you watch. Leaving it produces a submission the server rejects with a message
the user cannot act on.

## 8.2 Scope the subscription

`watch('country')` subscribes to one field. `watch()` subscribes to all of them and
re-renders the component on every keystroke, which is the form-wide version of the
per-keystroke validation in §2.3.

```tsx
const country = watch('country');

useEffect(() => {
  setValue('city', '');
}, [country, setValue]);
```

`setValue` runs in event handlers and effects. Calling it during render is a
render loop.

The full pattern is in [references/cascading-fields.md](references/cascading-fields.md).

---

# 9. Definition of Done

- [ ] The schema is the only definition of the shape and the rules; the type comes
      from `z.infer`
- [ ] The catalogue in [references/anti-patterns.md](references/anti-patterns.md)
      has been checked against the diff

---

# Related skills

| Domain                                           | Skill                            |
| ------------------------------------------------ | -------------------------------- |
| Server state: the mutation this form submits to  | `react-query` skill              |
| Component structure, effects, render performance | `react` skill                    |
| Error message text and locale parity             | `i18n` skill                     |
| Detecting form anti-patterns in code             | `code-review/react-doctor` skill |

## References

- [references/form-setup.md](references/form-setup.md) — the `useForm` setup with
  its options table, the form-size → `mode` mapping and what each mode costs, and the
  `reset` variants. Read it when wiring a new form or when a form validates at the
  wrong moment.
- [references/server-errors.md](references/server-errors.md) — mapping a
  `ValidationError` onto fields with `setError`, and the `root.serverError` alert.
  Read it when a form has to reflect a response the client could not have predicted.
- [references/cascading-fields.md](references/cascading-fields.md) — the dependent
  field pattern: scoped `watch`, resetting in an effect, and when `trigger` is the
  right tool instead. Read it when a field's value depends on another field's.
- [references/file-layout.md](references/file-layout.md) — where a feature's schema,
  form component, and mutation hook live, and why the schema is kept out of the
  component. Read it before creating a new form or a second form over the same
  fields.
- [references/anti-patterns.md](references/anti-patterns.md) — the catalogue: each
  anti-pattern, why it breaks, and the body section that holds the rule. Read it
  before reporting a form done, and when a form misbehaves in a way the code does not
  explain.
