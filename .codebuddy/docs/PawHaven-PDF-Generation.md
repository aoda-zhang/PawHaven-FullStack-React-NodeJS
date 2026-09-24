How `document-service` turns a guide into a PDF, why this project renders PDFs with React + Puppeteer instead of a PDF templating library, and the constraints that bite when you edit a template.

All claims below were read from source. Paths are relative to `apps/backend/document-service/src/modules/PDF/` unless stated otherwise.

---

## 1. Why React + Puppeteer

A PDF is a **web page printed by headless Chromium**. React produces the markup, Tailwind produces the stylesheet, Puppeteer produces the bytes.

### What it buys

| Benefit                           | Why it matters here                                                                                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One UI language                   | Guides are React components using the same Tailwind utility classes as the web app. No second templating language, no HTML string building, no JSON-layout DSL.                   |
| Design tokens reach PDFs for free | Tokens come from `@pawhaven/design-system` and are compiled into the PDF stylesheet, so a token change lands on the next build. No parallel colour/spacing table to keep in sync. |
| i18n reuses the same machinery    | Templates call `t()` against the same `@pawhaven/i18n` bundles as the frontend. The only PDF-specific step is a per-request locale clone.                                         |
| Testable without a browser        | A template is a plain React element, so `renderToStaticMarkup` asserts markup and translation coverage in milliseconds, with no Chromium in the loop.                             |
| Real layout engine                | Wrapping, CJK line breaking, flexbox, gradients, `break-inside-avoid` and `writing-mode` are handled by Chromium. A PDF library would have to reimplement them.                   |

### What it costs — stated just as plainly

| Cost                                | Detail                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A browser must exist at runtime     | `PDF.service.ts` launches Chromium in `onModuleInit` (`--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu`) and closes it in `onModuleDestroy`. If the launch fails the module throws and the service does not start. Memory and cold-start cost per instance, and the image must ship Chromium. |
| Cost per request                    | Each render opens a page, sets content, prints, then closes it in a `finally`. The body is guarded by `pdf-payload-size.guard.ts`.                                                                                                                                                                                        |
| Pagination is the browser's problem | Breaks are controlled only through CSS print rules. There is no "N pages" control and no callback reporting how a document broke.                                                                                                                                                                                         |
| Print CSS is not screen CSS         | Most importantly, `min-h-screen` resolves to the **printable page height**, not a device screen.                                                                                                                                                                                                                          |
| Output is not byte-stable           | Chrome print output shifts across Chromium versions. Do not golden-file PDF bytes; assert markup and structure instead.                                                                                                                                                                                                   |
| Silent style failures               | The stylesheet is compiled by Tailwind from a fixed scan set. A class outside that set is never generated and renders as nothing — no error, no warning.                                                                                                                                                                  |

---

## 2. The pipeline, end to end

```
POST /pdf/download   (or POST /pdf/preview, non-prod only)
  |
  +- PDF.controller.ts       @Body({ schema: RenderPdfBodySchema }) -> unknown template / bad data = 400
  |                          PdfPayloadSizeGuard -> oversize body rejected
  |                          resolveRequestLocale(headers) -> requires the x-locale header
  |
  +- engine/locale.ts        GuideLocaleSchema.safeParse(x-locale); missing or non-canonical = 400
  |
  +- PDF.service.ts          renderPdf(body, locale) -> buildPdf(this.browser, ...)
  |
  +- engine/pdfBuilder.ts
       1. getPdfTemplate(body.template)          engine/templateRegistry.ts: name -> descriptor (registered by templates/index.ts)
       2. documentI18n.cloneInstance({ lng })    per-request clone, never mutates the shared instance
       3. descriptor.element(instance)           engine/definePdfTemplate wraps Component in I18nextProvider
       4. renderPdfElement(...)                  ReactDOMServer.renderToStaticMarkup
       5. buildHtml(content, locale)             injects <style>{documentStyles}</style> (engine/styles.ts)
       6. buildChromeTemplate(instance, Header|Footer)   same path, plus transparent background
       7. page.setContent(html, { waitUntil: 'load' })
       8. page.pdf({ ...resolvePdfOptions(body.options), headerTemplate, footerTemplate })
       9. page.close()   (finally)
  |
  +- controller writes bytes: Content-Type application/pdf + Content-Length.
     document-service sets NO Content-Disposition; the download route lives in core-service.
```

