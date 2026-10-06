---
name: boundary-doctor
description: >
  Import boundary & package dependency direction detection. Covers cross-feature imports (forbidden),
  packages importing feature code (forbidden), ui -> frontend-core dependency inversion (forbidden),
  backend cross-module internal imports (forbidden), features importing @pawhaven/i18n directly
  (forbidden), raw window navigation (forbidden). All Blocking.
  Trigger: import boundary cross-feature cross-module package dependency direction module isolation.
---

# boundary-doctor — Import Boundary & Dependency Direction

## Responsibility

Enforce module isolation and package dependency direction rules to prevent architecture decay.

## Step 0: Discover Feature & Module Directories

All paths are discovered at runtime — no hardcoded project paths.

### Discover frontend feature directories

```bash
find apps -type d -name features -not -path '*/node_modules/*'
ls apps/frontend/portal/src/features
```

From results, determine the active frontend feature root (`apps/frontend/portal/src/features/`) and
list its subdirectories — those are the feature names for Rule 1.

### Discover backend module directories

```bash
find apps -type d -name modules -not -path '*/node_modules/*'
ls apps/backend/core-service/src/modules
```

Those subdirectories are the module names for Rule 4.

## Rules

### Rule 1: Cross-feature imports

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Path**: the feature root discovered in Step 0
- **Command**:
  ```bash
  rg -n "from '@/features/" apps/frontend/portal/src/features --glob '*.ts' --glob '*.tsx' \
    | grep -v "import type"
  ```
- **Explanation**: Feature A must not import from Feature B directly. If code is shared across
  features, it must graduate to `@pawhaven/ui` or `@pawhaven/frontend-core`.

**The exclusions are load-bearing.** Without them this command returns ~15 hits that are all correct
code, and a doctor that cries wolf gets skipped:

- `src/router/**` is the composition root — `router.tsx` imports every feature's `route.tsx` on
  purpose. The search is scoped to `src/features/` to drop it.
- `import type` is filtered out. `store/globalReducer.ts` and `features/auth/` share
  `ProfileType`, and `utils/getStatusColorByPrefix.ts` reads a type out of `features/home/types` —
  type-only sharing across the app shell is not the violation this rule is about.
- A feature importing from **itself** (`features/home/route.tsx` → `features/home/Home`) is the
  normal case. Only a source/target pair that differs is a finding.

**Known hits — real, and worth reporting, not new:** `features/rescue-detail/components/VolunteerInfo.tsx`
imports `FollowButton` and `FollowerCount` from `features/animal-follow/`;
`features/report-animal/api/reportAnimal.mutations.ts` imports `homeQueryKeys` and
`rescueCasesQueryKeys`; and `features/report-animal/ReportAnimal.tsx` imports `useCurrentUser` from
`features/auth/`. The first is recorded as a defect in `docs/features/README.md`; the other two are
not recorded anywhere. All are pre-existing, so flag them as findings about the codebase, not as
regressions from the change under review.

### Rule 2: Packages importing feature code

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Command**:
  ```bash
  rg -n "from '.*features/" packages --glob '*.ts' --glob '*.tsx' \
    --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/build/**'
  ```
- **Explanation**: Shared packages (`@pawhaven/ui`, `@pawhaven/frontend-core`) must not depend on app-specific feature code. The dependency direction is `apps` → `packages`, never the reverse.

### Rule 3: ui -> frontend-core dependency violation

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Command**:
  ```bash
  rg -n "from '@pawhaven/frontend-core'" packages/ui --glob '*.ts' --glob '*.tsx' \
    --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/build/**'
  ```
- **Explanation**: The direction is `@pawhaven/ui` (pure presentation) ← `@pawhaven/frontend-core`
  (logic/hooks) ← `apps` (features). `ui` must not import from `frontend-core`.

### Rule 4: Backend cross-module internal imports

- **Severity**: ❌ Blocking
- **Scope**: backend / full-stack
- **Path**: the modules root discovered in Step 0
- **Command** — disjunction from the discovered module names:
  ```bash
  rg -n "from '@modules/" apps/backend/core-service/src --glob '*.ts' \
    --glob '!**/*.test.ts' --glob '!**/app.module.ts'
  ```
- **Explanation**: Backend modules must not import each other's internal files. Use the module's
  public API — the service, which is the only thing a module exports. `app.module.ts` is excluded
  because it is the composition root and legitimately imports every module.
- **This command returns nothing today.** A hit is new and blocking, not pre-existing. There is no
  ESLint rule for it, which is why the check is a command rather than a lint.

### Rule 5: Feature importing @pawhaven/i18n directly

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Command**:
  ```bash
  rg -n "from '@pawhaven/i18n'" apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'
  ```
- **Explanation**: Features and components MUST NOT import from `@pawhaven/i18n` directly. That
  package is infrastructure (provider config, language detection, resource loading) consumed only by
  the app root. Features translate through `react-i18next` (`useTranslation`, `t()`).

### Rule 6: Internal navigation must use React Router

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Command**:
  ```bash
  rg -n "window\.history\.(pushState|replaceState|back|forward)|window\.location\.(href|assign|replace)|window\.location\s*=" \
    apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'
  ```
- **Explanation**: All internal page navigation MUST use React Router (`useNavigate`, `<Link>`,
  `<Navigate>`). Only external links may use a real anchor (`<a href="https://...">`) or
  `window.open`. Raw history/location assignment for internal routes bypasses React Router, breaks
  scroll restoration, and desyncs route state.

**Accepted exceptions — known hits, not findings:**

- `apps/frontend/portal/src/components/ScrollToTop.tsx` — monkey-patches
  `history.pushState`/`replaceState` to delegate to the original and add scroll restoration. It does
  not navigate.
- `apps/frontend/portal/src/providers/QueryProvider.tsx` — `window.location.replace(...)` on an auth
  failure. A forced full-page reload that clears broken session state is intentional.

**One known hit that is a real deviation, reported as a warning:**

- `apps/frontend/portal/src/layout/RootLayoutFooter.tsx` — `StandaloneBrand` calls
  `window.location.assign('/')`. It only runs when `useInRouterContext()` is false, so
  `useNavigate` is unavailable there, which is why the rule cannot be satisfied. A plain
  `<a href="/">` would be the better form: it avoids a full reload and does not require JS. Report
  it as ⚠️ Warning against the pre-existing code, not as a blocking finding on the change under
  review.

## Execution

1. Run Step 0 to discover feature and module directories.
2. Build the cross-feature and cross-module patterns from the discovered names.
3. Run Rules 1–6, skipping those whose scope does not apply.
4. Rules 2–3 target `packages/` — a monorepo structural convention, not a project-specific path.
5. All violations are ❌ Blocking, except the one warning named under Rule 6.
6. Report: each violation with file path, line number, the matched import, and the rule it breaks.
   Name the accepted exceptions explicitly when a command hits them, so the next reviewer does not
   re-litigate them. Separate a pre-existing hit from a regression: a codebase that is already
   dirty is not a change that made it dirty.

## Related

- Architecture & graduation: [architecture-doctor](../architecture-doctor/SKILL.md)
- Component graduation: [component](../../component/SKILL.md)
- Backend modules: [backend-doctor](../backend-doctor/SKILL.md)
