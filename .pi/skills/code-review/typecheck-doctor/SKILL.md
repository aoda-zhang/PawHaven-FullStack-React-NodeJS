---
name: typecheck-doctor
description: >
  TypeScript type check validation. Dynamically discovers all projects with tsconfig.json
  and runs pnpm typecheck on each. Ensures zero type errors. Any project failure = Blocking.
  Trigger: typecheck TypeScript type error compile error tsc build.
---

# typecheck-doctor — TypeScript Type Check Validation

## Responsibility

Ensure zero TypeScript compile-time type errors across all projects.

## Step 0: Discover Projects with Type Checking

```bash
find apps packages libs -name tsconfig.json -not -path '*/node_modules/*' -not -path '*/dist/*' \
  -not -path '*/build/*'
```

For each `tsconfig.json` found, derive its package name from the nearest `package.json`. Build a list of `{packageName, projectPath}` entries.

If a project's `package.json` includes a `"typecheck"` script, include it. Skip projects that have `tsconfig.json` but no `"typecheck"` script.

Or run the whole tree in one command, which is the normal case at review time:

```bash
pnpm typecheck
```

## Rules

For each project discovered in Step 0, generate a rule:

### Rule N: TypeCheck (<packageName>)

- **Severity**: ❌ Blocking
- **Scope**: frontend / backend / full-stack (auto-detected from project contents)
- **Command**:
  ```bash
  pnpm --filter <packageName> typecheck 2>&1
  ```
  Always run from the workspace root. `pnpm --filter <packageName> typecheck` is the per-project
  form; the root `pnpm typecheck` runs them all through turbo.
- **Validation**: Exit code must be 0. Any non-zero exit or type error in output is a blocking failure.
- **Report**: If failed, include the error output with file paths and line numbers.

## Execution

1. Run Step 0 to discover all typecheck-able projects.
2. Run all `typecheck` commands in PARALLEL (one per project).
3. Check each command's exit code and output.
4. Report: pass (exit 0, no errors) or fail (list errors with file:line).

## Common Derivation Patterns

Examples of how `<packageName>` is derived from `apps/<project>/package.json`:

| tsconfig.json Location                    | package.json `name`      | Command                                          |
| ----------------------------------------- | ------------------------ | ------------------------------------------------ |
| `apps/frontend/portal/tsconfig.json`      | `@pawhaven/portal`       | `pnpm --filter @pawhaven/portal typecheck`       |
| `apps/backend/core-service/tsconfig.json` | `@pawhaven/core-service` | `pnpm --filter @pawhaven/core-service typecheck` |

These are **illustrative examples** — actual projects and names are discovered at runtime. An earlier
version of this table listed `apps/frontend/admin` / `@pawhaven/admin`, which is not a workspace
package; do not add it back.

## Related

- Frontend/backend standards: [react](../../../agents/frontend-dev/skills/react/SKILL.md) · [redux](../../../agents/frontend-dev/skills/redux/SKILL.md)
- Companion doctors: [react-doctor](../react-doctor/SKILL.md) · [style-doctor](../style-doctor/SKILL.md)
