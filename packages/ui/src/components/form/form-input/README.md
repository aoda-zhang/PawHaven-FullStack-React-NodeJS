# FormInput

Text-like input with size/variant options and optional password visibility toggle.

## Usage guidance

Choose an appropriate input type and autocomplete value. Never log credential values.

`size` is `sm` or `md`; `variant` is `standard`, `outline` or `fill`. The `small` / `medium` and `outlined` / `filled` spellings still work for one release and are deprecated.

## Tests and examples

Focused tests live in `tests/FormInput.test.tsx`. Shared accessibility assertions also run from `../tests/FormAccessibility.test.tsx`.
