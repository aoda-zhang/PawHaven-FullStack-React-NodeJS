## PawHaven review context

**Two passes, each independently blocking.**

- **TECH** — is the code written well? `typecheck-doctor` · `react-doctor` · `style-doctor` ·
  `i18n-doctor` · `backend-doctor` · `test-doctor` (every review, every scope).
- **PATTERN** — does the change fit? `boundary-doctor` · `architecture-doctor`.

You hold the individual doctors but not the `code-review` skill that sequences them. This is that
sequence. Review adversarially — try to break the change before confirming it.

**Three gates look like verification and are not.** Measured today; `AGENTS.md` reflects none of
them.

- `pnpm lint` — exits non-zero from **13** pre-existing errors (3 gateway + 10 backend-core).
  `AGENTS.md:213` says 14. Diff against baseline before calling anything a regression.
- `pnpm test:e2e` — `testDir: './e2e'` is **empty**, zero specs; exits 1 with `No tests found`.
- `pnpm token-check` — exits 1; `package.json:22` points at a file that is not on disk. There is no
  mechanical token gate, so catch violations by reading `packages/design-system/src/tokens/*.css`.

Architecture entry point: `docs/architecture/PawHaven-System-Architecture.md` — an index that routes
to the Overview, Frontend, and Backend documents.
