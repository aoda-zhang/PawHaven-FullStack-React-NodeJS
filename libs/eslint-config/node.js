const baseEslintConfig = require('./base.js');

/**
 * Node.js ESLint configuration for PawHaven backend services.
 * Extends the shared base config and adds server-side specific rules and environments.
 */
module.exports = {
  ...baseEslintConfig,

  // Define the environments that the code is designed to run in.
  // This enables global variables predefined by these environments.
  env: {
    node: true, // Enables Node.js global variables and Node.js scoping
    es2022: true, // Enables all ECMAScript 2022 globals and syntax
  },
  settings: {
    node: {
      version: '>=24.0.0',
    },
  },
  // Merge base extensions with Node-relevant plugin configurations
  extends: [
    ...baseEslintConfig.extends,
    'plugin:node/recommended', // Adds recommended Node.js rules
  ],

  rules: {
    ...baseEslintConfig.rules,

    // Function-size guard: one function should fit in a reviewable screen.
    'max-lines-per-function': [
      'error',
      { max: 30, skipBlankLines: true, skipComments: true },
    ],

    // Node.js specific adjustments
    'no-console': 'off', // Allow console for server logging
    'node/no-missing-import': 'off', // Allow unresolved imports handled by bundlers or TypeScript
    'node/no-unpublished-import': 'off', // Disable false positives for monorepo setups
    'node/no-extraneous-import': 'off', // Allow imports from shared workspace packages

    // TypeScript-specific overrides
    '@typescript-eslint/no-var-requires': 'off', // Allow require() in Node.js scripts
    'no-useless-constructor': 'off',
    'no-empty-function': ['error', { allow: ['constructors'] }], // Allow empty constructors for dependency injection
    '@typescript-eslint/no-useless-constructor': 'off', // Allow constructors with only dependency injection
    '@typescript-eslint/no-explicit-any': 'warn', // Warn on use of any
    '@typescript-eslint/explicit-function-return-type': 'warn', // Recommend explicit return types in backend
    'prefer-const': 'warn',
    'no-var': 'error', // Disallow var
    'import/order': ['warn', { 'newlines-between': 'always' }], // Enforce import order
    'class-methods-use-this': 'off', // Service methods may not use 'this'
    'max-classes-per-file': ['warn', 1], // One class per file
    'no-empty-function': 'off',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['params'],
      },
    ],
    '@typescript-eslint/no-empty-function': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'eslintnode/no-unsupported-features/es-syntax': 'off',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        endOfLine: 'auto',
      },
    ],
    'no-underscore-dangle': 'warn',
    '@typescript-eslint/consistent-type-imports': 'off',
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'prettier/prettier': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
  },

  overrides: [
    ...(baseEslintConfig.overrides || []),
    {
      files: ['**/tests/**/*.{ts,tsx,js,jsx}', '**/*.{test,spec}.{ts,tsx}'],
      rules: {
        'max-lines-per-function': 'off',
      },
    },
  ],
};
