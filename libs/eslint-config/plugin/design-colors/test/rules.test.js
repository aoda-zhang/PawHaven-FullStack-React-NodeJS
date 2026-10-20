const { RuleTester } = require('eslint');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const plugin = require('..');

const SETTINGS = {
  'design-colors': {
    cssFiles: [
      'packages/design-system/src/tokens',
      'packages/design-system/src/theme.css',
      'packages/design-system/src/utilities.css',
    ],
    extraCssFiles: [
      'apps/frontend/portal/src/shared/utils/rescue-status/rescueStatusColors.css',
    ],
  },
};

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
});

/** Styles that are on the design system, or are not colours at all. */
const VALID = [
  '<div className="bg-primary text-text border-border" />',
  '<div className="hover:bg-primary/50 md:text-text-secondary" />',
  '<div className="text-sm text-center text-2xl" />',
  '<div className="border-2 border-t ring-4 ring-inset" />',
  '<div className="shadow-toast shadow-md" />',
  '<div className="bg-rescue-status-pending" />',
  '<div className="flex items-center gap-2 p-4" />',
  'const variant = "filled";',
  '<div className="bg-[url(/logo.svg)]" />',
];

describe('no-raw-color', () => {
  ruleTester.run('no-raw-color', plugin.rules['no-raw-color'], {
    valid: VALID.map((code) => ({ code, settings: SETTINGS })),
    invalid: [
      {
        code: '<div className="bg-[#f00]" />',
        settings: SETTINGS,
        errors: [{ messageId: 'rawColour' }],
      },
      {
        code: '<div style={{ color: "rgb(0 0 0)" }} />',
        settings: SETTINGS,
        errors: [{ messageId: 'rawColour' }],
      },
      {
        code: '<div className="bg-[hsl(0_0%_0%)]" />',
        settings: SETTINGS,
        errors: [{ messageId: 'rawColour' }],
      },
    ],
  });
});

describe('no-unknown-color', () => {
  ruleTester.run('no-unknown-color', plugin.rules['no-unknown-color'], {
    valid: VALID.map((code) => ({ code, settings: SETTINGS })),
    invalid: [
      {
        code: '<div className="bg-red-500" />',
        settings: SETTINGS,
        errors: [{ messageId: 'defaultPalette' }],
      },
      {
        code: '<div className="text-gray-400" />',
        settings: SETTINGS,
        errors: [{ messageId: 'defaultPalette' }],
      },
      {
        code: '<div className="bg-primry" />',
        settings: SETTINGS,
        errors: [{ messageId: 'unknownToken' }],
      },
      {
        code: '<div className="bg-white" />',
        settings: SETTINGS,
        errors: [{ messageId: 'unknownToken' }],
      },
      {
        code: 'const classes = `bg-red-500`;',
        settings: SETTINGS,
        errors: [{ messageId: 'defaultPalette' }],
      },
      {
        code: 'const classes = "bg-red-500";',
        settings: SETTINGS,
        errors: [{ messageId: 'defaultPalette' }],
      },
    ],
  });
});

describe('the plugin', () => {
  it('exposes exactly the two colour rules', () => {
    assert.deepEqual(Object.keys(plugin.rules).sort(), [
      'no-raw-color',
      'no-unknown-color',
    ]);
  });
});
