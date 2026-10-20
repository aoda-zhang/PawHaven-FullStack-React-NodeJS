# NotificationBanner

Persistent inline message for informational, success, warning, or error states.

## Usage guidance

Choose severity to match the message and provide clear, actionable text. Icons are decorative.

Errors and warnings are announced assertively (`role="alert"`); info and success are announced politely (`role="status"`). Variants are `standard`, `fill` and `accent`. Pass a link as `link={{ text, href }}`; the link opens in a new tab and says so.

## Tests and examples

Regression tests are colocated in this component directory. Interactive examples live in `[NotificationBanner.stories.tsx](./NotificationBanner.stories.tsx)`.
