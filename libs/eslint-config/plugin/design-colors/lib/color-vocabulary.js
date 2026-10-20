/**
 * The colour vocabulary the plugin needs to tell a colour apart from
 * everything else that can follow a colour-ish utility prefix.
 *
 * The design system resets Tailwind's default palette, so a class that names
 * one of those colours can never resolve. Anything else that follows a colour
 * prefix is either one of our tokens or not a colour at all.
 */

/** Tailwind's default palette. Reset by the design system, never available. */
const TAILWIND_PALETTE = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
];

/** The steps Tailwind's default palette uses. */
const TAILWIND_PALETTE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

/**
 * Values a colour-ish prefix can take without naming a colour: font sizes,
 * alignment, transforms, overflow, background position and repeat.
 */
const NOT_A_COLOR = new Set([
  // font sizes
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
  // alignment
  'left',
  'center',
  'right',
  'justify',
  'start',
  'end',
  // text transforms and decoration
  'uppercase',
  'lowercase',
  'capitalize',
  'italic',
  'underline',
  'overline',
  'line-through',
  'no-underline',
  // overflow and wrapping
  'ellipsis',
  'clip',
  'wrap',
  'nowrap',
  'balance',
  'pretty',
  'truncate',
  // box and background
  'transparent',
  'current',
  'inherit',
  'none',
  'auto',
  'full',
  'cover',
  'contain',
  'fixed',
  'local',
  'scroll',
  'repeat',
  'no-repeat',
  'repeat-x',
  'repeat-y',
  'border',
  'padding',
  'border-box',
  'content-box',
  'clip-border',
  'collapse',
  'hidden',
  // border sides and widths
  't',
  'r',
  'b',
  'l',
  'x',
  'y',
  's',
  'e',
  'inset',
  // border styles
  'solid',
  'dashed',
  'dotted',
  'double',
  // ring and outline offsets
  'offset',
]);

/** Remainders that start with one of these name no colour either. */
const NOT_A_COLOR_PREFIX =
  /^(offset|spacing|decoration|blend|clip|repeat|border)-/;

/** Gradient directions, e.g. `bg-gradient-to-t`, `bg-linear-to-br`. */
const IS_GRADIENT = /^(gradient|linear)-to-/;

/** A remainder that is only a number, e.g. `border-2`, `ring-4`. */
const IS_NUMBER = /^\d+(\.\d+)?$/;

/** A side and a width, e.g. `border-l-4`, `divide-y-2`. */
const IS_SIDE_AND_WIDTH = /^[trblxyse]-\d+(\.\d+)?$/;

/**
 * Which token namespace each utility prefix reads from.
 * `text-` also reads the `--text-*` namespace, because that is where the
 * composite type sizes live.
 */
const TOKEN_NAMESPACE = {
  bg: '--color-',
  text: '--color-',
  border: '--color-',
  ring: '--color-',
  outline: '--color-',
  fill: '--color-',
  stroke: '--color-',
  placeholder: '--color-',
  decoration: '--color-',
  accent: '--color-',
  caret: '--color-',
  divide: '--color-',
  from: '--color-',
  via: '--color-',
  to: '--color-',
  shadow: '--shadow-',
};

/** Prefixes that also read a second namespace. */
const EXTRA_NAMESPACE = {
  text: '--text-',
  shadow: '--color-',
};

/**
 * Whether the remainder names one of Tailwind's default palette colours.
 * @param {string} remainder
 * @returns {boolean}
 */
function isDefaultPaletteColour(remainder) {
  const dash = remainder.lastIndexOf('-');
  if (dash === -1) return false;
  const name = remainder.slice(0, dash);
  const step = remainder.slice(dash + 1);
  return (
    TAILWIND_PALETTE.includes(name) &&
    TAILWIND_PALETTE_STEPS.includes(Number(step))
  );
}

/**
 * Whether the remainder names a colour at all.
 * @param {string} remainder
 * @returns {boolean}
 */
function isColourName(remainder) {
  if (NOT_A_COLOR.has(remainder)) return false;
  if (IS_NUMBER.test(remainder)) return false;
  if (IS_SIDE_AND_WIDTH.test(remainder)) return false;
  if (NOT_A_COLOR_PREFIX.test(remainder)) return false;
  if (IS_GRADIENT.test(remainder)) return false;
  return true;
}

module.exports = {
  TOKEN_NAMESPACE,
  EXTRA_NAMESPACE,
  isColourName,
  isDefaultPaletteColour,
};
