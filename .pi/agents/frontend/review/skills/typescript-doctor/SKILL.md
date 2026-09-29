---
name: typescript-doctor
description: >
  Type discipline checks. Catches `any`, unsafe casts, non-null assertions, duplicated
  domain types that belong in `packages/shared/types`, literal unions duplicating a Zod
  schema, and missing `import type`. Runs on changed files; zero tolerance for the banned list.
  触发场景 / Trigger: type any cast assertion enum duplicate schema shared types typecheck review.
---

# typescript-doctor

## Responsibility

Catch type escape hatches and type-placement violations. `typecheck-doctor` proves the code
compiles; this proves it is disciplined. A passing `tsc` with `any` everywhere is a failure here.

## Scope

Changed `.ts` / `.tsx` files. Skip `node_modules`, `dist`, `build`, generated clients.

## Rules

### Rule T1: `any`

- **Severity**: ❌ Blocking
- **Tool**: `grep`
- **Pattern**: `\bany\b` in a type position — `: any`, `<any>`, `as any`, `Array<any>`, `any[]`
- **Pass**: `any` inside a string literal, a comment, or a third-party type name.
- **Fix**: `unknown` + narrowing, or the real type.

### Rule T2: Unsafe cast

- **Severity**: ❌ Blocking
- **Tool**: `grep`
- **Pattern**: `as <Type>` where the cast narrows away `null`/`undefined` or bridges unrelated types
- **Pass**: `as const`, `as unknown as X` in a test fixture, narrowing after a real guard.
- **Fix**: narrow with a type guard, or correct the declared type.

### Rule T3: Non-null assertion

- **Severity**: ⚠️ Warning
- **Tool**: `grep`
- **Pattern**: `\w+!\.` and `\w+!\[` and `!\s*;`
- **Fix**: optional chaining, early return, or an explicit guard.
- **Exception**: inside a `tests/` fixture where the value is constructed locally.

### Rule T4: Domain type outside `packages/shared/types`

- **Severity**: ❌ Blocking
- **Tool**: `grep` + reference count
- **Rule**: a type used in **more than one place** must be declared in
  `packages/shared/types/<Name>.schema.ts` and nowhere else. A type used exactly once stays with
  its single owner.
- **Fail when**: a `type` / `interface` / `z.object` is declared outside `packages/shared/types`
  **and** is referenced from a second directory — another feature, another app, or a package.
- **Pass when**: declared outside `packages/shared/types` and referenced exactly once, in the same
  directory tree as its only consumer.
- **Fix**: move the declaration to `packages/shared/types`, export it from that directory's
  `index.ts`, and import it as `@pawhaven/shared/types`.
- **Note**: this also covers cross-boundary types — a declaration imported by both an
  `apps/frontend` and an `apps/backend` file is always a T4 failure.

### Rule T5: Duplicated literal union

- **Severity**: ❌ Blocking
- **Tool**: `grep`
- **Pattern**: `type X = 'a' | 'b'` where the same literals exist as a Zod enum in
  `packages/shared/types/`
- **Pass**: `z.infer<typeof Schema>` or `typeof Schema.enum`.
- **Fix**: derive from the schema.

### Rule T6: `enum` keyword

- **Severity**: ❌ Blocking
- **Tool**: `grep`
- **Pattern**: `\benum\s+\w+`
- **Fix**: `as const` object + `z.infer` / `typeof Obj[keyof typeof Obj]`.

### Rule T7: Missing `import type`

- **Severity**: ⚠️ Warning
- **Tool**: `grep`
- **Pattern**: a named import used only in type position, not declared `import type`
- **Fix**: `import type { X } from '...'`.

### Rule T8: Cross-boundary type import

- **Severity**: ❌ Blocking
- **Tool**: `grep`
- **Pattern**: `apps/backend/**` importing `@pawhaven/frontend-core`, `@pawhaven/ui`, or
  `@pawhaven/design-system`
- **Fix**: move the shared contract to `packages/shared/types`.

## Execution

1. Resolve the changed-file list.
2. Run T1–T8 in parallel over that list.
3. Report each hit as `file:line` + rule id + the fix.
4. Any Blocking hit fails the review. Warnings are reported, not failed.

## Evidence requirement

Paste the grep output for every Blocking rule. A rule with no output is a pass, and must be
reported as `no matches` — never as a silent skip.

## Related

- [typescript](../../../dev/skills/typescript/SKILL.md) — the rule source
- [typecheck-doctor](../../../../../skills/code-review/typecheck-doctor/SKILL.md) — mechanical compiler check
- [boundary-doctor](../../../../../skills/code-review/boundary-doctor/SKILL.md) — package dependency direction
