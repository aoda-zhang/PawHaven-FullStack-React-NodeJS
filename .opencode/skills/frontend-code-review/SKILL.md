---
name: frontend-code-review
description: Review React, routing, client state, accessibility, localization, and design-system changes in a diff.
---

# Frontend code review

Review changed frontend behavior and minimum context needed to validate findings. Check as relevant: user-visible behavior and state coverage; React lifecycle/state correctness; route/auth boundaries; query keys, cache invalidation and request ownership; accessible semantics and keyboard behavior; localization in all supported locales; shared UI reuse; design-token compliance; responsive behavior; and regression tests. Follow `docs/context/frontend-architecture.md` and `docs/context/frontend-development-patterns.md` when their rules are implicated. Load `ui-component-catalog` when a component is selected or reused.

Do not report preferences as defects.

## Finding format

Severity (critical/high/medium/low); confidence; file and line; trigger/condition; evidence; impact; recommended fix; verification status or uncertainty.
