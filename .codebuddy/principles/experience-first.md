# Experience First

Choose user delight over implementation convenience.

## When it applies

Product, UX, or feature-scope tradeoffs.

## The rule

When a choice trades user experience against implementation ease, default to the user's side. Loading states, empty states, error states, and first-run experience are part of the feature, not polish you add later.

## PawHaven notes

- A feature is not done when the happy path works. It is done when loading, empty, error, and offline states are handled and the i18n keys exist for all of them.
- Optimistic updates and skeleton states are features for the consumer.
- The design system exists so UX consistency is cheap; using raw values instead is a UX regression, not a shortcut.

## Anti-pattern

Shipping a feature that errors to a blank screen because "the error case is rare".
