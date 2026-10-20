module.exports = {
  extends: [
    '@pawhaven/eslint-config/web',
    'plugin:jsx-a11y/recommended',
    'plugin:storybook/recommended',
  ],
  plugins: ['jsx-a11y'],
  overrides: [
    {
      files: ['**/*.stories.tsx'],
      rules: {
        // A Storybook story file is its module's default export.
        'import/no-default-export': 'off',
        // Stories are built by the Storybook toolchain, not shipped.
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
      },
    },
    {
      files: ['.storybook/**/*.{ts,tsx}'],
      rules: {
        // Storybook requires this directory name.
        'check-file/folder-naming-convention': 'off',
        // Storybook loads the config and the preview through default exports.
        'import/no-default-export': 'off',
        // The Vite config is built by mutating the object Storybook passes in.
        'no-param-reassign': 'off',
        // The Storybook toolchain lives in devDependencies.
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
      },
    },
  ],
};
