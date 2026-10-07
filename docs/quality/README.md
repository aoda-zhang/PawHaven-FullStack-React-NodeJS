# PawHaven Repository Quality

This is the repository's quality record: what is healthy, what needs attention, what debt is
accepted, and which invariants are mechanically enforced. It is not an eval — no scores, no
grades, no percentages. Every claim below traces to a command run or a file read; where there is
no reliable data, that is said rather than filled.

States: `healthy` / `needs attention` / `medium risk`.

## Architecture

- Package boundary: **healthy**. `pnpm architecture-check` exits 0 — `@pawhaven/shared` has zero
  workspace dependencies, `ui` does not depend on `frontend-core`, apps do not import each other,
  and backend services import packages only, never each other.
- Feature boundary: **needs attention**. The same check carries a four-entry allowlist of
  pre-existing cross-feature imports. One (`rescue-detail` → `animal-follow`) is a documented
  deviation; three (`report-animal` → `home`, `rescue-cases`, `auth`) are pre-existing and not yet
  recorded as deviations.
- Backend module boundary: **healthy**, with one recorded exception — only `home` may reach
  `adoption`/`rescue`, and only through NestJS DI.
- Phantom `apps/frontend/admin` references: none. `config-service` treated as a service: none.

## Frontend

- i18n: **needs attention**. Locale parity holds — `check-locale-parity.mjs` reports de-DE 396 keys
  ok and zh-CN 395 keys ok — but the same run warns that `footer` and `rescueGuide` are each
  claimed by two files in each of the three locales, sharing one namespace.
