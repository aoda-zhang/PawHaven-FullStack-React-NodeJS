# FormPhoneInput

React Hook Form wrapper around the shared international phone input.

## Usage guidance

Validate the normalized international phone number in the form schema. The error message is rendered by the shared phone input, so the control announces it once through `aria-describedby`.

## Tests and examples

Focused tests live in `tests/FormPhoneInput.test.tsx`. Shared accessibility assertions also run from `../tests/FormAccessibility.test.tsx`.
