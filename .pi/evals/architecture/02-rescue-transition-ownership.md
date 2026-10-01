# arch-02 — Who owns the legal status transition

**Category:** architecture · **Primary surface:** rescue lifecycle (shared schema, core-service,
portal timeline) · **Risk band:** authenticated write decides who may move a case; currently no write
exists at all

## Task prompt

> Somebody asked where the rule lives that says a rescue case cannot jump from `pending` straight to
> `adopted`. Find out. Then decide — in one place, with the write path and the reads agreeing — which
> layer should own the transition, and what has to change in the schema, the service, and the UI for
> that answer to be true tomorrow.

## Expected classification (§6)

```json
{
  "taskType": "architecture-change",
  "secondaryTasks": ["documentation"],
  "scope": [
    "backend",
    "core-service",
    "frontend",
    "api",
    "database",
    "testing",
    "documentation"
  ],
  "complexity": "high",
  "risk": "high",
  "confidence": 0.85,
  "workflow": "architecture-change",
  "requiredAgents": [
    "scout",
    "oracle",
    "architect",
    "backend",
    "frontend",
    "tester",
    "reviewer"
  ],
  "requiredVerification": [
    "pnpm --filter @pawhaven/core-service test",
    "pnpm --filter @pawhaven/portal test",
    "pnpm typecheck"
  ],
  "requiresClarification": true,
  "clarificationReason": "Whether failed is terminal and recoverable, and whether a transition needs an audit record, changes the data model and is an owner decision."
}
```

Accept `risk: high` or `critical`; the transition becomes a role-gated authenticated write.
Accept `requiresClarification: true`, or `false` only when the run states the transition graph it
chose and records who authorised it. `taskType: refactor` is a classification failure — there is
nothing to dedup, the rule does not exist.

## Workflow route

`/architecture-change`. The answer to "where does the rule live" is the deliverable, and at this
commit the honest answer is **nowhere**: the work is choosing the owner, not moving existing logic.

## Observable success criteria

1. The finding is grounded in four verified absences and four verified presences, each cited:
   - **No transition rule anywhere.** No status-transition table, guard, or helper exists in
     `apps/backend/core-service/src/modules/rescue/rescue.service.ts` or
     `packages/shared/types/AnimalStatus.ts`.
   - **No write endpoint.** `apps/backend/core-service/src/modules/rescue/rescue.controller.ts` has
     exactly one mutating route, `POST /rescues`, and three `@OptionalAuth()` reads
     (`GET /`, `GET /:id/photo/:index`, `GET /:id`).
   - **The column is a free-text `String`.** `apps/backend/core-service/src/prisma/mongodb/schema.prisma`
     declares `animalStatus String @default("pending")` with `@@index([animalStatus])` — the database
     enforces nothing, and there is no history or transition model.
   - **The reads guess.** `RescueService.toListItem` and `toDetail` each run
     `AnimalStatusSchema.safeParse(record.animalStatus)` and silently fall back to
     `AnimalStatus.PENDING` on failure, so an unmapped status renders as a new case rather than as
     an error.
   - **The UI decides order on its own.** `STATUS_ORDER` in
     `apps/frontend/portal/src/features/rescue-cases/components/RescueTimeline.tsx` lists six of the
     seven `AnimalStatusValues` — `failed` is absent — and `indexOf(currentStatus)` drives the
     ladder, so a `failed` case renders the full ladder with no active step.
   - **The shared enum is the only real contract.** `AnimalStatusValues` /
     `AnimalStatusSchema` in `packages/shared/types/AnimalStatus.ts` is the single source both sides
     import.
   - **The portal has its own copy of the labels.** `STATUS_LABEL_KEYS` in `StatusBadge.tsx` and in
     `RescueTimeline.tsx`, keys `common.rescue_status_*`.
   - **A second, unrelated timeline exists.** `apps/frontend/portal/src/features/rescue-detail/components/RescueTimeline.tsx`
     takes an `updates` array and prints `update.status` as a raw untranslated string — it is not
     driven by `AnimalStatus` at all.
2. The decision names one owner and defends it, addressing the three real candidates and why each
   loses or wins: the shared package (a transition map beside `AnimalStatusSchema`, importable by
   both sides, no authority over persistence), core-service's rescue service (the only place that
   can be reached by an authenticated write), or the portal (the only place that currently knows the
   order, and cannot enforce anything). A decision that leaves ownership split across two of the
   three is not a decision.
