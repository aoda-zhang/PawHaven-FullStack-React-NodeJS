# ESLint config: how it is built and shared

> This document covers the **architecture of the lint layer**: what each config owns, how a new app
> or service picks it up, and where the project-specific rules live. The rule reference itself lives
> in `libs/eslint-config/README.md` — not repeated here.

## What I built

`libs/eslint-config` is a **private workspace package** (`@pawhaven/eslint-config`) that holds one
config per project type:

| Config | Entry     | Owns                                                                       |
| ------ | --------- | -------------------------------------------------------------------------- |
| `base` | `base.js` | TypeScript parser, Prettier, import ordering, file naming, shared TS rules |
| `web`  | `web.js`  | Browser apps: React, React Hooks, TanStack Query, design-colors plugin     |
| `node` | `node.js` | Backend services: Node env, server-side allowances                         |

Each app's `.eslintrc.cjs` is a single `extends` line — there is no duplicated rule logic in any app:

```js
// apps/frontend/portal/.eslintrc.cjs
module.exports = {
  extends: ['@pawhaven/eslint-config/web'],
};

// apps/backend/core-service/.eslintrc.cjs
module.exports = {
  extends: ['@pawhaven/eslint-config/node'],
};
```

## Why a separate package

Without it, every app would repeat the same parser, plugin list, import-order groups, and
airbnb-base preset. A shared package means **one place to change a rule** — for example adding
`@tanstack/query/exhaustive-deps` or the design-colors plugin — and every app picks it up on the
next install.

## Project-specific rules: the design-colors plugin

`@pawhaven/eslint-plugin-design-colors` lives in
`libs/eslint-config/plugin/design-colors/` and ships two rules:

- `no-raw-color` — bans hex / `rgb()` / `hsl()` / `oklch()` colour literals in source.
- `no-unknown-color` — bans any class that reads a design-token namespace but does not resolve to an
  actual token in the design-system CSS.

The valid token list is **not hard-coded**. At lint time it is read from `packages/design-system/`
CSS, so a token can never pass the linter while missing from the stylesheet:

```js
settings: {
  'design-colors': {
    cssFiles: [
      'packages/design-system/src/tokens',
      'packages/design-system/src/theme.css',
      'packages/design-system/src/utilities.css',
    ],
    extraCssFiles: [
      'apps/frontend/portal/src/shared/utils/rescueStatus/rescueStatusColors.css',
    ],
  },
},
```

This rule only applies to `web` apps; `node` does not load it.

## How to add a new app or service

1. **Add the dependency** in the new package's `package.json`:

   ```json
   {
     "dependencies": {
       "@pawhaven/eslint-config": "*"
     }
   }
   ```

2. **Create `.eslintrc.cjs`** extending the matching config:

   ```js
   // web app
   module.exports = { extends: ['@pawhaven/eslint-config/web'] };

   // node service
   module.exports = { extends: ['@pawhaven/eslint-config/node'] };
   ```

3. **Add `lint` to the package scripts** if it does not have one:

   ```json
   {
     "scripts": { "lint": "eslint . --ext .ts,.tsx" }
   }
   ```

4. **Run `pnpm lint`** at the repo root — `turbo run lint` runs every package's `lint` script in
   parallel.

## What quality is guaranteed

| Guarantee     | How                                                                                     | Runs in                |
| ------------- | --------------------------------------------------------------------------------------- | ---------------------- |
| Import order  | `import/order` groups: builtin → external → parent → sibling → index → internal (`@/…`) | `pnpm lint`            |
| Types         | `@typescript-eslint` recommended + `consistent-type-imports`                            | `pnpm lint`            |
| Formatting    | `prettier/prettier`                                                                     | `pnpm lint`            |
| Design tokens | `no-raw-color` + `no-unknown-color`, read from design-system CSS                        | `pnpm lint` (web only) |
| Unused vars   | `@typescript-eslint/no-unused-vars`                                                     | `pnpm lint`            |

## Related documents

- `libs/eslint-config/README.md` — how to consume `@pawhaven/eslint-config` in a sub-package
- `libs/eslint-config/plugin/design-colors/README.md` — the two design-colour rules in detail
- [Design Tokens](design-tokens.md) — where the component colours come from (the lint rules read
  this CSS at lint time)
