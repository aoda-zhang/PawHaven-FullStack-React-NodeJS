---
name: frontend-code-review
description: Review frontend diffs for behavior, React correctness, accessibility, localization, and design-system regressions.
---

# Frontend Code Review

Load only when the diff affects frontend code.

Read the relevant frontend architecture and development patterns; treat those documents as the canonical rules rather than restating them.

Review the changed paths for:
- User-visible behavior and relevant state transitions.
- React lifecycle, state, and query/cache correctness.
- Route and authorization boundaries.
- Accessible semantics and keyboard behavior.
- Localization across supported locales.
- Shared UI and design-token use.
- Responsive behavior and regression coverage.

Report only evidence-backed defects or material risks, not personal preferences. Use the finding format defined by the Reviewer agent.
