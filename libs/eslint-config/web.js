const baseEslintConfig = require('./base.js');

/**
 * Web ESLint configuration for PawHaven frontend projects.
 * Extends the shared base config and adds React + React Query specific rules.
 */
module.exports = {
  ...baseEslintConfig,

  // Merge "extends" from base with additional React-specific ones
  extends: [
    ...baseEslintConfig.extends,
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  // Define the environments that the code is designed to run in.
  // This enables global variables predefined by these environments.
  env: {
    browser: true, // Enables browser global variables like window and document
    es2022: true, // Enables all ECMAScript 2022 globals and syntax
  },

  // Merge base plugins with additional frontend-specific plugins
  plugins: [
    ...baseEslintConfig.plugins,
    '@tanstack/query',
    '@pawhaven/eslint-plugin-design-colors',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
    // The design-token rules read the token vocabulary from the design-system
    // CSS at lint time, so the CSS stays the single source of truth.
    'design-colors': {
      cssFiles: [
        'packages/design-system/src/tokens',
        'packages/design-system/src/theme.css',
        'packages/design-system/src/utilities.css',
      ],
      // Domain tokens that live in the app that owns the domain.
      extraCssFiles: [
        'apps/frontend/portal/src/shared/utils/rescue-status/rescueStatusColors.css',
      ],
    },
  },

  rules: {
    ...baseEslintConfig.rules,

    // React-related rules
    'react/react-in-jsx-scope': 'off', // Not required since React 17+
    'react/prop-types': 'off', // Prop types handled by TypeScript
    'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.tsx'] }],
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    'jsx-a11y/anchor-is-valid': 'off', // Disable overly strict accessibility checks

    // TypeScript-related overrides
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error', // Enforce type safety
    '@typescript-eslint/explicit-function-return-type': 'off',

    // Import-related rules (reuse from base to avoid override)
    'import/order': baseEslintConfig.rules['import/order'],

    // General JavaScript rules
    'no-console': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',

    // React Query plugin rules
    '@tanstack/query/exhaustive-deps': 'error',

    // Design-system token rules.
    // no-inline-style stays a warning: the design system still has
    // legitimate inline styles (scroll-snap) that the team may want to allow.
    '@pawhaven/design-colors/no-unknown-color': 'error',
    '@pawhaven/design-colors/no-raw-color': 'error',
  },

  overrides: [
    ...(baseEslintConfig.overrides || []),
    {
      files: ['**/tests/**/*.{ts,tsx,js,jsx}', '**/*.{test,spec}.{ts,tsx}'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
        'no-magic-numbers': 'off',
      },
    },
    {
      // A test file mirrors the name of the file it tests, and the two
      // naming conventions differ per package, so it is not governed here.
      files: ['**/*.{test,spec}.{ts,tsx}'],
      rules: {
        'check-file/filename-naming-convention': 'off',
      },
    },
    {
      // Storybook requires this directory to be named `.storybook`.
      files: ['**/.storybook', '**/.storybook/**'],
      rules: {
        'check-file/folder-naming-convention': 'off',
      },
    },
    {
      files: ['vitest.config.*', 'vite.config.*'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
        'import/no-default-export': 'off',
      },
    },
    {
      files: ['**/*.setup.ts', '**/*.setup.tsx'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
      },
    },
  ],
};
