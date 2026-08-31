---
name: code-review/react-doctor
description: >
  React code quality validation. PRIMARY: runs npx react-doctor@0.9.12 (security, performance,
  correctness, architecture, a11y, bundle size). SUPPLEMENTARY: project-specific convention
  checks (Redux typed hooks, TanStack Query key factories, React Hook Form, console.log, any type).
  Trigger: React code quality scan triage cleanup anti-pattern.
version: '4.0.0'
---

# react-doctor — React Code Quality Validation

## Responsibility

Two-layer validation for React code:

1. **Primary**: `npx react-doctor@0.9.12` — the canonical tool for security, performance, correctness, architecture, accessibility, and bundle size.
2. **Supplementary**: manual `search_content` rules for project-specific conventions the generic CLI cannot know (Redux patterns, TanStack Query key factories, RHF enforcement).

**Version is pinned to `0.9.12`** — the SAME version CI runs (`.github/workflows/react-doctor.yml` sets `version: "0.9.12"` on `millionco/react-doctor@v2`).

Never use `@latest`: it drifts ahead of the pin and the local scan stops agreeing with CI. The gap is not theoretical — the skill previously claimed `0.7.6` while CI ran `0.9.12`, which is **17 releases of rules CI reported and the local review could not see** (this is why PR #70's findings were missed).

Bumping the version requires explicit approval **AND** a matching bump in the workflow. Both sides move together or neither does.

## Layer 1: Official React Doctor CLI

### Mandatory flags

| Flag                  | Why                                                                                                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-y`                  | Skips the interactive project prompt and scans **all** workspace projects. Without it the CLI prompts, and in an agent context it falls back to a subset — `apps/frontend/portal` and `apps/frontend/admin` get silently skipped. **This is the single most common cause of "doctor found nothing".** |
| `--verbose`           | Shows affected files and line numbers per rule.                                                                                                                                                                                                                                                       |
| `--scope changed`     | Only issues introduced vs the base branch — the same delta CI comments on.                                                                                                                                                                                                                            |
| `--include-untracked` | With `--scope changed`, also covers new/uncommitted files (the normal state mid-review).                                                                                                                                                                                                              |

### Regression check (default for code review)

```bash
npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked
```

If the score dropped vs the base branch, fix the regressions before committing.

### Full codebase scan (only when explicitly asked for)

```bash
npx react-doctor@0.9.12 -y --verbose
```

### Targeting specific apps

```bash
npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked --project apps/frontend/portal,apps/frontend/admin
```

`--project` accepts workspace names or directory paths (comma-separated) and overrides the `projects` config field. Use it to force coverage when the detected project list looks short.

### /doctor — full local triage workflow

When the user types `/doctor`, says "run react doctor", or asks for a full triage:

```bash
curl --fail --silent --show-error \
  --header 'Cache-Control: no-cache' \
  https://www.react.doctor/prompts/react-doctor-agent.md
```

The playbook is the single source of truth — a scan → filter → triage → fix → validate loop that edits the working tree directly (never commits, never opens PRs). Follow every step in the fetched playbook.

Pair it with per-rule prompts at `https://www.react.doctor/prompts/rules/<plugin>/<rule>.md` (fetched on demand inside the playbook).

### Configuring or explaining rules

When the user wants to understand / disable / tune a rule:

```bash
npx react-doctor@0.9.12 rules explain <rule>
npx react-doctor@0.9.12 rules disable|set|category|ignore-tag …
```

| Flag                  | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `-y`                  | Skip prompts, scan all workspace projects (required in agent context)   |
| `--verbose`           | Show affected files and line numbers per rule                           |
| `--scope changed`     | Only issues introduced vs base branch                                   |
| `--scope lines`       | Only issues whose source spans touch changed lines                      |
| `--include-untracked` | With files/changed/lines scope, also scan ordinary untracked files      |
| `--project <name>`    | Select workspace names or directory paths (comma-separated)             |
| `--base <ref>`        | Base git ref for files/changed/lines scope (auto-detected when omitted) |
| `--score`             | Output only the numeric score                                           |

---

## Layer 2: Project-Specific Convention Checks

These rules enforce PawHaven conventions that the generic React Doctor CLI does not cover.

### Step 0: Discover Frontend Source & Store Directories

```
search_file: pattern="**/App.tsx" target_directory=<workspace_root>/apps/ recursive=true
search_file: pattern="**/reduxHooks.ts" target_directory=<workspace_root>/apps/ recursive=true
```

From results, derive frontend `src/` directories and the Redux `store/` directory.

### Rule S1: Server data in Redux slice

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Redux store directory (from Step 0)
- **Pattern**: `state\.\w*Response|state\.\w*List|state\.\w*Data`
- **File Types**: `*.ts`
- **Explanation**: Server data belongs in TanStack Query, not Redux. Redux is for client-only state (UI state, auth status, preferences).

### Rule S2: Raw useDispatch / useSelector (must use typed hooks)

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Frontend src directories (from Step 0)
- **Pattern**: `useSelector|useDispatch`
- **File Types**: `*.tsx`, `*.ts`
- **Exclude**: `reduxHooks.ts` (the file defining typed wrappers)
- **Explanation**: Never use bare `useSelector`/`useDispatch`. Always use `useAppSelector`/`useAppDispatch`.

### Rule S3: Raw string query keys (must use query key factory)

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Frontend src directories (from Step 0)
- **Pattern**: `queryKey.*\[.*'`
- **File Types**: `*.tsx`, `*.ts`
- **Explanation**: TanStack Query must use a query key factory. `queryKey: ['pets']` → `queryKey: petKeys.list()`.

### Rule S4: useState for form values (must use React Hook Form register)

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Frontend src directories (from Step 0)
- **Pattern**: `useState.*form|useState.*input|useState.*value`
- **File Types**: `*.tsx`
- **Explanation**: Forms must use RHF's `register` (uncontrolled). `useState` per field causes unnecessary re-renders.

### Rule S5: console.log in frontend source

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Frontend src directories (from Step 0)
- **Pattern**: `console\.log`
- **File Types**: `*.ts`, `*.tsx`
- **Exclude**: `*.test.*`, `*.spec.*`

### Rule S6: TypeScript `any` type in frontend

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Frontend src directories (from Step 0)
- **Pattern**: `: any`
- **File Types**: `*.ts`, `*.tsx`
- **Exclude**: `*.test.*`, `*.spec.*`
- **Explanation**: Use `unknown`, a proper interface, or a generic instead.

## Execution

1. Run Step 0 to discover frontend/src directories.
2. **Layer 1**: Run `npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked`. ALL issues are ❌ Blocking.
   - Verify the reported project list includes `apps/frontend/portal` and `apps/frontend/admin` when the change touches them. If not, re-run with `--project` — an incomplete project list invalidates the scan.
3. **Layer 2**: Run Rules S1–S6 in PARALLEL on the discovered paths. All are ❌ Blocking.
4. Report: combines Layer 1 + Layer 2 findings, organized by severity and source.

### Evidence requirement (mandatory)

Paste the **raw react-doctor output** — the exact command, the project list it scanned, and the findings — into the review report.

A review that claims "react-doctor: clean" **without** that raw output is INVALID. The Step Completion Checklist (dispatcher §STEP 5b) must carry this evidence; a missing scan is treated as a skipped step, not a passing one.

This exists because the step is easy to skip: the scan is a prompt-level instruction, not automation. On PR #70 it was never executed, so CI's findings had no local counterpart.

## Related

- React standards: [react skill](../../frontend/react/SKILL.MD)
- Companion doctors: [style-doctor](../style-doctor/SKILL.MD) · [i18n-doctor](../i18n-doctor/SKILL.MD) · [typecheck-doctor](../typecheck-doctor/SKILL.MD)
- State rules: [redux](../../frontend/redux/SKILL.MD) · [react-query](../../frontend/react-query/SKILL.MD) · [react-hook-form](../../frontend/react-hook-form/SKILL.MD)
- CI counterpart: `.github/workflows/react-doctor.yml` (must stay on the same pinned version)
