---
name: code-review/style-doctor
description: >
  Styling violation detection. Covers hex colors (forbidden), raw Tailwind color names (warning),
  CSS variable bypass (forbidden), magic numbers (pixel/blur values, warning), Prettier format check (warning).
  All based on @pawhaven/design-system design token spec.
  Trigger: style CSS hex color magic number CSS variable bypass design token Prettier format.
version: 3.0
---

# style-doctor — Styling & Design Token Validation

## Responsibility

Detect all styling violations against the design system. All styles must use `@pawhaven/design-system` design tokens — no hardcoded values.

## Step 0: Discover Frontend Source Directories

Dynamically locate frontend source directories so rules are project-agnostic and robust across Tailwind v3/v4 and Vite plugin setups. **Never rely solely on `tailwind.config.*` for discovery.**

### Strategy 1: known frontend apps
Find every `src/` directory under `apps/frontend/`:

```
search_file: pattern="**/src/" target_directory=<workspace_root>/apps/frontend recursive=true
```

### Strategy 2: Vite + source projects
Find every project directory that contains both `vite.config.ts` (or `vite.config.js`) and a `src/` folder:

```
search_file: pattern="**/vite.config.ts" target_directory=<workspace_root> recursive=true
search_file: pattern="**/vite.config.js" target_directory=<workspace_root> recursive=true
```

For each `vite.config.*` found, derive its parent project directory and verify that a `src/` directory exists at the same level.

### Strategy 3: tailwind config (last resort)
If the first two strategies return nothing, fall back to:

```
search_file: pattern="**/tailwind.config.*" target_directory=<workspace_root> recursive=true
```

From each tailwind config, derive the parent project's `src/` directory.

### Fail-fast
If none of the strategies return at least one frontend source directory, **STOP** and report a configuration error. Do not silently run scans on an empty target set.

### Target list output
Before running any style rule, list every discovered frontend source directory in the report. This prevents silent empty scans.

Use the discovered paths throughout all search rules below.

## Rules

### Rule 1: Raw hex colors

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Frontend source directories (discovered in Step 0)
- **Pattern**: `#[0-9a-fA-F]{3,8}`
- **File Types**: `*.tsx`, `*.css`
- **Exclude**: `node_modules/`, `dist/`
- **Explanation**: Hex colors like `#fff` or `#f7823a` are forbidden. Always use design tokens from `@pawhaven/design-system` (e.g., `bg-surface-primary` instead of `#ffffff`).
- **search_content invocation**:
  ```
  pattern: "#[0-9a-fA-F]{3,8}"
  path: <frontend_src_dirs_from_step0>
  type: "tsx"
  outputMode: "content"
  ```

### Rule 2: Raw Tailwind color names

- **Severity**: ⚠️ Warning
- **Tool**: `search_content`
- **Path**: Frontend source directories (discovered in Step 0)
- **Pattern**: `(text|bg|border)-(red|blue|green|yellow|orange|gray|brown)-[0-9]+`
- **File Types**: `*.tsx`
- **Exclude**: `node_modules/`
- **Explanation**: Raw Tailwind color utilities like `text-red-500` or `bg-blue-100` bypass the design token system. Use semantic tokens instead (e.g., `text-error-primary`, `bg-surface-secondary`).
- **search_content invocation**:
  ```
  pattern: "(text|bg|border)-(red|blue|green|yellow|orange|gray|brown)-[0-9]+"
  path: <frontend_src_dirs_from_step0>
  type: "tsx"
  outputMode: "content"
  ```

### Rule 3: CSS variable bypass

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Frontend source directories (discovered in Step 0)
- **Pattern**: `(bg|text|border|ring|outline|shadow|accent|caret|fill|stroke|placeholder|decoration)-\[var\(--color-`
- **File Types**: `*.tsx`
- **Exclude**: `node_modules/`
- **Explanation**: Using CSS custom properties inside Tailwind arbitrary values like `bg-[var(--color-primary)]` is forbidden. Use the design token utility class directly instead.
- **search_content invocation**:
  ```
  pattern: "(bg|text|border|ring|outline|shadow|accent|caret|fill|stroke|placeholder|decoration)-\\[var\\(--color-"
  path: <frontend_src_dirs_from_step0>
  type: "tsx"
  outputMode: "content"
  ```

### Rule 4: Magic pixel values

- **Severity**: ⚠️ Warning
- **Tool**: `search_content`
- **Path**: Frontend source directories (discovered in Step 0)
- **Pattern**: `(w|h|mt|mb|ml|mr|pt|pb|pl|pr|p|m|left|right|top|bottom|gap)-\[[0-9]+px\]`
- **File Types**: `*.tsx`
- **Exclude**: `node_modules/`
- **Explanation**: Arbitrary pixel values like `w-[317px]` or `mt-[12px]` should use the design token spacing/sizing scale. The design system defines a constrained set of sizes.
- **search_content invocation**:
  ```
  pattern: "(w|h|mt|mb|ml|mr|pt|pb|pl|pr|p|m|left|right|top|bottom|gap)-\\[[0-9]+px\\]"
  path: <frontend_src_dirs_from_step0>
  type: "tsx"
  outputMode: "content"
  ```

### Rule 5: Magic filter/blur values

- **Severity**: ⚠️ Warning
- **Tool**: `search_content`
- **Path**: Frontend source directories (discovered in Step 0)
- **Pattern**: `(blur|backdrop-blur|brightness|contrast|saturate|sepia|grayscale)-\[[0-9]+`
- **File Types**: `*.tsx`
- **Exclude**: `node_modules/`
- **Explanation**: Arbitrary filter and blur values like `backdrop-blur-[12px]` should use design tokens or predefined scale values.
- **search_content invocation**:
  ```
  pattern: "(blur|backdrop-blur|brightness|contrast|saturate|sepia|grayscale)-\\[[0-9]+"
  path: <frontend_src_dirs_from_step0>
  type: "tsx"
  outputMode: "content"
  ```

### Rule 6: Prettier format check

- **Severity**: ⚠️ Warning
- **Tool**: `execute_command`
- **Command**:
  ```bash
  npx prettier --check "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}" 2>&1
  ```
  Run from the workspace root. The `apps/**` and `packages/**` globs cover all projects without hardcoded names.
- **Validation**: If the command reports unformatted files, it is a warning. Non-zero exit code due to unformatted files = warning.
- **Report**: List the unformatted file paths.

## Execution

1. Run Step 0 to discover frontend source directories. **Output the discovered directories explicitly.**
2. If zero directories are discovered, **fail-fast** with a configuration error.
3. Run Rules 1-5 (search_content) in PARALLEL on the discovered paths.
4. Run Rule 6 (execute_command) in the same parallel batch.
5. Categorize each match by severity.
6. Report: list discovered directories, then list each violation with filePath, lineNumber, matched content, and which rule it violates.
