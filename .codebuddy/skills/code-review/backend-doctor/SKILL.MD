---
name: code-review/backend-doctor
description: >
  Backend code quality detection. Covers: console.log in backend (forbidden, use Logger service),
  TypeScript any type (forbidden). All Blocking.
  Trigger: backend NestJS console.log any type backend code quality.
version: 3.0
---

# backend-doctor — Backend Code Quality

## Responsibility

Detect common quality issues in backend code, targeting NestJS projects.

## Step 0: Discover Backend Source Directories

Dynamically locate backend source directories so rules are project-agnostic:

```
search_file: pattern="**/main.ts" target_directory=<workspace_root> recursive=true
```

From results, extract the parent directories (e.g., `apps/backend/app-name/src/`). These are the backend source roots. Use them as search paths for Rules 1–2.

Alternatively, search across the entire workspace and filter by backend-specific indicators (`@nestjs/*` imports, `@Module()` decorators).

## Rules

### Rule 1: console.log in backend source

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Backend source directories discovered in Step 0
- **Exclude**: `node_modules/`, `dist/`, `*.spec.ts`, `*.test.ts`
- **Pattern**: `console\.log`
- **File Types**: `*.ts`
- **Explanation**: `console.log` is forbidden in backend production code. Use the NestJS Logger service (`private readonly logger = new Logger(ClassName.name)`) or a structured logging solution instead. Console output is uncontrolled, cannot be filtered by log level, and bypasses the logging infrastructure.
- **search_content invocation**:
  ```
  pattern: "console\\.log"
  path: <backend_src_dirs_from_step0>
  type: "ts"
  outputMode: "content"
  ```

### Rule 2: TypeScript `any` type in backend

- **Severity**: ❌ Blocking
- **Tool**: `search_content`
- **Path**: Backend source directories discovered in Step 0
- **Exclude**: `node_modules/`, `dist/`, `*.spec.ts`, `*.test.ts`
- **Pattern**: `: any`
- **File Types**: `*.ts`
- **Explanation**: The `any` type disables all type checking. In backend code, where data flows through multiple layers (controller → service → repository), untyped data causes runtime errors that are hard to trace. Use `unknown`, proper DTO interfaces, or generics instead.
- **search_content invocation**:
  ```
  pattern: ": any"
  path: <backend_src_dirs_from_step0>
  type: "ts"
  outputMode: "content"
  ```

## Execution

1. Run Step 0 first to discover backend source directories.
2. Run both `search_content` calls in PARALLEL on the discovered paths.
3. All violations are ❌ Blocking.
4. Report: list each violation with filePath, lineNumber, matched content, and which rule it violates.
