---
name: react-hook-form
description: >
  React Hook Form + Zod standards for the PawHaven portal. Schema-first validation, the
  `@pawhaven/ui/form` primitives, and the provider/component split for multi-section forms.
  Use when building or changing any form.
  触发场景 / Trigger: form input validation zod field array submit error schema 表单.
---

# react-hook-form

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
- Options arrays hold `{ value, labelKey }`; translate at render — see the [i18n](../i18n/SKILL.md) skill.

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

[react-doctor](../../../../skills/code-review/react-doctor/SKILL.md) · S4 `useState` used for form values ·
[typescript-doctor](../../../../skills/code-review/typescript-doctor/SKILL.md) · T4 untyped resolver
