# Toast

Transient notification with severity-appropriate announcement semantics.

## Usage guidance

Use for brief feedback, not critical content that must remain visible.

The queue lives in a persistent live region, so a message injected after the first render is still announced. Only one mounted `<Toast />` renders the queue; extra instances stay empty.

## Tests and examples

Regression tests are colocated in this component directory. Interactive examples live in `[Toast.stories.tsx](./Toast.stories.tsx)`.
