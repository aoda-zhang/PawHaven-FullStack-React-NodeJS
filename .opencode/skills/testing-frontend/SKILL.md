---
name: testing-frontend
description: Verify React UI, routes, forms, component states, accessibility, and frontend package changes.
---

# Frontend verification

Load for frontend or shared UI changes. Start from the acceptance criteria and affected files; do not run every check just because it exists.

## Choose the appropriate checks

- **Component behaviour:** test visible output, user interactions, disabled/loading states, empty/error/success states, and accessible semantics.
- **State and business rules:** test transitions, validation, boundary values, and error paths at the lowest suitable layer.
- **Routing and navigation:** verify direct URL/deep-link entry, navigation, back/forward behaviour, and permission-gated routes when applicable.
- **API integration:** verify loading, success, empty, and failure responses; check request/response contracts and error mapping.
- **Design-system changes:** check token usage, shared component consumers, responsive behaviour, and relevant visual states.
- **React changes:** run the project's React Doctor check when the change touches React pages or components, following the current project workflow.

## Browser requirement

For user-facing changes involving UI, routes, forms, navigation, or auth, load browser-verification when the running application and environment are available. Component tests and source inspection do not prove the complete user journey.

If browser verification is blocked, report the exact missing service, credentials, test data, or runtime condition. Do not describe an unrun browser check as passing.

## Commands

Inspect the root and affected package package.json files before running commands. The root currently defines pnpm typecheck, pnpm lint, pnpm build, pnpm test, pnpm test:e2e, and pnpm doctor:react; choose the narrowest valid checks and add broader checks according to the mode selected by Tester. Do not assume a package has a script because another package does.

## Report

For each relevant acceptance criterion, include the actual check, status, and observed evidence. Call out uncovered states or flows explicitly. Do not modify tests or application code during verification.
