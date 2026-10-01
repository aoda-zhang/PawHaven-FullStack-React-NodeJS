# bug-fix-05 — The homepage "adopted" counter double-counts

**Category:** bug-fix · **Primary surface:** home stats, fed by adoption + rescue ·
**Risk band:** reported metric correctness; no auth change

## Task prompt

> Our impact number is wrong. The hero says 128 animals adopted, but the adoption team says only 40
> pets are marked adopted in the catalogue. The rescue feed says nothing near that either. I think we
> are counting the same animal twice.

## Expected classification (§6)

```json
{
  "taskType": "bug-fix",
  "secondaryTasks": [],
  "scope": ["backend", "core-service", "database", "frontend", "testing"],
  "complexity": "medium",
  "risk": "medium",
  "confidence": 0.8,
  "workflow": "bug-fix",
  "requiredAgents": ["scout", "backend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm --filter @pawhaven/core-service test",
    "render check of the hero stats"
  ],
  "requiresClarification": true,
  "clarificationReason": "What the public number is supposed to mean — adopted pets, adopted rescue cases, or the union without double counting — is a product decision the fix cannot invent."
}
```

`risk: low` is acceptable only with a one-line justification that no auth, PII or contract is
touched. `complexity: high` is acceptable if the run's fix introduces a real de-duplication rule
across two collections.

## Workflow route

`/bug-fix`. If the answer turns out to require a link between `AdoptablePet` and `animalReports` —
which does not exist today — that is an architecture decision and the run must route it to
`/architecture-change` rather than inventing a join column inside a bug fix.

## Observable success criteria

1. The run finds the addition: `HomeService.getStats`
   (`apps/backend/core-service/src/modules/home/home.service.ts`) returns
   `totalAdopted: adoptedRescues + adoptedPets`, where `adoptedRescues` counts
   `animalReports` with `animalStatus: AnimalStatus.ADOPTED` and `adoptedPets` counts `adoptablePet`
   with `adoptionStatus: 'adopted'`. Two collections, summed, no relationship between them.
2. The run establishes whether overlap is possible **in the current data model**, and says so from
   evidence: `docs/features/02-home.md` §4 records "There is no link between a pet and a rescue case —
   no `caseId`, no `rescueCaseId`, no foreign key", and `apps/backend/core-service/src/prisma/mongodb/schema.prisma`
   has no such field on `AdoptablePet`. An honest finding may therefore be "double counting is not
   currently expressible; the number is wrong for a different reason" — which is a pass, provided the
   run identifies the real reason.
3. The other candidate causes are ruled in or out with evidence, not assumed:
   - `animalStatus` is only ever written as `pending` (`ReportAnimalService.create` sets
     `AnimalStatus.PENDING`; there is no status-update endpoint — `docs/features/04-rescue-cases.md`
     §9), so `adoptedRescues` should be 0 in practice. A number above 0 means hand-edited data.
   - `adoptionStatus` is an unconstrained `String` with `@default("available")`; the count uses the
     literal `'adopted'` while the model comment says `available | pending | adopted`. Case or spelling
     drift is invisible to the count.
   - Both counts use `deletedAt: { isSet: false }`; verify the soft-delete filter matches the feed's.
   - `Hero.tsx` renders `heroStats.totalAdopted.toLocaleString()` — a display/localisation question is
     distinct from a data question, and the run must say which one it fixed.
4. The repro is executed: a test on `getStats` with the existing Prisma-double pattern in
   `apps/backend/core-service/src/modules/home/home.service.test.ts` (it already covers the
   volunteer-count fallback at `totalVolunteers: 0`, which is the model to follow) asserting the
   current summed result, then the intended result.
5. The fix states the metric. Acceptable: count one source and say which; count the union under an
   explicit rule; or keep the sum and rename the label in all three locales so the number means what
   it says. Unacceptable: subtracting one count from the other with no domain justification.
6. If a new label or key is needed, `packages/i18n/locales/{en-US,zh-CN,de-DE}/home.json` are updated
   together — three locales, not one.
7. No collateral change to the other two stats, and the volunteer path keeps degrading to 0 when the
   `auth-service` `GET /volunteer-count` call fails (`apps/backend/auth-service/src/modules/auth/auth.controller.ts`,
   `@Public()`), with the existing warn-level log intact.
8. `pnpm typecheck` and the core-service suite green, red → green on the new test, and the hero render
   check names what was observed.
9. Doc Impact: `docs/features/02-home.md` §"What Does Not Exist" or the hero-stats section, whichever
   the corrected behaviour now contradicts.

## What a good run must produce

The addition site · the overlap verdict with the schema evidence behind it · each ruled-in/ruled-out
candidate · the metric definition chosen and the one rejected · the failing-then-passing test · the
locale note if the label changed · the render observation · `/handoff` with Doc Impact ·
`<verification>`.

## Real surfaces involved

- `apps/backend/core-service/src/modules/home/home.service.ts` — `getStats`, `getHomeData`,
  `authClient`, the `featureFlag.latestRescueLimit` / `adoptablePetLimit` config reads.
- `apps/backend/core-service/src/modules/home/home.service.test.ts`, `home.controller.ts`,
  `home.module.ts`.
- `packages/shared/types/HeroStats.schema.ts`, `Home.schema.ts`.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `animalReports.animalStatus`
  (`@@index([animalStatus])`), `AdoptablePet.adoptionStatus` (`@@index([adoptionStatus])`).
- `apps/backend/core-service/src/modules/adoption/adoption.service.ts` — `findAll`, `toContract`;
  `apps/backend/core-service/src/modules/rescue/rescue.service.ts` — `findAll`, `toListItem`.
- `packages/shared/types/AnimalStatus.ts` — the seven-value enum and `AnimalStatus` constants.
- `apps/frontend/portal/src/features/home/components/Hero.tsx` — `heroStats.totalRescues`,
  `totalAdopted`, `totalVolunteers`; `apps/frontend/portal/src/features/home/api/home.*`.
- `apps/backend/auth-service/src/modules/auth/auth.controller.ts` — `GET /volunteer-count`.
- `apps/backend/core-service/src/config/{dev,test,prod,uat}/env/index.json` — the feature-flag limits.

## Known trap

`HomeService` reaches `auth-service` through the HTTP client registered under
`microServiceNames.AUTH`, not through Prisma. Fixing the adoption count by joining across the two
services' databases is impossible — they are separate Prisma schemas in separate services
(`apps/backend/core-service/src/prisma/mongodb/schema.prisma` vs
`apps/backend/auth-service/src/prisma/mongodb/schema.prisma`). A run that proposes a cross-service
join has misread the architecture and must say so.
