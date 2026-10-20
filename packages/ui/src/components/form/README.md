# Form controls

React Hook Form-integrated controls for text, select, phone, checkbox, radio, textarea, and date-range values.

## Usage guidance

Render controls inside a `FormProvider` backed by `useForm`. Keep field names stable and always pass a visible `label` — it is required, because it is the accessible name of the control. Validate values with the form schema or rules.

Every control shares one contract:

- `disabled` turns the native control off.
- `error` overrides the React Hook Form message with your own node; `errorId` overrides the id of the rendered error element. The error element is referenced by `aria-describedby` and is not a live region, so it is announced once.
- `fullWidth` adds `w-full` to the control container.

`FormInput` adds `size` (`sm` / `md`) and `variant` (`standard` / `outline` / `fill`). The maps live in `formControl.ts` and are exported from `@pawhaven/ui/form`.

`FormDateRanger` requires the range as a whole: neither date input is individually required, so the form schema decides whether a half-filled range is valid.

## Tests and examples

Shared accessibility regression coverage lives in `tests/FormAccessibility.test.tsx`; every individual control also has a focused test in its own `tests/` directory. Stories live in [`FormPatterns.stories.tsx`](./FormPatterns.stories.tsx) and in one colocated file per control, for example [`form-input/FormInput.stories.tsx`](./form-input/FormInput.stories.tsx).
