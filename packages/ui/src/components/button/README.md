# Button

Shared action control with variants, sizes, loading/disabled states, and optional slotted-child rendering.

## Usage guidance

Use native buttons for actions and links for navigation. Disabled/loading slotted controls must not activate.

Sizes are `md` (the default action size, 40px tall, with token-driven padding) and `icon` (a square 40×40 icon-only button). The focus indicator comes from the design-system `focus-ring` utility, so it stays visible on every variant.

## Tests and examples

Regression tests are colocated in this component directory. Interactive examples live in `[Button.stories.tsx](./Button.stories.tsx)`.
