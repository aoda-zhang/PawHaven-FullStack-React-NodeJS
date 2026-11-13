---
name: a11y-audit
description: Audit and validate PawHaven frontend accessibility against WCAG 2.2 AA using repository checks, browser automation, and documented manual testing.
---

# Accessibility Audit

Load for dedicated accessibility audits, accessibility bug investigations, or validation of accessibility fixes.

## Scope

- Default to a read-only audit. Do not change application code, tests, configuration, tokens, or dependencies unless the user explicitly asks for implementation.
- Follow WCAG 2.2 AA where applicable. Check the rendered experience, not just JSX attributes.
- Prioritize login/registration, animal reporting, rescue list, rescue details, and shared UI components.
- Reuse the existing `code-review`, `verification`, and `ui-component-catalog` Skills when their responsibilities apply. Do not duplicate their general review or verification rules.

## Audit workflow

1. **Set scope.** Identify routes, components, user journeys, changed files, and acceptance criteria. If the scope is broad, start with the critical workflows listed above and state what is not covered.
2. **Inspect project conventions.** Read `packages/ui/README.md`, the relevant frontend architecture docs, component source, tests, and Storybook stories. Load `ui-component-catalog` before recommending shared-component replacements.
3. **Run existing automated checks.** Inspect scripts and CI configuration first. Use the narrowest applicable checks:
   - `pnpm doctor:react` for the repository's React Doctor scan.
   - `pnpm --filter @pawhaven/ui lint` for shared UI ESLint/JSX accessibility rules.
   - `pnpm --filter @pawhaven/ui test-storybook` for Storybook browser tests and its axe checks.
   - Relevant page/component tests and existing Playwright journeys for the in-scope workflows.
   Do not install tools, invent scripts, or claim that a check covers pages it does not exercise.
4. **Review semantics and names.** Check native HTML semantics first; accessible names for icon-only controls; labels and descriptions; heading hierarchy; landmarks; link purpose; image alternatives; and appropriate ARIA roles, states, and properties. Avoid redundant or conflicting ARIA.
5. **Review keyboard and focus behavior.** Verify logical Tab order, no keyboard traps, visible focus, expected Enter/Space/Escape behavior, focus entry/return for dialogs and popovers, menu behavior, and focus after route or async state changes.
6. **Review forms and dynamic content.** Check required/invalid states, field-error associations, error summaries, live announcements, loading/success/failure feedback, and status changes. Announce only meaningful updates; avoid noisy live regions.
7. **Review visual access.** Check text contrast (4.5:1 normal text, 3:1 large text), relevant non-text contrast (generally 3:1), color-independent meaning, zoom/reflow, responsive layouts, and reduced-motion behavior where relevant.
8. **Perform manual checks.** For critical journeys, document keyboard-only testing and screen-reader testing with the available platform/browser/assistive technology. If the environment is unavailable, mark the check NOT RUN; never infer a pass from source inspection or axe.
9. **Report coverage and evidence.** Map each criterion to the route/component, check performed, result, and any limitation. Separate automated findings from manual observations.

## Repository-specific cautions

- Storybook's `@storybook/addon-a11y` runs axe against stories; `pnpm --filter @pawhaven/ui test-storybook` does not by itself prove that Portal routes or end-to-end workflows are accessible.
- The `color-contrast` axe rule is currently disabled in `packages/ui/.storybook/preview.tsx` because existing design-token pairs have known contrast failures. Report this as an explicit coverage gap. Do not describe the Storybook axe run as full WCAG contrast validation or silently treat the disabled rule as passing.
- `pnpm doctor:react` and `eslint-plugin-jsx-a11y` are useful signals, not substitutes for browser, keyboard, screen-reader, or contrast testing.
- Existing project documentation and issue #120 define the critical workflows and accessibility expectations. Keep findings aligned with those criteria.

## Finding format

For each finding, report:

- **Severity:** Critical / High / Medium / Low
- **Location:** route, component, and file/line when available
- **Criterion:** relevant WCAG 2.2 AA success criterion when confidently applicable
- **Evidence:** exact observed behavior and reproduction steps
- **Impact:** who is blocked or what assistive-technology behavior is affected
- **Recommendation:** the smallest practical correction

Do not assign a WCAG criterion by guesswork. Explain when a concern is a usability recommendation rather than a confirmed WCAG failure.

## Final status

Summarize:
- Scope audited and scope not audited
- Automated commands run, with exact outcomes
- Manual keyboard/screen-reader checks and test environment
- Findings grouped by severity
- Known blind spots, including disabled or unavailable checks

Use PASS only for criteria with adequate evidence. Use FAIL for confirmed violations, NOT RUN for checks not executed, and UNVERIFIABLE when evidence is insufficient. A clean axe result is not a WCAG conformance certification.
