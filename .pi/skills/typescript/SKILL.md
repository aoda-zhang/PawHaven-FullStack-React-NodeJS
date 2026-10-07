---
name: typescript
description: >
  TypeScript discipline for PawHaven. Where a type must live, Zod as the single source of truth for
  enums and API contracts, and the banned escape hatches. Read before writing any `.ts` / `.tsx`.
  Trigger: type types interface enum schema zod infer any unknown cast
  satisfies generic import type shared types contract api dto model.
---

# TypeScript

## Where a type lives

The placement table and its reasoning are owned by
[the portal facts document](../../../docs/frontend-portal.md#where-a-type-lives). Do not restate
them; read them there.

The rule in one line: a type used in more than one place is declared in `packages/shared/types` and
imported as `@pawhaven/shared/types`. A type used exactly once stays with its single owner.

## Banned

| Banned                                  | Use instead                                 |
| --------------------------------------- | ------------------------------------------- |
| `any`                                   | `unknown` + narrowing, or the real type     |
| `as` cast to silence an error           | fix the type, or narrow with a guard        |
| `!` non-null assertion                  | optional chaining, early return, or a guard |
| `enum`                                  | `as const` object + `z.infer`               |
| Interface extending a type twice        | compose                                     |
| Duplicated literal union                | schema-derived type                         |
| Named import used only in type position | `import type { X }`                         |

## Naming

- Types and interfaces `PascalCase`. Hooks `useX`. Booleans read as predicates: `isOpen`, `hasError`, `canSubmit`.
- Do not prefix a type with its holder: `UserProps`, `ButtonType` → `Props`, `ButtonProps`.
- Avoid the `I` prefix and Hungarian notation.

## Related

- Discipline check: [typescript-doctor](../code-review/typescript-doctor/SKILL.md)
- Compile check: [typecheck-doctor](../code-review/typecheck-doctor/SKILL.md)
