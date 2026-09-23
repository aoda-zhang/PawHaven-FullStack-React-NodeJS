module.exports = {
  extends: ['@pawhaven/eslint-config/web'],
  rules: {
    'no-magic-numbers': [
      'warn',
      { ignore: [0, 1, -1, 24, 60, 365], ignoreArrayIndexes: true },
    ],
  },
};
