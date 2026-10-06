# Locale files — layout and key schema

Lookup reference for `packages/i18n/`. Read this to find where a key lives on disk, what a module file may contain, and which instance answers a given `t()` path. For the naming rules themselves, see `SKILL.md`.

## Contents

- [Supported locales](#supported-locales)
- [Two resource trees](#two-resource-trees)
- [Directory layout](#directory-layout)
- [File name to key path](#file-name-to-key-path)
- [JSON key schema](#json-key-schema)
- [Lookup forms](#lookup-forms)
- [Runtime options that shape lookup](#runtime-options-that-shape-lookup)
- [Package exports](#package-exports)

## Supported locales

```js
// packages/i18n/supportedLngs.js
export const supportedLngs = ['zh-CN', 'en-US', 'de-DE'];
```

`en-US` is the fallback locale. The app instance preloads it and falls back to it for any locale that does not resolve; the document instance sets it as both `lng` and `fallbackLng`.

## Two resource trees

`packages/i18n/locales/` holds two independent trees, loaded by two separate i18next instances.

|                             | App UI                                                          | Documents / PDF                                                          |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Files                       | `locales/<locale>/<module>.json`                                | `locales/<locale>/documents/<kind>/<name>.json`                          |
| Loaded by                   | `packages/i18n/index.js` — browser instance, exported as `i18n` | `packages/i18n/resources.js` — Node instance, exported as `documentI18n` |
| Consumed by                 | the portal and any `react-i18next` component                    | `apps/backend/document-service` PDF templates                            |
| Key path                    | `<module>.<key>`                                                | `document.<kind>.<name>.<key>`                                           |
| `returnObjects`             | `true`                                                          | `false`                                                                  |
| `interpolation.escapeValue` | `false`                                                         | `false`                                                                  |
| Fail-fast                   | no                                                              | throws if `locales/<locale>/documents` is absent                         |

The app instance globs `./locales/*/*.json` — one directory level only. Everything under `documents/` is therefore absent from the browser bundle by construction, so the two trees cannot collide on a key.

## Directory layout

```
packages/i18n/
  supportedLngs.js
  index.js                 # browser instance
  resources.js             # document instance
  i18nProvider.jsx
  locales/
    en-US/
      animalFollow.json    auth.json           carousel.json   common.json
      errorMessage.json    footer.json         home.json       imageUpload.json
      reportAnimal.json    rescueCases.json    rescueDetail.json
      rescueGuide.json
      documents/
        pdf/
          firstAid.json        footer.json      header.json
          injuryResponse.json  kittenCare.json  rescueGuide.json
    zh-CN/                 # same file set as en-US
    de-DE/                 # same file set as en-US
```

Each locale directory carries the identical file set. A module file that exists in one locale and not another is a parity defect, not a partial translation.

## File name to key path

The file's single top-level object is the module name, and that name is the first segment of every `t()` path that reaches it.

| File                                      | Top-level key | Full path                                 |
| ----------------------------------------- | ------------- | ----------------------------------------- |
| `locales/en-US/common.json`               | `common`      | `common.save`                             |
| `locales/en-US/rescueGuide.json`          | `rescueGuide` | `rescueGuide.documents.rescueGuide.title` |
| `locales/en-US/documents/pdf/header.json` | `header`      | `document.pdf.header.tagline`             |

The instance merges every module file in a locale directory with `Object.assign`, so the top-level objects must not collide with each other.

Two existing files deviate from the file-name-equals-key convention: `rescueCases.json` holds the top-level key `rescue_cases`. Match the surrounding file when adding a key there rather than normalising it as a side effect of unrelated work.

## JSON key schema

```json
{
  "rescueGuide": {
    "eyebrow": "Rescue library",
    "documents_title": "Downloadable guides",
    "documents": {
      "rescueGuide": {
        "title": "Animal Rescue Basics",
        "description": "The six steps for helping a stray animal safely..."
      }
    },
    "steps": [
      { "icon": "🕵️‍♀️", "title": "Assess if Rescue Is Needed", "desc": "..." }
    ]
  }
}
```

- Below the module object a file may hold leaf keys, nested sub-objects, and arrays of objects.
- Arrays and objects are read with `returnObjects`, and the result is cast at the call site — the JSON carries no type information.
- Key casing is governed by rule `3a` in `SKILL.md`. The file name is the one `camelCase` segment of a path, and it is a file name rather than a key.
- Error maps are keyed by the constant itself: `{ "errorMessage": { "TOKEN_EXPIRED": "Your session has expired..." } }`.

## Lookup forms

```tsx
// dot path
t('common.cancel');
t('auth.login_subtitle');
t('reportAnimal.report_animal');
t('errorMessage.TOKEN_EXPIRED');

// interpolation
t('common.owner_text', { year: 2025, author: 'Aoda Zhang' });

// object or array value — the app instance sets returnObjects: true
const steps = t('rescueGuide.steps', { returnObjects: true }) as Step[];

// scoped to a subtree
const { t } = useTranslation(undefined, { keyPrefix: 'document.pdf.header' });
t('tagline');
```

The document instance sets `ns: ['translation']` with `defaultNS: 'translation'` and `returnObjects: false`, so a document `t()` call cannot destructure an object — read one leaf key at a time.

## Runtime options that shape lookup

App instance (`packages/i18n/index.js`):

| Option                          | Value                                      | Effect                                                                                     |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `returnObjects`                 | `true`                                     | object and array values are returned rather than stringified                               |
| `interpolation.escapeValue`     | `false`                                    | values are not HTML-escaped; do not interpolate untrusted input                            |
| `interpolation.skipOnVariables` | `false`                                    | a missing variable yields the raw placeholder instead of the key                           |
| `preload`                       | `['en-US']`                                | the fallback locale is bundled eagerly                                                     |
| `detection.order`               | `['localStorage', 'navigator', 'htmlTag']` | the browser language only applies when nothing is stored                                   |
| `detection.lookupLocalStorage`  | `'i18nextLng'`                             | also the storage key the Redux store reads for the active locale                           |
| `react.useSuspense`             | `true`                                     | a component reading `t()` suspends until resources load, so it needs a `Suspense` boundary |

Document instance (`packages/i18n/resources.js`) sets `initImmediate: false`, `returnObjects: false`, and reads its JSON from disk with `node:fs` at module load.

## Package exports

| Subpath                        | File               | Consumer                                                           |
| ------------------------------ | ------------------ | ------------------------------------------------------------------ |
| `@pawhaven/i18n`               | `index.js`         | side-effect import in `packages/frontend-core`, for non-React code |
| `@pawhaven/i18n/i18nProvider`  | `i18nProvider.jsx` | the app root, once                                                 |
| `@pawhaven/i18n/supportedLngs` | `supportedLngs.js` | locale switchers that enumerate locales                            |
| `@pawhaven/i18n/resources`     | `resources.js`     | the backend PDF engine                                             |

Features, pages, and components use `react-i18next` instead — rule `28` in `SKILL.md` states the boundary and its rationale.
