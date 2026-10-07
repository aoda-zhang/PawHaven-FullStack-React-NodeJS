---
name: architecture-doctor
description: >
  Architecture and design compliance detection. Covers cross-module imports (forbidden), package
  dependency direction (ui -> frontend-core inverted, forbidden), cross-feature imports (forbidden),
  component graduation (2+ features must promote), feature folder structure, API design consistency,
  shared type ownership, and architecture-doc coverage.
  Trigger: architecture boundaries dependency direction module isolation graduation package layering.
---

# Architecture Doctor

Deep review of architecture and design compliance. Severity vocabulary is
[code-review](../SKILL.md)'s.

## Scope detection

```bash
git diff --name-only develop...HEAD
```

`apps/backend/**` → rules 1, 6, 7. `apps/frontend/**` → rules 3, 4, 5. `packages/**` → rule 2. Rule 8
is full-stack only. Rule 9 applies to any significant architecture change.

## Rule 1 — Cross-module imports (backend) · Blocking

```bash
grep -rn "from '\.\.\/.*\/modules\/" apps/backend/core-service/src/ \
  --include="*.ts" | grep -v "\.service" | grep -v "\.module"
```

- Another module's internal file, entity, DTO, or controller → Blocking.
- Another module's exported service → OK. That is the public API, reached through DI.
- Another module's Prisma model directly → Blocking.

## Rule 2 — Package dependency direction · Blocking

```
shared ← design-system ← ui ← frontend-core ← portal
shared ← backend services
```

```bash
grep -rn "from '@pawhaven/frontend-core'" packages/ui/src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*features/" packages/frontend-core/src/ --include="*.ts" --include="*.tsx"
grep -rn "from '@pawhaven/ui'" packages/design-system/ --include="*.ts" --include="*.tsx"
```

The rule statements live in
[architecture-design → boundaries](../../architecture-design/references/boundaries.md). This rule
holds the commands.

## Rule 3 — Cross-feature imports (frontend) · Blocking

```bash
grep -rn "from '.*features/" apps/frontend/portal/src/features/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "from '.*features/queryKeys'" | grep -v "from '\.\/"
```

- One feature importing another feature's internals → Blocking.
- A shared key re-export hub, a self-import, or a type-only import → OK.
  [boundary-doctor](../boundary-doctor/SKILL.md) owns those exclusions.

## Rule 4 — Component graduation · Warning

```bash
grep -rn "from '.*components/" apps/frontend/portal/src/features/ \
  --include="*.tsx" | grep -v "from '\.\/"
```

- The same component imported from 2+ feature directories → Warning, it should graduate.
- A component in `packages/ui/` imported from only 1 feature → Suggestion, it could be
  feature-private.

Placement rules: [component placement](../../frontend-patterns/references/component-placement.md).

## Rule 5 — Feature folder structure · Warning

```bash
ls -d apps/frontend/portal/src/features/*/
```

For each feature:

- Entry point `index.tsx` present, `types.ts` for feature-local types.
- `api/` holds `<module>.api.ts` and `<module>.queryKeys.ts`, plus `queries.ts` / `mutations.ts`
  **only** when a relevant hook exists.
- `queries.ts` exports `useQuery` hooks only. `mutations.ts` exports `useMutation` hooks only. No
  duplication between them, and no `export {};` placeholders.
- Components sit in `components/`, not at the feature root.
- No business logic in the generic `src/components/`.

## Rule 6 — Module responsibility (backend) · Warning

```bash
for dir in apps/backend/core-service/src/modules/*/; do
  echo "=== $(basename $dir) ==="
  grep -l "export class.*Service" "$dir"*.ts 2>/dev/null || echo "  No service"
done
```

- One module's service containing another domain's business logic → Warning.
- A module with no clear aggregate root → Warning.
- A module exporting internal entities or use-cases instead of only its service → Warning.

## Rule 7 — API design consistency · Warning

```bash
grep -rn "@Controller\|@Get\|@Post\|@Put\|@Delete\|@Patch" \
  apps/backend/core-service/src/modules/ --include="*.controller.ts"
```

- Inconsistent URL patterns across modules.
- Inconsistent response shapes — some wrap in `{ data }`, others do not.
- Unvalidated inbound input: a `@Body` / `@Query` without the `schema` option. There is no
  `ZodValidationPipe` in this repo.
- Business logic in the controller instead of delegating to the service.

## Rule 8 — Shared type ownership · Warning (full-stack only)

```bash
grep -rn "interface.*Dto\|type.*Dto\|interface.*Type" \
  apps/frontend/portal/src/features/ --include="*.ts" | grep -v "node_modules"
```

- A frontend or backend type that should be in `@pawhaven/shared` → Warning.
- The same Zod schema defined on both sides → Blocking.

The placement rule itself is owned by [typescript](../../typescript/SKILL.md).

## Rule 9 — Architecture doc coverage · Suggestion

```bash
ls docs/architecture/
```

A significant architecture change not reflected under `docs/architecture/` → Suggestion.

## Output

Report findings grouped by severity, each as rule · file:line · issue. `## Related` for the
best-practice detail: [references/best-practices.md](references/best-practices.md).
