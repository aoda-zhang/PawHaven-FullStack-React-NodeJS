# PawHaven Shared TypeScript Configurations

This package provides shared TypeScript configuration presets for the PawHaven monorepo, enabling consistent and maintainable TypeScript setups across all sub-packages.

## Usage

Follow these two steps to apply this tsconfig config in your sub-packages (e.g., `apps/frontend/portal`):

1. Add `@pawhaven/tsconfig` to your sub-package's `package.json` dependencies (workspace-aware):

```json
{
  "dependencies": {
    "@pawhaven/tsconfig": "*"
  }
}
```

2. Extend the shared TypeScript config in your sub-package's `tsconfig.json`:

```json
{
  "extends": "@pawhaven/tsconfig/web",
  "compilerOptions": {
    // your overrides here
  }
}
```

Available presets include:

- `@pawhaven/tsconfig/web` — for web projects
- `@pawhaven/tsconfig/node` — for Node.js projects

## Features

- **Workspace resolution:** Sub-packages can reference these configs directly without copying files.
- **Consistency:** Centralized config ensures uniform compiler options across the monorepo.

## Notes

- Ensure your TypeScript version is compatible with the shared configs.
- When extending, configure `paths` and `baseUrl` in your sub-package as needed to resolve modules correctly.
- Avoid duplicating configs; rely on this package to keep settings centralized and up to date.

## VSCode Path Aliases for IntelliSense

To enable IntelliSense and autocomplete for TypeScript path aliases (e.g., `@pawhaven/*`) in VSCode, you should also add corresponding path mappings to your workspace or project `.vscode/settings.json`. This helps VSCode resolve aliases for navigation and suggestions.

**Example:**

```json
{
  "path-autocomplete.pathMappings": {
    "@pawhaven/ui/*": "${workspaceFolder}/packages/ui/*",
    "@pawhaven/frontend-core/*": "${workspaceFolder}/packages/shared-frontend/*"
  },
  "path-autocomplete.extensionOnImport": true
}
```

Adjust the path (`../packages/*`) as needed for your workspace structure. This ensures that VSCode recognizes and autocompletes the `@pawhaven/*` imports.
