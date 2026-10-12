# ESLint Config for Monorepo Projects

This package provides a shared ESLint configuration tailored for monorepo projects, using ESLint v8 with CommonJS setup.

## How to Use in Sub-Packages

Follow these two steps to apply this ESLint config in your sub-packages (e.g., `apps/frontend/user`):

1. **Add the workspace dependency**  
   In your sub-package's `package.json`, add `@pawhaven/eslint-config` as a workspace-aware dependency:

   ```json
   {
     "dependencies": {
       "@pawhaven/eslint-config": "*"
     }
   }
   ```

2. **Extend the config in `.eslintrc.cjs`**  
   In the sub-package root, create or update `.eslintrc.cjs` to extend the desired config:

   ```js
   module.exports = {
     extends: ['@pawhaven/eslint-config/web'],
     // customize or override rules as needed
   };
   ```

## Available Configs

Choose the config that matches your project type:

- Web projects: `'@pawhaven/eslint-config/web'`
- Node.js projects: `'@pawhaven/eslint-config/node'`

## Requirements

Ensure your project uses ESLint v8 or higher and compatible peer dependencies as specified in this package’s `package.json` to prevent conflicts.

---

For more details or issues, check the package source or open an issue.
