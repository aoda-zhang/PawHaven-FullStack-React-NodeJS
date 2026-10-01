# feature-03 — Report-a-stray as a multi-step wizard with progress

**Category:** feature · **Primary surface:** report-animal (portal form + core-service write) ·
**Risk band:** authenticated write, PII and photo upload

## Task prompt

> The report form is one very long scroll and people give up halfway. Break it into steps —
> animal, location, behaviour and photos — with a progress indicator and Back/Next, and keep the
> answers if someone reloads the page.

## Expected classification (§6)

```json
{
  "taskType": "feature",
  "secondaryTasks": ["refactor"],
  "scope": ["frontend", "shared", "testing", "documentation"],
  "complexity": "medium",
  "risk": "medium",
  "confidence": 0.85,
  "workflow": "feature-development",
  "requiredAgents": ["frontend", "tester", "review"],
  "requiredVerification": [
    "pnpm typecheck",
    "pnpm --filter @pawhaven/portal test",
    "render check of each step"
  ],
  "requiresClarification": false
}
```

`secondaryTasks` including `refactor` is expected: the sections already exist as components and only
their orchestration changes. `risk: low` is acceptable **only** if the run proves no wire contract
changes — otherwise the photo payload and submit path make it medium.

## Workflow route

`/feature-development`. A pure frontend restructure of one feature folder; `/refactoring` is wrong
because progress state and persistence are new user-visible behaviour, and `/architecture-change`
is wrong because nothing crosses a package or service boundary unless the run moves validation into
`packages/shared`, which it should say so if it does.

## Observable success criteria

1. Every existing field survives the split with the same validation. The sections are already
   componentised — `AnimalBasicsSection.tsx`, `LocationSection.tsx`, `BehaviorContactSection.tsx`,
   `PhotoUpload.tsx`, `AnimalCountStepper.tsx` — so a step that drops a field is a regression, not a
   simplification.
2. Per-step Next refuses to advance while that step's fields are invalid, using the same Zod schema
   the whole form uses — not a second, looser hand-written check.
3. `defaultValues` semantics are unchanged: `ReportAnimalForm.tsx` seeds `animalType: 'cat'`,
   `animalCount: 1`, empty `coatColor`, null `age`/`size`/`behavior`/`latitude`/`longitude`, empty
   `photos`, `urgent: false`. A reload restores them plus user input.
4. Reload survival is real, and its scope is stated: `utils/readFilesAsDataUrls.ts` turns files into
   base64 data URLs, so persisting photos across a reload means persisting potentially megabytes.
   `REPORT_PHOTO_LIMITS` is `min: 2`, `max: 5`, `maxSizeBytes` = 10 MB each (`packages/shared/types/ReportAnimal.schema.ts`).
   Either the run excludes photos from the draft and says so on the restored step, or it names the
   storage it used and its quota failure mode.
5. Submit still posts to `/core/report-animal` through `reportAnimal.api.ts` and still invalidates
   `rescueCasesQueryKeys.all` and `homeQueryKeys.all` in `reportAnimal.mutations.ts`.
6. The route stays auth-gated: `report-animal/route.tsx` is the only `requireUser`-nested route, and
   a wizard step must not become a way to submit anonymously.
7. All step labels, buttons and errors are `t()` keys in `reportAnimal.json` for `en-US`, `zh-CN`,
   `de-DE`. No new hardcoded string, no `style={{}}`, no magic values.
8. Progress indicator is keyboard-reachable and announces the current step (`aria-current` or
   equivalent) — a11y is part of the feature, not a follow-up.
9. `pnpm typecheck` green; `ReportAnimalForm.validation.test.tsx` and `PhotoUpload.test.tsx` still
   pass unchanged or are updated with a stated reason; new tests cover step gating and restore.

## What a good run must produce

The step model (which fields in which step, forward and back) · the gating rule expressed against
the existing schema · the draft persistence decision with its size tradeoff named · the
loading/error/empty states of each step · i18n keys across three locales · tests for gating, restore,
and final submit · `docs/features/03-report-animal.md` §8 line "No wizard, no steps, no progress
indicator. One scrolling form." retired or corrected · `/handoff` with Doc Impact = `update` ·
`<result>` with `<verification>`.

## Real surfaces involved

- `apps/frontend/portal/src/features/report-animal/ReportAnimal.tsx`, `route.tsx`, `constants.ts`
  (`FALLBACK_ID_SUFFIX_LENGTH`), `components/ReportAnimalForm.tsx` (owns the DTO mapping and the
  success card), the five section components, `utils/readFilesAsDataUrls.ts`.
- `apps/frontend/portal/src/features/report-animal/tests/ReportAnimalForm.validation.test.tsx` and
  `tests/PhotoUpload.test.tsx` — the jsdom + react-hook-form + i18n-mock pattern to reuse, including
  the `lottie-react` / `lottie-web` mocks.
- `packages/shared/types/ReportAnimal.schema.ts` — `createReportAnimalFormSchema(messages)` takes
  fourteen translated message strings from `t()`; `AnimalReportSchema` is the server-side shape.
  They are deliberately different shapes: `File` cannot cross the wire and data URLs cannot live in
  a form value. Do not "unify" them.
- `apps/backend/core-service/src/modules/report-animal/reportAnimal.controller.ts` —
  `@Body({ schema: AnimalReportSchema })`, `@InternalJwt()`; the write itself is unchanged by this
  task.
- `packages/i18n/locales/{en-US,zh-CN,de-DE}/reportAnimal.json`, `imageUpload.json`.
- `packages/ui` (`Button`, `FormInput`), `@pawhaven/frontend-core` `MultiImageUpload`, `cn`.

## Known trap

`components/StrayCTA.tsx` is duplicated verbatim between `features/home/` and
`features/report-animal/` except for one class. Deduplicating it is out of scope here — the honest
move is to note the duplication as a finding for `/refactoring`, not to promote a shared component
mid-feature and turn a medium-risk frontend task into an unannounced cross-package change.
