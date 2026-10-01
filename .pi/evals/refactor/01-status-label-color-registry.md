# refactor-01 — One registry for rescue status labels and colours

**Category:** refactor · **Primary surface:** portal rescue UI (`rescue-cases`, `rescue-detail`) +
`@pawhaven/design-system` · **Risk band:** presentation only, no behaviour change

## Task prompt

> The rescue status colours and labels have grown by copy-paste. There is a colour lookup in
> `apps/frontend/portal/src/utils/getStatusColorByPrefix.ts` with three near-identical maps, a
> label map duplicated in two different `RescueTimeline.tsx` files, and two components that share
> the name `RescueTimeline` but do completely different things. Clean this up so one status value
> has exactly one label and one colour source of truth, without changing anything the user sees.

## Expected classification (§6)

```json
{
  "taskType": "refactor",
  "secondaryTasks": [],
  "scope": ["frontend", "design-system", "testing"],
  "complexity": "medium",
  "risk": "low",
  "confidence": 0.85,
  "workflow": "refactoring",
  "requiredAgents": ["frontend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm --filter @pawhaven/portal test",
    "pnpm --filter @pawhaven/portal typecheck",
    "render check on /rescue-cases and /rescue/detail/:animalID"
  ],
  "requiresClarification": false
}
```

Accept `complexity: medium` or `low`; `high` is over-classification but not a failure. `risk: high`
or `critical` needs a stated reason — nothing here touches auth, tokens, PII or a write path.
`taskType: feature` is a classification failure: the run must not add a status, a route, or a new
user-visible affordance.

## Workflow route

`/refactoring`. The prompt's own constraint is the pass condition: a refactor is only correct if the
rendered output is unchanged. Where the run discovers the two `RescueTimeline` components cannot be
merged without changing behaviour (see Known trap), it must report that as a finding and stop short
of a merge — not merge anyway.

## Observable success criteria

1. Exactly one label map for `AnimalStatus` in the portal. Today it is declared twice —
   `STATUS_LABEL_KEYS` in `apps/frontend/portal/src/features/rescue-cases/components/StatusBadge.tsx`
   and in `apps/frontend/portal/src/features/rescue-cases/components/RescueTimeline.tsx` — with the
   same seven keys pointing at `common.rescue_status_*`. After the refactor there is one declaration
   and both components read it.
2. The colour lookup keeps every value it has today. The seven statuses must still resolve for all
   three prefixes (`bg`, `text`, `border`), and the keys must stay the token-backed class names
   `bg-rescue-status-<status>` etc. — `packages/design-system/src/theme.css` defines
   `--color-rescue-status-pending: var(--color-yellow-6)` and one entry per status, and the
   `--color-yellow-6` scale is the real authority (`packages/design-system/src/tokens/color.css`).
   A run that inlines `#a3a3a3`, `bg-slate-400`, or any raw hex to "simplify" the map has failed
   this criterion even if the diff looks cleaner.
3. The three collapse targets in `getStatusColorByPrefix.ts` (`bgStatusColors`, `textStatusColors`,
   `borderStatusColors`) become one map or one generator, and `getStatusColorByPrefix`'s throwing
   behaviour for an unsupported prefix is either preserved and covered by a test, or consciously
   replaced by a typed call site with the reason stated in the handoff. It may not silently start
   returning `undefined`.
4. `StatusColorType` stays a template literal type over the shared `AnimalStatus`
   (`apps/frontend/portal/src/features/home/types.ts`), so a status added to
   `packages/shared/types/AnimalStatus.ts` without a colour is a compile error, not a blank badge.
5. Both consumers keep working: `StatusBadge.tsx` (pill + dot in `CaseCard.tsx` and `CaseDetail.tsx`)
   and `apps/frontend/portal/src/features/rescue-detail/components/RescueDetailContent.tsx` line ~63,
   which today falls back to `?? 'bg-slate-400'`. That fallback is a hardcoded colour and a
   candidate for removal; if it stays it must be justified, not silently retained.
