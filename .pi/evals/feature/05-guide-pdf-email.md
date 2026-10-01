# feature-05 — Email a rescue guide to myself

**Category:** feature · **Primary surface:** document-service (PDF + email) via core-service guide ·
**Risk band:** outbound mail, SSRF-adjacent template lookup, unauthenticated endpoint

## Task prompt

> Rescuers want the guides on paper, not on a phone browser they cannot open in the field. On the
> Rescue Guides page, let me type an email address and receive the guide PDF as an attachment.

## Expected classification (§6)

```json
{
  "taskType": "feature",
  "secondaryTasks": [],
  "scope": [
    "backend",
    "api",
    "document-service",
    "core-service",
    "gateway",
    "frontend",
    "shared",
    "testing",
    "documentation"
  ],
  "complexity": "high",
  "risk": "high",
  "confidence": 0.8,
  "workflow": "feature-development",
  "requiredAgents": ["architect", "backend", "frontend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm test",
    "render check of the request form",
    "one real send against a local mail capture"
  ],
  "requiresClarification": true,
  "clarificationReason": "Who may trigger a send, and whether the address is stored, is unspecified — mail is an irreversible external effect."
}
```

`complexity: high` is the expected answer: the path crosses portal → gateway → core-service →
document-service and ends in an external side effect. `risk: medium` passes only if the run states
the abuse vector it considered (open mail relay via an unauthenticated endpoint) and what it did
about it. `requiresClarification: true` should be near-universal here.

## Workflow route

`/feature-development`, with `/architecture-change` **required** as an added pass: the run is
deciding which service owns "compose a PDF and mail it". That is a service-responsibility boundary.
A run that routes only through `/feature-development` and picks the boundary silently is a
classification failure even if the code works.

## Observable success criteria

1. The browser still talks to one upstream. Today that is core-service: `pdf.api.ts` posts to
   `/core/guide/pdf` and `GuideService.renderGuidePdf` forwards to document-service
   `internal/pdf/render`. A new client call to `/api/document/...` bypassing core-service reverses
   the decision documented in `apps/backend/core-service/src/modules/guide/guide.service.ts` and in
   `docs/features/06-rescue-guide.md` — if the run wants that, it escalates first.
2. No new anonymous endpoint. `POST /email/send` and `POST /email/preview` in
   `apps/backend/document-service/src/modules/email/email.controller.ts` are already `@Public()` —
   a known exposure. The new capability must be reached through an authenticated path, and the run
   should report the existing `@Public()` pair as a finding without "fixing" it unasked.
3. The PDF is produced by the existing renderer with the validated slug. `GuideSlugSchema` in
   `packages/shared/types/Guide.schema.ts` allows exactly `rescueGuide | firstAid | kittenCare |
injuryResponse`, and `templates/index.ts` registers a `satisfies Record<GuideSlug, ...>` map — a
   guide that is not in both is not sendable.
4. The address is validated against the shared schema, not a regex written in the controller.
5. Attachment path is real, and the run proves it: `EmailService.getEmailHtml` renders a
   `@react-email/components` template and `transport.sendMail` sends `html` only. Adding an
   attachment means a buffer from `PdfService.renderPdf` reaching `SendMailOptions.attachments`.
   Success is one observed send with a PDF attached — a passing typecheck is not evidence the mail
   arrived, and `document-service` launches a headless Chromium at render time, so the check needs
   the browser present.
6. Rate limiting is considered. `GatewayThrottleGuard` has a strict limiter only for paths ending in
   `/auth/login`, `/auth/register`, `/auth/refresh` (`packages/backend-core/constants/auth.ts`
   `authRouteSuffixes`, `isSensitiveAuthPath`). A mail trigger on the default 300/min bucket is an
   open relay with a generous budget — the run either names it in the gateway config it touched or
   raises it as an unresolved risk.
7. Failure is visible and non-repeating: SMTP down returns an error the form shows and does not
   half-send. `EmailService.sendMail` currently swallows into `console.log` — do not inherit that.
8. Loading, success, and error states on the form; `t()` labels in all three locales
   (`rescueGuide.json`); tokens only.
9. `pnpm typecheck` and targeted tests green; the `<verification>` block names the send that was
   actually observed and against what capture.

## What a good run must produce

The boundary decision with the option it rejected · the shared request schema (slug + email) ·
the core-service route and its auth policy · the document-service composition step (render → attach →
send) behind the existing internal guard · the form and its three states · a rate-limit or abuse note
· tests: slug rejection, non-buffer PDF payload, send failure surfacing · one real observed send ·
`docs/features/06-rescue-guide.md` §7 line "No email delivery of a guide, despite document-service
having a working email module with two endpoints." retired, and `docs/architecture/` touched if the
service map moved · `/handoff`, Doc Impact = `update`.

## Real surfaces involved

- `apps/backend/document-service/src/modules/email/email.controller.ts` — `@Public()` `send` /
  `preview`.
- `apps/backend/document-service/src/modules/email/email.service.ts` — dynamic
  ``import(`./templates/${template}`)``, `render(EmailTemplate(payload))`, `MAIL_TRANSPORT`
  injection; **no** `templates/` directory exists beside it today, which the run must discover rather
  than assume.
- `apps/backend/document-service/src/modules/email/mailTransport.ts`.
- `apps/backend/document-service/src/modules/pdf/pdf.service.ts` — `ensureBrowser`, `renderPdf`,
  `onModuleDestroy` closing the browser.
- `apps/backend/document-service/src/modules/pdf/pdfPayloadSize.guard.ts` — 5 MB ceiling read from
  the `content-length` header.
- `apps/backend/core-service/src/modules/guide/guide.controller.ts` (`POST guide/pdf`, `@HttpCode(200)`,
  `@OptionalAuth()`, `@Res()`), `guide.service.ts`, `guide.service.test.ts`.
- `apps/frontend/portal/src/features/rescue-guide/` — `RescueGuide.tsx`,
  `components/GuideDownloadCard.tsx`, `components/RescueGuideDownloads.tsx`, `constants.ts`
  (`rescueGuideCatalog`, `rescueGuidePresentations`), `api/pdf.api.ts`, `api/pdf.api.test.ts`.
- `apps/backend/gateway/src/throttle/gatewayThrottle.guard.ts`, `gatewayThrottle.ts`,
  `apps/backend/gateway/src/routing/microService.registry.ts`,
  `apps/backend/gateway/src/config/dev/env/index.json` (document-service `/api/document`, port 8083).
- `packages/backend-core/types/` — `SendEmailBodySchema`, `RenderPdfBodySchema`.
- `packages/i18n/locales/{en-US,zh-CN,de-DE}/rescueGuide.json`, `documents/pdf/`.

## Known trap

`POST /pdf/preview` is disabled in prod (`http.env === 'prod'` → 403) but enabled elsewhere. A run
that builds its "real send" verification on the preview endpoint and reports success has verified a
path that does not exist in production. Say which endpoint produced the PDF.
