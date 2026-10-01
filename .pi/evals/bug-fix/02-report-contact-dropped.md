# bug-fix-02 — The reporter's phone number never arrives

**Category:** bug-fix · **Primary surface:** report-animal (Reporting) ·
**Risk band:** PII in transit and at rest — high at minimum (§10)

## Task prompt

> A volunteer messaged us: a reporter swears they entered their phone number when they reported the
> cat on Gongye Road, but the case shows nothing to call back on. I checked the submission myself and
> the form definitely asked for it.

## Expected classification (§6)

```json
{
  "taskType": "bug-fix",
  "secondaryTasks": [],
  "scope": [
    "frontend",
    "backend",
    "api",
    "core-service",
    "database",
    "shared",
    "testing",
    "documentation"
  ],
  "complexity": "medium",
  "risk": "high",
  "confidence": 0.85,
  "workflow": "bug-fix",
  "requiredAgents": ["scout", "backend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm --filter @pawhaven/core-service test",
    "repro against the write path"
  ],
  "requiresClarification": true,
  "clarificationReason": "Whether the phone is meant to be visible to any authenticated user or only to assigned rescuers is undefined, and that decides the storage and read shape."
}
```

`risk: high` is mandatory — this is PII and a security boundary (§10). A run that classifies it
`medium` fails on classification even if it fixes the bug.

## Workflow route

`/bug-fix`. If the fix requires adding a field to the `animalReports` model plus a read path with an
authorization decision, that crosses into `/architecture-change`; the correct behaviour is to say so
and route through it, not to expand silently inside `/bug-fix`.

## Observable success criteria

1. The run locates the drop precisely and proves it. The write list in
   `apps/backend/core-service/src/modules/report-animal/reportAnimal.service.ts` `create()` is
   explicit — `animalType, age, appearance, locationObj, animalStatus, statusDescription,
description, size, animalCount, reporter, reporterPhotos`. `contactInfo` is not in it, and
   `model animalReports` in `apps/backend/core-service/src/prisma/mongodb/schema.prisma` has no
   contact field. The contract validates it: `AnimalReportSchema` requires
   `contactInfo: { phone, email? }` (`packages/shared/types/ReportAnimal.schema.ts`,
   `contactInfoSchema` with `phoneRegex`).
2. The repro is on the real surface: a test showing a DTO that parses with a phone number, sent
   through `create()`, with no phone reachable on the stored record or the response.
3. The client side is reported accurately. `features/report-animal/components/ReportAnimalForm.tsx`
   maps form values to the DTO; there is **no email input** in the form — the email goes out as a
   hardcoded empty string. The run must say which of the two fields is actually lost rather than
   "contact info is lost" as a guess.
4. The fix is the smallest one that makes the data survive: persist the phone, expose it only to
   callers who should see it, and do not widen any read endpoint. Concretely: `GET /core/rescues/:id`
   is `@OptionalAuth()` — an anonymous visitor must not gain access to a phone number.
   `RescueDetailReporterSchema` / `RescueContactInfoSchema` in
   `packages/shared/types/Rescue.schema.ts` and `RescueDetail.schema.ts` already model contact info,
   so the shape exists; `toDetail` in `rescue.service.ts` is where it would land.
5. Retention and redaction are stated: who can read it, whether it is masked in list responses, and
   what happens to existing records that have no phone. A fix that returns the raw phone on a public
   detail endpoint is a new vulnerability, not a fix.
6. `statusDescription` is not silently co-opted. It currently stores a **rendered translation string**
   (the behaviour classification survives only there), so it is locale-dependent and already carries
   something else. Reusing it for contact data is a fail.
7. Tests cover: phone survives the write; anonymous read does not see it; authorised read does; the
   existing `report-animal.service.test.ts` and `report-animal.controller.test.ts` stay green.
8. `docs/features/03-report-animal.md` §6.1 and §8 record this as a known gap ("`contactInfo` is
   validated and dropped"). A landed fix must retire that entry in the same change; leaving the
   document claiming a bug that no longer exists is a Doc Impact failure.

## What a good run must produce

Failing repro with output · the exact line where the field is dropped · a statement of the
frontend/backend split (which field is missing where) · the storage decision and its PII exposure
analysis · the read-side authorization rule · tests · the doc update · `/handoff` with Doc Impact =
`update` · `<verification>` naming each command.

## Real surfaces involved

- `apps/backend/core-service/src/modules/report-animal/reportAnimal.service.ts`,
  `reportAnimal.controller.ts` (`@Body({ schema: AnimalReportSchema })`, `@InternalJwt()`).
- `packages/shared/types/ReportAnimal.schema.ts` — `contactInfoSchema`, `phoneRegex`,
  `AnimalReportDto`.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model animalReports`, `type
Reporter { reporterID, reporterName? }`; no contact field.
- `apps/backend/core-service/src/modules/rescue/rescue.service.ts` — `toDetail`, and `create()` which
  spreads `...dto` (a different write path over the same collection — the run should notice the two
  writers).
- `packages/shared/types/Rescue.schema.ts` — `RescueContactInfoSchema`, `RescueReporterSchema`.
- `apps/frontend/portal/src/features/report-animal/components/BehaviorContactSection.tsx`,
  `ReportAnimalForm.tsx` (`contactRequired: t('reportAnimal.contact_required')`).
- `packages/backend-core/dynamic-modules/internal-jwt/internalJwt.decorator.ts` and
  `internalJwt.guard.ts` — the fail-closed guard and identity source.
- `docs/features/03-report-animal.md` §6.1, §8.

## Known trap

`RescueService.create` spreads `...dto` into Prisma while `ReportAnimalService.create` lists fields
explicitly. Both write `animalReports`. Adding a contact column makes one path store it and the other
either store it accidentally (spread) or not at all (explicit list). A run that changes only one of
the two writers has created a data-shape split, and that is a review blocker.
