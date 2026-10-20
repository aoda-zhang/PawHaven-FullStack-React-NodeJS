# UI Library Audit and Refactoring Record

**Base:** `main`  
**Working branch:** `refactor/ui-library-audit`  
**Pull request:** [#90 — refactor(ui): audit and improve shared UI library](https://github.com/aoda-zhang/PawHaven-FullStack-React-NodeJS/pull/90)  
**Scope:** `packages/ui`, `packages/design-system`, and Portal consumption  
**Status:** The source changes for this audit are on the branch. The focused [UI Library workflow](https://github.com/aoda-zhang/PawHaven-FullStack-React-NodeJS/actions/runs/39183975135) passed on PR #90's head. On the branch head this document describes (all measurements below taken on **2026-10-20**): `pnpm --filter @pawhaven/ui test` is green (19 files, 91 tests), `pnpm --filter @pawhaven/ui lint` is green, `pnpm token-check` and `pnpm --filter @pawhaven/ui verify:package` are green, and the Storybook verification step passes against a freshly built catalogue. Two things are still unobserved rather than unfixed: the GitHub Pages deployment has never run on CI, and the browser-level behaviour of the primitives is still unproven. The separate whole-workspace Test workflow remains blocked by unrelated `@pawhaven/backend-core#lint` errors.

## Executive summary

`@pawhaven/ui` is currently a shared UI kit, not a fully governed Design System. Retain the package and its current public entry points. The best near-term investment is reliability: correct CSS retention, accessible form controls and announcements, disabled/loading behavior, carousel state synchronization, and package-consumer verification. Avoid a broad API redesign until the existing consumer contract is inventoried.

No confirmed P0 issue was found in the reviewed UI-library scope. The most consequential confirmed issues were P1/P2 accessibility and packaging defects. The source changes below address them, and the focused UI workflow verifies package build/tests and Portal CSS retention.

This branch went further than the first pass: it normalized the component vocabularies, added a package-contract check, removed the unused `Phase` component, and gave `packages/ui` a lint gate of its own. It also surfaced findings that are **still open** — WCAG AA contrast and the jsdom-only verification gap — and one that is **deliberately deferred**: the palette itself.

Scores below are qualitative engineering judgments, not automated measurements.

| Dimension              | Initial assessment |            Current assessment | Notes                                                                                                                                                               |
| ---------------------- | -----------------: | ----------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public API consistency |               5/10 |                          6/10 | Vocabularies are normalized (`size`, `variant`, banner variants, `PhoneInput.error`); each surface has exactly one spelling                                         |
| Reuse and boundaries   |               6/10 |                          6/10 | Shared primitives coexist with composite and feature-leaning components                                                                                             |
| Accessibility          |               5/10 | 7/10, automated checks passed | Label/error semantics and announcement behavior have been improved and regression tests added; colour contrast is a separate, still-open finding                    |
| Token integration      |               7/10 |                          7/10 | Semantic tokens exist but hard-coded/inline styles remain in some components; the primitive values themselves are a Figma source of truth this branch did not touch |
| Package/build contract |               6/10 |       8/10, focused CI passed | CSS is declared side-effectful; a focused Portal production CSS check and a package exports-map check were added                                                    |
| Tests                  |               5/10 |                          7/10 | Button, Carousel, forms, Toast, and NotificationBanner behavior now has focused coverage; this is not a coverage percentage                                         |
| Change governance      |               4/10 |                          5/10 | Governance guidance and a focused CI workflow added; ownership and release/version workflow remain lightweight                                                      |

## P0–P3 implementation tracker

Severity means user impact, not simply code style. “Implemented” means the code change exists; it does not mean CI has passed. The three tables below are deliberately separate: work that is done, work that is still open, and work that was chosen not to do.

### Resolved in this branch

| Priority | Finding / acceptance condition                                                                                  | Status                         | Evidence / verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | No confirmed security, privacy, or data-integrity blocker in the reviewed UI package                            | No finding confirmed           | Scope-limited source review; not a security certification                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| P1       | CSS side effects must survive bundling                                                                          | Implemented; focused CI passed | `packages/ui/package.json` now declares `sideEffects: ["**/*.css"]`; focused workflow builds Portal and checks emitted CSS                                                                                                                                                                                                                                                                                                                                                                          |
| P1       | Loading component must use the installed Lottie API and expose an accessible status                             | Implemented                    | `components/loading/Loading.tsx` uses named `Lottie` and `src={animationData}`, `role="status"`, and an accessible label                                                                                                                                                                                                                                                                                                                                                                            |
| P1       | Form controls need real labels, required semantics, invalid state, and associated error text                    | Implemented                    | Input, Select, TextArea, PhoneInput, Checkbox, Radio, and DateRange updated; `label` is a required prop of `BaseFormType`; regression tests added in `form/tests/FormAccessibility.test.tsx`                                                                                                                                                                                                                                                                                                        |
| P1       | Disabled/loading slotted Buttons must not activate links or other slotted controls                              | Implemented                    | `components/button/Button.tsx` blocks capture-phase activation for disabled/loading `asChild`; Button tests cover disabled, loading, and native loading state                                                                                                                                                                                                                                                                                                                                       |
| P1       | Carousel state must not be synchronously updated during render and region needs an accessible name              | Implemented                    | `components/carousel/Carousel.tsx` syncs Embla state in an effect and exposes `label`; slides expose their position                                                                                                                                                                                                                                                                                                                                                                                 |
| P2       | Notification iconography must be decorative and announcements should match urgency                              | Implemented                    | NotificationBanner icons are hidden from assistive tech; Toast uses `status` for success/info and `alert` for error/warning, with decorative icons                                                                                                                                                                                                                                                                                                                                                  |
| P2       | UI package changes need focused build/test/consumer CSS checks that are not blocked by unrelated workspace lint | Implemented                    | `.github/workflows/ui-library.yml` runs token check, UI build/tests, the package contract check, Portal build, and production CSS assertions                                                                                                                                                                                                                                                                                                                                                        |
| P2       | Component API vocabulary must be consistent for new code                                                        | Implemented                    | Button `size` is `sm \| md \| lg \| icon`; form-control `size` is `sm \| md` and `variant` is `standard \| outline \| fill`; NotificationBanner `variant` is `standard \| fill \| accent`; `PhoneInput` carries the message through `error`. Each surface has one spelling and the previous spellings are gone                                                                                                                                                                                      |
| P2       | The package's `exports` map must be checked, not assumed                                                        | Implemented                    | `packages/ui/scripts/verify-package.mjs` asserts every export target resolves, the named exports survive the build, and `sideEffects` covers the shipped stylesheets; wired into the focused workflow as `verify:package`                                                                                                                                                                                                                                                                           |
| P2       | The previous spellings of the component vocabularies must be removed, not kept as aliases                       | Implemented                    | Each surface accepts exactly one spelling: the form-control `size` / `variant` props, the `Button` `size` prop, the `NotificationBanner` `variant` and link props, and the `PhoneInput` error prop. The earlier spellings and the resolver helpers behind them are gone from `packages/ui/src`, and no consumer used them                                                                                                                                                                           |
| P2       | An unused component must not sit in the public barrel                                                           | Implemented                    | `Phase` was removed from `packages/ui/src/components/phase/` and from `packages/ui/src/index.ts`; no consumer imported it                                                                                                                                                                                                                                                                                                                                                                           |
| P2       | A browsable Storybook catalogue must cover all exported UI components                                           | Implemented                    | The catalogue now lives in the UI package itself (`packages/ui/.storybook/`) with one story file per component, colocated with its source (`packages/ui/src/components/<component>/<Component>.stories.tsx`). `packages/ui/scripts/verify-stories.mjs` derives the component list from the public barrels and asserts that every exported component has a story that actually built, plus the behavioural stories (the form size/variant matrix, the mobile and tablet layouts, the password field) |
| P2       | The `packages/ui` lint gate must be green                                                                       | Implemented                    | `packages/ui` gained a `lint` script and `plugin:jsx-a11y/recommended`. The gate surfaced `react-hooks/refs` in `toast/Toast.tsx` and a `jsx-a11y` finding on `FormRadio`; all were fixed, and `eslint src --max-warnings 0` now exits 0 with 0 errors and 0 warnings. See _New findings → B_                                                                                                                                                                                                       |

### Still open

| Priority | Finding / acceptance condition                                               | Status                       | Evidence / verification                                                                                                                                                                                                                                               |
| -------- | ---------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Text and control colours must meet WCAG AA                                   | Open — measured, not applied | See _New findings → A. WCAG AA contrast_ below. 18 pairs fail — 14 × 1.4.3 text contrast and 4 × 1.4.11 non-text — with candidate values and ratios recorded against each. No token was changed                                                                       |
| P2       | The GitHub Pages deployment must actually happen                             | Open — never observed on CI  | The `deploy` job in `.github/workflows/storybook.yml` `needs: build`, so it only runs when the whole build job succeeds. The verify step that used to break that job is fixed in this branch, but no deployment has been observed yet                                 |
| P2       | Behaviour must be proven in a real browser, not only in jsdom                | Open                         | Every UI test runs in jsdom with `css: false` (`packages/ui/vitest.config.ts`); the only Playwright specs are `e2e/smoke.spec.ts` and `e2e/report-animal.spec.ts`, and neither covers `@pawhaven/ui`. See _New findings → C. jsdom vs. real-browser verification gap_ |
| P2       | Automated visual regression and manual browser/screen-reader checks          | Open                         | Storybook is the review surface; screenshot baselines and manual assistive-technology checks are still separate follow-ups                                                                                                                                            |
| P3       | Clean up unused props such as `FormDateRanger` and legacy text-field options | Open                         | The component vocabularies are settled and their previous spellings are removed. What is left is the unused-prop surface: `FormDateRanger` and the legacy text-field options in `BaseTextFieldType`. Remove them with a consumer inventory and tests                  |

### Deliberately deferred

| Priority | Finding / acceptance condition                                                       | Status                                                 | Evidence / verification                                                                                                                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | The primitive colour palette must be re-valued to meet WCAG AA                       | Deferred — the palette was deliberately left unchanged | The colour primitives in `packages/design-system/src/tokens/color.css` are the Figma source of truth; every consumer inherits them, and re-valuing them changes the product's appearance. That is a design decision, not an audit fix. The measurements are in _New findings → A_ so the decision can be made with the numbers in hand. This branch changed no token value |
| P2       | Component API vocabulary and style sources need consistent future governance         | Deferred — the vocabulary sweep is done                | Record the migration rules below; a further breaking sweep of the remaining consumer APIs is not scheduled                                                                                                                                                                                                                                                                 |
| P2       | Animations should honour the user's reduced-motion preference                        | Deferred — out of scope for now                        | The product does not account for the OS reduced-motion setting, so nothing in the package reacts to `prefers-reduced-motion`. The global rule, the `usePrefersReducedMotion` hook and its Loading/Carousel/Skeleton wiring were removed rather than shipped. Reintroduce them when motion preferences are in scope                                                         |
| P3       | Private package release governance, ownership, deprecation, codemods, and Changesets | Deferred intentionally                                 | Package is private and currently workspace-consumed; adding a release framework without an external release workflow would be premature                                                                                                                                                                                                                                    |

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
- **Changes:** Use generated stable-per-mount IDs, real label associations or fieldset/legend grouping, native required semantics, `aria-invalid`, `aria-describedby`, and alert semantics for validation feedback. `label` is a required prop, so a control cannot ship unlabelled. Phone input forwards the ID, required state, and error relationship to its native number input, and takes the message through `error`.
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
- **Open:** the browser keyboard and focus check is still outstanding — the current tests use jsdom API polyfills and do not prove assistive-technology behavior.

### 6. Toast and NotificationBanner

- **Notification changes:** Decorative icons are hidden from the accessibility tree. Toast severity determines announcement semantics: error/warning use `alert`, while success/info use `status`. Banner remains an alert and has a dismiss regression test.
- **Regression coverage:** `packages/ui/src/components/loading/tests/Loading.test.tsx`, `packages/ui/src/components/toast/tests/Toast.test.tsx`, and `packages/ui/src/components/notification-banner/tests/NotificationBanner.test.tsx`.
- **Remaining review:** Confirm timer behavior under browser tab suspension and whether repeated announcements should be deduplicated.

### 7. Focused quality gate

Added `.github/workflows/ui-library.yml` to isolate UI-package verification from unrelated workspace lint failures. It runs:

1. Design token validation.
2. UI package build and its workspace dependencies.
3. The package contract check (`pnpm --filter @pawhaven/ui verify:package`).
4. UI component tests.
5. Portal production build and its workspace dependencies.
6. Assertions that Design System tokens and a UI-library utility survive in the production CSS.

The focused [UI Library workflow](https://github.com/aoda-zhang/PawHaven-FullStack-React-NodeJS/actions/runs/39183975135) passed token validation, UI package build, all UI component tests, Portal production build, and CSS retention assertions on PR #90's head. React Doctor passed on the same head. On the branch head this document describes, the token, build, test, lint, and CSS steps are green. The separate whole-workspace Test workflow failed at `@pawhaven/backend-core#lint` on existing errors in backend-core test files (including filename-convention and restricted-syntax violations); its Typecheck, Tests, and Build stages were skipped. That failure is outside this UI-library diff, but it means the repository-wide required check is not green.

### 8. Vocabulary normalization

Each component vocabulary was given one canonical spelling, and the previous
spelling was removed rather than kept as an alias:

| Surface                        | Canonical                     | Where it lives                                          |
| ------------------------------ | ----------------------------- | ------------------------------------------------------- |
| `Button` `size`                | `sm \| md \| lg \| icon`      | `components/button/Button.tsx`                          |
| Form control `size`            | `sm \| md`                    | `components/form/formControl.ts`                        |
| Form control `variant`         | `standard \| outline \| fill` | `components/form/formControl.ts`                        |
| `NotificationBanner` `variant` | `standard \| fill \| accent`  | `components/notification-banner/NotificationBanner.tsx` |
| `NotificationBanner` link      | `link: { text, href }`        | `components/notification-banner/NotificationBanner.tsx` |
| `PhoneInput` error             | `error` (the message)         | `components/phone-input/PhoneInput.tsx`                 |

`FileDownloadButton` was reduced to the props it actually needs — `fileFetchRequest`, `fileName`, `onSuccess`, `onError`, `disabled`, `children` — and renders its own `Button`. The former `fileType`, `label`, `buttonClassName`, and `contentClassName` props are gone.

### 9. Design-token comment sync

`packages/design-system/src/theme.css` now carries the resolved hex value beside every semantic token, and `--color-brown-11` was added so the footer surface has a primitive rather than a literal. No colour value was changed by this branch.

## New findings raised by this branch

### A. WCAG AA contrast

Measured against the tokens as they stand. Ratios are WCAG 2.x relative luminance over the stated surface, computed from `packages/design-system/src/tokens/color.css` and `packages/design-system/src/theme.css`. Text pairs are held to 1.4.3 (4.5:1; 3:1 for large text), control boundaries and meaningful icons to 1.4.11 (3:1).

**No token value was changed, and none is proposed for this branch.** The primitives are the Figma source of truth, every consumer inherits them, and re-valuing them changes the product's appearance — a design decision rather than an audit fix. The numbers are recorded so that decision can be taken with evidence.

Text contrast (1.4.3):

| Pair                                                                    | Current                | Ratio | Needed | Candidate              | Candidate ratio |
| ----------------------------------------------------------------------- | ---------------------- | ----: | -----: | ---------------------- | --------------: |
| `--color-text-secondary` on `--color-background`                        | `#737373` on `#f8f8f8` |  4.46 |    4.5 | `#5b5b5b`              |            6.39 |
| `--color-text-secondary` on `--color-background-subtle`                 | `#737373` on `#f6e9df` |  3.98 |    4.5 | `#5b5b5b`              |            5.70 |
| `--color-text-tertiary` on `--color-background`                         | `#a3a3a3` on `#f8f8f8` |  2.38 |    4.5 | `#6f6f6f`              |            4.73 |
| `--color-text-placeholder` on `--color-background`                      | `#d4d4d4` on `#f8f8f8` |  1.40 |    4.5 | `#6f6f6f`              |            4.73 |
| `--color-text-link` on `--color-background`                             | `#f7823a` on `#f8f8f8` |  2.41 |    4.5 | `#c2410b`              |            4.88 |
| `--color-primary` as link text on `--color-background`                  | `#f7823a` on `#f8f8f8` |  2.41 |    4.5 | `#c2410b`              |            4.88 |
| `--color-primary-fg` on `--color-primary` (primary button)              | `#ffffff` on `#f7823a` |  2.56 |    4.5 | `#ffffff` on `#c2410b` |            5.18 |
| `--color-primary-fg` on `--color-primary/90` (banner `variant: 'fill'`) | `#ffffff` on `#f78e4d` |  2.35 |    4.5 | `#ffffff` on `#c2410b` |            5.18 |
| `--color-error` on `--color-surface`                                    | `#ef4444` on `#ffffff` |  3.76 |    4.5 | `#dc2626`              |            4.83 |
| `--color-success` on `--color-surface`                                  | `#4caf50` on `#ffffff` |  2.78 |    4.5 | `#15803d`              |            5.02 |
| `--color-warning` on `--color-surface`                                  | `#f59e0b` on `#ffffff` |  2.15 |    4.5 | `#92400e`              |            7.09 |
| `--color-info` on `--color-surface`                                     | `#3b82f6` on `#ffffff` |  3.68 |    4.5 | `#1d4ed8`              |            6.70 |
| `--color-stat-labels` on `--color-hero-bg`                              | `#8f7b69` on `#f6e9df` |  3.39 |    4.5 | `#6b5642`              |            5.81 |
| `--color-footer-muted` on `--color-footer-bg`                           | `#8f7b69` on `#2f1f14` |  3.92 |    4.5 | `#b9a596`              |            6.70 |

Non-text contrast (1.4.11):

| Pair                                               | Current                | Ratio | Needed | Candidate                                        | Candidate ratio |
| -------------------------------------------------- | ---------------------- | ----: | -----: | ------------------------------------------------ | --------------: |
| Form control border on `--color-background`        | `#d4d4d4` on `#f8f8f8` |  1.40 |      3 | `--color-border-strong` `#737373` — no new token |            4.46 |
| Form control border on `--color-surface`           | `#d4d4d4` on `#ffffff` |  1.48 |      3 | `--color-border-strong` `#737373` — no new token |            4.74 |
| NotificationBanner warning icon on `bg-warning/10` | `#f59e0b` on `#f8efe0` |  1.88 |      3 | `#b45309`                                        |            4.15 |
| NotificationBanner success icon on `bg-success/10` | `#4caf50` on `#e7f1e7` |  2.40 |      3 | `#15803d`                                        |            4.14 |
| NotificationBanner error icon on `bg-error/10`     | `#ef4444` on `#f7e6e6` |  3.12 |      3 | `#b91c1c`                                        |            5.16 |
| NotificationBanner info icon on `bg-info/10`       | `#3b82f6` on `#e5ecf8` |  3.10 |      3 | `#1d4ed8`                                        |            5.42 |

The control-border row is the one that needs no palette change at all: `--color-border-strong` already exists and already passes, so the fix is which token the form controls read, not what the token is worth.

The error and info banner icons are listed for completeness — they clear 3:1 today (3.12 and 3.10), but only just; the candidates are the same darkening the failing rows need.

### B. The `packages/ui` lint gate

`packages/ui` gained a `lint` script (`eslint src --max-warnings 0`) in this branch, and its ESLint config gained `plugin:jsx-a11y/recommended`. The new gate did its job: it surfaced `react-hooks/refs` in `toast/Toast.tsx` (the component read `hostIdRef.current` during render) and a `jsx-a11y` finding on `FormRadio`. Those were fixed in this branch, and the gate is now green — `eslint src --max-warnings 0` exits 0 with 0 errors and 0 warnings (measured 2026-10-20).

One thing to know before changing it: the script runs with the package as its working directory, and `packages/ui` has no `.eslintignore` of its own — so ESLint falls back to its defaults instead of the repo-root `.eslintignore`, which deliberately excludes `**/*.test.tsx` and `**/tests/**`. The package gate therefore lints files the repo-wide lint never looks at. That is why `import/no-extraneous-dependencies` fired on test files that import `vitest` and `@testing-library/*` from `devDependencies`. The fixes went into the files rather than into an ignore rule, which is the right direction: the gate stays strict, and the root `.eslintignore` remains the single place that decides what the repo-wide lint skips.

### C. jsdom vs. real-browser verification gap

Every test in `packages/ui` runs under `environment: 'jsdom'` with `css: false` (`packages/ui/vitest.config.ts`). That means:

- No stylesheet is applied, so no colour, spacing, or focus-ring assertion is meaningful.
- The Carousel's Embla behaviour is exercised through jsdom polyfills, so the plugin's own rotation is not observable in tests.

The repository's Playwright setup exists (`playwright.config.ts`, `e2e/smoke.spec.ts`, `e2e/report-animal.spec.ts`) but has no spec for `@pawhaven/ui`. The Storybook catalogue is the closest thing to a browser surface, and its CI gate was broken for most of this branch — so until a browser-level run covers the primitives, the accessibility claims in this record are DOM-level claims only.

## Component inventory and classification

| Component                                 | Classification            | Current assessment / action                                                                                                                                                               |
| ----------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                                    | Foundation / Primitive    | Keep; `size` is `sm \| md \| lg \| icon` and `variant` is `default \| destructive \| outline \| secondary \| ghost \| link`; disabled/loading and `asChild` behavior has regression tests |
| Skeleton                                  | Foundation                | Keep; reduced-motion utility added                                                                                                                                                        |
| PhotoPlaceholder                          | Foundation                | Keep; decorative placeholder is hidden from assistive technology                                                                                                                          |
| Timeline and compound parts               | Composite                 | Keep; semantic list structure exists; add interaction tests only if real interactive behavior is introduced                                                                               |
| Carousel                                  | Composite                 | Keep; state and accessible-name fixes made, the region is keyboard reachable, and the browser keyboard check remains                                                                      |
| FormInput / FormSelect / FormTextArea     | Form Pattern              | Keep React Hook Form integration; label is required, and error semantics are aligned; `size`/`variant` normalized                                                                         |
| FormCheckbox / FormRadio / FormDateRanger | Form Pattern              | Fieldset/legend, required, and error associations improved                                                                                                                                |
| FormPhoneInput / PhoneInput               | Specialized Form Pattern  | Keep country-specific behavior; native input semantics forwarded; the message travels as `error`                                                                                          |
| Toast                                     | Composite / Feedback      | Announcement urgency and icon semantics fixed; lifecycle regression tests added                                                                                                           |
| NotificationBanner                        | Composite / Feedback      | Decorative icon and dismissal behavior covered; `variant` is `standard \| fill \| accent`                                                                                                 |
| FileDownloadButton                        | Feature-leaning composite | Retain unless consumer evidence supports moving it; props are `fileFetchRequest`, `fileName`, `onSuccess`, `onError`, `disabled`, `children`                                              |
| Loading                                   | Foundation / Feedback     | Lottie API and status semantics fixed                                                                                                                                                     |

`Phase` was removed in this branch and is deliberately absent from this table: it was a read-only summary card with no consumer, and it is not part of the current public barrel.

Every component in this table is covered by the catalogue. The stories are colocated with the component source — `packages/ui/src/components/<component>/<Component>.stories.tsx` — and the form controls additionally share `packages/ui/src/components/form/FormPatterns.stories.tsx` for the combined form, the responsive layouts, and the size/variant matrix.

These classifications are based on inspected source and intent, not a formal ownership audit. Moving components requires checking all consumers first.

## API, tokens, and package decisions

- Preserve `@pawhaven/ui`, `@pawhaven/ui/form`, and existing public names for this change.
- Keep React and React DOM as peer dependencies.
- Keep JavaScript tree-shakeable and CSS side-effectful.
- Portal's package manifest does not list MUI, and repository code search did not return direct `@mui/material` import matches. Treat that as evidence against current MUI bypass—not as a substitute for a future automated import-boundary rule.
- Prefer native HTML props and consistent controlled/uncontrolled contracts for new components. Standardize `size`, `variant`, `loading`, `disabled`, and error semantics prospectively rather than changing established APIs in bulk.
- Use semantic Design System tokens. Avoid adding arbitrary Tailwind values or inline styles when an existing token/utility can express the requirement. Existing inline sizing in `FormTextArea` remains a candidate for a later compatibility-safe cleanup.
- The colour primitives are the Figma source of truth. Re-valuing them for WCAG AA is a product decision, not a UI-library change; until it is taken, the measurements in this record are the reference.
- Storybook is now part of the UI review workflow. Do not add Changesets or codemods without confirming the need for a release process or a real breaking migration.

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
- [x] Production CSS assertions pass in the generated Portal bundle.
- [x] Component vocabularies normalized; each surface has exactly one spelling.
- [x] Package exports map and `sideEffects` asserted against the built package.
- [x] `Phase` removed from the package and from the public barrel.
- [x] `packages/ui` has a lint gate of its own, and the `react-hooks`/`jsx-a11y` findings it surfaced are fixed.
- [x] Storybook CI verification step reads its index relative to the script, and its required-story list no longer names the removed `Phase`.
- [x] Focused UI workflow passes on this branch head — token, build, test, lint, and package-contract steps are green.
- [ ] Confirm full existing consumer flows and browser keyboard/screen-reader behavior.
- [x] Add Storybook stories for every exported UI component and form pattern — the catalogue builds and `verify-stories.mjs` asserts one per exported component.
- [ ] Confirm the public Pages deployment succeeds — the deploy job has never been observed on CI.
- [ ] Decide the WCAG AA palette question with the measurements in this record.
- [ ] Decide whether screenshot-based visual regression is justified by the current team workflow.

**Merge gate:** The focused UI workflow is green on this branch head — token validation, UI build, UI tests, the package contract check, and the production CSS assertions all pass, and `pnpm --filter @pawhaven/ui lint` is clean. Two items are unobserved rather than unfixed: the GitHub Pages deployment has never run on CI, and the primitives have never been exercised in a real browser. The broader workspace Test workflow remains red due to unrelated backend-core lint failures. Resolve that separately or obtain an explicit repository-owner waiver before merging if that workflow is required.
