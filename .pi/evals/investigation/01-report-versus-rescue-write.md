# inv-01 — Report versus rescue write: who actually writes what

**Category:** investigation · **Primary surface:** `report-animal` vs `rescue` in core-service, seen
from the portal · **Risk band:** read-only reconnaissance over a PII write path — no writes expected

## Task prompt

> A stray animal reported through the site shows up in the rescue list, and we cannot tell which
> endpoint created it. Trace both write paths from the browser to the database — which service,
> which module, which endpoint, what gets stored, and where the two paths meet. Answer with the
> answer first, then the evidence. Do not change any code.

## Expected classification (§6)

```json
{
  "taskType": "investigation",
  "secondaryTasks": [],
  "scope": ["frontend", "backend", "core-service", "api", "database"],
  "complexity": "medium",
  "risk": "medium",
  "confidence": 0.8,
  "workflow": "investigation",
  "requiredAgents": ["scout", "oracle"],
  "requiredVerification": [
    "grep for the two controller paths across apps/ and packages/",
    "pnpm --filter @pawhaven/core-service test"
  ],
  "requiresClarification": false
}
```

Accept `risk: medium` or `low` — this is read-only, so `risk: low` with the reason "no write is
issued" is defensible. `risk: high` is over-classification but not a failure. The failure in either
direction is `taskType: bug-fix` or `feature`: a run that edits a file while answering a question has
changed the task.

## Workflow route

`/investigation`. The answer comes first, evidence second, and the evidence is file paths and symbol
names that a reader can open — not a summary of the summary.

## Observable success criteria

1. The answer is stated in the first paragraph, and it is this: both paths are written by the same
   service (core-service, `:8081`, behind the gateway prefix `/api/core`) into the same Prisma model
   `animalReports` in `apps/backend/core-service/src/prisma/mongodb/schema.prisma`, by two different
   modules — `report-animal` and `rescue` — over two different endpoints. They meet at the database
   row, and nowhere else.
2. The two endpoints are named with their real decorators:
   `apps/backend/core-service/src/modules/report-animal/reportAnimal.controller.ts` is
   `@Controller('report-animal')` with a single `@Post()` (gateway-visible as `/api/core/report-animal`),
   and `apps/backend/core-service/src/modules/rescue/rescue.controller.ts` is `@Controller('rescues')`
   with `POST /` plus three `@OptionalAuth()` reads (gateway-visible as `/api/core/rescues`).
3. The originating client is identified: `apps/frontend/portal/src/features/report-animal/api/reportAnimal.api.ts`
   is the only place in the portal that POSTs to `/core/report-animal`, and **no portal code POSTs to
   `/core/rescues`** — `apps/frontend/portal/src/features/rescue-cases/api/rescueCases.api.ts` and
   `apps/frontend/portal/src/features/rescue-detail/api/rescueDetail.api.ts` only GET. The run
   states what that means (every `animalReports` row visible in the portal today was created by the
   report path) instead of inferring it.
4. The payload difference is laid out field by field, because it is what makes the two rows
   distinguishable after the fact:
   - report (`AnimalReportSchema`, `packages/shared/types/ReportAnimal.schema.ts`) →
     `ReportAnimalService.create` maps explicitly, renames `location` → `locationObj`, forces
     `animalStatus: AnimalStatus.PENDING`, and writes `reporter.reporterID` / `reporterName` from the
     internal JWT claims. **`contactInfo` — required by the schema, with `phone` and optional `email`
     — is never written to the document.** `model animalReports` has no field for it.
   - rescue (`CreateRescueDtoSchema`, `packages/shared/types/Rescue.schema.ts`) →
     `RescueService.create` spreads `...dto` into Prisma; the DTO already uses Prisma field names
     (`locationObj`), and `animalStatus` is caller-supplied with `.default(AnimalStatus.PENDING)`.
     The run flags the `contactInfo` drop as an observation with its consequences (PII captured at the
     API boundary and then discarded) — as a finding for the owner, not as a fix.
5. Where the paths meet, precisely: the same collection, and downstream readers that cannot tell the
   difference at all. `RescueService.findAll` / `findOne` query `animalReports` and project through
   `RescueListItemSchema` / `RescueDetailSchema`; `HomeService` and the rescue list both render rows
   without a provenance field. There is no discriminator column — the run says so instead of
   speculating how one could be inferred.
6. The gateway hop is accounted for: `/api/core` comes from
   `apps/backend/gateway/src/config/dev/env/index.json` (`microServices[].gatewayPrefix`,
   `pathRewrite: /core-service`), so both writes arrive through `apps/backend/gateway/src/proxy/proxy.service.ts`
   with a gateway-signed ES256 internal JWT, and both controllers read the caller through
   `@InternalJwt()`. The run confirms the browser never talks to core-service directly.
7. No source file is modified. The result is a trace with a stated conclusion and, at the end, the
   short list of things worth a follow-up (the `contactInfo` drop; the unposted `POST /rescues`) —
   each named as a candidate, none started.

## What a good run must produce

The one-paragraph answer · the endpoint → module → service → collection chain for both paths, with
the client that issues each · the field-by-field payload diff and the `contactInfo` observation ·
the meeting point and its absence of a discriminator · the gateway hop · a follow-up list with no
code. Read-only throughout: `git status --short` shows no change to `apps/` or `packages/`.

## Real surfaces involved

- `apps/backend/core-service/src/modules/report-animal/reportAnimal.controller.ts`,
  `reportAnimal.service.ts`, `reportAnimal.module.ts`.
- `apps/backend/core-service/src/modules/rescue/rescue.controller.ts`, `rescue.service.ts`,
  `rescue.module.ts`.
- `apps/backend/core-service/src/modules/home/home.service.ts` — a second reader of the same
  collection.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model animalReports`.
- `packages/shared/types/ReportAnimal.schema.ts` (`AnimalReportSchema`, `contactInfoSchema`),
  `packages/shared/types/Rescue.schema.ts` (`CreateRescueDtoSchema`), `AnimalStatus.ts`,
  `RescueList.schema.ts`, `RescueDetail.schema.ts`.
- `apps/frontend/portal/src/features/report-animal/api/reportAnimal.api.ts`,
  `apps/frontend/portal/src/features/rescue-cases/api/rescueCases.api.ts`,
  `apps/frontend/portal/src/features/rescue-detail/api/rescueDetail.api.ts`,
  `apps/frontend/portal/src/utils/apiClient.ts`.
- `apps/backend/gateway/src/proxy/proxy.service.ts`, `internalJwt/internalJwt.service.ts`,
  `config/dev/env/index.json`.
- `packages/backend-core/constants/microServices.ts`, `databaseEngines.mongodb`.
- Tests that describe the current write behaviour:
  `apps/backend/core-service/src/modules/report-animal/report-animal.service.test.ts`,
  `report-animal.controller.test.ts`, `apps/backend/core-service/src/modules/rescue/rescue.service.test.ts`.
- `docs/features/03-report-animal.md`, `docs/features/04-rescue-cases.md`.

## Known trap

The names make this look like a report path and a separate "rescue record" table. They are one
table. A run that describes them as two features with two stores — or that quietly introduces the
idea of a second collection to reconcile them — is solving a problem the schema does not have.

Second trap: the `contactInfo` drop looks like a bug to fix, and `bug-fix-02` already covers the
report-contact surface. This eval measures whether the trace _finds_ it and reports it, not whether
it repairs it. Editing `reportAnimal.service.ts` during an investigation is the failure mode here.
