# Frontend Verification Reference

Load for frontend or shared-UI changes. Use the shared rules in `verification` skill for check-selection, evidence, and status.

## Frontend-specific checks

- Components: exercise relevant interactions, disabled/loading states, empty/error/success states, and accessible semantics
- State and validation: cover transitions, boundary values, and failure paths
- Routes: verify direct/deep-link entry, navigation, and permission-gated routes when affected
- API integration: cover loading/success/empty/failure responses and request/response error mapping
- Design system: check token use, shared-component consumers, responsive behavior, and relevant visual states
- Localization: when locale files change, run the project i18n key check (`pnpm check:i18n`); a key present in one locale and missing in another is a defect
- React pages/components: run the project's React Doctor check (`pnpm doctor:react`)

## Browser journeys

For user-facing journeys, load `references/browser-verification.md` when the app and required environment are available. Do not duplicate its browser workflow here.

## Execution

Inspect root and affected package scripts before running commands. Use the narrowest relevant checks; do not assume a script exists in every package. Report criterion-level evidence and uncovered states. Do not edit source or tests during verification.
