# Accessibility contract

This document defines the accessibility expectations for `@pawhaven/ui`.

## Keyboard and focus
- All interactive elements must be operable using the keyboard.
- Preserve native keyboard behavior for native form controls.
- Custom controls must implement and document expected keyboard interaction.
- Never remove browser focus indicators without a clearly visible replacement.
- Use the existing `focus-ring` utility for consistent `:focus-visible` treatment.

## Accessible names and semantics
- Every form control must have a programmatic accessible name.
- Prefer native HTML elements before adding ARIA roles.
- Icon-only buttons must have an accessible name; decorative icons must be hidden from assistive technology.
- Group related controls with `fieldset` and `legend`, or an equivalent labelled group.
- Expose required, disabled, busy, and invalid states programmatically.

## Validation and announcements
- Associate validation messages with controls using `aria-describedby`.
- Use a live region only when an update needs to be announced dynamically.
- Avoid announcing the same error through both a description and a live region.
- Validation must not rely on color alone.

## Motion and loading
- Respect `prefers-reduced-motion` for non-essential animation.
- JavaScript-driven animations must respond when the preference changes.
- Loading indicators must expose a meaningful status label to assistive technology.
- Decorative animation content must be hidden from assistive technology.

## Verification
Run the UI package checks:

```bash
pnpm --filter @pawhaven/ui lint
pnpm --filter @pawhaven/ui typecheck
pnpm --filter @pawhaven/ui test
pnpm --filter @pawhaven/ui test-storybook
```

Storybook axe checks complement, but do not replace, keyboard testing and screen-reader review.

## Contribution checklist
- [ ] Verify keyboard-only operation and visible focus.
- [ ] Verify accessible names and semantic relationships.
- [ ] Verify required, disabled, busy, and invalid states.
- [ ] Verify error text is associated with its control.
- [ ] Verify reduced-motion behavior for animations.
- [ ] Add or update relevant component tests and stories.
