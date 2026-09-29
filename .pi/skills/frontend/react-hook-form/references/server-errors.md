# react-hook-form — Server Errors

Putting a server response back onto the form. The rules — which errors are field
errors and which are form-level — are in `SKILL.md` §7; this file is the mapping
code.

## Contents

| Section                                                   | What it answers                                      |
| --------------------------------------------------------- | ---------------------------------------------------- |
| [Mapping a `ValidationError`](#mapping-a-validationerror) | Turning a field-errors payload into `setError` calls |
| [The form-level alert](#the-form-level-alert)             | Rendering `errors.root.serverError`                  |

---

## Mapping a `ValidationError`

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

The `field` cast is the weak point of this pattern: it is a string from the wire
being asserted as a key of the form type. When the API's error shape is shared, put
it in `packages/shared` and parse it with a Zod schema, so a renamed field is a
compile error instead of a message attached to a field that does not exist.

---

## The form-level alert

```tsx
{
  errors.root?.serverError && (
    <Alert variant="destructive" role="alert">
      {errors.root.serverError.message}
    </Alert>
  );
}
```

`role="alert"` is what makes a screen reader announce it; an error that only changes
the colour of a banner is invisible to anyone not looking at it.
