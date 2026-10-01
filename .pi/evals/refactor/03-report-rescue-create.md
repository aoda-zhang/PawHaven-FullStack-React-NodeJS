# refactor-03 — One write path for the `animalReports` collection

**Category:** refactor · **Primary surface:** core-service write path (`report-animal` + `rescue`) ·
**Risk band:** authenticated write into Mongo — high at minimum (§10)

## Task prompt

> Two modules in core-service write to the same `animalReports` collection and they do it two
> different ways. `ReportAnimalService.create` maps every field by hand and pins the status to
> pending. `RescueService.create` spreads the DTO straight into Prisma and lets the column default
> decide. Pull the duplication out into one writer that both use, and keep each route's current
> behaviour intact.

## Expected classification (§6)

```json
{
  "taskType": "refactor",
  "secondaryTasks": [],
  "scope": ["backend", "core-service", "database", "api", "testing"],
  "complexity": "medium",
  "risk": "high",
  "confidence": 0.8,
  "workflow": "refactoring",
  "requiredAgents": ["backend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm --filter @pawhaven/core-service test",
    "pnpm --filter @pawhaven/core-service typecheck"
  ],
  "requiresClarification": false
}
```

`risk: high` is required — this is a write path, and §10 floors irreversible data operations and
authenticated writes high at minimum. `risk: medium` or `low` is a classification failure. Accept
`taskType: architecture-change` as a secondary only if the run states that a shared writer is a
service-boundary decision, which it should be stated as and not decided silently. A run that adds a
`PATCH /rescues/:id/status` route is not doing this task.

## Workflow route

`/refactoring`, with the shape named before code. The duplication is:

- `apps/backend/core-service/src/modules/report-animal/reportAnimal.service.ts` — `create` builds
  the Prisma payload field by field, maps `dto.location` → `locationObj`, forces
  `animalStatus: AnimalStatus.PENDING`, writes `reporter.reporterID = claims.sub` and
  `reporter.reporterName = claims.username?.trim() || null`, and **does not write `contactInfo`**
  even though `AnimalReportSchema` (`packages/shared/types/ReportAnimal.schema.ts`) requires it.
- `apps/backend/core-service/src/modules/rescue/rescue.service.ts` — `create` does
  `this.prisma.animalReports.create({ data: { ...dto, reporter: {...} } })`. `CreateRescueDtoSchema`
  (`packages/shared/types/Rescue.schema.ts`) already names its fields in Prisma shape
  (`locationObj`, `animalStatus` defaulted), so the spread happens to line up.

Both catch and rethrow as `BadRequestException`, so a shared writer must not swallow the difference
in the log line either.

## Observable success criteria

1. The reporter block is written once. Both services currently build the same
   `{ reporterID: claims.sub, reporterName: claims.username?.trim() || null }` from the same
   `@InternalJwt()` claims; after the refactor there is one place that does it, and both routes
   produce the same stored value for the same token.
2. `POST /report-animal` keeps forcing `AnimalStatus.PENDING` and `POST /rescues` keeps honouring a
   caller-supplied `animalStatus` (defaulted to `PENDING` by `CreateRescueDtoSchema`). A shared
   writer that applies the report path's hardcoded status to both routes changes
   `POST /core/rescues` behaviour, and that is a failure even though `POST /rescues` has no portal
   caller today — see Known trap.
3. Field mapping is one mapping. `location` → `locationObj` (report) and the passthrough
   `locationObj` (rescue) are reconciled in one place with the reason written down, or the run
   states that the two DTO shapes stay separate and only the Prisma-payload construction is shared.
4. `@InternalJwt()` stays the identity source in both controllers —
   `apps/backend/core-service/src/modules/report-animal/reportAnimal.controller.ts` and
   `apps/backend/core-service/src/modules/rescue/rescue.controller.ts`. No controller reads a cookie
   or trusts a raw header, and the gateway invariant (the gateway alone owns browser cookies and
   signs the ES256 internal JWT) is untouched.
