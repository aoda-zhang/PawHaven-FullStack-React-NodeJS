# FormRadio

Radio group connected to a single React Hook Form value.

## Usage guidance

Provide unique option values and meaningful labels; the group label is a fieldset legend. The fieldset is the `radiogroup`, so the invalid state and the error reference sit on the group. The group error is announced once through the fieldset, not once per option. `defaultValue` must match one of the option values.

## Tests and examples

Focused tests live in `tests/FormRadio.test.tsx`. Shared accessibility assertions also run from `../tests/FormAccessibility.test.tsx`.
