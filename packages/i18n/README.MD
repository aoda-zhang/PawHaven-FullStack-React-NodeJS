# @pawhaven/i18n

`@pawhaven/i18n` is the shared internationalization (i18n) package for the PawHaven frontend ecosystem.

It centralizes language configuration and i18n initialization to ensure **consistency, scalability, and predictable behavior** across applications.

---

## What it does

- Provides a preconfigured `i18next` instance
- Defines supported languages as **business-level configuration**
- Handles language persistence and switching
- Optionally exposes a React `I18nProvider`
- Exposes a Node-safe `@pawhaven/i18n/resources` entry for PDF document text

---

## Locale structure

Locales are organized **locale-first**, with **one file per business**. The filename is always the file's single top-level key, so the per-locale merge is collision-free.

```
locales/
├── zh-CN/                 (Primary — product targets Chinese market)
│   ├── common.json        → { "common": { ... } }
│   ├── carousel.json      → { "carousel": { ... } }
│   ├── imageUpload.json   → { "imageUpload": { ... } }
│   ├── auth.json          → { "auth": { ... } }
│   ├── home.json          → { "home": { ... } }
│   ├── reportAnimal.json  → { "reportAnimal": { ... } }
│   ├── rescueGuide.json   → { "rescueGuide": { ... } }
│   ├── rescueCases.json   → { "rescueCases": { ... } }
│   ├── rescueDetail.json  → { "rescueDetail": { ... } }
│   ├── animalFollow.json  → { "animalFollow": { ... } }
│   ├── footer.json        → { "footer": { ... } }
│   ├── errorMessage.json  → { "errorMessage": { ... } }
│   └── documents/         → Node-only, NOT part of the browser locale (see below)
│       └── pdf/           → one subfolder per document kind
│           ├── header.json         → { "header": { "tagline": ... } }
│           ├── footer.json         → { "footer": { "copyright": ... } }
│           └── {slug}.json         → { "<slug>": { ... } }
├── en-US/                 (Secondary — same 12 files + documents/)
└── de-DE/                 (Secondary — same 12 files + documents/)
```

Rules:

- **One business per file.** The filename equals the top-level key, and every file owns a **unique** top-level key.
- **All three locales stay in sync.** Adding a key means adding it to `zh-CN/`, `en-US/` and `de-DE/` — including under `documents/`.
- **Keys are dotted paths** — `t('rescueGuide.steps_title')`, `t('common.cancel')`. There are no namespace prefixes at the call site.
- **Loading stays lazy.** Only the requested locale's files are fetched; the rest are separate chunks that load on demand.
- **Adding a language** = add one folder with the same 12 files plus `documents/`, then register the locale in `supportedLngs`.

### `documents/` — Node-only, excluded from the browser bundle

`documents/` holds strings that **server-rendered documents** need. Each **subfolder** is one document kind — today only
`pdf/`, which holds the shell chrome (`header.json`, `footer.json`) and one file per guide (`{slug}.json`, the four
guide slugs). `resources.js` reads the folder from **disk with `fs`** and builds one key per subfolder:

- `document.pdf.header.tagline` / `document.pdf.footer.copyright` — the chrome
- `document.pdf.<slug>` — each guide's copy (brand / title / subtitle / sections / checklist / contacts / disclaimer)

Every file inside a kind folder is merged **flat** into that kind's object, so there is no intermediate level and no
special case for chrome versus guides — the filename *is* the key. Adding a second document kind (say email) is just
adding `documents/email/`, which yields `document.email.*` with no change to `resources.js`.

So a backend resolves them as `document.pdf.header.tagline` and `document.pdf.rescueGuide`
(via the `documentI18n` instance).

Each file carries **only its bare top-level key** — `header.json` is `{ "header": { ... } }`, never
`{ "document": { "header": ... } }`. `resources.js` merges file content into the `document` object itself, so a
`document` wrapper would resolve every key one level too deep (`document.document.*`). This is the same
"filename === single top-level key" rule as the UI files.

**The browser loader globs `./locales/*/*.json` — one segment, deliberately.** `index.js` matches only files sitting
directly in `locales/<locale>/`, so `documents/` is never bundled or fetched by the browser. Keep it that way:

- It keeps ~15 KB per locale of PDF copy (the largest group in the package) out of the browser bundle. No portal code
  reads `document.*` today.
- It keeps the "filename === unique top-level key" invariant intact. `documents/pdf/rescueGuide.json` and
  `documents/pdf/footer.json` would collide with the UI files `rescueGuide.json` and `footer.json`; the per-locale merge is
  a shallow `Object.assign` where the later file wins, so widening the glob would silently shadow PDF copy with UI
  keys.

If PDF copy is ever needed in the browser, the lever is **this glob**, not an i18next namespace.

`document` is an **ordinary business key**, not an i18next namespace — it merges into the locale's resource exactly
like `common` or `footer`. There is exactly one namespace per locale (i18next's built-in default), so `document` must
keep its own top-level key: a shared key such as `common` would otherwise be clobbered by `common.json` in the shallow
merge.

---

## Usage (React)

### 1. Wrap your application

```tsx
import { I18nProvider } from '@pawhaven/i18n';

export function App() {
  return (
    <I18nProvider>
      <YourApp />
    </I18nProvider>
  );
}
```

### 2. Use translations

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

t('common.welcome');
```

### 3. Switch language

```tsx
import i18n from '@pawhaven/i18n';

i18n.changeLanguage('en');
```

### Adding a new language

1. Add the language code

```tsx
export const supportedLngs = ['zh-CN', 'en-US', 'de-DE', 'fr-BE'];
```

2. Add the locale folder

```tsx
locales / fr - BE / common.json;
```

---

## Usage (Node — document / PDF)

`@pawhaven/i18n/resources` is Node-safe: it never imports `react`, `react-dom`, `react-i18next`, `i18next-browser-languagedetector` or `i18next-resources-to-backend`.

This entry reads `locales/{locale}/documents/` from disk, so PDF copy does **not** go through the browser loader.
See [`documents/` — Node-only](#documents--node-only-excluded-from-the-browser-bundle).

### `documentI18n` — the instance behind a React PDF render

The same entry also exports the configured i18next instance itself, so a React renderer can mount it:

```tsx
import { I18nextProvider } from 'react-i18next';
import { documentI18n } from '@pawhaven/i18n/resources';
import { renderToStaticMarkup } from 'react-dom/server';

renderToStaticMarkup(
  <I18nextProvider i18n={documentI18n}>
    <PdfTemplate locale={locale} />
  </I18nextProvider>,
);
```

The instance is initialised with `initImmediate: false`, so it is usable synchronously inside
`renderToStaticMarkup`, and with `interpolation: { escapeValue: false }`, so `{{year}}` in footer copy is not
HTML-escaped.

Pass the locale **per call**, not by switching the shared instance:

```tsx
const { t } = useTranslation();

t('guide.rescueGuide.title', { lng: locale });
```

`documentI18n.changeLanguage(locale)` mutates module state shared by every render in the process. Two PDFs
rendering concurrently in different locales would each overwrite the other's language, so `lng` per `t()` call is
the only race-free option.

`returnObjects` is `false` on the instance; pass `{ returnObjects: true }` per call when a whole subtree is wanted.
