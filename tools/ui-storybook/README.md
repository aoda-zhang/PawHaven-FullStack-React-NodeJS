# PawHaven UI Storybook

This standalone Storybook workspace provides a browsable component catalogue for `packages/ui`. Stories import the actual shared component source and the same Design System stylesheet used by Portal.

## Run locally

From the repository root:

```bash
npm install --prefix tools/ui-storybook
npm run --prefix tools/ui-storybook storybook
```

Open http://localhost:6006.

Build the static site with `npm run --prefix tools/ui-storybook build-storybook`. Output is written to `tools/ui-storybook/storybook-static`.

## Included components

- Core: Button variants/sizes/states, FileDownloadButton, Loading, Skeleton, PhotoPlaceholder, Phase, Timeline compound parts, and PhoneInput.
- Feedback/navigation: NotificationBanner variants, Toast severity states, and Carousel controls/keyboard navigation.
- Forms: FormInput/password visibility, FormSelect, FormTextArea, FormCheckbox, FormRadio, FormDateRanger, and FormPhoneInput.
- Storybook accessibility addon and autodocs are enabled.

Form stories run only in the browser and do not submit data to the PawHaven backend.

## Published site

The Storybook workflow builds on pull requests and publishes the static catalogue to GitHub Pages when changes land on `main`. Expected URL: https://aoda-zhang.github.io/PawHaven-FullStack-React-NodeJS/ . The first publication may take a few minutes after merge. If repository settings block deployment, check the Storybook workflow and Settings → Pages.
