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

- Canonical source: **healthy**. `harness-core/` holds 9 capability bundles, 9 agents, 16 skills, 12
  workflows plus 1 pattern, and 4 rules. `pnpm harness:check` exits 0 — no duplicate component name,
  no dangling grant or reference, no runtime field or provider model name inside canonical source, and
  no orphan skill.
- Layer separation: **healthy**. Capabilities hold capability, `rules/` holds the invariants every
  workflow applies, `workflows/` holds ordering, `agents/` holds responsibility, `adapters/` holds
  runtime translation. `validate-core` fails on a skill that reaches into a workflow or at an agent, on
  a read-only agent that could write, on an agent that declares its own model, and on a workflow that
  points into a generated runtime directory.
- Runtime boundary: **healthy**. `.pi/` is generated output. `pnpm harness:generate` rebuilds it
  directory-for-directory from `harness-core/`, and `pnpm harness:check:generated` fails on missing,
  stale, or orphaned output. `pnpm pi:check` runs Pi's own `loadSkills` and `loadPromptTemplates`
  against it: 16 project skills, 12 project prompts, 9 agents, 9 rendered tiers, zero diagnostics.
- Model policy: **healthy**. `harness-core/config/model-policy.yaml` assigns each agent one of three
  abstract tiers (`fast`, `balanced`, `strong`), and the adapter renders them into the runtime's
  thinking levels. Every tier is `model: inherit`, because this repo pins no provider — pinning one
  later is one line per tier in the adapter, and no agent changes.
- Links: **healthy**. 718 relative links and anchors across `harness-core/`, `AGENTS.md`, `docs/`, and
  both root READMEs resolve, with an empty `KNOWN_BROKEN` list.
- Browser verification substrate: **healthy**. `e2e/smoke.spec.ts` proves the portal boots, mounts
  `#root`, and raises no uncaught exception, with only the portal up. A pass says nothing about a
  backend, and deeper journeys are the responsibility of the change that needs one.
- Documentation freshness: **needs attention**. `pnpm quality-check` counts historical mentions of
  retired harness resources, each classified historical by a past-tense marker on its line or in the
  section heading above it. They are allowed, but they accumulate; delete them rather than rewording.
- Duplicate rules: 2 candidates, reported as warnings by `pnpm quality-check` — the contract-change
  gate text carried by both implementation agents, and one design-philosophy sentence shared by the
  two system-architecture docs. Neither is a failure; both are drift risks to decide on.

## Pre-existing findings the review checks hit

Each line below is a hit that a review dimension returns against **the codebase rather than the change
under review**. They are recorded here so a review reports them once, marked pre-existing, instead of
re-reporting them on every diff that touches the file. Provenance: carried over from the checks that
first recorded them; re-run the named command to confirm before relying on one.

The check ids are the ones `code-review/scripts/run-project-checks.mjs` prints.

| Check                        | Dimension           | Command                                                                                                                     | What it hits                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BE-CONSOLE` `console.log`   | backend             | `rg -n 'console\.log' apps/backend --glob '*.ts'`                                                                           | `apps/backend/document-service/src/modules/email/email.service.ts` logs a caught error                                                                                                                                                                                                            |
| `BE-ANY` / `FE-` `: any`     | backend, TypeScript | `rg -n ': any\b' apps/backend --glob '*.ts'`                                                                                | the portal has zero `: any` outside tests, so any frontend hit is a regression                                                                                                                                                                                                                    |
| T6 `enum`                    | TypeScript          | `rg -n '\benum\s+\w+' <changed files>`                                                                                      | `packages/frontend-core/src/api/types.ts:54` declares `export enum extraRequestHeader`                                                                                                                                                                                                            |
| cross-feature import         | architecture        | the command in [architecture.md](../../harness-core/capabilities/code-review/skills/code-review/references/architecture.md) | `features/rescue-detail/components/VolunteerInfo.tsx` imports from `features/animal-follow/`; `features/report-animal/api/reportAnimal.mutations.ts` imports `homeQueryKeys` and `rescueCasesQueryKeys`; `features/report-animal/ReportAnimal.tsx` imports `useCurrentUser` from `features/auth/` |
| window navigation            | architecture        | the command in [architecture.md](../../harness-core/capabilities/code-review/skills/code-review/references/architecture.md) | `apps/frontend/portal/src/layout/RootLayoutFooter.tsx` calls `window.location.assign('/')` — a `MINOR`, not blocking                                                                                                                                                                              |
| inline `style={{}}`          | frontend            | `rg -n 'style=\{\{' apps/frontend/portal/src --glob '*.tsx'`                                                                | `features/home/components/AdoptablePetsSection.tsx:25` and `features/home/components/PetCard.tsx:27`, both `scrollSnap*`                                                                                                                                                                          |
| raw Tailwind colours         | frontend            | the command in [frontend.md](../../harness-core/capabilities/code-review/skills/code-review/references/frontend.md)         | `layout/RootLayoutFooter.tsx` (`text-brown-7`, `bg-white/10`, `hover:text-white`) and `features/home/components/PetCard.tsx:40`                                                                                                                                                                   |
| hardcoded strings            | frontend            | the command in [frontend.md](../../harness-core/capabilities/code-review/skills/code-review/references/frontend.md)         | the portal ships CJK strings inline in several components rather than through `t()`                                                                                                                                                                                                               |
| React gate project discovery | frontend            | `find apps/frontend -type d -name src -not -path '*/node_modules/*'`                                                        | `apps/frontend/portal` is the only frontend app; there is no `apps/frontend/admin`                                                                                                                                                                                                                |
| `pnpm test:e2e`              | testing             | `pnpm test:e2e`                                                                                                             | collected zero specs until the browser substrate landed; `e2e/smoke.spec.ts` now proves the shell mounts, and still says nothing about a backend                                                                                                                                                  |

Accepted exceptions that are **not** findings are stated inside the rule that hits them, so the next
reviewer does not re-litigate them: `ScrollToTop.tsx` and `QueryProvider.tsx` in the raw-navigation
rule, and the type-only sharing named in the cross-feature rule.

## Quality invariants

Mechanical, and exit-0 on a clean tree:

- `pnpm architecture-check` — package, feature, and service boundaries.
- `pnpm harness:verify` — canonical source, generated output, links, and the Pi runtime loader.
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

**A second runtime adapter.** `harness-core/adapters/README.md` records Pi as implemented and Codex,
Claude Code, and Cursor as architecture-ready and unimplemented. Each needs a real capability and
compatibility document before it exists; a placeholder directory is a promise a reader will believe.

**A `security` capability.** Security is currently a review dimension. If it grows its own agents,
commands, and knowledge, it graduates to a capability bundle — and at that point a dedicated security
reviewer becomes the parallel-review shape the other dimensions use.
