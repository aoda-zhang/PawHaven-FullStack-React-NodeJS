/**
 * Base ESLint configuration for PawHaven monorepo projects.
 * Updated for ESLint v8+, TypeScript ESLint v6+, and monorepo best practices.
 */
module.exports = {
  root: true, // Ensure this is the root ESLint config to avoid accidental inheritance

  // Tool config files (vitest, postcss, ...) are required to use default exports.
  ignorePatterns: [
    '**/*.config.ts',
    '**/*.config.js',
    '**/*.config.cjs',
    '**/*.config.mjs',
    '**/*.config.json',
  ],

  // Specify parser for TypeScript
  parser: '@typescript-eslint/parser',

  // Parser options for modern JS and JSX
  parserOptions: {
    ecmaVersion: 'latest', // Use latest ECMAScript features
    sourceType: 'module', // Enable ES modules
  },

  // Plugins extend ESLint with additional rules
  plugins: [
    '@typescript-eslint', // TypeScript-specific rules
    'prettier', // Integrate Prettier formatting rules
    'import', // Validate imports
    'check-file', // Enforce file/folder naming conventions
  ],

  // Extend shared configurations
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended', // Recommended TypeScript rules
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:prettier/recommended', // Prettier integration
  ],

  rules: {
    // ----------------------------
    // Prettier integration
    // ----------------------------
    'prettier/prettier': 'error',

    // ----------------------------
    // General JS rules
    // ----------------------------
    'no-console': 'warn', // Warn on console usage
    'no-debugger': 'warn', // Warn on debugger statements
    'no-alert': 'warn', // Warn on alert usage

    // ----------------------------
    // Import rules
    // ----------------------------
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node built-in modules
          'external', // npm modules
          'internal', // internal packages
          'parent', // parent dirs
          'sibling', // sibling files
          'index', // index files
          'object', // object imports
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/newline-after-import': ['error', { count: 1 }],
    'import/no-duplicates': 'error',
    'import/default': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-default-export': 'error',
    'import/prefer-default-export': 'off',

    // ----------------------------
    // TypeScript rules
    // ----------------------------
    'no-unused-vars': 'off', // Disable base rule
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false },
    ],
    '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
    '@typescript-eslint/ban-ts-comment': [
      'warn',
      { 'ts-ignore': 'allow-with-description' },
    ],

    // ----------------------------
    // Other best practices
    // ----------------------------
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],

    // ----------------------------
    // File naming convention
    // ----------------------------
    // Enforce camelCase for source + config files (no snake_case, no kebab-case).
    // React components (.tsx) use PascalCase. JSON files (e.g. i18n locale
    // resources, tsconfig) must be camelCase too. ignoreMiddleExtensions lets
    // "config.schema.ts" / "*.client.ts" validate only the first segment.
    // NOTE: nest-cli.json is exempted in .eslintignore (NestJS tool config).
    'check-file/filename-naming-convention': [
      'error',
      {
        '**/!(main|route|router).tsx': 'PASCAL_CASE',
        '**/!(*.schema|*.types|*.type|*.dto).ts': 'CAMEL_CASE',
        '**/*.{js,jsx,cjs,mjs}': 'CAMEL_CASE',
        '**/*.json': 'CAMEL_CASE',
      },
      { ignoreMiddleExtensions: true },
    ],

    'check-file/folder-naming-convention': [
      'error',
      { '**/': 'KEBAB_CASE' },
      { ignoreWords: ['de-DE', 'en-US', 'zh-CN'] },
    ],

    'no-void': 'error',
    'no-magic-numbers': [
      'warn',
      { ignore: [0, 1, -1], ignoreArrayIndexes: true },
    ],
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['state'], // allow modifying state (common in stores)
      },
    ],
  },

  // ----------------------------
  // JSON data files
  // ----------------------------
  // JSON files carry no executable code, so only the filename naming rule
  // (check-file/filename-naming-convention) should apply. The JS/TS rule set
  // otherwise misfires on JSON literals — e.g. @typescript-eslint/no-unused-
  // expressions flags the root object, no-magic-numbers flags numeric values,
  // and prettier reports formatting. Disable those for *.json.
  overrides: [
    {
      files: ['**/*.json'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off',
        'no-unused-expressions': 'off',
        'no-magic-numbers': 'off',
        'prettier/prettier': 'off',
      },
    },
    {
      files: [
        '**/types/**/!(index).ts',
        '**/dto/**/!(index).ts',
        '**/*.schema.ts',
        '**/*.types.ts',
        '**/*.type.ts',
        '**/*.dto.ts',
      ],
      rules: {
        'check-file/filename-naming-convention': [
          'error',
          { '**/*.ts': 'PASCAL_CASE' },
          { ignoreMiddleExtensions: true },
        ],
      },
    },
  ],
};
