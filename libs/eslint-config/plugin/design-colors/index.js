'use strict';

/**
 * ESLint rules that keep the colours in PawHaven's components on the design
 * system.
 *
 * The valid tokens are read from the design-system CSS at lint time (see
 * `settings['design-colors']` in `libs/eslint-config/web.js`), so the CSS stays
 * the single source of truth for the palette.
 */

const noRawColor = require('./rules/no-raw-color');
const noUnknownColor = require('./rules/no-unknown-color');

module.exports = {
  meta: { name: '@pawhaven/design-colors' },
  rules: {
    'no-raw-color': noRawColor,
    'no-unknown-color': noUnknownColor,
  },
};
