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
  plugins: [...baseEslintConfig.plugins, '@tanstack/query'],
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
  },

  overrides: [
    {
      files: ['**/tests/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
        'no-magic-numbers': 'off',
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
  ],
};
