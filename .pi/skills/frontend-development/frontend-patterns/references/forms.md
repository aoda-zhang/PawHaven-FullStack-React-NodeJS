# Forms — React Hook Form + Zod

Schema-first validation, the `@pawhaven/ui/form` primitives, and the provider/component split for
multi-section forms. The router that names when to read this is
[frontend-patterns](../SKILL.md).

## Schema first

The Zod schema is the contract. Types derive from it — never write them twice.

```ts
export const ReportAnimalSchema = z.object({
  animalType: z.string().min(1),
  count: z.number().min(1),
});
export type ReportAnimalFormValues = z.infer<typeof ReportAnimalSchema>;
```

- Shared form contracts live in `packages/shared/types/<Name>.schema.ts`.
- Feature-only forms keep the schema in `features/<feature>/types.ts`.
- Server errors merge through `setError` keyed by the same field names.

### The feature layout

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

The inferred type is exported from the schema file, so a consumer imports the type and the schema
from the same place and cannot end up with the type of one schema and the rules of another.

Separation buys three things:

1. **Reuse.** Create and edit share one schema, so the two forms cannot disagree about what a valid
   password is.
2. **Testable without mounting.** `signUpSchema.safeParse({...})` needs no component, no DOM, and no
   query client — it is the cheapest test in the feature.
3. **Shareable.** A schema that validates a payload can be checked against the same payload on the
   server, which is what keeps client and server from drifting.

## Use the primitives

Never a raw `<input>` in a feature form. `@pawhaven/ui/form` provides the wired controls.

```tsx
import {
  FormInput,
  FormRadio,
  FormSelect,
  FormCheckbox,
  FormTextarea,
} from '@pawhaven/ui/form';
```

- Label, error display, id, aria wiring, and registration are already handled. Do not re-add them.
- Pass `required` to the primitive, not a hand-written `*` in a label.
- Options arrays hold `{ value, labelKey }`; translate at render — see
  [i18n](./i18n.md).

## Multi-section forms

A long form splits into sections. The parent owns the form, sections consume the context.

```tsx
// ReportAnimalForm.tsx — owns the form
const form = useForm<ReportAnimalFormValues>({
  resolver: zodResolver(ReportAnimalSchema),
  defaultValues: initialValues,
});

// AnimalBasicsSection.tsx — consumes it
const { control } = useFormContext<ReportAnimalFormValues>();
const animalType = useWatch({ control, name: 'animalType' });
```

- `useFormContext<T>()` in a section, never a second `useForm`.
- `useWatch` for a value that drives another field's visibility. No `watch()` subscription leak.
- Sections render conditionally on a watched value — that is the intended use.

## Field arrays

- `useFieldArray` for repeatable groups. Never an index-keyed array in state.
- `keyName` is stable. Do not renumber on remove.

## Submission

- `handleSubmit(onSubmit)` with the resolver. The resolver is the only validation path.
- Disable the submit button while `isSubmitting`. Do not guard it in an effect.
- Server-side failure → map to `setError`. Never `alert`.
- Reset with `reset(values)` from the server response, not `reset()` blindly.

## `useForm` setup and options

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

| Prop            | What it sets                                                    |
| --------------- | --------------------------------------------------------------- |
| `resolver`      | The schema the form validates against                           |
| `defaultValues` | The baseline for `isDirty`, and the initial value of each field |
| `mode`          | When validation runs — the library default is `'onSubmit'`      |

### Validation mode by form size

| Form                               | `mode`       | Cost                                  |
| ---------------------------------- | ------------ | ------------------------------------- |
| Login, search — a few short fields | `'onSubmit'` | One validation pass, on submit        |
| Profile, settings, anything medium | `'onBlur'`   | One pass per field the user leaves    |
| Password strength meter, tiny form | `'onChange'` | Full re-validation on every keystroke |

`reValidateMode` defaults to `onChange`: a field already validated on blur keeps re-validating on
every keystroke afterwards, which is what makes a half-typed field stop shouting. Set it to
`'onBlur'` when even that is too eager.

### `reset` variants

```typescript
reset(); // back to defaultValues
reset({ email: '' }); // specific values
reset(undefined, { keepValues: false }); // force the reset
reset(getValues(), { keepDirty: false }); // keep the shape, drop the edits
```

`reset` clears the error state as well as the values, so calling it before the mutation resolves
would wipe the messages a failed submit just produced. Reset on success.

