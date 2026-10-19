# UI Library Audit and Refactoring Record

**Base:** `main`  
**Working branch:** `refactor/ui-library-audit`  
**Scope:** `packages/ui`, `packages/design-system`, and Portal consumption  
**Status:** Implementation in progress; local build and test execution still required.

## Executive summary

The current `@pawhaven/ui` is a useful shared UI kit, not yet a fully governed design system. Keep the current package and its public entry points. Refactor incrementally, preserving existing consumer behavior where practical.

This review is based on source and configuration inspection. Scores are qualitative engineering judgments, not automated measurements.

| Dimension | Initial score | Notes |
|---|---:|---|
| Public API consistency | 5/10 | Form and primitive props are not fully consistent |
| Reuse and boundaries | 6/10 | Shared primitives coexist with workflow-oriented components |
| Accessibility | 5/10 | Label/error relationships and carousel semantics needed work |
| Token integration | 7/10 | Semantic Tailwind tokens are used, but not uniformly |
| Package/build contract | 6/10 | CSS side-effect declaration needed correction |
| Tests | 5/10 | Carousel and Timeline tests exist; complete coverage not measured |
| Change governance | 4/10 | Package is private; release/compatibility governance is limited |

## Confirmed findings

### 1. CSS side-effects declaration

- **Evidence:** `packages/ui/package.json` declared `"sideEffects": false`; `packages/ui/index.css` imports `@pawhaven/design-system/index.css`.
- **Risk:** Bundlers may remove CSS imports considered side-effect-free.
- **Change:** Declare CSS files as side effects while leaving JavaScript eligible for tree-shaking.
- **Acceptance:** Build the Portal production bundle and verify design-system CSS and component styles remain present.

### 2. Lottie API usage

- **Evidence:** `packages/ui/src/components/loading/Loading.tsx` imported a named `Lottie` and passed `src={animationData}`.
- **Change:** Use the named `Lottie` export from `lottie-react` v3 with its `src` prop (which accepts the parsed animation object); add a status role and configurable accessible label.
- **Acceptance:** Typecheck and render the component in the Portal; verify the animation loads and the status has an accessible name.

### 3. FormInput accessibility

- **Evidence:** `FormInput` displayed its label in a `div` without associating it with the input, and error text had no stable relationship to the control.
- **Change:** Add a generated input ID, a real `label`, `aria-describedby` for validation errors, and an alert role for error feedback.
- **Acceptance:** The control can be found by its accessible label; when invalid, its error is associated and exposed.

### 4. FormSelect accessibility

- **Evidence:** `FormSelect` displayed its label in a `div` and did not connect validation errors to the select.
- **Change:** Add generated ID, associated label, error description relationship, and hide the decorative icon from assistive technology.
- **Acceptance:** Accessible name and error relationship are verified in component tests.

### 5. FormTextArea accessibility

- **Evidence:** `FormTextArea` used an unassociated label container and did not link error feedback to the field.
- **Change:** Add generated ID, associated label, required semantics, and error description relationship.
- **Acceptance:** Accessible name and invalid state are testable.

### 6. Button loading semantics

- **Evidence:** `Button` supported loading but did not expose `aria-busy`.
- **Change:** Expose busy state and keep the spinner decorative. For `asChild`, do not pass a native `disabled` attribute to a non-button child.
- **Acceptance:** Native buttons disable during loading; slotted children expose disabled semantics and cannot activate while disabled/loading. Regression tests now cover both disabled and loading slotted links; execution is pending CI.

### 7. Carousel state and semantics

- **Evidence:** `Carousel` synchronized state during render when the Embla API changed; the carousel region had no configurable accessible name.
- **Change:** Synchronize state in an effect, add a configurable region label, and give slides position labels.
- **Acceptance:** Existing Carousel tests pass; add a regression test for accessible region naming and verify keyboard controls.

## Component inventory and classification

| Component | Classification | Recommendation |
|---|---|---|
| Button | Foundation / Primitive | Keep; stabilize loading and slotted-child semantics |
| Skeleton | Foundation | Keep; verify decorative semantics and reduced motion |
| PhotoPlaceholder | Foundation | Keep; simple and focused |
| Timeline | Composite | Keep; maintain semantic list structure |
| Carousel | Composite | Keep; improve state synchronization and a11y |
| FormInput / FormSelect / FormTextArea | Form Pattern | Keep RHF integration; standardize label and error semantics |
| FormCheckbox / FormRadio | Form Pattern | Keep; test label, required and error behavior |
| FormPhoneInput / PhoneInput | Form Pattern / specialized input | Keep country-specific behavior; align accessibility and API contracts |
| Toast / NotificationBanner | Composite / Pattern | Audit announcement behavior, lifecycle and timer cleanup |
| FileDownloadButton | Feature-leaning composite | Retain unless actual consumer evidence supports moving it |
| Phase | Pattern / possibly feature-specific | Inspect usage before moving or renaming |
| Loading | Foundation / feedback | Keep; fix animation API and accessible status |

The classifications are based on current source and intent. Moving a component out of the package requires checking all consumers first.

## Public API and package strategy

- Preserve `@pawhaven/ui` and `@pawhaven/ui/form`.
- Keep React and React DOM as peer dependencies.
- Keep JavaScript tree-shakeable while marking CSS as side-effectful.
- Do not add subpath exports unless they provide demonstrated bundle or dependency-isolation benefits.
- Prefer native HTML props and stable controlled/uncontrolled conventions for future components.
- Do not add `forwardRef` solely as a convention; use React 19-compatible patterns appropriate to each component.
- Avoid a broad API rename in this refactor. Introduce compatibility layers if a real consumer migration is required.

## Governance plan

1. **Admission:** A component belongs in `packages/ui` when it is presentation-focused and reused across features or is a stable shared primitive.
2. **Ownership:** Every exported component needs an identifiable owner and documented purpose.
3. **API review:** Review native prop inheritance, controlled/uncontrolled behavior, variants, disabled/loading/error states, and token use.
4. **Accessibility:** Verify semantic HTML, accessible names, keyboard interaction, focus behavior, errors, and reduced motion where applicable.
5. **Tests:** Test user-observable behavior, including loading, disabled, invalid, keyboard, and empty states.
6. **Changes:** Record public API changes and migration notes. Do not introduce Changesets or Storybook without confirming the actual package-release and team workflow requires them.
7. **Quality gates:** Run package build/typecheck, component tests, relevant Portal checks, design-token checks, and React Doctor for React changes.

## Remaining verification

The following items are not proven by source inspection alone and must not be reported as passing until executed:

- Full UI package typecheck/build.
- Full UI component test suite and coverage.
- Portal production build and CSS retention.
- Browser-level keyboard and screen-reader behavior.
- Complete direct-import audit for Material UI across the Portal.
- Storybook, visual regression, and release governance inventory across all workspace configuration.

## Acceptance checklist

- [ ] `pnpm --filter @pawhaven/ui build`
- [ ] `pnpm --filter @pawhaven/ui test`
- [ ] Portal production build succeeds.
- [ ] CSS is retained in the production bundle.
- [ ] Form controls expose accessible names and associated validation errors.
- [ ] Button native and `asChild` disabled/loading behavior is covered.
- [ ] Carousel regression tests cover accessible naming and keyboard controls.
- [ ] React Doctor is run for modified React components.
- [ ] Existing consumer flows remain compatible.
