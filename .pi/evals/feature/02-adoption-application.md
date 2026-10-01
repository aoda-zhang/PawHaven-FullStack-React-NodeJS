# feature-02 — Adoption application from a pet card

**Category:** feature · **Primary surface:** adoption (core-service) + portal home ·
**Risk band:** authenticated write holding applicant PII

## Task prompt

> The homepage shows adoptable pets and the "Adopt" buttons go nowhere. We want people to actually
> apply: click a pet, fill in a short application — name, phone, housing type, other animals — and
> get a confirmation with a reference number. The pet should then stop looking available to the next
> visitor.

## Expected classification (§6)

```json
{
  "taskType": "feature",
  "secondaryTasks": ["bug-fix"],
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
  "complexity": "high",
  "risk": "high",
  "confidence": 0.85,
  "workflow": "feature-development",
  "requiredAgents": ["architect", "backend", "frontend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm test",
    "render check of the apply flow and /adopt landing"
  ],
  "requiresClarification": true,
  "clarificationReason": "PII retention on the application, and who is allowed to read applicant contact details, is unspecified."
}
```

The `secondaryTasks: ["bug-fix"]` is because `apps/frontend/portal/src/features/home/Home.tsx`
already navigates to `/adopt` and `/adopt/detail/:id` and no such route is registered in
`apps/frontend/portal/src/router/routePaths.ts` — the button is broken today. Accept an empty
`secondaryTasks` when the run names the dead link as part of its scope; reject a run that never
notices it.

## Workflow route

`/feature-development`. The new route plus the application record make it Standard-to-Architectural;
if the run adds a new module or a second writer to `AdoptablePet`, it should also run
`/architecture-change` and record the decision — not silently widen.

## Observable success criteria

1. A route exists for what `Home.tsx` links to — `routePaths.ts` gains the path, `router.tsx` mounts
   it — and the homepage card no longer lands on `NotFound`.
2. Application shape is declared once in `packages/shared/types/` as a Zod schema, and both
   `adoption.controller.ts` (`@Body({ schema })`) and the form resolver consume it. No parallel
   hand-written type.
3. A persistence path exists: either a new Prisma model in
   `apps/backend/core-service/src/prisma/mongodb/schema.prisma` plus a migration, or an explicit
   statement that the run added no migration and the application is not durable. Silently storing
   applications only in memory is a fail.
4. The pet's availability changes visibly: `AdoptionService.findAll` filters on `adoptionStatus`,
   so the applied-for pet leaves the default list, and the write is guarded so a second concurrent
   application cannot double-book. `adoptionStatus` is an unconstrained `String` on the model — the
   run must say that out loud and constrain it at the boundary at minimum.
5. Applicant phone/email are not returned by any read endpoint that a caller without a role can
   reach; `adoption.controller.ts` currently exposes both reads as `@OptionalAuth()`, so an
   unauthenticated visitor must not be able to list applications.
6. Confirmation reference is shown from server state, not minted client-side as a random id.
7. Every user-visible string is `t()` in `en-US`, `zh-CN`, `de-DE`; every colour and size is a
   design-system token; `pnpm token-check` is unaffected.
8. Loading, empty, error and offline states exist for the form — `@pawhaven/frontend-core`
   `apiClient` already funnels 401 to login; the form must not swallow a 4xx.
9. `pnpm typecheck` green; targeted vitest green for the service and the form; render check on the
   actual page.

## What a good run must produce

Named domain shape (application: pet id, applicant, answers, status, reference) · the shared Zod
schema · the guarded endpoint · the Prisma model or an honest non-durable declaration · the apply
form with state coverage · the cache invalidation so the home list refreshes (the existing pattern is
`reportAnimal.mutations.ts` invalidating `rescueCasesQueryKeys` and `homeQueryKeys`) · tests for
happy path, double-apply, and anonymous read · `docs/features/02-home.md` §7 gap line "No adoption
flow … no applications" updated or retired · `/handoff` with Doc Impact = `update` · `<result>` with
`<verification>`.

## Real surfaces involved

- `apps/backend/core-service/src/modules/adoption/adoption.controller.ts` — `@OptionalAuth()`,
  `GET /adoptable-pets` and `GET /adoptable-pets/:id` only.
- `apps/backend/core-service/src/modules/adoption/adoption.service.ts` — `findAll(status?, limit?)`,
  `findOne(id)`, `toContract()`; note it raises `BadRequestException` for a missing pet, so a bad id
  answers 400, not 404.
- `apps/backend/core-service/src/modules/adoption/adoption.service.test.ts` — the Prisma-double
  builder to extend.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model AdoptablePet`,
  `adoptionStatus String @default("available")`, `@@index([adoptionStatus])`; no
  application/applicant model and no link from a pet to a rescue case.
- `apps/frontend/portal/src/features/home/components/PetCard.tsx` — the card, with a decorative
  `Heart` affordance that has no handler; `AdoptablePetsSection.tsx`; `Home.tsx` for the dead
  navigations.
- `apps/frontend/portal/src/features/report-animal/` — the reference implementation of an
  authenticated form: `ReportAnimalForm.tsx` (react-hook-form + `zodResolver`),
  `api/reportAnimal.api.ts`, `api/reportAnimal.mutations.ts`.
- `apps/frontend/portal/src/utils/apiClient.ts`, `packages/i18n/locales/en-US/home.json`.

## Known trap

The homepage "Adoptable" badge is `bg-emerald-100 text-emerald-800` hardcoded in `PetCard.tsx`, which
is a design-token violation already in the file. Fixing it is out of scope for this task and must be
reported as a finding, not swept in as a drive-by; leaving it is acceptable, silently editing
unrelated files is not.
