# feature-04 — "My followed animals" list page

**Category:** feature · **Primary surface:** animal-follow (core-service + portal) ·
**Risk band:** authenticated read of another user's relationships

## Task prompt

> Followers are our cheapest signal for "this person will foster". Add a page where a signed-in user
> sees the animals they follow, with the current status of each one, so they can see when an animal
> they saved becomes available for adoption.

## Expected classification (§6)

```json
{
  "taskType": "feature",
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
  "risk": "medium",
  "confidence": 0.85,
  "workflow": "feature-development",
  "requiredAgents": ["backend", "frontend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm test",
    "render check of /followed while signed in and out"
  ],
  "requiresClarification": false
}
```

`risk: high` is a defensible answer too — the endpoint returns a user's own relationship rows, so an
identifying-parameter bug turns it into an authorization leak. Either value passes; a run that
classifies it `low` **and** adds an id-taking GET endpoint without a role/ownership check fails.

## Workflow route

`/feature-development`. Not `/new-feature` — deleted. Not `/refactoring`: new user-visible page and
new read path.

## Observable success criteria

1. A read path returns the caller's follows and nothing else, with identity taken **only** from the
   internal JWT claims (`@InternalJwt()`, `claims.sub`) — never from a query or body parameter.
   `animalFollow.service.ts` already does this correctly for `follow`/`unfollow`/`getStatus`; the new
   list must match that pattern.
2. Status per animal comes from `RescueService`/`animalReports.animalStatus`, resolved in one query
   or one documented batch — not one request per card. N+1 on a follow list is the predictable
   failure and is a review finding.
3. A follow whose animal was soft-deleted (`deletedAt` set, or the row absent) is handled: filtered
   out, or shown as unavailable. `animalFollow` has **no foreign key** to `animalReports` — the
   model is `userId` + `animalId` with `@@unique([userId, animalId])` and `@@index([animalId])`, and
   `docs/features/05-rescue-detail.md` records "No cascade cleanup … orphan follow rows are latent".
   The run must say which behaviour it chose for the orphan case.
4. A route is registered — `routePaths.ts` plus `router.tsx` — and reachable from the shell menu.
   Menu entries come from `GET /core/bootstrap`; adding a nav item that is not in the seeded `Menu`
   collection is a dead link, which is exactly the failure already recorded elsewhere in this repo.
5. Empty, loading and error states exist; signed-out visitors get the redirect the other guarded
   routes use (`requireUser` in `features/auth/route.tsx`), not a page that renders an empty list.
6. Followed-animals shapes live in `packages/shared/types/` — `AnimalFollow.schema.ts` currently
   exports `AnimalFollowStatusSchema` and `AnimalFollowResultSchema` and is the natural home for the
   list item. No ad-hoc type in the api module.
7. Unfollow works from the list, and the row disappears without a full reload — cache-key update via
   TanStack Query, following `features/animal-follow/api/animalFollow.mutations.ts`.
8. Tests: service list query with the Prisma double, and a component render for empty and populated.
   Vitest, co-located.
9. i18n across `en-US`/`zh-CN`/`de-DE` (`animalFollow.json` exists in all three); design-system tokens
   only; `pnpm typecheck` green.

## What a good run must produce

Named shape for a followed-animal row · the ownership-scoped query · the orphan/soft-delete decision ·
the route and menu wiring, or an explicit statement that the menu row needs seeding it will not fake ·
query/mutation/query-key modules in the existing `api/` pattern · the three states · tests · a
`docs/features/` update — `docs/features/README.md` says `animal-follow` is documented as
**Rescue Detail §1.4** and has no document of its own, so the run must decide and state whether this
page makes it a feature document or stays a section · `/handoff`, Doc Impact = `update`.

## Real surfaces involved

- `apps/backend/core-service/src/modules/animal-follow/animalFollow.controller.ts` — `GET
:animalId/status` with `@InternalJwt({ allowAnonymous: true })`, `POST`/`PUT :animalId` with
  `@InternalJwt()`. No list endpoint.
- `apps/backend/core-service/src/modules/animal-follow/animalFollow.service.ts` — `follow`,
  `unfollow`, `getStatus`, `toResult`, `recoverFollow` with `P2002` unique-violation handling.
- `apps/backend/core-service/src/modules/animal-follow/animal-follow.controller.test.ts` and
  `animal-follow.service.test.ts` — note the directory is kebab-case while the files inside are
  camelCase. Match the file names you are extending; do not rename them as a side effect.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model AnimalFollow`, `@@map("animal_follows")`.
- `apps/frontend/portal/src/features/animal-follow/` — `api/animalFollow.api.ts`, `mutations.ts`,
  `queries.ts`, `queryKeys.ts`, `components/FollowButton.tsx`, `components/FollowerCount.tsx`,
  `tests/FollowButton.test.tsx`, `tests/FollowerCount.test.tsx`.
- `apps/frontend/portal/src/features/rescue-detail/RescueDetail.tsx` — the only current consumer;
  it imports across the feature boundary, which `docs/features/README.md` records as "the only place
  two features share UI without promotion to `packages/ui`".
- `apps/frontend/portal/src/router/routePaths.ts`, `router.tsx`, `apps/backend/core-service/src/modules/bootstrap/bootstrap.service.ts`.
- `packages/shared/types/AnimalFollow.schema.ts`, `RescueList.schema.ts`.

## Known trap

There is no notification module, so "notify followers when status changes" is **not** an available
surface — `apps/backend/core-service/src/modules/` has only `adoption`, `animal-follow`, `bootstrap`,
`guide`, `home`, `report-animal`, `rescue`. If the run reads the task as implying notifications it
must say so and stop, not scaffold a module.
