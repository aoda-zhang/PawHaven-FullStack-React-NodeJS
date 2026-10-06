---
name: react-doctor
description: >
  React code quality validation. PRIMARY: runs npx react-doctor@0.9.12 (security, performance,
  correctness, architecture, a11y, bundle size). SUPPLEMENTARY: project-specific convention
  checks (typed Redux hooks, TanStack Query key factories, React Hook Form, console.log, any type).
  Trigger: React code quality scan triage cleanup anti-pattern.
---

# react-doctor — React Code Quality Validation

## Responsibility

Two-layer validation for React code:

1. **Primary**: `npx react-doctor@0.9.12` — the canonical tool for security, performance, correctness, architecture, accessibility, and bundle size.
2. **Supplementary**: manual `rg` rules for project-specific conventions the generic CLI cannot know (typed Redux hooks, TanStack Query key factories, RHF enforcement).

**Version is pinned to `0.9.12`** — the SAME version CI runs (`.github/workflows/react-doctor.yml` sets `version: "0.9.12"` on `millionco/react-doctor@v2`).

Never use `@latest`: it drifts ahead of the pin and the local scan stops agreeing with CI. The gap is not theoretical — the skill previously claimed `0.7.6` while CI ran `0.9.12`, which is **17 releases of rules CI reported and the local review could not see** (this is why PR #70's findings were missed).

Bumping the version requires explicit approval **AND** a matching bump in the workflow. Both sides move together or neither does.

## Layer 1: Official React Doctor CLI

Run the regression check. If the score dropped vs the base branch, fix the regressions before
committing.

```bash
npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked
```

`-y` is not optional. Without it the CLI prompts for a project and an agent context silently
scans a subset, which is the single most common cause of "doctor found nothing".

→ [references/cli-reference.md](./references/cli-reference.md) — the full flag table, the
full-scan and `--project` variants, the `/doctor` playbook fetch, and `rules explain`.

---

## Layer 2: Project-Specific Convention Checks

These rules enforce PawHaven conventions that the generic React Doctor CLI does not cover.

### Step 0: Discover the frontend source and store directories

```bash
find apps/frontend -type d -name src -not -path '*/node_modules/*'
find apps/frontend -name 'reduxHooks.ts' -not -path '*/node_modules/*'
```

`apps/frontend/portal` is the only frontend app in this repo. An earlier version of this skill
required the scan to cover `apps/frontend/admin` as well, and told the reviewer to re-run with
`--project apps/frontend/portal,apps/frontend/admin` when it was missing from the list. **No admin app
exists** — that directory is not in the workspace, and asking for it turns a clean scan into a
false finding. If a second frontend app is ever added, discover it here rather than hardcoding it.

From the results, derive the frontend `src/` root and the Redux store directory.

### Rule S1: Server data in Redux slice

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n 'state\.\w*(Response|List|Data)' apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'
  ```
- **Explanation**: Server data belongs in TanStack Query, not Redux. Redux is for client-only state
  (UI state, auth status, preferences). The registered slice is `store/globalReducer.ts`, holding
  `profile`, `locale`, `isSysMaintain` — if server data shows up there it is a finding.

### Rule S2: Raw useDispatch / useSelector (must use a typed hook)

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n 'useSelector|useDispatch' apps/frontend/portal/src --glob '*.ts' --glob '*.tsx' \
    --glob '!**/reduxHooks.ts'
  ```
- **Explanation**: Never use bare `useSelector` / `useDispatch` from `react-redux` outside
  `src/hooks/reduxHooks.ts`. The accepted typed hooks and their exact names are in the shared
  `frontend` skill — [State access](../../frontend/SKILL.md#state-access--the-real-names).
  Read them there rather than from this rule, so the check and the vocabulary cannot drift.

### Rule S3: Raw string query keys (must use query key factory)

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n "queryKey.*\[[^\]]*['\"]" apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'
  ```
- **Explanation**: TanStack Query must use a query key factory. `queryKey: ['pets']` →
  `queryKey: petKeys.list()`. Every feature with an `api/` directory has a `<name>.queryKeys.ts`.

### Rule S4: useState for form values (must use React Hook Form register)

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n 'useState.*(form|input|value)' apps/frontend/portal/src --glob '*.tsx'
  ```
- **Explanation**: Forms must use RHF's `register` (uncontrolled). `useState` per field causes
  unnecessary re-renders. The reporting form is the reference: `features/report-animal/` uses
  `useForm` in the page and `useFormContext` in its sections.

### Rule S5: console.log in frontend source

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n 'console\.log' apps/frontend/portal/src --glob '*.ts' --glob '*.tsx' \
    --glob '!*.test.*' --glob '!*.spec.*'
  ```

### Rule S6: TypeScript `any` type in frontend

- **Severity**: ❌ Blocking
- **Command**:
  ```bash
  rg -n ': any\b' apps/frontend/portal/src --glob '*.ts' --glob '*.tsx' \
    --glob '!*.test.*' --glob '!*.spec.*'
  ```
- **Explanation**: Use `unknown`, a proper interface, or a generic instead. The portal currently has
  zero `: any` outside tests, so any hit is a regression.

## Execution

1. Run Step 0 to discover the frontend `src/` and store directories.
2. **Layer 1**: Run `npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked`. ALL issues are ❌ Blocking.
   - Verify the reported project list includes `apps/frontend/portal` when the change touches it. If
     not, re-run with `--project apps/frontend/portal` — an incomplete project list invalidates the
     scan.
3. **Layer 2**: Run Rules S1–S6 on the discovered paths. All are ❌ Blocking.
4. Report: combines Layer 1 + Layer 2 findings, organized by severity and source.

### Evidence requirement (mandatory)

Paste the **raw react-doctor output** — the exact command, the project list it scanned, and the findings — into the review report.

A review that claims "react-doctor: clean" **without** that raw output is INVALID. The review's verification block must carry this evidence; a missing scan is a skipped step, not a passing one.

This exists because the step is easy to skip: the scan is a prompt-level instruction, not automation. On PR #70 it was never executed, so CI's findings had no local counterpart.

## Related

- React standards: [react skill](../../react/SKILL.md)
- Companion doctors: [style-doctor](../style-doctor/SKILL.md) · [i18n-doctor](../i18n-doctor/SKILL.md) · [typecheck-doctor](../../code-review/typecheck-doctor/SKILL.md)
- State rules: [redux](../../redux/SKILL.md) · [react-query](../../react-query/SKILL.md) · [react-hook-form](../../react-hook-form/SKILL.md)
- CI counterpart: `.github/workflows/react-doctor.yml` (must stay on the same pinned version)
