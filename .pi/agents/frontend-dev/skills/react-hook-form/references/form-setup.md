# react-hook-form — `useForm` Setup and Options

The complete call, the option reference, the mode lookup by form size, and the
`reset` forms. The rule that three of those options are mandatory is in
`SKILL.md` §2.1; this file is everything else about them.

## Contents

| Section                                                       | What it answers                                    |
| ------------------------------------------------------------- | -------------------------------------------------- |
| [The setup](#the-setup)                                       | A complete `useForm` call with its options         |
| [Options table](#options-table)                               | What each option does and what breaks without it   |
| [Validation mode by form size](#validation-mode-by-form-size) | Which `mode` a given form gets                     |
| [`reset` variants](#reset-variants)                           | Resetting all of it, some of it, or a single field |

---

## The setup

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

---

## Options table

| Prop            | What it sets                                                    |
| --------------- | --------------------------------------------------------------- |
| `resolver`      | The schema the form validates against                           |
| `defaultValues` | The baseline for `isDirty`, and the initial value of each field |
| `mode`          | When validation runs — the library default is `'onSubmit'`      |

---

## Validation mode by form size

| Form                               | `mode`       | Cost                                  |
| ---------------------------------- | ------------ | ------------------------------------- |
| Login, search — a few short fields | `'onSubmit'` | One validation pass, on submit        |
| Profile, settings, anything medium | `'onBlur'`   | One pass per field the user leaves    |
| Password strength meter, tiny form | `'onChange'` | Full re-validation on every keystroke |

`reValidateMode` defaults to `onChange`: a field already validated on blur keeps
re-validating on every keystroke afterwards, which is what makes a half-typed field
stop shouting. Set it to `'onBlur'` when even that is too eager.

---

## `reset` variants

```typescript
reset(); // back to defaultValues
reset({ email: '' }); // specific values
reset(undefined, { keepValues: false }); // force the reset
reset(getValues(), { keepDirty: false }); // keep the shape, drop the edits
```

`reset` clears the error state as well as the values, so calling it before the
mutation resolves would wipe the messages a failed submit just produced. Reset on
success — see `SKILL.md` §6.1.
