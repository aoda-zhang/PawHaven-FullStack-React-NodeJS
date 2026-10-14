---
name: browser-verification
description: Verify real browser journeys for UI, routing, forms, authentication, and end-to-end behaviour.
---

# Browser verification

Load when acceptance criteria depend on behaviour in a running application, especially UI interactions, routes, forms, navigation, authentication, or frontend-to-backend journeys.

## Preconditions

1. Inspect the existing browser automation and Playwright setup before acting.
2. Use the existing browser tooling and test framework. Do not install another framework or driver.
3. Confirm the required app, backend services, credentials, and test data are available. If not, report the blocker and mark the check NOT RUN.

## Run the journey

1. Map each relevant acceptance criterion to a concrete user journey and observable outcome.
2. Exercise the real running application, not only source code, mocks, or isolated component renders.
3. Check the expected visible state and relevant loading, empty, error, and success states.
4. For route changes, test direct URL entry and navigation where applicable.
5. For forms, cover valid input and relevant validation/error cases.
6. For authentication or permissions, verify both allowed and denied paths when in scope.
7. Inspect relevant browser console errors and failed network/API requests.
8. Run the existing pnpm test:e2e suite when it covers the change and the script is available.

## Evidence

Record the exact journey, environment/surface tested, observed outcome, and command output where applicable. Report screenshots or artifacts only when actually produced. Do not treat a successful page load as proof that all acceptance criteria passed.

If the environment blocks the journey, state what was unavailable and the closest check actually completed. Do not infer a pass from a mock or a different runtime surface.
