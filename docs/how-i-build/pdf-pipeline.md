# PDF pipeline: one route, two hops, no data owner

> This document covers **how a PDF is produced and delivered**: the contract, the two-hop flow, the
> template engine, and the copy layer. The design decision behind it is DD-10 in
> [System Architecture Overview](../context/system-architecture-overview.md).

## The shape

```text
browser ──POST /api/core/guide/pdf { template }──► core-service (guide module)
                                                     │  validates the slug
                                                     │  POST /document-service/internal/pdf/render
                                                     │  { template, locale, data: {} }
                                                     │  x-locale: en-US | zh-CN | de-DE
                                                     ▼
                                              document-service (pure render)
                                                     │  React → HTML → Puppeteer → PDF bytes
                                                     ▼
browser ◄──────────── application/pdf ──────────────┘
```

The browser never reaches document-service: the gateway proxies `/api/document`, but no frontend
caller uses it. The only live path is core's guide module relaying over internal HTTP.

## Contract

`RenderPdfBodySchema` lives in `packages/backend-core/types/Document.schema.ts` and is a
**`z.strictObject`** — an unknown key is a 400:

| Field      | Type                                                      | Notes                                                                                    |
| ---------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `template` | `rescueGuide \| firstAid \| kittenCare \| injuryResponse` | The four `guideSlugs` from `@pawhaven/shared`; an unknown value is a 400                 |
| `locale`   | `en-US \| zh-CN \| de-DE` (optional)                      | Canonical locale; the `x-locale` header is also forwarded                                |
| `data`     | `Record<string, unknown>` (optional)                      | Resolved domain data; today the only caller passes `{}`                                  |
| `options`  | optional                                                  | Page format/landscape/scale/margin/printBackground/displayHeaderFooter/preferCSSPageSize |

The response is raw PDF bytes with `Content-Type: application/pdf` and `Content-Length` only —
document-service sets **no** `Content-Disposition`; the browser-facing filename is core's decision.

## document-service internals

| Area      | Files                                                                                             | Role                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry  | `engine/templateRegistry.ts`                                                                      | `definePdfTemplate({ Component })` wraps the component in `I18nextProvider`; the registry is typed `satisfies Record<GuideSlug, …>`, so a missing template is a type error |
| Templates | `components/` — `Cover`, `Header`, `Footer`, `SectionList`, `Checklist`, `Contacts`, `Disclaimer` | React components rendered to static markup                                                                                                                                 |
| Engine    | `engine/pdfBuilder.ts`, `engine/launchBrowser.ts`                                                 | Clones `documentI18n` per render (`cloneInstance({ lng: locale })`), renders to HTML, launches Puppeteer, returns a buffer                                                 |
| Options   | `engine/defaultOptions.ts`                                                                        | A4, margins 70px/70px/0/0, `printBackground`/`displayHeaderFooter` true, `preferCSSPageSize` false                                                                         |
| Styling   | `engine/pdfRunTime/pdf.generated.css`, `theme.css`, `design-tokens.css`                           | Design tokens prebuilt into the PDF stylesheet; the design-system package is never imported at runtime                                                                     |
| Guard     | `pdfPayloadSize.guard.ts`                                                                         | Rejects oversized payloads before rendering                                                                                                                                |
| Tests     | `pdf.service.test.ts`, `internalPdf.controller.test.ts`                                           | Render path and controller contract                                                                                                                                        |

`engine/cjkFont.ts` handles CJK glyph coverage; `engine/locale.ts` canonicalises the render locale.

## The copy layer

- Translatable copy lives in `@pawhaven/i18n` under
  `locales/{locale}/documents/pdf/`: `header.json`, `footer.json`, and one file per slug.
- Keys are nested as `document.pdf.<slug>.*`; template components read them through a `keyPrefix`.
- document-service reads the files through the **Node-only** `@pawhaven/i18n/resources` entry — the
  browser loader glob (`./locales/*/*.json`) never matches `documents/`, so PDF copy stays out of the
  browser bundle.
- Non-translatable data (`provenance` today, per-template structured input in general) is assembled
  by core's guide module and passed inbound as `data`.

## Adding a guide

1. Add the slug to `guideSlugs` in `packages/shared/types/Guide.schema.ts`.
2. Add the template component and register it in `engine/templateRegistry.ts` (`satisfies` will
   force the entry).
3. Add `locales/{en-US,zh-CN,de-DE}/documents/pdf/<slug>.json` with the copy.
4. Read `data`/`locale` through `PdfTemplateProps<K>` — do not reach for the request.
5. Render it through the existing route; the contract and the HTTP surface do not change.

## Invariants

- document-service holds **no DB, no outbound calls, no catalog endpoint**; it never fetches,
  stores or derives domain data.
- Every PDF is a template behind the single internal route. Do not add per-template routes.
- The render route is protected by the global `InternalJwtGuard`; only core-service signs the call.
