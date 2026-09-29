---
name: typescript
description: >
  TypeScript discipline for PawHaven. Where a type must live (shared vs feature-local),
  Zod as the single source of truth for enums and API contracts, and the banned escape
  hatches. Read before writing or reviewing any `.ts` / `.tsx`.
  触发场景 / Trigger: type types interface enum schema zod infer any unknown cast
  satisfies generic import type shared types contract api dto model.
---

# TypeScript

## Where types live

| Situation                       | Location                                 | Import                   |
| ------------------------------- | ---------------------------------------- | ------------------------ |
| Used in **more than one place** | `packages/shared/types/<Name>.schema.ts` | `@pawhaven/shared/types` |
| Used by **exactly one** feature | `features/<feature>/types.ts`            | relative                 |
| Never                           | `apps/backend/**` importing frontend     | —                        |

- A type has exactly two homes: `packages/shared/types`, or the one feature that owns it.
- Used once → next to it. Used more than once → `packages/shared/types`. There is no third option.
- Frontend and backend share **no** domain types outside `packages/shared/types`.
- Never re-declare a shared type locally. Import it.
- A type inside `packages/frontend-core` is app infrastructure, not a domain contract. Domain types
  do not go there.

## Zod is the source of truth

- Every API contract and enum is a Zod schema in `packages/shared/types/`.
- Derive the TS type — never write it twice:
  ```ts
  export type ReportAnimalFormValues = z.infer<typeof ReportAnimalSchema>;
  ```
- Read enum members off the schema. Never duplicate the literal union:
  ```ts
  AnimalStatusSchema.enum.inProgress; // ✅
  status: 'inProgress'; // ❌ duplicated literal
  ```
- Schemas validate at the edge (API response, form input). Trust validated data inside.

## Imports

- `import type { X }` for type-only imports. No value-position type imports.
- `@/` → `apps/frontend/portal/src`. Use it for cross-feature app imports.
- Relative imports within a feature. `@pawhaven/*` for packages.
- Barrel files: import from the package root, not deep into `build/`.

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

[typescript-doctor](../../../review/skills/typescript-doctor/SKILL.md) enforces this file.
`typecheck-doctor` proves it compiles; this doctor proves it is disciplined.
