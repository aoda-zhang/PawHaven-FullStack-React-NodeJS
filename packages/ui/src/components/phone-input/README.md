# PhoneInput

International phone number input with country selector and validation-friendly callbacks.

## Usage guidance

Control with `phone` and `onPhoneChange`; provide a visible external label. The country defaults to `CN` and can be changed with `defaultCountry`. The component renders the error message itself: pass `error` and it is associated with the input through `aria-describedby` (add `errorId` to choose the id).

The third-party stylesheet ships from `@pawhaven/ui/index.css`, so the package stylesheet has to be imported by the consumer.

## Tests and examples

Regression tests are colocated in this component directory. Interactive examples live in `[PhoneInput.stories.tsx](./PhoneInput.stories.tsx)`.
