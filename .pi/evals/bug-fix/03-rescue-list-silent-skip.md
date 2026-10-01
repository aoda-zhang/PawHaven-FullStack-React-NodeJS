# bug-fix-03 — Reports that exist but never appear in the list

**Category:** bug-fix · **Primary surface:** rescue (core-service read path) ·
**Risk band:** data-dependent silent loss, availability of the public feed

## Task prompt

> We have 40-something pending reports in the database but the rescue page only ever shows about a
> dozen cards, and it is not the newest ones that are missing. Nothing errors — the page just looks
> short.

## Expected classification (§6)

```json
{
  "taskType": "bug-fix",
  "secondaryTasks": [],
  "scope": ["backend", "core-service", "api", "testing"],
  "complexity": "medium",
  "risk": "medium",
  "confidence": 0.8,
  "workflow": "bug-fix",
  "requiredAgents": ["scout", "backend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm --filter @pawhaven/core-service test",
    "repro against findAll"
  ],
  "requiresClarification": true,
  "clarificationReason": "Whether an unmappable record should be surfaced as a degraded card, skipped with a signal, or fail the request is a product decision, not an implementation detail."
}
```

`risk: medium` is the floor; `high` is acceptable because the loss is silent on a public surface.
`low` is a classification failure — silent data disappearance is not cosmetic.

## Workflow route

`/bug-fix`. Reproduce first, root-cause second, verify the repro on the same surface.

## Observable success criteria

1. The run finds the drop site. `RescueService.findAll`
   (`apps/backend/core-service/src/modules/rescue/rescue.service.ts`) maps through
   `toListItemOrSkip`, which `catch`es, logs `Skipping unmappable rescue`, and returns
   `undefined`; the caller filters those out. So a record can vanish with only a `logger.warn`.
2. The run identifies what actually makes a record unmappable, by construction rather than by
   guessing: `toListItem` calls `RescueDetailLocationSchema.parse(record.locationObj)` — and
   `RescueLocationSchema` in `packages/shared/types/Rescue.schema.ts` requires
   `address: z.string().min(1)`. Reports whose stored `locationObj` has an empty or absent address
   therefore throw. `animalReports.locationObj` is `Json` with no schema constraint, so the shape is
   whatever the writer put there.
3. The two writers are both examined. `ReportAnimalService.create` writes `locationObj: dto.location`
   and `rescue.service.ts` `create()` spreads `...dto`; `report-animal` and `rescue` write the **same
   collection**, and `docs/features/04-rescue-cases.md` documents report-animal as "the write path, on
   the same collection". The run must determine which writer can produce the malformed shape.
4. The repro is real: a test in `rescue.service.test.ts` (extend the existing Prisma-double builder)
   feeding `findAll` one valid and one address-less record, asserting the count observed today — and
   the run states plainly that the current code returns 1 of 2, which is the bug.
5. The fix is decided, not fudged. Acceptable outcomes, chosen deliberately and justified:
   project a placeholder address so the card renders; or keep the skip but make the caller able to
   see that records were dropped (a count, a log with a metric, or a partial-response field); or
   reject at write time so the bad shape cannot be stored — which touches `report-animal` and needs
   the existing rows accounted for. Silently widening the Zod schema to accept `''` is not a fix: it
   moves the loss downstream to `location: location.address`.
6. No masking: the fix does not wrap `findAll` in a broader `try` or lower logging to hide the warn.
   `rescue.service.test.ts` existing cases still pass, including the photo-bearing behaviour in
   `findPhotoBearingIds` and `toListItem`'s `image` URL.
7. Frontend consequences are stated: `CaseCard.tsx` renders `location`
   (`apps/frontend/portal/src/features/rescue-cases/components/CaseCard.tsx`) and `Home.tsx` embeds
   `RescueCasesSection`, so the homepage feed shrinks by the same amount. A placeholder must be a
   translated key, not a literal.
8. `pnpm typecheck` and `pnpm --filter @pawhaven/core-service test` green; the new test shown red →
   green.
9. Doc Impact: `docs/features/04-rescue-cases.md` records the list projection and
   `docs/features/03-report-animal.md` §6 records dropped contract fields — update whichever the fix
   changes, and say which.

## What a good run must produce

Red-then-green repro output · the named unmappable shape · the writer that produces it · the chosen
outcome with its reason and the option rejected · the write-side/validation implication for new
records · the frontend-visible effect · `/handoff` with Doc Impact · `<verification>` with commands.

## Real surfaces involved

- `apps/backend/core-service/src/modules/rescue/rescue.service.ts` — `findAll`, `toListItemOrSkip`,
  `toListItem`, `findOne`, `toDetail`, `findPhoto`, `decodePhoto`, `buildPhotoUrl`,
  `findPhotoBearingIds`.
- `apps/backend/core-service/src/modules/rescue/rescue.service.test.ts` — the Prisma-double pattern,
  including `reporterPhotos` and location variants.
- `packages/shared/types/RescueList.schema.ts` — `RescueListItemSchema` (`location` required,
  `image` optional, `distance` required).
- `packages/shared/types/Rescue.schema.ts` — `RescueLocationSchema`, `AnimalAppearanceSchema`.
- `packages/shared/types/RescueDetail.schema.ts` — the detail shape, `photos` with `.catch([])`.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model animalReports`,
  `appearance Json`, `locationObj Json`, `@@index([animalStatus])`.
- `apps/backend/core-service/src/modules/report-animal/reportAnimal.service.ts` — the other writer.
- `apps/frontend/portal/src/features/rescue-cases/components/CaseCard.tsx`,
  `RescueCasesSection.tsx`, `apps/frontend/portal/src/features/home/components/AdoptablePetsSection.tsx`.

## Known trap

`toListItem` also hardcodes `distance: 0`, and `CaseCard.tsx` hides the distance chip when
`distance > 0` is false — so the feed never shows a distance at all. That is a separate, already
documented gap (`docs/features/02-home.md` §7: "`distance` is a hard-coded `0`"). Fixing it here
would widen a bug fix into a geo feature; report it, do not implement it.
