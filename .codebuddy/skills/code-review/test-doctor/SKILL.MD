---
name: code-review/test-doctor
description: >
  Test completeness & quality validation. Runs on EVERY review regardless of scope
  (frontend / backend / full-stack). Discovers changed files, verifies each behavior
  change has a corresponding test (existence), checks assertions are meaningful,
  executes the affected test suites, and validates project test conventions.
  Missing coverage is Blocking when the governing workflow mandates tests; otherwise Warning.
  Trigger: test coverage test file missing tests assertions test execution vitest jest test conventions.
version: 1.0
---

# test-doctor — Test Completeness & Quality

## Responsibility

Ensure every reviewed change is backed by tests that (a) exist, (b) assert the changed
behavior, (c) pass when run, and (d) follow project test conventions.

This doctor runs **on every review, every scope** — frontend, backend and full-stack
alike. It is NOT gated on the figma gate, and it is NOT optional: if it is missing from
a review's loaded sub-skills, the orchestrator must load it before completing Step 3.

## Step 0: Discover Changed Files and Their Test Files

1. Get the set of changed source files for this review:
   - PR / branch review: the diff between base and head, e.g.
     ```
     execute_command: git --no-pager diff --name-only <base>...<head>
     ```
   - Local working-tree review:
     ```
     execute_command: git --no-pager diff --name-only HEAD~1
     execute_command: git status --short
     ```
2. From the changed files, derive each affected package (nearest `package.json`) and its
   test script.
3. Locate existing test files for the affected packages:
   ```
   search_file: pattern="**/*.test.*" target_directory=<affected_package_src> recursive=true
   search_file: pattern="**/*.spec.*" target_directory=<affected_package_src> recursive=true
   ```
4. Build and **output the mapping**: `changed file → expected test file → existing test file (or MISSING)`.
   This prevents silent empty scans and documents coverage explicitly.

## Rules

### Rule 1: Test existence

- **Severity**: ⚠️ Warning; ❌ Blocking when the governing workflow mandates tests
  (feature-development, bug-fix, refactoring, perf-issue)
- **Tool**: `search_file` / `read_file`
- **Explanation**: Every changed file that adds or modifies behavior must be covered by a
  test file. Pure config / type / design-token changes may be exempt — state why.
- **Validation**: For each changed source file, check whether a sibling `*.test.*` /
  `*.spec.*` file exists. Missing coverage is a finding with the changed file's path.

### Rule 2: Meaningful assertions

- **Severity**: ⚠️ Warning; ❌ Blocking when tests are required by the workflow
- **Tool**: `read_file`
- **Path**: discovered test files
- **Explanation**: Tests must assert the changed behavior — required-field blocking, DTO
  shape, error messages, i18n key resolution, API contract — not trivial/no-op assertions
  (e.g. `expect(true).toBe(true)`, or render-only smoke tests with no assertions on the
  behavior under review).

### Rule 3: Test execution

- **Severity**: ❌ Blocking
- **Tool**: `execute_command`
- **Command**: run the affected suites from the workspace root:
  ```bash
  pnpm --filter <packageName> test -- --run <test_file>
  ```
  If the change spans multiple packages, run each affected package's suites.
- **Validation**: All affected suites must pass. Any failing test is ❌ Blocking. Known
  pre-existing unrelated failures must be reported as such — never papered over or
  silently accepted.

### Rule 4: Project test conventions

- **Severity**: ⚠️ Warning; ❌ Blocking when the violation makes tests flaky/broken
- **Tool**: `read_file` / `search_content`
- **Path**: discovered test files
- **Explanation**: Follow the project's test conventions (PawHaven):
  - Portal feature tests mock `@pawhaven/ui` — do NOT `importOriginal` the ui barrel (it
    pulls lottie-react into jsdom and crashes).
  - No lottie stubs/aliases (lottie `fillStyle` jsdom failures are a known pre-existing
    issue — report, do NOT fix).
  - Import `@testing-library/jest-dom/vitest` for DOM matchers.
  - No hardcoded CJK user-visible strings that should be i18n keys.
  - Per-file `// @vitest-environment jsdom` pragma where the DOM is used.

## Execution

1. Run Step 0 and output the changed-file → test-file mapping.
2. Run Rules 1–4 in PARALLEL where independent (existence search, assertion review,
   suite execution, convention scan).
3. Classify each finding: ❌ Blocking / ⚠️ Warning, with filePath + lineNumber.
4. Report: mapping + findings. State explicitly that **test-doctor ran for this review**
   — it is mandatory on every review.

## Related

- Orchestrator: [code-review](../SKILL.MD)
- Companion doctors: [typecheck-doctor](../typecheck-doctor/SKILL.MD) · [backend-doctor](../backend-doctor/SKILL.MD)
