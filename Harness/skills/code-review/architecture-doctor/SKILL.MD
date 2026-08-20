---
name: code-review/architecture-doctor
description: >
  Architecture & design compliance detection. Covers cross-module imports (forbidden),
  package dependency direction (ui -> frontend-core inverted, forbidden),
  cross-feature imports (forbidden), component graduation (2+ features must promote),
  feature folder structure, API design consistency, shared type ownership, ADR references.
  Trigger: architecture boundaries dependency direction module isolation graduation package layering.
version: 3.0
---

# Architecture Doctor

> **Part of**: Code Review Skill Set
> **Layer**: Deep Review — Architecture & Design
> **Applies to**: full-stack, backend, frontend (when feature structure affected)
> **Severity**: Violations are classified as Blocking / Warning / Suggestion

## Purpose

Verify that the codebase follows the defined architecture rules:

- Module responsibility and domain boundaries
- Dependency direction (no circular or reversed dependencies)
- Package boundary enforcement
- Feature isolation (no cross-feature imports)
- API design consistency (REST patterns, DTO placement, event contracts)
- Graduation rules (components promoted to shared packages when needed)

## Scope Detection

Before running checks, detect what's changed:

```bash
# Get changed files vs develop
git diff --name-only develop...HEAD
```

Classify by scope:

- `backend/**` → backend architecture checks
- `apps/frontend/**` → frontend architecture checks
- `packages/**` → package boundary checks
- All → full architecture audit

---

## Rule 1: Cross-Module Import Check (Backend)

**Severity**: Blocking

Check that no module imports another module's internals:

```bash
# Find cross-module imports that bypass the service facade
grep -rn "from '\.\.\/.*\/modules\/" apps/backend/core-service/src/ \
  --include="*.ts" \
  | grep -v "\.service" \
  | grep -v "\.module"
```

**What to look for:**

- `modules/rescue/` importing from `modules/content/entities/` → Blocking
- `modules/rescue/` importing from `modules/content/content.service.ts` → OK (public API via DI)
- `modules/rescue/` importing from `modules/content/DTO/` → Blocking

**Report format:**

```
❌ [Blocking] Cross-module import: modules/rescue/use-cases/foo.usecase.ts:5
   imports from '../../content/DTO/story.dto' — use ContentService facade instead
```

---

## Rule 2: Package Dependency Direction Check

**Severity**: Blocking

Verify no package imports violate the dependency direction:

```
Dependency direction:
shared ← design-system ← ui ← frontend-core ← portal / admin
shared ← backend services
```

```bash
# Check @pawhaven/ui does NOT import from frontend-core or features
grep -rn "from '@pawhaven/frontend-core'" packages/ui/src/ --include="*.ts" --include="*.tsx"

# Check @pawhaven/frontend-core does NOT import from features
grep -rn "from.*features/" packages/frontend-core/src/ --include="*.ts" --include="*.tsx"

# Check @pawhaven/design-system does NOT import from ui or frontend-core
grep -rn "from '@pawhaven/ui'" packages/design-system/ --include="*.ts" --include="*.tsx"
grep -rn "from '@pawhaven/frontend-core'" packages/design-system/ --include="*.ts" --include="*.tsx"
```

**Report format:**

```
❌ [Blocking] Package dependency violation: packages/ui/src/Button.tsx:3
   imports from '@pawhaven/frontend-core' — ui cannot depend on frontend-core
```

---

## Rule 3: Cross-Feature Import Check (Frontend)

**Severity**: Blocking

Features must not import from other features:

```bash
# Find cross-feature imports
grep -rn "from '.*features/" apps/frontend/portal/src/features/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "from '.*features/queryKeys'" \
  | grep -v "from '\.\/"
```

**What to look for:**

- `features/Home/` importing from `features/RescueDetail/` → Blocking
- `features/RescueGuide/` importing from `features/Home/` → Blocking
- Importing from `features/queryKeys.ts` → OK (shared key re-export hub)

**Report format:**

```
❌ [Blocking] Cross-feature import: features/Home/components/Hero.tsx:4
   imports from 'features/RescueDetail/types' — graduate shared types to @pawhaven/shared
```

---

## Rule 4: Component Graduation Check

**Severity**: Warning

Check if any component is used by 2+ features but hasn't been graduated:

```bash
# Find components used across multiple features
# Strategy: search for component imports, then count unique feature directories
grep -rn "from '.*components/" apps/frontend/portal/src/features/ \
  --include="*.tsx" \
  | grep -v "from '\.\/"
```

**What to look for:**

- Same component imported from 2+ different feature directories → Warning (should graduate)
- Component in `packages/ui/` imported from only 1 feature → Suggestion (could be feature-private)

**Report format:**

```
⚠️ [Warning] Component needs graduation: RescueCard is imported by features/Home/components/Hero.tsx
   and features/RescueDetail/components/RescueTimeline.tsx
   → Move to @pawhaven/ui if pure UI, or @pawhaven/frontend-core if business-aware
```

---

## Rule 5: Feature Folder Structure Check

**Severity**: Warning

