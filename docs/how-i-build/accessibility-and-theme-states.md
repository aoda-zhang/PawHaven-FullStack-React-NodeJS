# Accessibility and theme-state contract

This document defines the shared accessibility and visual-state contract for
`@pawhaven/ui` and `@pawhaven/design-system`.

## Theme modes

The default theme is light. An application can opt into the dark semantic
mapping by setting the attribute on its root element:

```html
<html data-theme="dark">
```

Use `data-theme="light"` to explicitly select light mode. The Storybook toolbar
also exposes a Light / Dark switch so component states can be reviewed in both
modes. Components must
consume semantic tokens (for example `bg-background`, `text-text`,
`border-border`, and `focus-ring`) and must not branch on the theme name or
read primitive palette tokens directly.

The dark mapping overrides every semantic color token declared in the base
theme. Non-color design decisions (spacing, typography, radius, and layout)
remain shared between themes. The application owns persistence and any theme
selection UI; the design-system package only defines the token contract.

## Component interaction states

Interactive components should define and verify these states where applicable:

| State | Expected behavior |
| --- | --- |
| Default | Clear affordance and semantic color tokens |
| Hover | Pointer feedback without being the only state cue |
| Active | Pressed feedback; no layout shift |
| Focus-visible | Visible 2px focus outline with offset |
| Disabled | Non-interactive; disabled semantic tokens; no misleading hover |
| Loading | Announces busy state and prevents duplicate activation |
| Invalid | Programmatic invalid state and an associated error description |
| Reduced motion | Avoids non-essential motion when the OS preference is enabled |

Use the shared `focus-ring` utility for keyboard focus. Native form controls
must retain their native keyboard behavior; custom controls must document and
test their keyboard interaction explicitly.

## Accessibility requirements

- Every form control has a programmatic accessible name.
- Required and invalid states are exposed through native attributes or ARIA.
- Validation text is connected through `aria-describedby`; do not announce the
  same error through both a description and a live region.
- Grouped controls use `fieldset` / `legend` or an equivalent labelled group.
- Icon-only buttons have an accessible name.
- Decorative icons are hidden from assistive technology.
- Focus is visible and is not removed without an equivalent replacement.
- CSS transitions and animations respect `prefers-reduced-motion`; JavaScript
  animation components must also subscribe to that preference.

## Automated verification

Run:

```bash
pnpm token-check
pnpm theme-check
pnpm --filter @pawhaven/ui test
pnpm --filter @pawhaven/ui test-storybook
```

`theme-check` verifies that every semantic color token has a dark-theme
mapping and checks WCAG contrast ratios for the core text, action, status, and
focus-indicator pairs. Storybook axe checks remain enabled for all rules except
the existing color-contrast rule; that rule must only be enabled globally after
the full story catalogue has been audited and remediated. The token-level
contrast gate is an enforceable baseline, not a substitute for checking real
component combinations and rendered content.

## Contribution checklist

- [ ] Use semantic tokens; do not add raw colors.
- [ ] Verify light and dark theme rendering when changing color or surface use.
- [ ] Verify keyboard focus and disabled behavior.
- [ ] Verify reduced-motion behavior for new animations.
- [ ] Add or update accessible-name, state, and error-association tests.
- [ ] Add a Storybook story for materially different visual states.
