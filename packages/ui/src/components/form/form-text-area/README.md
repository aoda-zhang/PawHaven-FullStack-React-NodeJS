# FormTextArea

Multiline text control with configurable rows and height bounds.

## Usage guidance

Provide a visible label and validation limits; placeholders are supplemental guidance. `minRows` and `maxRows` are converted to a height from one rem-based line height, so the box grows with the text without a hardcoded pixel line.

## Tests and examples

Focused tests live in `tests/FormTextArea.test.tsx`. Shared accessibility assertions also run from `../tests/FormAccessibility.test.tsx`.