5. `BadRequestException` with a per-route message is preserved on both paths; the run does not
   collapse "Failed to submit report" and "Failed to create rescue record" into one string, and
   does not let a Prisma error surface as a 500.
6. Tests pass on both existing suites and cover the shared writer: `report-animal.service.test.ts`,
   `report-animal.controller.test.ts`, `rescue.service.test.ts` (the Prisma-double pattern to
   follow), plus `pnpm --filter @pawhaven/core-service typecheck`.
7. No schema or migration change is smuggled in. `apps/backend/core-service/src/prisma/mongodb/schema.prisma`
   `model animalReports` must be byte-identical unless the run escalates the change first — this is a
   refactor, and `reporterPhotos String[]` in particular is load-bearing for
   `RescueService.decodePhoto`.

## What a good run must produce

The field-by-field comparison of the two `create` payloads, naming every difference that is
deliberate and every difference that is accidental · the chosen shared seam (a writer helper, a
mapper, a base service — with the reason) · the two routes' behaviour preserved, shown by the
existing suites plus at least one test that pins the `animalStatus` difference · the before/after
diff of the reporter block · a `/handoff` recording Doc Impact, `update` if
`docs/architecture/PawHaven-Backend-Architecture.md` or `docs/features/03-report-animal.md` /
`04-rescue-cases.md` describes the two paths separately.

## Real surfaces involved

- `apps/backend/core-service/src/modules/report-animal/reportAnimal.service.ts` (`create`),
  `reportAnimal.controller.ts`, `reportAnimal.module.ts`.
- `apps/backend/core-service/src/modules/rescue/rescue.service.ts` (`create`, `findAll`, `findOne`,
  `findPhoto`, `decodePhoto`, `toListItem`, `toDetail`), `rescue.controller.ts`, `rescue.module.ts`.
- `packages/shared/types/ReportAnimal.schema.ts` (`AnimalReportSchema`, `reporterPhotosSchema`,
  `contactInfoSchema`), `packages/shared/types/Rescue.schema.ts` (`CreateRescueDtoSchema`,
  `RescueLocationSchema`).
- `packages/shared/types/AnimalStatus.ts` (`AnimalStatus.PENDING`, `AnimalStatusSchema`).
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model animalReports` lines ~134-155.
- `packages/backend-core/constants/database.ts` (`databaseEngines.mongodb`),
  `packages/backend-core/dynamic-modules/prisma/`,
  `packages/backend-core/dynamic-modules/internal-jwt/internalJwt.guard.ts` and
  `internalJwt.decorator.ts`, `packages/backend-core/types/InternalJwt.schema.ts`.
- Tests: `apps/backend/core-service/src/modules/report-animal/report-animal.service.test.ts`,
  `report-animal.controller.test.ts`, `apps/backend/core-service/src/modules/rescue/rescue.service.test.ts`.
- The only caller of either write today is the portal report wizard:
  `apps/frontend/portal/src/features/report-animal/api/reportAnimal.api.ts` posts
  `/core/report-animal`.

## Known trap

`POST /core/rescues` has no frontend caller — the portal only issues GETs against it
(`apps/frontend/portal/src/features/rescue-cases/api/rescueCases.api.ts`,
`apps/frontend/portal/src/features/rescue-detail/api/rescueDetail.api.ts`). A run that concludes
"the rescue create path is dead code, delete it" is solving a different task, and one that concludes
"`POST /rescues` is the only real path" is wrong in the other direction. The eval is about sharing
the write, not pruning it; deletion needs `/architecture-change` and an owner decision.

Second trap: the two DTOs are not aliases. `AnimalReportSchema` carries `location` and a required
`contactInfo`; `CreateRescueDtoSchema` carries `locationObj` and no `contactInfo` at all. Merging the
schemas to "make one writer" changes the public request contract of two endpoints. Contract
unification is an architecture decision; sharing the payload construction is not.
