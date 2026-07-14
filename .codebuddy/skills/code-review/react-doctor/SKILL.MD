---
name: code-review/react-doctor
description: >
  React code quality validation. PRIMARY: runs npx react-doctor@0.7.6 (security, performance,
  correctness, architecture, a11y, bundle size). SUPPLEMENTARY: project-specific convention
  checks (Redux typed hooks, TanStack Query key factories, React Hook Form, console.log, any type).
  Trigger: React code quality scan triage cleanup anti-pattern.
version: "3.2.0"
---

# react-doctor — React Code Quality Validation

## Responsibility

Two-layer validation for React code:

1. **Primary**: `npx react-doctor@0.7.6` — the canonical tool for security, performance, correctness, architecture, accessibility, and bundle size.
2. **Supplementary**: manual `search_content` rules for project-specific conventions the generic CLI cannot know (Redux patterns, TanStack Query key factories, RHF enforcement).

**Version is pinned** to avoid `latest` instability. Do not change to `latest` without explicit approval.

## Layer 1: Official React Doctor CLI

### For regression check (after finishing a feature / bugfix)

```bash
npx react-doctor@latest --verbose --scope changed
```

If the score dropped vs the base branch, fix the regressions before committing.

### For full codebase scan

```bash
npx react-doctor@latest --verbose
```

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
npx react-doctor@latest rules explain <rule>
npx react-doctor@latest rules disable|set|category|ignore-tag …
```

| Flag              | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `--verbose`       | Show affected files and line numbers per rule     |
| `--scope changed` | Only issues introduced vs base branch             |
| `--scope lines`   | Only issues on changed lines                      |
| `--score`         | Output only the numeric score                     |

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
2. **Layer 1**: Run `npx react-doctor@latest --verbose`. ALL issues are ❌ Blocking.
3. **Layer 2**: Run Rules S1–S6 in PARALLEL on the discovered paths. All are ❌ Blocking.
4. Report: combines Layer 1 + Layer 2 findings, organized by severity and source.
