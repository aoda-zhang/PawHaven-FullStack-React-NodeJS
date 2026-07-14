---
name: code-review/typecheck-doctor
description: >
  TypeScript type check validation. Dynamically discovers all projects with tsconfig.json
  and runs pnpm typecheck on each. Ensures zero type errors. Any project failure = Blocking.
  Trigger: typecheck TypeScript type error compile error tsc build.
version: 3.0
---

# typecheck-doctor — TypeScript Type Check Validation

## Responsibility

Ensure zero TypeScript compile-time type errors across all projects.

## Step 0: Discover Projects with Type Checking

Dynamically locate all projects that have TypeScript type checking configured:

```
search_file: pattern="**/tsconfig.json" target_directory=<workspace_root>/apps/ recursive=true
```

For each `tsconfig.json` found, derive its package name from the nearest `package.json`. Build a list of `{packageName, projectPath}` entries.

If a project's `package.json` includes a `"typecheck"` script, include it. Skip projects that have `tsconfig.json` but no `"typecheck"` script.

## Rules

For each project discovered in Step 0, generate a rule:

### Rule N: TypeCheck (<packageName>)

- **Severity**: ❌ Blocking
- **Scope**: frontend / backend / full-stack (auto-detected from project contents)
- **Tool**: `execute_command`
- **Pre-condition**: `tsconfig.json` exists and `package.json` has `"typecheck"` script
- **Command**:
  ```bash
  pnpm --filter <packageName> typecheck 2>&1
  ```
  Always run from the workspace root.
- **Validation**: Exit code must be 0. Any non-zero exit or type error in output is a blocking failure.
- **Report**: If failed, include the error output with file paths and line numbers.

## Execution

1. Run Step 0 to discover all typecheck-able projects.
2. Run all `typecheck` commands in PARALLEL (one per project).
3. Check each command's exit code and output.
4. Report: pass (exit 0, no errors) or fail (list errors with file:line).

## Common Derivation Patterns

Examples of how `<packageName>` is derived from `apps/<project>/package.json`:

| tsconfig.json Location | package.json `name` | Command |
|---|---|---|
| `apps/frontend/portal/tsconfig.json` | `@pawhaven/portal` | `pnpm --filter @pawhaven/portal typecheck` |
| `apps/frontend/admin/tsconfig.json` | `@pawhaven/admin` | `pnpm --filter @pawhaven/admin typecheck` |
| `apps/backend/core-service/tsconfig.json` | `@pawhaven/core-service` | `pnpm --filter @pawhaven/core-service typecheck` |

These are **illustrative examples** — actual projects and names are discovered at runtime.
