---
name: react-hook-form
description: >
  React Hook Form + Zod 表单规范 / React Hook Form + Zod Enterprise Patterns.
  定义表单开发全流程标准：Schema-First 验证（Zod schema 作为唯一真源）、z.infer 类型推导、useForm 配置（mode/resolver/defaultValues）、register（非受控）vs Controller（受控自定义组件）、useFieldArray 动态表单、表单提交流程与 isSubmitting 状态、性能优化（避免不必要的重渲染）、noValidate 禁用浏览器默认验证、错误信息展示。
  触发场景 / Trigger: 表单 form input field textbox textarea select dropdown checkbox radio switch slider, React Hook Form useForm register handleSubmit watch reset setValue getValues formState, Zod schema validation infer type safe z.object z.string z.number z.enum z.array refinement superRefine, 表单验证 form validation required min max minLength maxLength pattern regex custom validate, schema validation schema-first Zod resolver single source of truth type inference, useForm mode onChange onBlur onSubmit onTouched all defaultValues resolver reValidateMode, register uncontrolled input name ref onChange onBlur defaultValue, Controller controlled component custom input render field fieldState formState, useFieldArray dynamic form fields add remove append prepend swap move insert replace, 表单提交 form submission handleSubmit onSubmit isSubmitting isDirty isValid, 表单错误 form errors fieldState error message type types message, 非受控组件 uncontrolled component performance less re-render native input, 类型安全 type-safe form TypeScript z.infer typeof FormValues, noValidate disable browser native HTML5 validation custom validation, dirtyFields touchedFields reset dirty isDirty isValidating, formProvider useFormContext nested complex form wizard multi-step, conditional fields watch trigger validation dynamic schema refinement, multi-step form stepper wizard progress form steps sequential wizard.
version: 1.0
---

# Purpose

This skill defines React Hook Form + Zod standards for the project. React Hook Form manages **form state** — input values, validation, submission — with minimal re-renders. Zod provides type-safe schema validation.

Apply this skill whenever working on:

- Forms of any complexity (login, profile, multi-step, filters)
- Dynamic field arrays (add/remove items)
- Form validation (client-side + type inference)
- File upload forms
- Dependent/cascading fields

---

# 1. Schema-First Design — Zod

## 1.1 Always Define a Zod Schema First

The Zod schema is the **single source of truth** for form shape, validation rules, and TypeScript types.

```typescript
import { z } from 'zod';

const signUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
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
    path: ['confirmPassword'], // attach error to confirmPassword field
  });

// Infer TypeScript type from the schema — never define it manually
type SignUpFormData = z.infer<typeof signUpSchema>;
```

✅ Use `.refine()` / `.superRefine()` for cross-field validation. ✅ Attach errors to specific fields via `path`. ✅ Use `z.literal(true)` for checkboxes.

## 1.2 File Validation

```typescript
const avatarSchema = z.object({
  avatar: z
    .instanceof(File, { message: 'Please select a file' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File must be under 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP are allowed'
    ),
});
```

For `<input type="file">`, preprocess the `FileList`:

```typescript
const profileSchema = z.object({
  avatar: z
    .preprocess(
      (val) => (val instanceof FileList && val.length > 0 ? val[0] : undefined),
      z.instanceof(File, { message: 'Avatar is required' }).optional()
    ),
});
```

## 1.3 Type Inference — Never Duplicate Types

```typescript
// ✅ Good: type is inferred from schema
type FormData = z.infer<typeof mySchema>;

// ❌ Bad: manually defined type that can drift from schema
interface FormData {
  email: string;
  password: string;
}
```

---

# 2. `useForm` Setup

## 2.1 Standard Setup

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
    mode: 'onBlur',  // validate on blur (or 'onSubmit' / 'onChange')
  });
