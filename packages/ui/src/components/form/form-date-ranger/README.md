# FormDateRanger

A pair of native date inputs representing a start/end range.

## Usage guidance

The value is a two-item tuple of date strings or nulls. Validate that the start does not follow the end. `required` marks the range as a whole: neither date input is individually required, so a half-filled range is left to the form schema. Each input carries its own id and a label derived from the group label.

## Tests and examples

Focused tests live in `tests/FormDateRanger.test.tsx`. Shared accessibility assertions also run from `../tests/FormAccessibility.test.tsx`.