## Server errors

### Mapping a `ValidationError`

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
    setError('root.serverError', {
      message: 'Something went wrong. Please try again.',
    });
  }
}
```

The `field` cast is the weak point of this pattern: it is a string from the wire being asserted as
a key of the form type. When the API's error shape is shared, put it in `packages/shared` and parse
it with a Zod schema, so a renamed field is a compile error instead of a message attached to a
field that does not exist.

### The form-level alert

```tsx
{
  errors.root?.serverError && (
    <Alert variant="destructive" role="alert">
      {errors.root.serverError.message}
    </Alert>
  );
}
```

`role="alert"` is what makes a screen reader announce it; an error that only changes the colour of a
banner is invisible to anyone not looking at it.

## Cascading and dependent fields

### Watch one field, reset the dependent

```tsx
const country = watch('country');

useEffect(() => {
  setValue('city', '');
}, [country, setValue]);
```

The subscription is scoped to `country`; `watch()` would re-render this component on every
keystroke in the form. `setValue` runs in the effect and never in render — a `setValue` during
render is a render loop.

### Clearing validation for the dependent

A reset value can keep the error it had, so the field shows an error for an empty input. Clear
both:

```tsx
useEffect(() => {
  setValue('city', '', { shouldValidate: false });
  clearErrors('city');
}, [country, setValue, clearErrors]);
```

When the dependent field is a set of checkboxes or a select populated from the watched value,
`trigger` is the tool for asking the schema to re-check one field after the change rather than the
whole form:

```tsx
const country = watch('country');

useEffect(() => {
  trigger('postalCode');
}, [country, trigger]);
```

## Anti-pattern catalogue

Every rule above is stated once, in the sections of this file. This catalogue is the diagnosis:
what the symptom looks like, why it breaks, and which section holds the rule. Check a diff against
it before reporting a form done.

| Anti-pattern                               | Why it breaks                                                                  | Rule                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `useState` for every input                 | Duplicates the form's own state and re-renders the component on each keystroke | [Schema first](#schema-first)                                     |
| Manual validation without Zod              | Scattered logic; no type inference                                             | [Schema first](#schema-first)                                     |
| A hand-written TS type beside the schema   | The two drift on the first new field                                           | [Schema first](#schema-first)                                     |
| `watch()` with no field name               | Re-renders on every keystroke of every field                                   | [Multi-section forms](#multi-section-forms)                       |
| Conditional `formState` access             | The Proxy misses the subscription; the update is lost                          | [Multi-section forms](#multi-section-forms)                       |
| `formState.errors.field` in effect deps    | A nested property's identity does not change with its contents                 | [Multi-section forms](#multi-section-forms)                       |
| `Controller` around a native input         | Re-renders the form component for no gain                                      | [Use the primitives](#use-the-primitives)                         |
| The array index as a `useFieldArray` key   | Breaks on reorder and remove; values land on the wrong row                     | [Field arrays](#field-arrays)                                     |
| Missing `defaultValues`                    | Uncontrolled-to-controlled warning; `isDirty` unreliable                       | [`useForm` setup and options](#useform-setup-and-options)         |
| `mode: 'onChange'` on a large form         | Re-validates everything on every keystroke                                     | [`useForm` setup and options](#useform-setup-and-options)         |
| No `noValidate` on `<form>`                | The browser's own validation competes with Zod's                               | [Submission](#submission)                                         |
| `setValue` during render                   | A render loop                                                                  | [Cascading and dependent fields](#cascading-and-dependent-fields) |
| A schema defined inside the form component | Two forms over the same fields cannot share it; it cannot be tested alone      | [Schema first](#schema-first)                                     |

## Banned

| Banned                          | Use                            |
| ------------------------------- | ------------------------------ |
| `useState` per field            | `useForm` + schema             |
| raw `<input>` / `<select>`      | `@pawhaven/ui/form` primitives |
| a second `useForm` in a section | `useFormContext<T>()`          |
| `watch()` for a live value      | `useWatch`                     |
| hand-written error `<p>`        | the primitive's error slot     |
| `any` in a resolver             | `z.infer` of the schema        |
| validation in `onSubmit`        | the resolver                   |

## Doctor

[react-doctor](../../react-doctor/SKILL.md) · S4 `useState` used for form values ·
[typescript-doctor](../../../../code-review/skills/code-review/references/typescript.md) · T4 untyped resolver
