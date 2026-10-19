# Form controls

React Hook Form-integrated controls for text, select, phone, checkbox, radio, textarea, and date-range values.

## Usage guidance

Render controls inside a `FormProvider` backed by `useForm`. Keep field names stable, provide visible labels, and validate values with the form schema or rules. Native required/disabled semantics and validation-error associations are supported.

## Tests and examples

Shared accessibility regression coverage lives in `tests/FormAccessibility.test.tsx`; every individual control also has a focused test in its own `tests/` directory. Stories live in `libs/ui-storybook/stories/Forms.stories.tsx`.
