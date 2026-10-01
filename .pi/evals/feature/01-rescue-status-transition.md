# feature-01 — Rescue case status transition

**Category:** feature · **Primary surface:** rescue (core-service) + portal rescue-cases ·
**Risk band:** authenticated write, role-gated

## Task prompt

> Rescuers keep telling us a case is stuck on "pending" even though the animal has already been
> treated. Right now nobody can move a case forward — they just edit the description. We need a
> proper status change: an admin or volunteer updates the case from its detail page, picks the next
> stage, writes a short note, and the timeline on the case reflects it.

## Expected classification (§6)

```json
{
  "taskType": "feature",
  "secondaryTasks": ["documentation"],
  "scope": [
    "backend",
    "api",
    "core-service",
    "frontend",
    "database",
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
    "render check on /rescue/detail/:animalID"
  ],
  "requiresClarification": true,
  "clarificationReason": "Which roles may change status, and whether a transition must be legal (pending -> treated) or free (any -> any), is not stated."
}
```

Accept `risk: high` or `critical`, and `requiresClarification: true`. Accept `requiresClarification:
false` only when the run states the role rule and transition legality it chose, and where it wrote
them down — inventing them silently into code is the failure this eval watches for.

## Workflow route

`/feature-development`. Accept `/architecture-change` as an added pass, not a replacement: a
transition-history collection is a data-model decision and the feature prompt's step 2 is where the
shared contract gets defined. `/new-feature` is deleted — a run routing there is routing to a
command that no longer exists.

## Observable success criteria

1. `packages/shared/types/Rescue.schema.ts` or a new sibling carries the Zod request/response shape
   for the transition; the endpoint and the form consume the same schema.
2. A mutating route exists on the rescue controller, and `@InternalJwt()` reads the caller — no
   cookie parsing, no trusting a raw header. The gateway invariant holds: downstream services never
   see a browser token.
3. The write is role-gated against `userRoles` (`packages/backend-core/constants/userRoles.ts`
   defines `volunteer`, `admin`), and the gate is enforced server-side, not by hiding the button.
4. The previous status, new status, author and note are retrievable after the write — either a
   persisted history the detail response exposes, or an explicit statement in the handoff that only
   the latest status is stored and why.
5. The status ladder in `apps/frontend/portal/src/features/rescue-cases/components/RescueTimeline.tsx`
   advances: fed a case at `treated`, it lights stages through `treated` rather than stage 1.
6. Validation on the shared enum, not a stringly-typed path: `AnimalStatusSchema.safeParse`
   (`packages/shared/types/AnimalStatus.ts`, seven values) rejects a bogus stage with a 4xx, not a
   500 or a silent `pending` fallback like `toListItem` does today.
7. Tests: happy transition, rejected role, rejected unknown status — vitest, co-located
   (`apps/backend/core-service/src/modules/rescue/`), no Jest.
8. Copy in all three locales (`packages/i18n/locales/{en-US,zh-CN,de-DE}/rescueCases.json` and
   `common.json`); styles through `@pawhaven/design-system` tokens.
9. `pnpm typecheck` and `pnpm --filter @pawhaven/core-service test` green; the rendered detail page
   shows the new stage.

## What a good run must produce

Named data shape before code (transition record: from, to, actor, note, timestamp) · the shared
request/response schemas · the guarded endpoint · the form affordance and its loading/error/disabled
states · the three tests · an updated `docs/features/04-rescue-cases.md` §"What Does Not Exist"
line 3 ("No status update endpoint … `PATCH /rescues/:id/status` is not implemented") — a landed
feature must retire its own gap entry · a `/handoff` with Doc Impact = `update` · `<result>` with a
`<verification>` block naming each command.

## Real surfaces involved

- `apps/backend/core-service/src/modules/rescue/rescue.controller.ts` — today `POST /rescues` plus
  three `@OptionalAuth()` reads; no mutating route besides create.
- `apps/backend/core-service/src/modules/rescue/rescue.service.ts` — `findAll`, `findOne`,
  `findPhoto`, `toListItem`, `toDetail`; `animalStatus` mapped defensively at lines ~195 and ~212.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model animalReports`,
  `animalStatus String @default("pending")`, `@@index([animalStatus])`. No transition/history model.
- `apps/backend/core-service/src/modules/rescue/rescue.service.test.ts` — existing Prisma-double
  pattern to follow.
- `packages/shared/types/AnimalStatus.ts`, `Rescue.schema.ts`, `RescueDetail.schema.ts` (has no
  timeline field), `RescueList.schema.ts`.
- `apps/frontend/portal/src/features/rescue-cases/components/RescueTimeline.tsx` (`STATUS_ORDER`,
  seven stages), `StatusBadge.tsx`, `CaseCard.tsx`;
  `apps/frontend/portal/src/features/rescue-detail/` for the page.
- `packages/backend-core/decorators/authMode.decorator.ts` (`Public`, `OptionalAuth`),
  `packages/backend-core/dynamic-modules/internal-jwt/` (guard + `InternalJwt` decorator),
  `packages/backend-core/constants/userRoles.ts`.
- `apps/backend/gateway/src/internal-jwt/internalJwt.service.ts` — the `roles` claim's only writer.

## Known trap

`apps/backend/core-service/src/modules/` contains `adoption`, `animal-follow`, `bootstrap`, `guide`,
`home`, `report-animal`, `rescue`. There is **no** `community`, `content`, `volunteer` or
`notification` module despite `AGENTS.md`. A run that creates one for "notification on status
change" is inventing a service boundary and must route through `/architecture-change` for it — that
is a decision to escalate, not a detail to fill in.
