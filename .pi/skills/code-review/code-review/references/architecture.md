# Architecture and boundaries

Does the change fit this repository? The **rule statements** are owned by
[architecture-design → boundaries](../../../../architecture/skills/architecture-design/references/boundaries.md)
— read them there. This file is how a reviewer detects and judges a violation of them.

The commands below are the deterministic form of the same checks, and
`../scripts/run-project-checks.mjs` runs them. Run them; do not reconstruct them by eye.

## Scope detection

The detector maps each changed path to the rules that apply to it:

| Changed path                     | Applies                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `apps/backend/**`                | cross-module isolation, module responsibility, API design       |
| `apps/frontend/**`               | cross-feature isolation, package direction, component placement |
| `packages/**`                    | dependency direction, shared ownership                          |
| `apps/frontend` + `apps/backend` | shared type ownership, API contract consistency                 |
| `docs/architecture/**`           | documentation coverage                                          |

## Cross-module dependency (backend) — blocking

```bash
rg -n "from '\.\./[a-z][a-z-]*/[a-z-]*(?:entity|entities|dto|controller|repository|repo|model|schema)[a-z-]*\.js" \
  apps/backend/core-service/src/modules --glob '*.ts' \
  --glob '!**/*.test.ts' --glob '!**/app.module.ts'
```

- Another module's internal file, entity, DTO, controller, repository, or Prisma model → blocking.
- Another module's **exported service** or **module** → correct. That is the public API, reached
  through dependency injection; importing `../other/other.service.js` is not a violation.
- Another module's Prisma model reached directly → blocking.

`app.module.ts` is exempt: it is the composition root and imports every module on purpose. Anything
else that has to be exempted is an architecture change, not a check exception.

## Package dependency direction — blocking

The direction is `shared ← design-system ← ui ← frontend-core ← portal`, and `shared ← backend`.

```bash
rg -n "from '@pawhaven/frontend-core'" packages/ui --glob '*.ts' --glob '*.tsx'
rg -n "from '.*features/" packages --glob '*.ts' --glob '*.tsx'
rg -n "from '@pawhaven/(frontend-core|ui|design-system)'" apps/backend --glob '*.ts'
```

The third is a layering violation in the other direction: backend code reaching a frontend package
means a shared contract was put in the wrong place.

## Cross-feature isolation (frontend) — blocking

```bash
rg -n "from '@/features/" apps/frontend/portal/src/features --glob '*.ts' --glob '*.tsx' \
  | grep -v "import type"
```

The exclusions are load-bearing. Without them the command returns hits that are all correct code, and
a check that cries wolf gets skipped:

- the router is the composition root and imports every feature on purpose; the search is scoped to
  `src/features/` to drop it
- `import type` is not this violation — type-only sharing across the app shell is fine
- a feature importing from **itself** is the normal case; only a differing source/target pair is a
  finding

## Component placement and graduation — warning

```bash
rg -n "from '.*components/" apps/frontend/portal/src/features --glob '*.tsx' | grep -v "from '\./"
```

- The same component imported from two or more features → it should have graduated.
- A component in a shared package imported from exactly one feature → it could be feature-private.

The placement rule itself is owned by
[frontend-patterns → components](../../../../frontend-development/skills/frontend-patterns/references/components.md).

## Feature structure — warning

For each feature directory: an entry point, feature-local types in one place, an API layer with a
query-key factory, and `queries`/`mutations` files holding only the hooks they are named for. An
empty hook file with a placeholder export is a finding — delete it.

## Module responsibility (backend) — warning

```bash
for dir in apps/backend/core-service/src/modules/*/; do
  echo "=== $(basename "$dir") ==="
  grep -l "export class.*Service" "$dir"*.ts 2>/dev/null || echo "  no service"
done
```

- One module's service holding another domain's logic → the boundary moved without a decision.
- A module with no aggregate root → it is a folder, not a module.
- A module exporting entities or use-cases alongside its service → more surface than it needs.

## API design consistency — warning

```bash
rg -n "@(Controller|Get|Post|Put|Delete|Patch)" apps/backend/core-service/src/modules --glob '*.controller.ts'
```

- Inconsistent URL patterns or response shapes across modules. Some wrapping and some not is a client
  bug waiting to happen.
- **An inbound `@Body` or `@Query` without a `schema`.** There is no global validation pipe in this
  repository, so an unvalidated body is unvalidated, full stop.
- Business logic in a controller instead of in the service.

## Shared type ownership — blocking when duplicated across the boundary

- The same shape declared on both sides of a contract → blocking. The single source belongs in
  `packages/shared/types`.
- A domain type declared outside it **and** referenced from a second directory → the placement rule
  was broken. The rule is owned by the TypeScript skill; the detection is
  [typescript.md](./typescript.md).

## Feature importing runtime infrastructure — blocking

```bash
rg -n "from '@pawhaven/i18n'" apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'
```

That package is app-root infrastructure. Features translate through the translation hook.

## Internal navigation must use the router — blocking

```bash
rg -n "window\.history\.(pushState|replaceState|back|forward)|window\.location\.(href|assign|replace)|window\.location\s*=" \
  apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'
```

Two files are accepted exceptions and are named as such in the rule's owner: a scroll-restoration
component that delegates to the original history methods, and an auth-failure handler that forces a
full-page reload. Everything else is a finding.

## Documentation coverage — suggestion

A boundary that moved and is not reflected under `docs/architecture/` in the same change is a
suggestion, not a defect: the code is right and the document is behind. Say which document and which
section.

## Reading the output

Every command above returns a candidate list. Open the line and judge it: the exclusions are named in
the rule, and an unnamed exception is a decision nobody made. Paste the candidate list and the
reasoning for what you kept.

## Related

- The rules themselves: [boundaries.md](../../../../architecture/skills/architecture-design/references/boundaries.md)
- Backend service topology: [service-boundaries.md](../../../../../../docs/architecture/service-boundaries.md)