```

## 2.2 Validation Mode Decision

| `mode` | When to Use |
|--------|-------------|
| `'onSubmit'` | Short forms (login, search). Best performance — validates only on submit. |
| `'onBlur'` | Medium forms. Validates when user leaves a field — good balance of feedback and performance. |
| `'onChange'` | Only for small forms where instant feedback is critical (password strength meter). Most expensive. |

✅ Prefer `'onSubmit'` or `'onBlur'`. ❌ Avoid `'onChange'` for large forms — every keystroke triggers full re-validation.

## 2.3 Required Props

Always provide these for type safety and predictable behavior:

| Prop | Mandatory | Why |
|------|-----------|-----|
| `resolver` | ✅ | Connects Zod schema to form validation |
| `defaultValues` | ✅ | Prevents uncontrolled→controlled warnings; enables `isDirty` |
| `mode` | ✅ | Explicit validation strategy (default is `'onSubmit'`) |

---

# 3. Rendering Fields

## 3.1 Uncontrolled with `register` — Preferred

Use `register` for native HTML inputs. This is the **highest-performance pattern** — no re-renders on every keystroke.

```tsx
<input
  {...register('email')}
  type="email"
  className={errors.email ? 'border-red-500' : ''}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" className="text-red-500 text-sm" role="alert">
    {errors.email.message}
  </p>
)}
```

## 3.2 Controlled with `useController` / `<Controller>` — For Custom Components

Use only when integrating with custom UI components (e.g., date pickers, rich text editors, third-party component libraries) that don't expose a `ref`.

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
/>
```

```tsx
// Alternative hook form:
import { useController } from 'react-hook-form';

function CustomDateInput({ control, name }: { control: Control<FormData>; name: Path<FormData> }) {
  const { field } = useController({ name, control });
  return <DatePicker {...field} />;
}
```

| Pattern | When | Performance |
|---------|------|-------------|
| `register()` | Native HTML inputs | ✅ Best — field-level re-renders only |
| `<Controller>` / `useController` | Custom components without ref forwarding | ⚠️ Moderate — component-level re-renders |

---

# 4. Performance: `formState` Subscription Rules

`formState` uses a **Proxy** to only subscribe to properties you access. The way you access properties matters.

## 4.1 ✅ Destructure Before Render

```tsx
const { errors, isDirty, isValid } = formState;  // subscribes to all three
return <button disabled={!isDirty || !isValid}>Submit</button>;
```

## 4.2 ❌ Do NOT Access Conditionally

```tsx
// ❌ Proxy cannot track conditional access — isDirty subscription may miss updates
return <button disabled={!formState.isDirty || !formState.isValid}>Submit</button>;
```

## 4.3 `watch` vs `getValues`

| Method | Behavior | Use Case |
|--------|----------|----------|
| `watch('field')` | Subscribes to changes → triggers re-render | Live preview, dependent fields |
| `getValues('field')` | Reads current value, no subscription | `onSubmit`, event handlers, callbacks |

```tsx
// ✅ watch for live preview
const password = watch('password');

// ✅ getValues inside onSubmit
const onSubmit = (data: FormData) => {
  const currentValue = getValues('email');  // no re-render
  submitToApi(data);
};

// ❌ Don't watch all fields — causes re-render on every keystroke
const allValues = watch();  // BAD for large forms
```

## 4.4 `useEffect` with `formState`

Always depend on the **entire `formState` object**, not individual properties:

```tsx
// ✅ Correct
useEffect(() => {
  if (formState.errors.firstName) {
    focusField('firstName');
  }
}, [formState]);

// ❌ Wrong — won't re-trigger on error change
useEffect(() => {
  if (formState.errors.firstName) { /* ... */ }
}, [formState.errors.firstName]);
```

---

# 5. Field Arrays — `useFieldArray`

Use `useFieldArray` for dynamic lists of fields (e.g., adding/removing phone numbers, team members, ingredients).

```typescript
import { useFieldArray } from 'react-hook-form';

const schema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      quantity: z.number().min(1),
    })
  ).min(1, 'At least one item is required'),
});

function ItemForm() {
  const { register, control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>  {/* ✅ Use field.id as key, NOT index */}
          <input {...register(`items.${index}.name`)} />
          <input {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: '', quantity: 1 })}>
        Add Item
      </button>
    </div>
  );
}
```

**Rules:**

1. ✅ Use `field.id` as `key` — never array index. React Hook Form generates stable IDs.
2. ✅ One `useFieldArray` per array — don't nest multiple with the same name.
3. ✅ Batch operations where possible — avoid calling `append`/`remove` in rapid succession.
4. ❌ Don't mutate the `fields` array directly — always use `append`/`remove`/`insert`/`move`.

---

# 6. Form Submission

## 6.1 Standard Pattern

```tsx
const onSubmit: SubmitHandler<FormData> = async (data) => {
  try {
    await mutation.mutateAsync(data);
    reset();                        // clear form on success
    toast.success('Saved!');
  } catch (error) {
    // Display server-side errors on specific fields
    setError('email', { message: 'This email is already taken' });
  }
};

return (
  <form onSubmit={handleSubmit(onSubmit)} noValidate>
    {/* ... fields */}
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  </form>
);
```

