---
name: browser-verification
description: Verify real browser journeys for user-facing acceptance criteria.
---

# Browser Verification

Load when acceptance depends on a running application's UI, routing, forms, navigation, authentication, or frontend-to-backend behavior.

## Preconditions

1. Inspect the existing browser automation and Playwright setup; use the project's current tooling.
2. Confirm the required app/services, credentials, and test data are available. If not, report the blocker and mark the journey NOT RUN.

## Run

1. Map each in-scope acceptance criterion to a user journey and observable result.
2. Exercise the running application. Source inspection, mocks, and component renders do not prove a real journey.
3. Cover relevant success, loading, empty, validation, and failure states.
4. For routes, test direct entry and in-app navigation where relevant. For authorization, test allowed and denied paths when in scope.
5. Inspect browser-console errors and failed network requests related to the journey.
6. Run the existing E2E suite only when it covers the change and its script is available.

## Evidence

Report the journey, environment, observed result, and actual command/artifacts. If blocked, name the missing dependency and the closest check completed. Never infer a pass from a page load or a mock.