6. Rendered output is identical: `pnpm --filter @pawhaven/portal test` green — the suites that
   cover these surfaces are `apps/frontend/portal/src/features/rescue-cases/tests/RescueCasesPage.test.tsx`
   and `RescueCasesSection.test.tsx`, plus
   `apps/frontend/portal/src/features/rescue-detail/tests/RescueDetailContent.test.tsx` — and
   `pnpm --filter @pawhaven/portal typecheck` clean.
7. Labels stay in i18n. Every `common.rescue_status_*` key used today
   (`packages/i18n/locales/en-US/common.json`, and the same keys in `zh-CN` and `de-DE`) is still
   read through `useTranslation`. A refactor that hardcodes the English word next to the colour, or
   renders `update.status` raw as `apps/frontend/portal/src/features/rescue-detail/components/RescueTimeline.tsx`
   does today, has introduced the bug it was asked to remove.

## What a good run must produce

The duplication inventory (every site that maps a status to a label or a class) · the single
registry with its chosen home and the reason · a test that fails if a status has no label or no
colour · the portal suites green with the diff scoped to the registry and its importers · the
rendered-output check on `/rescue-cases` and `/rescue/detail/:animalID` · a `/handoff` recording Doc
Impact, which is `none` if nothing outside `.pi/evals`-adjacent docs describes this mapping and
`update` if the run changes it. No push, no PR, no commit.

## Real surfaces involved

- `apps/frontend/portal/src/utils/getStatusColorByPrefix.ts` — `bgStatusColors`, `textStatusColors`,
  `borderStatusColors`, `getStatusColorByPrefix`.
- `apps/frontend/portal/src/features/home/types.ts` — `RescueStatusType` (a re-export of the shared
  `AnimalStatus`), `ColorPrefix`, `StatusColorType`.
- `apps/frontend/portal/src/features/rescue-cases/components/StatusBadge.tsx`,
  `RescueTimeline.tsx`, `CaseCard.tsx`, `CaseDetail.tsx`, `RescueCasesSection.tsx`.
- `apps/frontend/portal/src/features/rescue-detail/components/RescueDetailContent.tsx`,
  `apps/frontend/portal/src/features/rescue-detail/components/RescueTimeline.tsx`.
- `packages/shared/types/AnimalStatus.ts` — `AnimalStatusValues`, `AnimalStatusSchema`, `AnimalStatus`.
- `packages/design-system/src/theme.css` lines ~88-94 — the seven `--color-rescue-status-*` tokens.
- `packages/design-system/src/tokens/color.css` — the raw scale the tokens resolve to.
- `packages/i18n/locales/{en-US,zh-CN,de-DE}/common.json` — `rescue_status_*`.
- `packages/frontend-core` — `cn`, the class merger every call site uses.
- Tests: `apps/frontend/portal/src/features/rescue-cases/tests/`,
  `apps/frontend/portal/src/features/rescue-detail/tests/`.

## Known trap

Two different components are both named `RescueTimeline`. The one under `rescue-cases` takes
`currentStatus: AnimalStatus` and derives steps from a `STATUS_ORDER` array that lists six of the
seven statuses — `failed` is in the label map but not in the order, so a `failed` case renders the
full six-step ladder with none active. The one under `rescue-detail` takes an `updates` array and
prints `update.status` as a raw string with no label map and no status typing. Merging them is a
behaviour change, not a refactor, and picking either behaviour for the other call site is a product
decision. A run that merges them and calls it a dedup is the failure this eval watches for; a run
that names the divergence and leaves both, is not.

Second trap: `packages/design-system/scripts/` holds only `build-tokens.mjs` and
`build-tokens.css` at this commit, yet both `packages/design-system/package.json` and the root
`package.json` reference a `token-check` script named `token-check.cjs` that is not on disk. So
`pnpm token-check` is not a validator a run can pass here. Token compliance is checked by reading
`packages/design-system/src/theme.css`, not by running a script that does not exist.
