# Dialog

Accessible modal surface for focused content and actions.

## Usage guidance

Use for a short, interruptive interaction that needs the user's attention. Keep decision-making and business logic in the consuming application. The component owns modal presentation, native dialog behavior, Escape dismissal, backdrop dismissal, and browser-provided focus handling.

- open controls whether the modal is shown.
- onOpenChange receives false when the user dismisses it with Escape, the backdrop, or the optional close button.
- title is required and provides the dialog's accessible name.
- description is optional and is associated with the dialog as its accessible description.
- children holds optional body content; footer holds optional actions.
- closeLabel adds an accessible close button. Omit it when the footer already provides a clear dismissal action.

## Tests and examples

Regression tests are colocated in this component directory. Interactive examples live in Dialog.stories.tsx.
