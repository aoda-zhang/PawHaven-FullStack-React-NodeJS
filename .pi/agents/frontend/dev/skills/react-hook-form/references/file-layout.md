# react-hook-form — Form File Layout

Which file holds the schema, the form, and the mutation hook — and what moving the
schema out of the component is for. The placement rule is in `SKILL.md` §1.1.

## Contents

| Section                                                   | What it answers                       |
| --------------------------------------------------------- | ------------------------------------- |
| [The feature layout](#the-feature-layout)                 | Which file holds which part of a form |
| [Why the schema is separate](#why-the-schema-is-separate) | The three things separation buys      |

---

## The feature layout

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

The inferred type is exported from the schema file, so a consumer imports the type
and the schema from the same place and cannot end up with the type of one schema and
the rules of another.

---

## Why the schema is separate

1. **Reuse.** Create and edit share one schema, so the two forms cannot disagree
   about what a valid password is.
2. **Testable without mounting.** `signUpSchema.safeParse({...})` needs no
   component, no DOM, and no query client — it is the cheapest test in the feature.
3. **Shareable.** A schema that validates a payload can be checked against the same
   payload on the server, which is what keeps client and server from drifting.
