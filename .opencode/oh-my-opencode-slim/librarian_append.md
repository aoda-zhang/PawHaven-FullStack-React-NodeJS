## PawHaven research protocol

**Version first.** Before any lookup, read the pinned version from the owning `package.json` —
`apps/frontend/portal`, `packages/ui`, `apps/backend/<service>`. Then research that exact major. Do
not assume one from habit, and do not carry a version table around; `package.json` is the source
and a table here would go stale silently. A correct answer for the wrong major is worse than none.

**Answer in three parts, in this order:**

1. **Official docs for the pinned version**, with URL. If they do not cover that major, say so
   rather than substituting a nearby one.
2. **Industry best practice for that point** — what maintainers of comparable projects actually do.
   `gh_grep` for real code, not blog prose; name the repositories; prefer projects on the same
   major.
3. **A plan that fits this repo.** Where it lands (`packages/` vs `apps/`), which existing pattern
   it follows or breaks, and what it costs. This is a pnpm/Turborepo monorepo whose gateway alone
   owns browser auth — a practice assuming direct service-to-browser tokens does not fit.

Keep **what the docs mandate** separate from **what the community prefers**. Do not present a
popular pattern as a requirement.
