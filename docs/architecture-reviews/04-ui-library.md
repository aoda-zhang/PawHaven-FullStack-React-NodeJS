# UI Library Audit and Refactoring Record

**Base:** `main`  
**Working branch:** `refactor/ui-library-audit`  
**Pull request:** [#90 — refactor(ui): audit and improve shared UI library](https://github.com/aoda-zhang/PawHaven-FullStack-React-NodeJS/pull/90)  
**Scope:** `packages/ui`, `packages/design-system`, and Portal consumption  
**Status:** Source changes and regression tests are committed on the branch. Focused UI CI is configured; final build/test status must be read from the latest workflow run before merging.

## Executive summary

`@pawhaven/ui` is currently a shared UI kit, not a fully governed Design System. Retain the package and its current public entry points. The best near-term investment is reliability: correct CSS retention, accessible form controls and announcements, disabled/loading behavior, carousel state synchronization, and package-consumer verification. Avoid a broad API redesign until the existing consumer contract is inventoried.

No confirmed P0 issue was found in the reviewed UI-library scope. The most consequential confirmed issues were P1/P2 accessibility and packaging defects. The source changes below address them; a successful CI run is still required to call them verified.

Scores below are qualitative engineering judgments, not automated measurements.

| Dimension | Initial assessment | Current assessment | Notes |
|---|---:|---:|---|
| Public API consistency | 5/10 | 5/10 | Existing form and primitive vocabularies still differ; avoid breaking rename now |
| Reuse and boundaries | 6/10 | 6/10 | Shared primitives coexist with composite and feature-leaning components |
| Accessibility | 5/10 | 7/10, pending CI | Label/error semantics and announcement behavior have been improved and regression tests added |
| Token integration | 7/10 | 7/10 | Semantic tokens exist but hard-coded/inline styles remain in some components |
| Package/build contract | 6/10 | 8/10, pending CI | CSS is declared side-effectful; focused Portal production CSS check added |
| Tests | 5/10 | 7/10, pending CI | Button, Carousel, forms, Toast, and NotificationBanner behavior now has focused coverage; this is not a coverage percentage |
| Change governance | 4/10 | 5/10 | Governance guidance and a focused CI workflow added; ownership and release/version workflow remain lightweight |

## P0–P3 implementation tracker

Severity means user impact, not simply code style. “Implemented” means the code change exists; it does not mean CI has passed.

| Priority | Finding / acceptance condition | Status | Evidence / verification |
|---|---|---|---|
| P0 | No confirmed security, privacy, or data-integrity blocker in the reviewed UI package | No finding confirmed | Scope-limited source review; not a security certification |
| P1 | CSS side effects must survive bundling | Implemented; CI pending | `packages/ui/package.json` now declares `sideEffects: ["**/*.css"]`; focused workflow builds Portal and checks emitted CSS |
| P1 | Loading component must use the installed Lottie API and expose an accessible status | Implemented; CI pending | `components/loading/Loading.tsx` uses named `Lottie` and `src={animationData}`, `role="status"`, and an accessible label |
| P1 | Form controls need real labels, required semantics, invalid state, and associated error text | Implemented; CI pending | Input, Select, TextArea, PhoneInput, Checkbox, Radio, and DateRange updated; regression tests added in `form/tests/FormAccessibility.test.tsx` |
| P1 | Disabled/loading slotted Buttons must not activate links or other slotted controls | Implemented; CI pending | `components/button/Button.tsx` blocks capture-phase activation for disabled/loading `asChild`; Button tests cover disabled, loading, and native loading state |
| P1 | Carousel state must not be synchronously updated during render and region needs an accessible name | Implemented; CI pending | `components/carousel/Carousel.tsx` syncs Embla state in an effect, exposes `label`, and gives slides position labels; regression test added |
| P2 | Notification iconography must be decorative and announcements should match urgency | Implemented; CI pending | NotificationBanner icons are hidden from assistive tech; Toast uses `status` for success/info and `alert` for error/warning, with decorative icons |
| P2 | Skeleton animation should respect reduced-motion preferences | Implemented | Skeleton includes `motion-reduce:animate-none`; Design System also defines a global reduced-motion rule |
| P2 | UI package changes need focused build/test/consumer CSS checks that are not blocked by unrelated workspace lint | Implemented; workflow pending | Added `.github/workflows/ui-library.yml` to run token check, UI build/tests, Portal dependency build, and production CSS assertions |
| P2 | Component API vocabulary and style sources need consistent future governance | Follow-up; no breaking API sweep | Record the migration rules below; existing consumer APIs are intentionally retained |
| P2 | Storybook, automated visual regression, and browser/screen-reader checks need a conscious decision | Not implemented | No current UI-specific Storybook/visual-regression workflow was confirmed in inspected configuration; decide based on actual team/release needs |
| P3 | Private package release governance, ownership, deprecation, codemods, and Changesets | Deferred intentionally | Package is private and currently workspace-consumed; adding a release framework without an external release workflow would be premature |
| P3 | Clean up legacy names and unused props such as `FormDateRanger` and legacy text-field options | Deferred for compatibility | Rename only with consumer inventory, deprecation period, and tests; do not create a silent breaking change |

## Confirmed changes

### 1. Package CSS contract

- **Evidence:** `packages/ui/index.css` imports `@pawhaven/design-system/index.css`; the previous `sideEffects: false` could allow bundlers to discard CSS.
- **Change:** CSS files are now explicitly marked as side effects while JavaScript remains eligible for tree-shaking.
- **Acceptance:** The focused workflow builds the Portal and checks that both Design System token declarations and a UI utility (the Button loading spinner's `.animate-spin`) remain in the emitted CSS.

### 2. Loading component

- **Evidence:** The prior `animationData` prop failed type-checking against the installed `lottie-react` component API.
- **Change:** Use the named `Lottie` export and `src={animationData}`; expose a status role and configurable accessible label; mark the animation decorative.
- **Acceptance:** UI package build and Portal build pass; browser rendering confirms the animation is present and the status has an accessible name.

### 3. Form accessibility

- **Components:** `FormInput`, `FormSelect`, `FormTextArea`, `FormPhoneInput`/`PhoneInput`, `FormCheckbox`, `FormRadio`, and `FormDateRanger`.
- **Changes:** Use generated stable-per-mount IDs, real label associations or fieldset/legend grouping, native required semantics, `aria-invalid`, `aria-describedby`, and alert semantics for validation feedback. Phone input forwards the ID, required state, and error relationship to its native number input.
- **Regression coverage:** `packages/ui/src/components/form/tests/FormAccessibility.test.tsx` checks accessible labels, required state, and error associations.
- **Caveat:** Automated DOM tests do not replace keyboard testing with real browsers or manual screen-reader verification.

### 4. Button behavior

- **Evidence:** Native `disabled` cannot be passed to an arbitrary `asChild` element such as an anchor; `aria-disabled` alone does not prevent activation.
- **Change:** Native buttons use the native disabled state. Slotted children expose `aria-disabled`; capture-phase handling prevents default activation and stops propagation while disabled/loading. Loading exposes `aria-busy`, and the spinner is decorative.
- **Regression coverage:** `packages/ui/src/components/button/tests/Button.test.tsx`.

### 5. Carousel

- **Evidence:** Embla-derived React state was synchronized in a way that could cause render-time updates; region labeling was not configurable.
- **Change:** State synchronization and listener lifecycle live in an effect; the region accepts `label`; slides expose their position.
- **Regression coverage:** `packages/ui/src/components/carousel/tests/Carousel.test.tsx`.
- **Remaining browser check:** Confirm keyboard operation and focus behavior in a real browser. The current tests use jsdom API polyfills and do not prove assistive-technology behavior.

### 6. Toast and NotificationBanner

- **Changes:** Decorative icons are hidden from the accessibility tree. Toast severity determines announcement semantics: error/warning use `alert`, while success/info use `status`. Banner remains an alert and has a dismiss regression test.
- **Regression coverage:** `packages/ui/src/components/toast/tests/Toast.test.tsx` and `packages/ui/src/components/notification-banner/tests/NotificationBanner.test.tsx`.
- **Remaining review:** Confirm timer behavior under browser tab suspension and whether repeated announcements should be deduplicated.

### 7. Focused quality gate

Added `.github/workflows/ui-library.yml` to isolate UI-package verification from unrelated workspace lint failures. It runs:

1. Design token validation.
2. UI package build and its workspace dependencies.
3. UI component tests.
4. Portal production build and its workspace dependencies.
5. Assertions that Design System tokens and a UI-library utility survive in the production CSS.

The existing whole-workspace Test workflow at the previously inspected commit failed during `@pawhaven/backend-core#lint` on unrelated errors in backend-core test files (including naming-convention and restricted-syntax violations); Typecheck, Tests, and Build were skipped by that workflow. React Doctor passed for that earlier head. Do not interpret the workspace lint failure as proof of a UI failure, and do not interpret React Doctor as proof of package build/test success. Read the latest focused UI workflow run before merging.

## Component inventory and classification

| Component | Classification | Current assessment / action |
|---|---|---|
| Button | Foundation / Primitive | Keep; disabled/loading and `asChild` behavior now has regression tests |
| Skeleton | Foundation | Keep; reduced-motion utility added |
| PhotoPlaceholder | Foundation | Keep; decorative placeholder is hidden from assistive technology |
| Timeline and compound parts | Composite | Keep; semantic list structure exists; add interaction tests only if real interactive behavior is introduced |
| Carousel | Composite | Keep; state and accessible-name fixes made; browser keyboard check remains |
| FormInput / FormSelect / FormTextArea | Form Pattern | Keep React Hook Form integration; label and error semantics aligned |
| FormCheckbox / FormRadio / FormDateRanger | Form Pattern | Fieldset/legend, required, and error associations improved |
| FormPhoneInput / PhoneInput | Specialized Form Pattern | Keep country-specific behavior; native input semantics forwarded |
| Toast | Composite / Feedback | Announcement urgency and icon semantics fixed; lifecycle regression tests added |
| NotificationBanner | Composite / Feedback | Decorative icon and dismissal behavior covered |
| FileDownloadButton | Feature-leaning composite | Retain unless consumer evidence supports moving it |
| Phase | Pattern / potentially feature-specific | Inspect actual consumer usage before moving or renaming |
| Loading | Foundation / Feedback | Lottie API and status semantics fixed |

These classifications are based on inspected source and intent, not a formal ownership audit. Moving components requires checking all consumers first.

## API, tokens, and package decisions

- Preserve `@pawhaven/ui`, `@pawhaven/ui/form`, and existing public names for this change.
- Keep React and React DOM as peer dependencies.
- Keep JavaScript tree-shakeable and CSS side-effectful.
- Portal's package manifest does not list MUI, and repository code search did not return direct `@mui/material` import matches. Treat that as evidence against current MUI bypass—not as a substitute for a future automated import-boundary rule.
- Prefer native HTML props and consistent controlled/uncontrolled contracts for new components. Standardize `size`, `variant`, `loading`, `disabled`, and error semantics prospectively rather than changing established APIs in bulk.
- Use semantic Design System tokens. Avoid adding arbitrary Tailwind values or inline styles when an existing token/utility can express the requirement. Existing inline sizing in `FormTextArea` and uneven form variant vocabularies remain candidates for a later compatibility-safe cleanup.
- Do not add Changesets, Storybook, or codemods without confirming the need for a release process, a visual-review workflow, or a real breaking migration.

## Governance plan

1. **Admission:** Add a component to `packages/ui` when it is presentation-focused and reused across features, or is a stable shared primitive. Feature workflows should remain feature-owned.
2. **Ownership:** Every exported component should have a clear purpose and an accountable maintainer before the package becomes a separately released product.
3. **API review:** Review native prop inheritance, controlled/uncontrolled behavior, variants, disabled/loading/error states, token use, and whether the component leaks library-specific APIs.
4. **Accessibility:** Check semantic HTML, accessible names, keyboard behavior, focus, error relationships, announcement urgency, and reduced motion.
5. **Tests:** Test observable behavior—loading, disabled, invalid, keyboard, dismissal, and empty states. Do not use coverage percentage as the only quality target.
6. **Changes:** Record public API changes and migration notes. Use a compatibility layer or deprecation period for breaking renames.
7. **Quality gates:** Run token validation, UI package build/tests, Portal production build/CSS verification, and React Doctor for React changes. Add browser-level a11y/visual tests when there is a stable workflow and baseline ownership.

## Acceptance checklist

- [x] CSS side effects declared for the UI package.
- [x] Lottie API and accessible status semantics corrected.
- [x] Form label, required, invalid, and error-description semantics improved for all shared form patterns.
- [x] Button native and `asChild` disabled/loading behavior covered by regression tests.
- [x] Carousel accessible naming and state synchronization improved; naming test added.
- [x] Toast and NotificationBanner announcement semantics and tests improved.
- [x] Focused UI quality workflow added.
- [ ] Focused UI workflow passes on the latest branch head.
- [ ] Confirm production CSS assertions pass in the generated Portal bundle.
- [ ] Confirm full existing consumer flows and browser keyboard/screen-reader behavior.
- [ ] Decide whether Storybook/visual regression is justified by the current team workflow.

**Merge gate:** Do not merge until the focused UI workflow is green. The broader workspace workflow must also be green or its unrelated lint blockers must be separately tracked and explicitly waived by the repository owner.