## 6.2 Submission State

Always disable the submit button and show a loading state during submission:

```tsx
<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Spinner className="mr-2" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</button>
```

## 6.3 Reset After Success

```typescript
reset();                 // reset to defaultValues
reset({ email: '' });    // reset to specific values
reset(undefined, { keepValues: false });  // force reset
```

---

# 7. Server-Side Errors

Map server errors to form fields using `setError`:

```typescript
try {
  await createUser(data);
  reset();
} catch (error) {
  if (error instanceof ValidationError) {
    // Map server field errors
    Object.entries(error.fieldErrors).forEach(([field, message]) => {
      setError(field as keyof FormData, { message });
    });
  } else {
    // Generic form-level error
    setError('root.serverError', { message: 'Something went wrong. Please try again.' });
  }
}
```

Display root-level errors:

```tsx
{errors.root?.serverError && (
  <Alert variant="destructive" role="alert">
    {errors.root.serverError.message}
  </Alert>
)}
```

---

# 8. Dependent / Cascading Fields

Use `watch` for fields that depend on other field values:

```tsx
const country = watch('country');

// Reset city when country changes
useEffect(() => {
  setValue('city', '');
}, [country, setValue]);
```

For expensive subscriptions, scope `watch` to only the required field:

```tsx
const country = watch('country');  // ✅ watches only 'country'
// NOT: const allValues = watch();  // ❌ watches everything
```

---

# 9. File Organization

```
src/
├── features/
│   └── auth/
│       ├── schemas/
│       │   └── signUpSchema.ts    # Zod schema + inferred type
│       ├── components/
│       │   ├── SignUpForm.tsx     # Form component
│       │   └── SignUpForm.test.tsx
│       └── hooks/
│           └── useSignUp.ts       # Hook wrapping useForm + mutation
```

**Pattern**: Keep schemas separate from components. This enables:

1. Reuse across components (e.g., create + edit use same schema)
2. Schema testing without mounting components
3. Sharing with backend validation

---

# 10. Common Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|-------------|---------------|-----|
| `useState` for every input | Duplicates form state; causes re-renders | Use `register` (uncontrolled) |
| Manual validation without Zod | Scattered logic; no type inference | Zod schema as single source of truth |
| Manually defining TS types + Zod schema | Types drift; single source violated | `z.infer<typeof schema>` only |
| `watch()` without field name | Re-renders on every keystroke | `watch('fieldName')` for specific fields |
| Conditional `formState` access | Proxy subscriptions break | Destructure `formState` before render |
| `formState.errors.field` in `useEffect` deps | Won't re-trigger on change | Depend on entire `formState` |
| `Controller` for native HTML inputs | Unnecessary overhead | Use `register` for native inputs |
| Array index as `key` in `useFieldArray` | Bugs on reorder/remove | Use `field.id` |
| Missing `defaultValues` | Triggers uncontrolled→controlled warning; `isDirty` unreliable | Always provide `defaultValues` |
| `mode: 'onChange'` for large forms | Excessive re-validation on every keystroke | Use `'onSubmit'` or `'onBlur'` |
| Not using `noValidate` on `<form>` | Browser validation conflicts with Zod | Always add `noValidate` to `<form>` |
| `setValue` in render / not in `useEffect` | Causes infinite render loop | `setValue` only in event handlers or `useEffect` |

---

# 11. Definition of Done

A form implementation is complete when:

- [ ] Zod schema is the single source of truth — types inferred via `z.infer`
- [ ] `useForm` has `resolver`, `defaultValues`, and explicit `mode`
- [ ] Native HTML inputs use `register` (not `Controller`)
- [ ] `Controller`/`useController` used only for custom components
- [ ] `formState` properties are destructured before render
- [ ] `watch` is scoped to specific fields (not `watch()`)
- [ ] Submit button is disabled during `isSubmitting` and shows loading state
- [ ] Form resets on successful submission
- [ ] Server errors are mapped to fields via `setError`
- [ ] `useFieldArray` uses `field.id` as key (not index)
- [ ] `<form>` has `noValidate` attribute
- [ ] All field errors have `role="alert"` for accessibility
- [ ] Dependent fields use scoped `watch` + `useEffect` to reset
