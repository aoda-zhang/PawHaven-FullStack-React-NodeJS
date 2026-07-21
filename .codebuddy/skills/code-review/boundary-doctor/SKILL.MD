---
name: code-review/boundary-doctor
description: >
  Import boundary & package dependency direction detection. Covers cross-feature imports (forbidden),
  packages importing feature code (forbidden), ui -> frontend-core dependency inversion (forbidden),
  backend cross-module internal imports (forbidden). All Blocking.
  Trigger: import boundary cross-feature cross-module package dependency direction module isolation.
version: 3.0
---

# boundary-doctor — Import Boundary & Dependency Direction

## Responsibility

Enforce module isolation and package dependency direction rules to prevent architecture decay.

## Step 0: Discover Feature & Module Directories

All paths are dynamically discovered — no hardcoded project paths.

### Discover frontend feature directories

```
list_dir_or_search: find any directory named "features" under <workspace_root>/apps/
```

From results, determine the active frontend feature root (e.g., `apps/<project>/src/features/`). List its subdirectories to get feature names. Build a disjunction pattern for Rule 1.

### Discover backend module directories

```
list_dir_or_search: find any directory named "modules" under <workspace_root>/apps/
```

From results, determine the backend modules root (e.g., `apps/<project>/src/modules/`). List its subdirectories to get module names. Build a disjunction pattern for Rule 4.

## Rules

### Rule 1: Cross-feature imports

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Tool**: `search_content`
- **Path**: Feature directories root (discovered in Step 0)
- **Pattern**: `from '.*features/(<FEATURE_NAMES_disjunction>)/` — replace `<FEATURE_NAMES_disjunction>` with feature names from Step 0
- **File Types**: `*.ts`, `*.tsx`
- **Explanation**: Feature A must not import from Feature B directly. If code is shared across features, it must graduate to `@pawhaven/ui` or `@pawhaven/frontend-core`.
- **search_content invocation**:
  ```
  pattern: "from '.*features/(featureA|featureB|...)/"
  path: <features_root_from_step0>
  type: "ts"
  outputMode: "content"
  ```

### Rule 2: Packages importing feature code

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Tool**: `search_content`
- **Path**: `<workspace_root>/packages/`
- **Pattern**: `from '.*features/`
- **File Types**: `*.ts`, `*.tsx`
- **Explanation**: Shared packages (`@pawhaven/ui`, `@pawhaven/frontend-core`, etc.) must not depend on app-specific feature code. The dependency direction is: `apps` depends on `packages`, never the reverse.
- **search_content invocation**:
  ```
  pattern: "from '.*features/"
  path: <workspace_root>/packages
  type: "ts"
  outputMode: "content"
  ```

### Rule 3: ui -> frontend-core dependency violation

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Tool**: `search_content`
- **Path**: `<workspace_root>/packages/ui/`
- **Pattern**: `from '@pawhaven/frontend-core'`
- **File Types**: `*.ts`, `*.tsx`
- **Explanation**: The dependency direction is: `@pawhaven/ui` (pure UI) ← `@pawhaven/frontend-core` (logic/hooks) ← `apps` (features). `ui` must not import from `frontend-core`.
- **search_content invocation**:
  ```
  pattern: "from '@pawhaven/frontend-core'"
  path: <workspace_root>/packages/ui
  type: "ts"
  outputMode: "content"
  ```

### Rule 4: Backend cross-module internal imports

- **Severity**: ❌ Blocking
- **Scope**: backend / full-stack
- **Tool**: `search_content`
- **Path**: Backend modules root (discovered in Step 0)
- **Pattern**: `from '.*modules/(<MODULE_NAMES_disjunction>)/` — replace `<MODULE_NAMES_disjunction>` with module names from Step 0
- **File Types**: `*.ts`
- **Explanation**: Backend modules must not import each other's internal files directly. Use the module's public API (service layer) for cross-module communication.
- **search_content invocation**:
  ```
  pattern: "from '.*modules/(moduleA|moduleB|...)/"
  path: <backend_modules_root_from_step0>
  type: "ts"
  outputMode: "content"
  ```

### Rule 5: Feature importing @pawhaven/i18n directly

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Tool**: `search_content`
- **Path**: Feature directories root (discovered in Step 0)
- **Pattern**: `from '@pawhaven/i18n'`
- **File Types**: `*.ts`, `*.tsx`
- **Explanation**: Features and components MUST NOT import from `@pawhaven/i18n` directly. This package is an infrastructure layer (provider config, language detection, resource loading) consumed only by the app root. Features access translation functionality through `react-i18next` hooks (`useTranslation`, `t()`).

### Rule 6: Internal navigation must use React Router

- **Severity**: ❌ Blocking
- **Scope**: frontend / full-stack
- **Tool**: `search_content`
- **Path**: Feature directories root (discovered in Step 0)
- **Pattern**: `window\.history\.(pushState|replaceState|back|forward)|window\.location\.(href|assign|replace)|window\.location\s*=`
- **File Types**: `*.ts`, `*.tsx`
- **Explanation**: All internal page navigation MUST use React Router (`useNavigate().navigate(path)`, `<Link>`, `<Navigate>`). Only external links may use a real anchor (`<a href="https://...">`) or `window.open`. Raw `window.history.pushState`/`replaceState`/`back`/`forward` and `window.location` assignments for internal routes are forbidden — they bypass React Router, break scroll restoration, and desync route state.

**Accepted exceptions:**

- `src/components/ScrollToTop.tsx` — monkey-patches `history.pushState`/`replaceState` to delegate to the original method and add scroll restoration; it does NOT perform navigation.
- Auth-failure hard redirect (`window.location.href = '/auth/login'`) in `src/providers/QueryProvider.tsx` — a forced full-page reload to clear broken session state is intentional, not page-to-page navigation.

## Execution

1. Run Step 0 first to discover feature and module directories.
2. Build the cross-feature and cross-module patterns from discovered names.
3. Run Rules 1–4 in PARALLEL (skip rules whose scope doesn't apply).
4. For Rules 2–3, use `<workspace_root>/packages/` and `<workspace_root>/packages/ui/` — these are monorepo structural conventions, not project-specific paths.
5. All violations are ❌ Blocking.
6. Report: list each violation with filePath, lineNumber, matched import statement, and which rule it violates.

## Related

- Architecture & graduation: [architecture-doctor](../architecture-doctor/SKILL.MD)
- Component graduation: [component](../../frontend/component/SKILL.MD)
- Backend modules: [backend-doctor](../backend-doctor/SKILL.MD)
