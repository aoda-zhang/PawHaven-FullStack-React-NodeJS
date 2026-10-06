---
name: typescript-doctor
description: >
  Type discipline checks. Catches `any`, unsafe casts, non-null assertions, duplicated
  domain types that belong in `packages/shared/types`, literal unions duplicating a Zod
  schema, and missing `import type`. Runs on changed files; zero tolerance for the banned list.
  Trigger: type any cast assertion enum duplicate schema shared types typecheck review.
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
- **Command**: `rg -n '(: any\b|<any>|as any\b|Array<any>|any\[\])' <changed files>`
- **Pass**: `any` inside a string literal, a comment, or a third-party type name.
- **Fix**: `unknown` + narrowing, or the real type.

### Rule T2: Unsafe cast

- **Severity**: ❌ Blocking
- **Command**: `rg -n '\bas [A-Z]' <changed files>` — then judge each hit; this rule is not
  mechanical, so the grep is the candidate list, not the finding
- **Pattern**: `as <Type>` where the cast narrows away `null`/`undefined` or bridges unrelated types
- **Pass**: `as const`, `as unknown as X` in a test fixture, narrowing after a real guard.
- **Fix**: narrow with a type guard, or correct the declared type.

### Rule T3: Non-null assertion

- **Severity**: ⚠️ Warning
- **Command**: `rg -n '\w+!\.|\w+!\[|!\s*;' <changed files>`
- **Fix**: optional chaining, early return, or an explicit guard.
- **Exception**: inside a `tests/` fixture where the value is constructed locally.

### Rule T4: Domain type outside `packages/shared/types`

- **Severity**: ❌ Blocking
- **Command**: for each `type` / `interface` / `z.object` declared outside
  `packages/shared/types` in the changed files, count its references with
  `rg -l '<TypeName>' apps packages --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/build/**'`
  and compare the count of distinct directories against 1. Mechanical count, manual judgement on
  whether the declaration is a domain type or app infrastructure.
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
- **Command**: `rg -n "type \w+ =\s*'" <changed files>` — then check the literals against
  `packages/shared/types/`
- **Pattern**: `type X = 'a' | 'b'` where the same literals exist as a Zod enum in
  `packages/shared/types/`
- **Pass**: `z.infer<typeof Schema>` or `typeof Schema.enum`.
- **Fix**: derive from the schema.

### Rule T6: `enum` keyword

- **Severity**: ❌ Blocking
- **Command**: `rg -n '\benum\s+\w+' <changed files>`
- **Fix**: `as const` object + `z.infer` / `typeof Obj[keyof typeof Obj]`.

### Rule T7: Missing `import type`

- **Severity**: ⚠️ Warning
- **Command**: `rg -n '^import \{' <changed .ts / .tsx files>`, then check whether each imported
  name is used in type position only. Not mechanical; the grep is the candidate list.
- **Pattern**: a named import used only in type position, not declared `import type`
- **Fix**: `import type { X } from '...'`.

### Rule T8: Cross-boundary type import

- **Severity**: ❌ Blocking
- **Command**:
  `rg -n "@pawhaven/(frontend-core|ui|design-system)" apps/backend --glob '*.ts' --glob '!**/node_modules/**'`
- **Pattern**: `apps/backend/**` importing `@pawhaven/frontend-core`, `@pawhaven/ui`, or
  `@pawhaven/design-system`
- **Fix**: move the shared contract to `packages/shared/types`.

## Execution

1. Resolve the changed-file list with `git --no-pager diff --name-only <base>` and
   `git status --short`.
2. Run the T1–T8 commands over that list. They are independent — batch them.
3. Report each hit as `file:line` + rule id + the fix.
4. Any Blocking hit fails the review. Warnings are reported, not failed.

## Evidence requirement

Paste the command output for every Blocking rule. A rule with no output is a pass, and must be
reported as `no matches` — never as a silent skip. T2, T4, T5 and T7 need judgement after the grep:
paste the candidate list and the reasoning for each one you keep.

## Related

- [typescript](../../typescript/SKILL.md) — the rule source
- [typecheck-doctor](../../code-review/typecheck-doctor/SKILL.md) — mechanical compiler check
- [boundary-doctor](../../code-review/boundary-doctor/SKILL.md) — package dependency direction

## Known hits — pre-existing, report as such

- **T6** returns one hit: `packages/frontend-core/src/api/types.ts:54` declares
  `export enum extraRequestHeader`. It is pre-existing. Report it as a finding about the codebase
  once, not as a blocking finding on the change under review.