Where the stylesheet comes from — build time only:

```
packages/design-system/src/tokens/*.css  --+
packages/design-system/src/theme.css     --+-- scripts/sync-design-tokens.mjs
                                            -> engine/pdfRunTime/   (gitignored derived artifacts)

engine/index.css
  @import 'tailwindcss'
  @import './pdfRunTime/tokens/index.css'
  @import './pdfRunTime/theme.css'
  @source '../templates/**/*.tsx'
  @source '../components/**/*.tsx'
  @layer base { ...print defaults... }
        |  scripts/prebuild-pdf-style.mjs  (npm "prebuild")
        v  node_modules/.bin/tailwindcss
engine/pdfRunTime/pdf.generated.css
        |  rspack.config.mjs: test /pdf\.generated\.css$/ -> type 'asset/source'
        v
engine/styles.ts -> documentStyles string -> injected into <head>
```

Nothing reads `@pawhaven/design-system` at runtime. That dependency is entirely compile-time.

---

## 3. Request contract

| Route                | Guards                                   | Notes                                                              |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `POST /pdf/download` | `@OptionalAuth()`, `PdfPayloadSizeGuard` | The production path.                                               |
| `POST /pdf/preview`  | `PdfPayloadSizeGuard`                    | Throws `400` when `http.env === 'prod'`; preview is non-prod only. |

- Body is validated by `RenderPdfBodySchema` (`@pawhaven/backend-core/types`). The template name belongs to a discriminated union, so an unknown template is a `400`, not a cast.
- Locale arrives as the `x-locale` header (`httpHeaders.appLocale`) and is validated by `GuideLocaleSchema`. Missing or non-canonical is a `400` — this service does **not** silently fall back to a default locale.
- `options` is optional. `resolvePdfOptions` (`pdfBuilder.ts:20`) merges it over the defaults with per-side margin fallback.

---

## 4. Print-layout constraints that actually bite

Each entry names the failure symptom, because these are the ones that have caused rework.

**The header and footer live in the margin bands, not in the document flow.**
`displayHeaderFooter: true` renders `Header.tsx` / `Footer.tsx` inside the top and bottom margin boxes. Consequences:

- Padding **inside** the header does not move the body down. Only `margin.top` does. More gap under the header means a larger `margin.top`.
- Header content taller than `margin.top` is clipped or overlaps the body. Keep header content height (including its own padding) below the top margin.

**Defaults live in `engine/defaultOptions.ts`:** `format: 'A4'`, `landscape: false`, `scale: 1`, `margin: { top: '120px', bottom: '50px', left: '0', right: '0' }`, `printBackground: true`, `displayHeaderFooter: true`, `preferCSSPageSize: false`.

**`min-h-screen` means one full page in print.**
`components/Cover.tsx` uses `min-h-screen` plus `break-after-page` to make page 1 a full-bleed cover. In print layout `100vh` resolves to the printable page height, so the cover fills the page. Change `margin.top` or `format` and the cover height changes with it.

**`preferCSSPageSize: false` is currently inert.**
No `@page { size: ... }` rule exists in the PDF stylesheets, so the flag has no observable effect today; the size always comes from `format`. It is kept only so a template could declare its own page size later.

**`landscape` changes geometry, not content.**
`true` rotates the paper and Chromium re-lays out to the new width. Because the cover height comes from `min-h-screen`, flipping to landscape silently changes the cover height and can push a long title into clipping.

**Tailwind only scans `templates/**` and `components/**`.**
A class used anywhere else — built at runtime, or living outside those two globs — is never generated and renders as nothing. This is the most common silent failure. After a build, grep `engine/pdfRunTime/pdf.generated.css` for the class to confirm it exists.

**`@utility` blocks in `engine/index.css` are local aliases.**
`text-label`, `text-fineprint`, `tracking-label`, `tracking-fineprint`, `tracking-print` are declared locally. The three `tracking-*` entries duplicate Tailwind's built-in `tracking-wide` / `tracking-normal`, and `tracking-fineprint` is unused (see §6).

