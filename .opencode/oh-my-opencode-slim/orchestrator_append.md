## PawHaven gates that do not work

Measured today. `AGENTS.md` does not reflect any of this — this append exists because it cannot.

- **`pnpm lint` exits non-zero from 13 pre-existing errors** — 3 `@pawhaven/gateway` + 10
  `@pawhaven/backend-core`. `AGENTS.md:213` still says **14**. Run `--continue`, or turbo aborts on
  the first package and you never see backend-core. A non-zero exit proves nothing; diff against
  baseline.
- **`pnpm test:e2e` is not a gate.** `playwright.config.ts` sets `testDir: './e2e'`, which is
  empty — zero specs. Playwright exits **1** with `No tests found`.
- **`pnpm token-check` does not run.** `package.json:22` points at
  `packages/design-system/scripts/token-check.cjs`, which is not on disk — `scripts/` holds
  `build-tokens.css` and `build-tokens.mjs`. `AGENTS.md` says three separate times that this
  enforces tokens; it does not. `packages/design-system/src/tokens/*.css` is the authority and
  nothing mechanically checks it.

Everything else you need is in `AGENTS.md` and the `project-rules` skill, both already in your
context. This file carries only what neither of them knows.
