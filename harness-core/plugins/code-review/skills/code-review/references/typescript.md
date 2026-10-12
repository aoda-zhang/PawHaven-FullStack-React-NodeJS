# TypeScript review

This file is how a reviewer **detects and judges** type violations. The rules themselves — what
"correct TypeScript" means in this repository — are owned by the
[typescript skill](../../../../javascript-typescript/skills/typescript/SKILL.md). Read them there. This
file does not restate them.

Typecheck proves the code compiles. It does not prove it is disciplined: a file full of `any`
compiles perfectly. Both halves are needed, and neither substitutes for the other.

## Scope

The changed `.ts` and `.tsx` files, skipping generated output and build directories.

## T1 — `any` · blocking

```bash
rg -n '(: any\b|<any>|as any\b|Array<any>|any\[\])' <changed files>
```

`any` inside a string literal, a comment, or a third-party type name is not a hit. Everything else is
`unknown` plus narrowing, or the real type.

## T2 — Unsafe cast · blocking, needs judgement

```bash
rg -n '\bas [A-Z]' <changed files>
```

**The grep is a candidate list, not a finding.** Judge each hit:

- a cast that narrows away `null` or `undefined`, or bridges unrelated types → blocking
- `as const`, `as unknown as X` in a test fixture, or a narrowing after a real guard → correct

Write the reasoning down for every hit you keep.

## T3 — Non-null assertion · minor

```bash
rg -n '\w+!\.|\w+!\[|!\s*;' <changed files>
```

Optional chaining, an early return, or an explicit guard. A `!` inside a locally-constructed test
fixture is acceptable.

## T4 — Domain type outside the shared types · blocking

For each `type`, `interface`, or `z.object` declared in the changed files outside
`packages/shared/types`, count its references across the workspace and compare the number of distinct
directories against one:

```bash
rg -l '<TypeName>' apps packages --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/build/**'
```

- **Fail when** the declaration is outside the shared types **and** is referenced from a second
  directory.
- **Pass when** it is referenced exactly once, from the same tree as its only consumer.

This also covers cross-boundary types: a declaration imported by both a frontend and a backend file is
always a T4 failure, and its duplication is also an [architecture](./architecture.md) finding. File it
once, under this dimension.

## T5 — Duplicated literal union · blocking

```bash
rg -n "type \w+ =\s*'" <changed files>
```

When the same literals already exist as a schema in the shared types, the union is a second source of
truth. Derive it from the schema instead.

## T6 — `enum` · blocking

```bash
rg -n '\benum\s+\w+' <changed files>
```

The repository's form is an `as const` object plus the inferred union, so the value set stays
checkable and the generated code stays plain.

## T7 — Missing `import type` · minor

```bash
rg -n '^import \{' <changed .ts / .tsx files>
```

A named import used only in type position should be a type import. Not mechanical: the grep is the
candidate list.

## T8 — Cross-boundary type import · blocking

```bash
rg -n "@pawhaven/(frontend-core|ui|design-system)" apps/backend --glob '*.ts' --glob '!**/node_modules/**'
```

Backend code reaching a frontend package means a shared contract was placed in the wrong package. It
is an [architecture](./architecture.md) finding as well; report it once.

## Execution

1. Resolve the changed-file list with `git --no-pager diff --name-only <base>` and `git status --short`.
2. Run T1–T8 over that list. They are independent, so batch them.
3. Judge every candidate that needs judgement, and paste both the candidate list and the reasoning for
   what you kept.
4. Report each hit as file, line, rule id, and the fix.

## Evidence

Paste the command output for every blocking rule. **A rule with no output is a pass and is reported as
"no matches"** — never as a silent skip.

The compile check itself is a separate concern and is run as a deterministic check, not from this
file:

```bash
pnpm --filter <package> typecheck
```

## Pre-existing hits

Report only against the change under review. Every pre-existing hit these rules return, and the
command that produces it, is recorded in [docs/quality](../../../../../../docs/quality/README.md).