Verify features follow the standard structure:

```bash
# List all feature directories
ls -d apps/frontend/portal/src/features/*/
```

For each feature, check:

- Has `index.tsx` (entry point)?
- Has `types.ts` (feature types)?
- Has `api/` directory with `<module>.api.ts` + `<module>.queryKeys.ts`, plus `queries.ts` / `mutations.ts` ONLY when a relevant hook exists?
- `queries.ts` (if present) only exports `useQuery` hooks (GET requests) — no `useMutation`?
- `mutations.ts` (if present) only exports `useMutation` hooks (POST/PUT/PATCH/DELETE) — no `useQuery`?
- No duplication between `queries.ts` and `mutations.ts`?
- No empty `queries.ts` / `mutations.ts` (no `export {};` placeholders)?
- Components are in `components/` subdirectory (not at feature root)?
- No business logic in generic `src/components/`?

**Report format:**

```
⚠️ [Warning] Feature structure: features/RescueGuide/ is missing types.ts
   → Add types.ts for RescueGuide-specific type definitions
```

---

## Rule 6: Module Responsibility Audit (Backend)

**Severity**: Warning

Verify each module only handles its own domain:

```bash
# List all modules and their public service exports
for dir in apps/backend/core-service/src/modules/*/; do
  echo "=== $(basename $dir) ==="
  grep -l "export class.*Service" "$dir"*.ts 2>/dev/null || echo "  No service"
done
```

**What to look for:**

- Module A's service contains business logic for Module B's domain → Warning
- Module has no clear aggregate root → Warning
- Module exports internal entities/use-cases (not just service facade) → Warning

**Report format:**

```
⚠️ [Warning] Module responsibility: modules/rescue/content.service.ts
   contains story management logic — should be in modules/content/
```

---

## Rule 7: API Design Consistency Check

**Severity**: Warning

Verify API patterns are consistent:

```bash
# Check controller route patterns
grep -rn "@Controller\|@Get\|@Post\|@Put\|@Delete\|@Patch" \
  apps/backend/core-service/src/modules/ --include="*.controller.ts"
```

**What to look for:**

- Inconsistent URL patterns (e.g., `/api/rescue-cases` vs `/api/rescues`)
- Inconsistent response shapes (some wrap in `{ data }`, others don't)
- Missing validation pipes (no `ZodValidationPipe`)
- Controllers directly calling use-cases (should go through service facade)

**Report format:**

```
⚠️ [Warning] API inconsistency: modules/report-stray/report-stray.controller.ts
   uses URL pattern /api/stray-reports but rescue module uses /api/rescues
   → Standardize on plural resource naming: /api/reports
```

---

## Rule 8: Shared Type Ownership Check

**Severity**: Warning (full-stack only)

Verify types exist in `@pawhaven/shared`, not duplicated:

```bash
# Check for duplicate type definitions
# Frontend types that should be in @pawhaven/shared
grep -rn "interface.*Dto\|type.*Dto\|interface.*Type" \
  apps/frontend/portal/src/features/ --include="*.ts" \
  | grep -v "node_modules"
```

**What to look for:**

- Frontend defines DTO types that should be in `@pawhaven/shared` → Warning
- Backend defines types outside `@pawhaven/shared` → Warning
- Same Zod schema defined in both frontend and backend → Blocking

**Report format:**

```
⚠️ [Warning] Duplicate type: features/RescueDetail/types.ts defines RescueDetailType
   but @pawhaven/shared already has RescueCase type — use the shared type
```

---

## Rule 9: ADR Reference Check

**Severity**: Suggestion

Verify architecture decisions are documented:

```bash
# List existing ADRs
ls Harness/docs/ADR/
```

**What to look for:**

- Significant architecture change without a corresponding ADR → Suggestion
- ADR metadata out of date (status not updated when superseded) → Warning

**Report format:**

```
💡 [Suggestion] Missing ADR: The new notification module introduces a new event pattern.
   Consider creating ADR-003-notification-events.md to document the decision.
```

---

## Output Format

```
## Architecture Doctor Report

### Scope: {backend|frontend|full-stack}
### Changed files: N

### ❌ Blocking Issues
| # | Rule | File | Line | Issue |
|---|------|------|------|-------|
| 1 | Cross-module import | ... | ... | ... |

### ⚠️ Warnings
| # | Rule | File | Line | Issue |
|---|------|------|------|-------|
| 1 | Component needs graduation | ... | ... | ... |

### 💡 Suggestions
| # | Rule | File | Line | Issue |
|---|------|------|------|-------|
| 1 | Missing ADR | N/A | N/A | ... |

### Summary
- X Blocking, Y Warnings, Z Suggestions
- Architecture health: 🟢 Good / 🟡 Needs Attention / 🔴 Critical Issues

## Related

- Best practices: [references/best-practices.md](references/best-practices.md)
- Boundaries: [boundary-doctor](../boundary-doctor/SKILL.MD) · styling: [style-doctor](../style-doctor/SKILL.MD)
- Component graduation: [component](../../frontend/component/SKILL.MD)
```
