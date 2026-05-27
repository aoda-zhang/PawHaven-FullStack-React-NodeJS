# PawHaven design token Package

This package provides shared theme resources—including colors, fonts, spacing, and global styles—for the entire PawHaven monorepo. It centralizes design tokens and style definitions to ensure consistency across all projects.

## Usage

Sub-packages within the monorepo can import theme values directly from this package without duplicating files. This workspace-aware setup simplifies maintenance and promotes reuse.

### Importing token values

You can import specific theme parts like colors or spacing as follows:

```js
import { colors, spacing } from '@pawhaven/design-system';

console.log(colors.primary);
console.log(spacing.md);
```

Use these imports in your frontend apps or other packages to apply consistent styling throughout PawHaven projects.
