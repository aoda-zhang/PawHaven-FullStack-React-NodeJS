/**
 * A colour used in a component has to be one of the design system's tokens.
 * The valid tokens are read from the design-system CSS at lint time.
 */
const { colourCandidates } = require('../lib/class-strings');
const {
  EXTRA_NAMESPACE,
  TOKEN_NAMESPACE,
  isColourName,
  isDefaultPaletteColour,
} = require('../lib/color-vocabulary');
const { getTokens } = require('../lib/token-source');

/**
 * The token names a class like `bg-primary` could be reading.
 * @param {string} remainder
 * @param {string} prefix
 * @returns {string[]}
 */
function candidateTokens(remainder, prefix) {
  const namespaces = [TOKEN_NAMESPACE[prefix]];
  if (EXTRA_NAMESPACE[prefix]) namespaces.push(EXTRA_NAMESPACE[prefix]);
  return namespaces.map((namespace) => namespace + remainder);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'require colours in components to come from the design-system tokens',
    },
    schema: [],
    messages: {
      defaultPalette:
        '"{{className}}" uses "{{colour}}", which is not in the design system — use a design-system token instead.',
      unknownToken:
        '"{{className}}" is not a design-system colour — no token named "{{tokens}}" exists.',
      missingSource:
        'design-colors: the configured CSS path "{{path}}" does not exist.',
    },
  },

  create(context) {
    const { tokens, utilities, missing } = getTokens(context);

    for (const path of missing) {
      context.report({
        node: context.sourceCode.ast,
        messageId: 'missingSource',
        data: { path },
      });
    }

    /**
     * @param {string} value every string in the file
     * @param {object} node
     */
    const check = (value, node) => {
      for (const candidate of colourCandidates(value)) {
        const dash = candidate.indexOf('-');
        const prefix = candidate.slice(0, dash);
        const remainder = candidate.slice(dash + 1);

        if (!TOKEN_NAMESPACE[prefix]) continue;
        if (!isColourName(remainder)) continue;
        if (utilities.has(candidate)) continue;

        if (isDefaultPaletteColour(remainder)) {
          context.report({
            node,
            messageId: 'defaultPalette',
            data: { className: candidate, colour: remainder },
          });
          continue;
        }

        const names = candidateTokens(remainder, prefix);
        if (names.some((name) => tokens.has(name))) continue;

        context.report({
          node,
          messageId: 'unknownToken',
          data: { className: candidate, tokens: names.join(' or ') },
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
