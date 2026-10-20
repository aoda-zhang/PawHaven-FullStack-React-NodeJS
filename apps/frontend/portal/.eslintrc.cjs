module.exports = {
  extends: ['@pawhaven/eslint-config/web'],
  overrides: [
    {
      // A schema file is named after the module it describes, which is
      // camelCase, not the PascalCase a component file uses.
      files: ['**/*.schema.ts'],
      rules: {
        'check-file/filename-naming-convention': 'off',
      },
    },
  ],
};
