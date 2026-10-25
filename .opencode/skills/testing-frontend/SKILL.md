---
name: testing-frontend
description: Choose frontend-specific checks for React UI, routes, forms, and shared UI changes.
---

# Frontend Verification

Load for frontend or shared-UI changes. Use `verify` for shared check-selection, evidence, and status rules.

## Frontend-specific checks

- Components: exercise relevant interactions, disabled/loading states, empty/error/success states, and accessible semantics.
- State and validation: cover transitions, boundary values, and failure paths.
- Routes: verify direct/deep-link entry, navigation, and permission-gated routes when affected.
- API integration: cover loading/success/empty/failure responses and request/response error mapping.
- Design system: check token use, shared-component consumers, responsive behavior, and relevant visual states.
- React pages/components: run the project's React Doctor check.

For user-facing journeys, load `browser-verification` when the app and required environment are available. Do not duplicate its browser workflow here.

Inspect root and affected package scripts before running commands. Use the narrowest relevant checks; do not assume a script exists in every package. Report criterion-level evidence and uncovered states. Do not edit source or tests during verification.