---

## 5. Working on templates

**Add a guide**

1. Create `templates/<slug>/index.tsx` exporting a component that takes no props and reads copy via `useTranslation(undefined, { keyPrefix: 'document.pdf.<slug>' })`.
2. Register it in `templates/index.ts` by adding `<slug>: definePdfTemplate({ Component })` to `pdfTemplates`. `definePdfTemplate` (from `engine/templateRegistry.ts`) wraps the component in an `I18nextProvider`; `pdfTemplates` is a `satisfies Record<GuideSlug, ...>` and its trailing `registerTemplates(pdfTemplates)` call auto-registers every entry with the engine, so a missing slug is a compile error and the template is immediately resolvable via `getPdfTemplate`.
3. Add `packages/i18n/locales/{en-US,zh-CN,de-DE}/documents/pdf/<slug>.json` nested under `document.pdf.<slug>`. All three locales are required.
4. Build, then confirm every class you used is present in `engine/pdfRunTime/pdf.generated.css`.

**Change the chrome**
`components/Header.tsx` and `components/Footer.tsx` are shared by every guide and render inside the margin bands. They are ordinary components on the same `t()` path (`keyPrefix` `document.pdf.header` / `document.pdf.footer`), but any height change interacts with `margin.top` (§4).

**Locale and translation**
`documentI18n.cloneInstance({ lng })` is created per request (`pdfBuilder.ts:67`), so concurrent renders in different locales cannot interfere. Templates never receive a `locale` prop and never call `changeLanguage`; the instance arrives through `I18nextProvider`.

**Testing without a browser**
Render with `renderToStaticMarkup` and assert markup: title appears exactly once, no unresolved `{{`, no raw key paths leaking, and correct section/item counts per locale. Fast, and needs no Chromium.

---

## 6. Known issues and open decisions

- **Three redundant `@utility` aliases.** `tracking-label` and `tracking-print` duplicate Tailwind's `tracking-wide`; `tracking-fineprint` duplicates `tracking-normal` and is unused. Safe to delete and replace usage with the built-ins. `text-label` / `text-fineprint` are genuine PDF typography composites and are candidates for promotion into `@pawhaven/design-system`.
- **Design-system is consumed by filesystem copy, not by package specifier.** `scripts/sync-design-tokens.mjs` reads `packages/design-system/src/{tokens,theme.css}` through a hardcoded relative path because design-system's `exports` map does not expose `theme.css`. An assessment concluded the current architecture is correct and should stay. The clean upgrade path (import `@pawhaven/design-system/tokens` and `theme.css` directly, delete the sync script) needs `"./theme.css": "./src/theme.css"` added to `packages/design-system/package.json` — **pending approval**. Do **not** "simplify" by importing the package root `index.css`: it carries an unlayered `html, body { font-family: var(--font-sans) }` that overrides the PDF print font stack and silently changes every guide's typography.
- **Turbo cache staleness (unproven).** `pdfRunTime/` is gitignored, so it is excluded from turbo task inputs, and `packages/design-system` has no `build` script, so `dependsOn: ["^build"]` creates no dependency edge. A token change may therefore not invalidate a cached `pdf.generated.css`. Not yet reproduced with a live cache experiment.
- **Orphan artifact.** `engine/pdfRunTime/design-tokens.css` is written by no script and imported by nothing; it is untracked dead disk state.
- **Watch input set is hand-maintained.** `scripts/dev-pdf-watch.mjs` re-declares the input list that Tailwind's import graph already knows, and it currently omits `prebuild-pdf-style.mjs` itself.
- **`pnpm install` is not side-effect-free here.** On this pnpm version, `pnpm install --frozen-lockfile` writes a `@pnpm/exe` self-record into `pnpm-lock.yaml` (~23 lines) on every run until that record is committed once. Expect lockfile churn in CI until then.

---

## 7. Related documents

- `PawHaven-Backend-Architecture.md` — document-service boundaries, the single-template-single-route decision, PDF defaults.
- `PawHaven-System-Architecture-Overview.md` — DD-10, the "every PDF is a template behind one route" decision record.
