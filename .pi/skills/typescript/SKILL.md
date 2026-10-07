---
name: typescript
description: >
  TypeScript discipline for PawHaven. Where a type must live (shared vs feature-local),
  Zod as the single source of truth for enums and API contracts, and the banned escape
  hatches. Read before writing or reviewing any `.ts` / `.tsx`.
  Trigger: type types interface enum schema zod infer any unknown cast
  satisfies generic import type shared types contract api dto model.
---

# TypeScript

## Where types live

One shared location table, and the reasoning behind it, live in [the portal facts document](../../../docs/frontend-portal.md) —
[Where a type lives](../../../docs/frontend-portal.md#where-a-type-lives). Do not restate
it here.

## Banned

| Banned                           | Use instead                                 |
| -------------------------------- | ------------------------------------------- |
| `any`                            | `unknown` + narrowing, or the real type     |
| `as` cast to silence an error    | fix the type, or narrow with a guard        |
| `!` non-null assertion           | optional chaining, early return, or a guard |
| `enum`                           | `as const` object + `z.infer`               |
| Interface extending a type twice | compose                                     |
| Duplicated literal union         | schema-derived type                         |

## Naming

- Types and interfaces `PascalCase`. Hooks `useX`. Booleans read as predicates: `isOpen`, `hasError`, `canSubmit`.
- Do not prefix a type with its holder: `UserProps`, `ButtonType` → `Props`, `ButtonProps`.
- Avoid the `I` prefix and Hungarian notation.

## Doctor

[typescript-doctor](../code-review/typescript-doctor/SKILL.md) enforces this file.
`typecheck-doctor` proves it compiles; this doctor proves it is disciplined.