3. The consequence chain is written out: what a transition endpoint would look like
   (`@InternalJwt()` identity, role gate from
   `packages/backend-core/constants/userRoles.ts`), whether the Prisma column becomes an enum or
   stays a string behind a Zod parse, whether an illegal transition is a 4xx or a silent correction,
   and what happens to rows already holding an unmapped value given the `PENDING` fallback.
4. The `failed` question is answered explicitly: whether `failed` is terminal, whether it is
   recoverable, and whether it belongs in `STATUS_ORDER` at all. The portal's current six-step ladder
   and the seven-value enum are inconsistent, and the decision must not leave that inconsistency in
   place by silence.
5. Nothing is implemented. The deliverable is the decision document plus the `/handoff` with Doc
   Impact = `create` or `update` — `docs/architecture/` for the ownership rule, and
   `docs/features/04-rescue-cases.md`, whose "What Does Not Exist" section still records that no
   status-update endpoint exists, for the endpoint shape. A run that lands `PATCH /rescues/:id/status`
   while the decision is still open has answered a product question without an owner.
6. No auth boundary is moved in the process: the gateway keeps owning browser cookies and the ES256
   internal JWT (`apps/backend/gateway/src/internal-jwt/internalJwt.service.ts`), and any proposed
   endpoint reads the caller through `@InternalJwt()`
   (`packages/backend-core/dynamic-modules/internal-jwt/`).

## What a good run must produce

The current-ownership finding, stated as "the rule does not exist" with the four absences cited ·
the ladder-vs-enum inconsistency, including `failed` · the three candidates and the one chosen ·
the decision document under `docs/architecture/` · the consequence chain (endpoint, column, illegal
transition, existing rows, role gate) · the `/handoff` with Doc Impact · `<result>` with a
`<verification>` block. No push, no PR, no commit.

## Real surfaces involved

- `packages/shared/types/AnimalStatus.ts` — `AnimalStatusValues`, `AnimalStatusSchema`, `AnimalStatus`.
- `apps/backend/core-service/src/modules/rescue/rescue.controller.ts`,
  `rescue.service.ts` (`create`, `findAll`, `toListItem`, `toDetail`, `safeParse` fallbacks),
  `rescue.service.test.ts`.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model animalReports`,
  `animalStatus String @default("pending")`, `@@index([animalStatus])`.
- `packages/shared/types/Rescue.schema.ts` (`CreateRescueDtoSchema` with its defaulted
  `animalStatus`), `RescueList.schema.ts`, `RescueDetail.schema.ts` (no timeline field).
- `apps/frontend/portal/src/features/rescue-cases/components/RescueTimeline.tsx` (`STATUS_ORDER`),
  `StatusBadge.tsx` (`STATUS_LABEL_KEYS`), `RescueCasesSection.tsx`;
  `apps/frontend/portal/src/features/rescue-detail/components/RescueTimeline.tsx`,
  `RescueDetailContent.tsx`.
- `packages/i18n/locales/{en-US,zh-CN,de-DE}/common.json` — `rescue_status_*`.
- `packages/backend-core/constants/userRoles.ts`, `packages/backend-core/decorators/authMode.decorator.ts`,
  `packages/backend-core/dynamic-modules/internal-jwt/internalJwt.guard.ts`.
- `docs/features/04-rescue-cases.md`, `docs/features/05-rescue-detail.md`,
  `docs/architecture/PawHaven-Backend-Architecture.md`.

## Known trap

`AGENTS.md` lists a Rescue module with a lifecycle that reads like transitions exist, and the portal
already has a timeline component that implies a history. Neither implies a rule. The trap is writing
the architecture doc as if the ownership question were "move the existing transition logic into
core-service" — there is nothing to move, and a document phrased that way is confidently wrong.

Second trap: the `AnimalStatusSchema.safeParse(... ) || PENDING` fallbacks look like defensive
validation and pass review as-is. They are the reason the current ownership is undecidable — the
reads repair bad data instead of surfacing it. A decision that keeps them leaves `animalStatus`
unowned in practice, and must say so rather than call the repair "resilience".
