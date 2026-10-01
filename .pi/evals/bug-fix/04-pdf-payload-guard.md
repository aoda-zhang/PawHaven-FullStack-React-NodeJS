# bug-fix-04 — The PDF size guard does not guard

**Category:** bug-fix · **Primary surface:** document-service PDF ·
**Risk band:** security boundary / DoS ceiling on a render endpoint

## Task prompt

> Someone on the team pointed out that our "5 MB limit" on PDF rendering is a joke, because you can
> just not send a Content-Length and the render runs anyway. Can you fix the limit so it is actually
> enforced?

## Expected classification (§6)

```json
{
  "taskType": "bug-fix",
  "secondaryTasks": ["architecture-change"],
  "scope": ["backend", "api", "document-service", "gateway", "testing"],
  "complexity": "medium",
  "risk": "high",
  "confidence": 0.85,
  "workflow": "bug-fix",
  "requiredAgents": ["scout", "backend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm --filter @pawhaven/document-service test",
    "repro on the endpoint"
  ],
  "requiresClarification": true,
  "clarificationReason": "The intended ceiling (bytes in, or rendered output size) and whether the gateway body limit is the real control are not stated."
}
```

`secondaryTasks` including `architecture-change` is a good answer: the honest fix may move the
ceiling to the gateway body parser rather than adding a second check in the service. `risk: high` is
the floor — this is a security boundary.

## Workflow route

`/bug-fix`. If the chosen fix relocates the control (gateway vs service), it must also run
`/architecture-change` and record the boundary decision; §7's "fix auth bug by redesigning session
management" is the pattern.

## Observable success criteria

1. The run reads the guard and names the actual defect:
   `apps/backend/document-service/src/modules/pdf/pdfPayloadSize.guard.ts` decides on
   `request.headers['content-length']`, and `if (raw)` means **absent header → allowed**. A chunked or
   gzip request, or a lying header, bypasses `PDF_RENDER_MAX_BYTES` (5 MiB). The guard is advisory,
   not measured.
2. The repro is executed, not argued: a test that posts an oversized body with no `Content-Length`
   (or a small forged one) and shows `canActivate` returning `true` where the payload exceeds the
   ceiling. Existing coverage to extend: `pdf.service.test.ts`, `internalPdf.controller.test.ts`.
3. The run checks the layers that already bound the body and says what each one does, rather than
   stacking a fourth guess:
   - `http.maxJsonBodySize` is `100mb` in `apps/backend/gateway/src/config/dev/env/index.json`,
     applied by `configureApp` in `packages/backend-core/setup/configureApp.ts` (`express.json({ limit })`).
   - The Nest app must be created with `bodyParser: false` or the configured limit is silently
     bypassed — that constraint is documented in `configureApp`'s own comment. Whether
     document-service honours it is part of the investigation.
   - The gateway's `proxy.service.ts` forwards the body and calls `fixRequestBody`.
     A 100 MB JSON ceiling in front of a "5 MB render limit" is the actual finding, and a run that fixes
     only the guard while leaving that contradiction has fixed the symbol, not the bug.
4. The fix measures what it claims to. Either the limit is applied to the parsed body / actual bytes,
   or the header is treated as untrusted input and rejected when absent — and the choice is stated
   with its cost (buffering a body to measure it is itself the DoS). No new dependency without a
   decision.
5. Both PDF entry points stay consistent: `pdf.controller.ts` (`POST pdf/download` `@OptionalAuth()`,
   `POST pdf/preview` blocked in prod) and `internalPdf.controller.ts` (`POST internal/pdf/render`, no
   `@Public()` — protected by the internal JWT guard and by the gateway's `assertSafePath` refusing
   rewrites that start with `/internal`). One guard on one of them and not the other is the same bug
   relocated.
6. The 413 remains a 413: `PayloadTooLargeException`, and `pdfPayloadSize.guard.ts` is applied via
   `@UseGuards` at controller level on both files — any change keeps both.
7. Legitimate renders still succeed: the four registered templates
   (`apps/backend/document-service/src/modules/pdf/templates/index.ts` — `rescueGuide`, `firstAid`,
   `kittenCare`, `injuryResponse`) each render through `PdfService.renderPdf` → `buildPdf` with a real
   Chromium browser. Verification must name the observed render, not just a green typecheck; if
   Chromium is unavailable in the environment, the run says so explicitly rather than reporting a pass.
8. `pnpm typecheck` and the document-service suite green; new test red → green.
9. Doc Impact: `docs/features/06-rescue-guide.md` and `docs/architecture/PawHaven-Backend-Architecture.md`
   or the PDF generation doc if the ceiling's owner moves.

## What a good run must produce

Executed repro · the layer table with what each bound actually is · the named contradiction (100 MB
body limit vs 5 MB guard) · the chosen enforcement point and its tradeoff · both entry points covered
· a real observed render as the non-regression check · `/handoff` with Doc Impact · `<verification>`.

## Real surfaces involved

- `apps/backend/document-service/src/modules/pdf/pdfPayloadSize.guard.ts` — the defect site.
- `apps/backend/document-service/src/modules/pdf/pdf.controller.ts`, `internalPdf.controller.ts`,
  `pdf.service.ts`, `pdf.service.test.ts`, `internalPdf.controller.test.ts`.
- `apps/backend/document-service/src/modules/pdf/engine/pdfBuilder.ts`, `launchBrowser.ts`,
  `templateRegistry.ts`, `locale.ts` (`resolveRequestLocale`), `cjkFont.ts`.
- `apps/backend/document-service/src/modules/pdf/templates/` and `templates/index.ts`.
- `packages/backend-core/types/` — `RenderPdfBodySchema`, `Document.schema.ts`.
- `packages/backend-core/setup/configureApp.ts`, `packages/backend-core/setup/bootstrap.ts`.
- `apps/backend/gateway/src/proxy/proxy.service.ts` (`assertSafePath`, `fixRequestBody`,
  `handleProxyReq`), `apps/backend/gateway/src/config/dev/env/index.json`.
- `apps/backend/core-service/src/modules/guide/guide.service.ts` — the in-cluster caller that posts to
  `internal/pdf/render` with `responseType: 'arraybuffer'`.

## Known trap

`resolveRequestLocale` throws 400 when `x-locale` is missing or invalid, and `PdfPayloadSizeGuard`
runs before the handler. A "fix" that starts reading the stream in the guard can change which error a
bad request gets first, turning a 413 into a 400 or a hang. The order of the two checks is part of the
contract and must be preserved or deliberately restated.
