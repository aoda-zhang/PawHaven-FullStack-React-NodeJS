# PawHaven UI Storybook

This standalone Storybook workspace provides a browsable catalogue for `packages/ui`. Stories import the real shared components and the Design System stylesheet used by Portal.

## Run locally

From the repository root:

```bash
npm install --prefix libs/ui-storybook
npm run --prefix libs/ui-storybook storybook
```

Open http://localhost:6006.

Build the static site with `npm run --prefix libs/ui-storybook build-storybook`. Output is written to `libs/ui-storybook/storybook-static`.

## Component documentation and tests

Every component directory under `packages/ui/src/components/` has a local `README.md`. Components without previous focused tests now have colocated test files; the seven form controls each have individual tests plus the shared accessibility suite. Run `pnpm --filter @pawhaven/ui test` from the repository root.

## Included components

- Core: Button variants/sizes/states, FileDownloadButton, Loading, Skeleton, PhotoPlaceholder, Phase, Timeline compound parts, and PhoneInput.
- Feedback/navigation: NotificationBanner variants, Toast severity states, and Carousel controls/keyboard navigation.
- Forms: FormInput/password visibility, FormSelect, FormTextArea, FormCheckbox, FormRadio, FormDateRanger, and FormPhoneInput.
- Storybook accessibility addon and autodocs are enabled.

Form stories run in the browser and do not submit data to the PawHaven backend.

## Published site

The Storybook workflow builds on pull requests and publishes to GitHub Pages when changes land on `main`. Expected URL: https://aoda-zhang.github.io/PawHaven-FullStack-React-NodeJS/ . The first publication may take a few minutes after merge. If repository settings block deployment, check the Storybook workflow and Settings → Pages.
