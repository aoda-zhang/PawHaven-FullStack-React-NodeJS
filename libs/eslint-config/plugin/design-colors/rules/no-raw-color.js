/**
 * A raw colour literal — hex, rgb(), hsl(), oklch() — is never allowed in
 * application source. The colour has to come from a design-system token.
 *
 * Storybook stories are exempt: a demo illustration in the catalogue is not
 * production styling, and an inline SVG in a data URI cannot read a token.
 */
const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch|color)\(/g;

/**
 * The Storybook configuration and the stories are exempt: a demo
 * illustration in the catalogue is not production styling, and an inline SVG
 * in a data URI cannot read a token.
 */
const isStorybook = (filename) =>
  /[/\\]\.storybook[/\\]/.test(filename) ||
  /\.stories\.[jt]sx?$/.test(filename);

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow raw colour literals — colours must come from a design-system token',
    },
    schema: [],
    messages: {
      rawColour:
        '"{{literal}}" is a raw colour — use a design-system token instead.',
    },
  },

  create(context) {
    if (isStorybook(context.getFilename())) return {};

    /**
     * @param {string} value
     * @param {object} node
     */
    const check = (value, node) => {
      for (const match of value.matchAll(HEX)) {
        context.report({
          node,
          messageId: 'rawColour',
          data: { literal: match[0] },
        });
      }
      for (const match of value.matchAll(COLOUR_FUNCTION)) {
        context.report({
          node,
          messageId: 'rawColour',
          data: { literal: match[0] },
        });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node.value, node);
      },
      TemplateElement(node) {
        if (node.value.cooked) check(node.value.cooked, node);
      },
    };
  },
};
