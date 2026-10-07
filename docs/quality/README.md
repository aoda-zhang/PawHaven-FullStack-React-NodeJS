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

- Skill dependency graph: **healthy**. `pnpm pi-check` exits 0 — 19/19 project skills, 0
  agent-private skills, and a clean skill graph (28 nodes, 9 ordering edges).
- Documentation freshness: **medium risk**. `pnpm quality-check` counts 26 historical mentions of
  retired harness resources, each classified historical by a past-tense marker on its line or in
  the section heading above it. They are allowed, but they
  accumulate: every historical mention is a sentence a future reader must re-classify.
- Duplicate rules: 2 candidates, reported as warnings by `pnpm quality-check` — the contract-change
  gate text carried by both implementation agents, and one design-philosophy sentence shared by the
  two system-architecture docs. Neither is a failure; both are drift risks to decide on.
- Model registry: none. `.pi/settings.json` carries only `thinking` tiers, and no model name is
  hardcoded in `.pi/` (see `.pi/README.md` § Model selection). This refactor deliberately does not
  introduce one.

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
