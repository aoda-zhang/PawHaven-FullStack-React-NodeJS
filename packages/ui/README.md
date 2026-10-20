# @pawhaven/ui

Shared React component library for PawHaven. It is consumed by the Portal
(`apps/frontend/portal`) and by the Storybook catalogue that ships with this
package (`.storybook/`).

The package is **private and workspace-only**: it is never published to npm.
See [Package status](#package-status).

---

## Table of contents

1. [What this package is](#what-this-package-is)
2. [Entry points](#entry-points)
3. [Installation and the CSS import contract](#installation-and-the-css-import-contract)
4. [Component catalogue](#component-catalogue)
5. [Shared prop vocabulary](#shared-prop-vocabulary)
6. [Accessibility notes by component family](#accessibility-notes-by-component-family)
7. [Migration guide](#migration-guide)
8. [Package status](#package-status)
9. [Working on the package](#working-on-the-package)

---

## What this package is

`@pawhaven/ui` is a small, opinionated kit of presentational React
components plus a set of React Hook Form patterns. It owns:

- **Visual consistency** — every component styles itself with semantic
  `@pawhaven/design-system` tokens (`bg-primary`, `text-text-secondary`,
  `border-border`, …), never with raw palette names or arbitrary values.
- **Accessible semantics** — label association, invalid state, error
  announcement, focus management and live-region behaviour are implemented
  once, in the component, instead of being re-implemented per screen.
- **A single vocabulary** — `size`, `variant`, `error`/`errorId`, `disabled`
  and `label` mean the same thing across the library (see
  [Shared prop vocabulary](#shared-prop-vocabulary)).

The package is a **bundler target**, not a runtime library: it ships
TypeScript-compiled ES modules in `build/` and one stylesheet in
`index.css`.

## Entry points

The `exports` map exposes exactly three subpaths.

| Import                   | Contents                                               | Use it when                                                                                 |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `@pawhaven/ui`           | Everything except the form controls.                   | You need a button, banner, toast, carousel, skeleton, timeline, etc.                        |
| `@pawhaven/ui/form`      | The React Hook Form controls and their shared helpers. | You are inside a `<FormProvider>` and want a control that is already wired to a form field. |
| `@pawhaven/ui/index.css` | The stylesheet.                                        | Always — see below.                                                                         |

```ts
// Presentational components
import { Button, Carousel, NotificationBanner, Toast, cn } from '@pawhaven/ui';

// Form controls (require a React Hook Form context)
import { FormInput, FormRadio } from '@pawhaven/ui/form';

// The stylesheet — required exactly once per application
import '@pawhaven/ui/index.css';
```

**`@pawhaven/ui` vs `@pawhaven/ui/form`.** The two entry points are split so
that the form controls — and their `react-hook-form` imports — are only
reachable through `@pawhaven/ui/form`. A bundle that never imports the form
entry therefore never pulls the form components into the module graph.
(`react-hook-form` is still a runtime `dependency` of the package, so it is
installed either way; the split is about the module graph, not about the
dependency install.) Import form controls only from `@pawhaven/ui/form`; do
not mix the two import paths for the same component.

`@pawhaven/ui/form` requires a React Hook Form context. Every control calls
`useFormContext()`, so it must be rendered inside a `<FormProvider>` backed by
`useForm`:

```tsx
import { FormProvider, useForm } from 'react-hook-form';
import { FormInput } from '@pawhaven/ui/form';

const form = useForm({ defaultValues: { name: '' } });

<FormProvider {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormInput name="name" label="Name" required />
  </form>
</FormProvider>;
```

## Installation and the CSS import contract

`@pawhaven/ui` is a workspace dependency (`workspace:*`), so there is nothing
to install by hand — add it to the consuming package and run `pnpm install`:

```jsonc
// apps/frontend/portal/package.json
{
  "dependencies": {
    "@pawhaven/ui": "workspace:*",
  },
}
```

### The CSS import is required

**`import '@pawhaven/ui/index.css'` is mandatory.** The components ship
unstyled JavaScript; every class name they use only resolves if the
design-system stylesheet is part of the bundle.

`packages/ui/index.css` is:

```css
@import '@pawhaven/design-system/index.css';
@import 'react-phone-number-input/style.css';

@source './src/**/*.{ts,tsx}';
```

It pulls in `@pawhaven/design-system/index.css`, which itself starts with
`@import 'tailwindcss';`.

### The trap: you must install Tailwind yourself

`packages/ui` declares `tailwindcss` as a **devDependency** only, while the
stylesheet it ships transitively `@import`s `tailwindcss`. The package does
**not** ship a compiled stylesheet. Therefore:

- The consuming application **must** have `tailwindcss` installed in its own
  `dependencies` (or `devDependencies`) at a version compatible with the
  design system (`^4.1.14` at the time of writing).
- With **Vite**, the application **must** also install `@tailwindcss/vite`
  (`^4.1.14`) and register the plugin, otherwise the `@import 'tailwindcss'`
  directive is never processed and the components render unstyled:

  ```ts
  // vite.config.ts
  import tailwindcss from '@tailwindcss/vite';
  import { defineConfig } from 'vite';

  export default defineConfig({
    plugins: [react(), tailwindcss()],
  });
  ```

  The Portal does exactly this — see `apps/frontend/portal/vite.config.ts`
  and `apps/frontend/portal/src/main.tsx`.

- The `@source './src/**/*.{ts,tsx}'` directive in `packages/ui/index.css`
  tells Tailwind to scan the library's own sources for class names. Because
  the package is consumed from the workspace (not from a published tarball),
  `packages/ui/src` is present on disk and the scan works.

If the styles are missing, the symptom is unstyled — but functional —
components: no colours, no spacing, no focus ring. Nothing throws.

### Import it exactly once

Import the stylesheet once, at the application entry point. Importing it in
several modules duplicates the CSS in the bundle.

```tsx
// apps/frontend/portal/src/main.tsx
import '@pawhaven/ui/index.css';
```

Note that `packages/ui/index.css` also imports
`@pawhaven/design-system/index.css`. If the application already imports the
design-system stylesheet directly, remove that import — importing both means
the design-system CSS is emitted twice.

## Component catalogue

Classification follows the vocabulary used in
`docs/architecture-reviews/04-ui-library.md`:

- **Primitive / Foundation** — a single control or element with no internal
  state machine. Safe to drop into any screen.
- **Composite** — several primitives composed into a richer widget
  (compound components, stateful feedback surfaces).
- **Pattern** — a recurring screen-level shape, in practice the React Hook
  Form controls.

### Primitive / Foundation

| Component          | Purpose                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `Button`           | The action control. Variants, sizes, `loading`, `disabled` and optional `asChild` slot rendering. |
| `Skeleton`         | A static grey placeholder block for content that has not loaded yet.                              |
| `PhotoPlaceholder` | Decorative paw-print shown when an item has no photo.                                             |
| `Loading`          | Full-viewport Lottie spinner with an accessible status label.                                     |

### Composite

| Component                                                                                                   | Purpose                                                                                  |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Carousel`                                                                                                  | Embla-backed image carousel with slide navigation, autoplay and accessible slide labels. |
| `NotificationBanner`                                                                                        | Page-level banner for information, warnings, errors and success messages.                |
| `Toast`                                                                                                     | Transient, queued notification surface with severity-appropriate announcement semantics. |
| `Timeline` + `TimelineItem` / `TimelineSeparator` / `TimelineDot` / `TimelineConnector` / `TimelineContent` | Compound vertical timeline built on a semantic `<ol>` / `<li>` structure.                |
| `FileDownloadButton`                                                                                        | Button that fetches a blob and triggers a browser download, with in-flight state.        |

### Pattern (form controls)

| Component        | Purpose                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `FormInput`      | Text-like input (text, password, email, number, …) with an optional show/hide password toggle. |
| `FormTextArea`   | Multi-line text input with a configurable row range.                                           |
| `FormSelect`     | Native `<select>` with a styled chevron and an optional placeholder option.                    |
| `FormCheckbox`   | Single checkbox bound to a boolean form field.                                                 |
| `FormRadio`      | Radio group bound to a single-value form field.                                                |
| `FormDateRanger` | Start/end date pair bound to one `[string, string]` form field.                                |
| `FormPhoneInput` | International phone input bound to a string form field.                                        |
| `PhoneInput`     | The standalone (non-form) international phone input used by `FormPhoneInput`.                  |

### Shared helpers

| Export                                                      | Purpose                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `cn`                                                        | `clsx` + `tailwind-merge` class merger with Tailwind conflict resolution. |
| `buttonVariants`                                            | The `cva` variant map behind `Button`, for building a matching control.   |
| `FORM_CONTROL_SIZE_CLASSES`, `FORM_CONTROL_VARIANT_CLASSES` | The class maps behind the form-control `size` / `variant` props.          |
| `isValidPhoneNumber`                                        | Re-export of `react-phone-number-input`'s number validator.               |
| `showToast`, `notificationType`                             | Imperative toast API and its severity constants.                          |

## Shared prop vocabulary

The same names mean the same thing everywhere.

### `size`

| Component   | Accepted values                | Default |
| ----------- | ------------------------------ | ------- |
| `Button`    | `sm` \| `md` \| `lg` \| `icon` | `md`    |
| `FormInput` | `sm` \| `md`                   | `md`    |

### `variant`

| Component            | Accepted values                                                             | Default    |
| -------------------- | --------------------------------------------------------------------------- | ---------- |
| `Button`             | `default` \| `destructive` \| `outline` \| `secondary` \| `ghost` \| `link` | `default`  |
| `FormInput`          | `standard` \| `outline` \| `fill`                                           | `outline`  |
| `NotificationBanner` | `standard` \| `fill` \| `accent`                                            | `standard` |

`NotificationBanner` also has a separate `type` prop for severity:
`info` \| `warning` \| `error` \| `success` (default `info`).

### `error` and `errorId`

Every form control and `PhoneInput` accept:

- `error?: ReactNode` — the validation message. It **overrides** the message
  React Hook Form produced for that field. Passing `error` marks the control
  invalid even when the form has no error for the field.
- `errorId?: string` — the `id` of the rendered error element. Defaults to
  `<control id>-error`.

The component renders the error message itself, in a `<p>` below the control,
and points the control's `aria-describedby` at it. `aria-invalid` is set to
`true` only while the control is invalid (it is omitted, not `false`, when
valid).

The error element is **not** a live region: it is announced once, as part of
the control's description, and is not re-announced on every keystroke. If you
need an assertive announcement on submit, announce it in the form-level error
summary instead.

### `disabled`

Accepted by `Button`, `FormInput`, `FormTextArea`, `FormSelect`,
`FormCheckbox`, `FormRadio`, `FormDateRanger`, `FormPhoneInput`,
`PhoneInput` and `FileDownloadButton`.

`disabled` is forwarded to the native control, so the browser removes it from
the tab order and it is not submitted with the form.

### `label`

**`label` is required on every form control.** It is the accessible name of
the control, so it is not optional and it is always rendered — the previous
conditional rendering of the label was removed in this branch.

```tsx
<FormInput name="email" label="Email address" required />
```

`label` is also used as the group label for the compound controls
(`FormRadio`, `FormDateRanger`), where it is rendered as a `<legend>`.

`FormDateRanger` additionally renders visually hidden labels for the two date
inputs (`"<label> start"` and `"<label> end"`), because a single legend is
not enough to name two separate inputs.

## Accessibility notes by component family

### Buttons

- `Button` renders a native `<button>`, so it is in the tab order, activates
  on both Enter and Space, and is announced as a button.
- `disabled` uses the native `disabled` attribute — the button is removed
  from the tab order and cannot be activated.
- `asChild` renders a different element through a Radix `Slot`. A native
  `disabled` cannot be set on, for example, an `<a>`, so the component sets
  `aria-disabled="true"` **and** intercepts the click in the capture phase
  to prevent default activation and stop propagation. A slotted control is
  therefore still focusable, but not activatable.
- `loading` sets `aria-busy="true"` and renders a spinner that is
  `aria-hidden="true"`. While loading, the button behaves as disabled.
- The focus indicator comes from the design-system `focus-ring` utility and
  is present on every variant.

### Form controls

- Each control generates a stable id with `useId()` and associates a real
  `<label htmlFor>` with it. The label is the accessible name.
- `required` sets the native `required` attribute, and the visible `*` next
  to the label is `aria-hidden="true"` so it is not announced twice.
- When a control is invalid, `aria-invalid="true"` is set and
  `aria-describedby` points at the rendered error message.
- `FormRadio` and `FormDateRanger` use `<fieldset>` + `<legend>` instead of
  a `<label htmlFor>`, and the error message is referenced by
  `aria-describedby` on the `<fieldset>`.
- `FormPhoneInput` delegates to `PhoneInput`, which forwards `id`,
  `required`, `aria-invalid` and `aria-describedby` to the underlying native
  number input, so the relationship survives the third-party wrapper.
- `FormDateRanger` treats the range as one field: neither date input is
  individually `required`, and the form schema decides whether a half-filled
  range is valid.

### Toast

- The toast surface is a persistent live region: `role="region"` with
  `aria-label="Notifications"`, containing an inner `aria-live="polite"`
  container. Because the live region is always mounted, a message injected
  after the first render is still announced.
- Each entry carries its own urgency: `role="alert"` (assertive) for
  `error` and `warning`, `role="status"` (polite) for `success` and `info`.
- An assertive toast moves focus to its dismiss button, and restores focus
  to the previously focused element when it disappears.
- The icons are `aria-hidden="true"`.
- Only one mounted `<Toast />` renders the queue. Extra instances stay empty,
  so mounting the component twice does not duplicate notifications.

### NotificationBanner

- `role="alert"` for `warning` and `error`, `role="status"` for `info` and
  `success`, matching the urgency of the message.
- The type icon is `aria-hidden="true"` — the message text carries the
  meaning.
- The dismiss button has an `aria-label` (`"Dismiss <title>"` when a title
  is present, otherwise `"Dismiss notification"`).
- The external link carries a visually hidden `"(opens in a new tab)"`, and
  the link opens with `rel="noopener noreferrer"`.

### Carousel

- The carousel is a labelled region: `role="region"`,
  `aria-roledescription="carousel"` and an `aria-label` (default
  `"Image carousel"`, configurable through the `label` prop).
- The region is focusable, so the arrow keys work without clicking a slide
  first. `ArrowLeft` and `ArrowRight` move between slides.
- Each slide is a `role="group"` labelled with its position
  (`"1 of 5"`).
- Slide changes are announced politely (`aria-live="polite"`) while auto
  rotation is off, and the live region is switched off (`aria-live="off"`)
  while it is running, so rotation is not announced continuously.
- Autoplay is created when the `autoplay` prop is set, and stops as soon as
  the user interacts with the carousel.

### Loading and Skeleton

- `Loading` has `role="status"` and an accessible `label` (default
  `"Loading"`). The Lottie animation is `aria-hidden="true"`.
- `Skeleton` has `role="status"` and `aria-label="Loading"`. Both props can
  be overridden through the spread props.

### PhotoPlaceholder

`PhotoPlaceholder` is `aria-hidden="true"` — it is a purely decorative
stand-in and must never be used in place of a real image that carries
meaning.

### Known open accessibility findings

The package is linted with `eslint-plugin-jsx-a11y`
(`plugin:jsx-a11y/recommended`). Four findings are still open on this
branch and are listed here so the documented behaviour is not mistaken for
verified behaviour:

| Location                                   | Rule                                  | Note                                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/carousel/Carousel.tsx`         | `jsx-a11y/no-noninteractive-tabindex` | The carousel region is focusable (`tabIndex={0}`) so the arrow keys work. This is the standard carousel pattern, but the rule flags it.                                                   |
| `components/form/form-radio/FormRadio.tsx` | `jsx-a11y/role-supports-aria-props`   | `aria-invalid` is set on a native radio input, whose implicit `radio` role does not declare support for it. The invalid state is still exposed through the fieldset's `aria-describedby`. |

## Migration guide

Breaking changes introduced on the `refactor/ui-library-audit` branch,
relative to `main`. Everything below is a change to a public API of
`@pawhaven/ui` or `@pawhaven/ui/form`.

### 1. `Phase` was removed

`Phase` was a feature-leaning label/value block. It has no consumer in the
Portal and was not part of a coherent shared vocabulary.

```diff
-import { Phase } from '@pawhaven/ui';
-
-<Phase title="Vaccination" sections={[{ label: 'Rabies', value: '2024-01-01' }]} />
```

Use plain markup and the design-system tokens instead:

```tsx
<p className="text-text-secondary">Rabies</p>
<p>2024-01-01</p>
```

### 2. `label` is required on every form control

`label` was optional and rendered conditionally. It is now a required
`string` and is always rendered, because it is the accessible name of the
control.

```diff
-<FormInput name="name" />
+<FormInput name="name" label="Name" />
```

### 3. `BaseFormType` and `BaseTextFieldType` lost props

```diff
-// BaseFormType
-type?: string;              // moved to FormInput only
-className?: string | string[];  // now `className?: string`
+className?: string;

-// BaseTextFieldType
-prefix?: string;
-defaultPrefix?: boolean;
-owPasswordToggle?: boolean;   // typo in the old API, never rendered
-suffix?: string;
-defaultSuffix?: boolean;
```

`disabled`, `error` and `errorId` were **added** to `BaseFormType`, so they
are now available on every form control.

### 4. `FormCheckbox` `defaultValue` is a boolean

```diff
-<FormCheckbox name="agree" label="I agree" defaultValue="" />
+<FormCheckbox name="agree" label="I agree" />
```

### 5. Form controls render the error message themselves

Previously the error message was **not announced**, in two different ways:

- `FormInput` set `aria-describedby` to the id of an element it never
  rendered, so the reference pointed at nothing.
- `FormSelect`, `FormTextArea`, `FormDateRanger` and `FormPhoneInput`
  rendered the React Hook Form message, but never referenced it with
  `aria-describedby` — the text was visible but not announced as part of the
  control's description.

Now every control renders the error message, sets `aria-invalid` and points
`aria-describedby` at it.

If your screen rendered its own error message under the control, **remove
it** — otherwise the message is shown twice:

```diff
 <FormInput name="email" label="Email" />
-{formState.errors.email && <p className="text-error">{formState.errors.email.message}</p>}
```

To override the message, use the `error` prop instead:

```tsx
<FormInput
  name="email"
  label="Email"
  error="We could not verify that address"
/>
```

### 6. The phone-input stylesheet moved out of the component

`PhoneInput.tsx` used to import `react-phone-number-input/style.css`
directly, so importing the component also imported the stylesheet. That
import now lives in `packages/ui/index.css`.

If your application imported the phone input styles itself, remove it and
import the package stylesheet instead:

```diff
-import 'react-phone-number-input/style.css';
+import '@pawhaven/ui/index.css';
```

### Additive changes (no migration needed)

- `Loading` accepts `label` and `className`.
- `Skeleton` exposes `role="status"` and `aria-label="Loading"`.
- `Carousel` accepts `label` for the region name.
- `Button` exports `ButtonProps` and `ButtonSize`.
- `NotificationBanner` exports `BannerLink`, `BannerMessage`, `BannerType`
  and `BannerVariant`.
- `PhoneInput` accepts `id`, `disabled` and `defaultCountry`.
- `@pawhaven/ui/form` exports `FORM_CONTROL_SIZE_CLASSES` and
  `FORM_CONTROL_VARIANT_CLASSES`.

## Package status

- **Private.** `packages/ui/package.json` has `"private": true`. The package
  is never published to npm and there is no registry entry for it.
- **Workspace-only.** Consumers depend on it with `workspace:*`
  (`apps/frontend/portal`). The version field
  (`3.0.0`) is not used for resolution.
- **Consumed through a bundler.** The build output is ES modules produced by
  `tsc` (`build/index.js`, `build/index.d.ts`, …) and the stylesheet is
  processed by the consumer's Tailwind pipeline. The package is not
  designed to be `require()`d or `import`ed from plain Node — it is a
  bundler target.
- **JavaScript is tree-shakeable, CSS is not.** `sideEffects` is
  `["**/*.css"]`, so bundlers may drop unused JavaScript but must keep the
  stylesheets. The `verify:package` script asserts that the field still
  covers `index.css`.
- **The build output is generated.** `build/` is produced by `pnpm --filter
@pawhaven/ui build` and is gitignored. `turbo` wires the build into the
  `lint`, `typecheck` and `test` tasks of the packages that depend on it.

## Working on the package

```bash
# Build the package (emits build/)
pnpm --filter @pawhaven/ui build

# Lint (ESLint + jsx-a11y) and type-check
pnpm --filter @pawhaven/ui lint
pnpm --filter @pawhaven/ui typecheck

# Component tests
pnpm --filter @pawhaven/ui test

# Assert the published contract (exports map, build output, sideEffects)
pnpm --filter @pawhaven/ui verify:package
```

The package contract check is a separate script
(`packages/ui/scripts/verify-package.mjs`) because it needs the build output
to exist. It exits `0` when the contract holds, `1` on a violation and `2`
on an input error (for example when the package has not been built).

## Storybook

The Storybook catalogue lives in this package (`.storybook/`) and is the
review surface for visual and interaction changes. Every component owns one
colocated story file next to its source, for example
`src/components/button/Button.stories.tsx`; the form controls live under
`src/components/form/`. The stories import the component sources directly, so
the catalogue always exercises the code in this working tree.

```bash
# Start the catalogue on http://localhost:6006
pnpm --filter @pawhaven/ui storybook

# Build the static site into packages/ui/dist/storybook-static
pnpm --filter @pawhaven/ui build-storybook

# Run the stories in a real Chromium browser (axe accessibility checks)
pnpm --filter @pawhaven/ui test-storybook
```

`packages/ui/scripts/verify-stories.mjs` asserts that every exported
component has a story that actually built. It exits `0` when the coverage
holds, `1` on a violation and `2` on an input error (for example when the
catalogue has not been built).

The accessibility addon runs axe against every story and
`parameters.a11y.test: 'error'` turns any violation into a failing test. The
axe `color-contrast` rule is disabled in `.storybook/preview.tsx`: the
design-system palette is frozen and its current token pairs do not reach WCAG
AA contrast (white on `--color-primary` is 2.55:1, `--color-text-secondary` on
`--color-background` is 4.46:1). Every other axe rule still fails the build.
Re-enable the rule once the palette is corrected.

The catalogue loads its own stylesheet (`.storybook/preview.css`) instead of
the package entry point `index.css`. The entry point excludes the colocated
`*.stories.tsx` files from its Tailwind sources, so the production Portal
bundle never carries story-only utilities; the catalogue needs the opposite,
and a Tailwind `@source not` exclusion applies to every source of a build, not
only to the one that declares it.

The Storybook workflow builds on pull requests and publishes to GitHub Pages
when changes land on `main`. Expected URL:
https://aoda-zhang.github.io/PawHaven-FullStack-React-NodeJS/ .
