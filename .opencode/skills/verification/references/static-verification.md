# Static Verification Reference

Load for typecheck, lint, architecture checks, and build verification. Use the shared rules in `verification` skill for evidence and status.

## Static-specific checks

- Typecheck: `tsc --noEmit` or equivalent; report exact errors with file:line
- Lint: ESLint, stylelint, or project linters; separate style from correctness rules
- Architecture checks: import boundaries, circular deps, layer violations, banned patterns
- Build: production build succeeds; artifact size, chunk analysis, missing assets

## Execution

Run the project's configured scripts (e.g., `pnpm typecheck`, `pnpm lint`, `pnpm build`). Do not add flags that bypass project gates.

Report each check separately from behavioral tests. A passing static check does not prove runtime behavior.
