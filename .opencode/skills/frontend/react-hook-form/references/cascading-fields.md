# react-hook-form — Cascading and Dependent Fields

The pattern for a field whose value depends on another field's. The rules — reset the
dependent, scope the subscription, and keep `setValue` out of render — are in
`SKILL.md` §8; this file is the code for the cases that come up.

## Contents

| Section                                                                         | What it answers                            |
| ------------------------------------------------------------------------------- | ------------------------------------------ |
| [Watch one field, reset the dependent](#watch-one-field-reset-the-dependent)    | Country → city, and the reset in an effect |
| [Clearing validation for the dependent](#clearing-validation-for-the-dependent) | Why a stale error survives the reset       |

---

## Watch one field, reset the dependent

```tsx
const country = watch('country');

useEffect(() => {
  setValue('city', '');
}, [country, setValue]);
```

The subscription is scoped to `country`; `watch()` would re-render this component on
every keystroke in the form. `setValue` runs in the effect and never in render — a
`setValue` during render is a render loop.

---

## Clearing validation for the dependent

A reset value can keep the error it had, so the field shows an error for an empty
input. Clear both:

```tsx
useEffect(() => {
  setValue('city', '', { shouldValidate: false });
  clearErrors('city');
}, [country, setValue, clearErrors]);
```

When the dependent field is a set of checkboxes or a select populated from the
watched value, `trigger` is the tool for asking the schema to re-check one field
after the change rather than the whole form:

```tsx
const country = watch('country');

useEffect(() => {
  trigger('postalCode');
}, [country, trigger]);
```