- Known code defects: **needs attention** — 18 rows in
  [`features/README.md`](../features/README.md#known-defects-in-the-code), from `contactInfo` being
  collected and never persisted to 13 dead link targets that all land on `NotFound`. Each is
  documented at the point it occurs; they are accepted debt, tracked rather than hidden.
- Component duplication: one documented instance — `StrayCTA` is duplicated across `home` and
  `report-animal`, differing by one class. No repository-wide measurement exists.

## Backend

- API boundary: **healthy**. The gateway alone owns browser cookies and browser JWTs; downstream
  services read identity from `x-gateway-jwt` via `@InternalJwt()`. The trust model is written down
  in [`authentication-architecture.md`](../architecture/authentication-architecture.md) and enforced
  by the internal JWT guard.
- Lint: **medium risk** — 13 pre-existing lint errors (3 in `gateway`, 10 in `backend-core`) are
  carried as the documented baseline in `AGENTS.md`. The baseline works only because every run is
  diffed against it; an error added on top of it is a regression.

## Harness

- Skill dependency graph: **healthy**. `pnpm pi-check` exits 0 — 21/21 project skills, 0
  agent-private skills, 0 oversized `SKILL.md` (limit 250 lines, largest 208), 27 supporting files
  reachable, and a clean skill graph (30 nodes, 7 ordering edges).
- Layer separation: **healthy**. Skills hold capability, `policies/` holds the rules every workflow
  applies, `workflows/` holds ordering, `agents/` holds responsibility. `pi-check` fails on a skill that
  reaches into either process directory, on a verification lane that can write, on an agent that pins its
  own model, and on a dispatch to a lane name that no longer exists.
- Model registry: **healthy**. `.pi/config/models.yaml` assigns every one of the nine lanes a tier, and
  `.pi/settings.json` is rendered from it by `scripts/sync-model-tiers.mjs`; `pi-check` fails on drift.
  Every tier is `model: inherit`, because this repo pins no provider — the tiers carry `thinking` and the
  capability mapping, and pinning a provider later is one line per tier.
- Browser verification substrate: **healthy**. `e2e/smoke.spec.ts` proves the portal boots, mounts
  `#root`, and raises no uncaught exception, with only the portal up. A pass says nothing about a
  backend, and deeper journeys are the responsibility of the change that needs one.
- Documentation freshness: **needs attention**. `pnpm quality-check` counts 7 historical mentions of
  retired harness resources, each classified historical by a past-tense marker on its line or in the
  section heading above it. They are allowed, but they accumulate; the refactor that took this count
  from 26 deleted the two `retired-harness-corrections.md` references outright rather than rewording
  them.
- Duplicate rules: 2 candidates, reported as warnings by `pnpm quality-check` — the contract-change
  gate text carried by both implementation agents, and one design-philosophy sentence shared by the
  two system-architecture docs. Neither is a failure; both are drift risks to decide on.
- Model registry: none. `.pi/settings.json` carries only `thinking` tiers, and no model name is
  hardcoded in `.pi/` (see `.pi/README.md` § Model selection). This refactor deliberately does not
  introduce one.

## Pre-existing findings the doctor rules hit

Each line below is a hit that a review check returns against **the codebase rather than the change
under review**. They are recorded here so a review reports them once, marked pre-existing, instead of
re-reporting them on every diff that touches the file. Provenance: carried over from the checks that
first recorded them; re-run the named command to confirm before relying on one.

| Check                                     | Command                                                              | What it hits                                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backend-doctor R1 `console.log`           | `rg -n 'console\.log' apps/backend --glob '*.ts'`                    | `apps/backend/document-service/src/modules/email/email.service.ts` logs a caught error                                                                                                                                                                                                            |
| backend-doctor R2 / react-doctor S6 `any` | `rg -n ': any\b' apps/backend --glob '*.ts'`                         | the portal has zero `: any` outside tests, so any frontend hit is a regression                                                                                                                                                                                                                    |
| typescript-doctor T6 `enum`               | `rg -n '\benum\s+\w+' <changed files>`                               | `packages/frontend-core/src/api/types.ts:54` declares `export enum extraRequestHeader`                                                                                                                                                                                                            |
| boundary-doctor R1 cross-feature import   | the command in that rule                                             | `features/rescue-detail/components/VolunteerInfo.tsx` imports from `features/animal-follow/`; `features/report-animal/api/reportAnimal.mutations.ts` imports `homeQueryKeys` and `rescueCasesQueryKeys`; `features/report-animal/ReportAnimal.tsx` imports `useCurrentUser` from `features/auth/` |
| boundary-doctor R6 window navigation      | the command in that rule                                             | `apps/frontend/portal/src/layout/RootLayoutFooter.tsx` calls `window.location.assign('/')` — a ⚠️ Warning, not blocking                                                                                                                                                                           |
| style-doctor R4d inline `style={{}}`      | `rg -n 'style=\{\{' apps/frontend/portal/src --glob '*.tsx'`         | `features/home/components/AdoptablePetsSection.tsx:25` and `features/home/components/PetCard.tsx:27`, both `scrollSnap*`                                                                                                                                                                          |
| style-doctor R2 raw Tailwind colours      | the command in that rule                                             | `layout/RootLayoutFooter.tsx` (`text-brown-7`, `bg-white/10`, `hover:text-white`) and `features/home/components/PetCard.tsx:40`                                                                                                                                                                   |
| i18n-doctor R1 hardcoded strings          | the command in that rule                                             | the portal ships CJK strings inline in several components rather than through `t()`                                                                                                                                                                                                               |
| react-doctor Step 0                       | `find apps/frontend -type d -name src -not -path '*/node_modules/*'` | `apps/frontend/portal` is the only frontend app; there is no `apps/frontend/admin`                                                                                                                                                                                                                |
| `pnpm test:e2e`                           | `pnpm test:e2e`                                                      | collected zero specs until the browser substrate landed; `e2e/smoke.spec.ts` now proves the shell mounts, and still says nothing about a backend                                                                                                                                                  |

Accepted exceptions that are **not** findings are stated inside the rule that hits them, so the next
reviewer does not re-litigate them: `ScrollToTop.tsx` and `QueryProvider.tsx` in boundary-doctor R6,
and the type-only sharing named in boundary-doctor R1.

## Quality invariants

Mechanical, and exit-0 on a clean tree:

- `pnpm architecture-check` — package, feature, and service boundaries.
- `pnpm check:links` — markdown links and anchors.
- `pnpm pi-check` — harness and skill integrity.
- `pnpm token-check` — design tokens.
- `pnpm quality-check` — orphaned docs, stale paths, duplicate-rule candidates (warnings).
- `pnpm lint` — must stay at the 13-error baseline.

## Cleanup priorities

1. Record the three `report-animal` cross-feature imports as documented deviations, or fix them.
2. Work the 18 known code defects, starting with `contactInfo` never persisted — it is silent data
   loss on every report.
3. Retire the 13 lint errors, or record each as accepted debt with a reason.
4. Decide on the 2 duplicate-rule candidates — extract to a shared reference, or delete one copy.
5. Disambiguate the 2 i18n namespace collisions, present in all three locales.

## Future work

Future work: centralized model registry
