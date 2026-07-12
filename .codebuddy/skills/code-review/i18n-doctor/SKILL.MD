---
name: code-review/i18n-doctor
description: >
  Internationalization compliance detection. Scans JSX for hardcoded English text (missing t() function),
  ensuring all user-visible text goes through i18next translation. Technical attributes (URLs, test IDs) are exempt.
  Trigger: i18n internationalization hardcoded string t() translation locale.
version: 3.0
---

# i18n-doctor — Internationalization Compliance

## Responsibility

Ensure all user-visible text uses the `t()` translation function from react-i18next. No hardcoded strings in JSX.

## Step 0: Discover Frontend Source Directories

Dynamically locate frontend source directories so rules are project-agnostic:

```
search_file: pattern="**/i18n.ts" target_directory=<workspace_root> recursive=true
```

From results, extract the parent project directories (e.g., `apps/<project>/src/`). These are the frontend source roots where `t()` is expected. Use them as search paths for Rule 1.

If no `i18n.ts` file is found, search `.tsx` files across the workspace under `apps/` to locate frontend source directories.

## Rules

### Rule 1: Hardcoded English text in JSX

- **Severity**: ⚠️ Warning
- **Tool**: `search_content`
- **Path**: Frontend source directories discovered in Step 0
- **Exclude**: `node_modules/`, `dist/`, `*.test.tsx`, `*.spec.tsx`
- **Pattern**: `>[A-Z][a-z]+( [a-z]+)*<`
- **File Types**: `*.tsx`
- **Explanation**: Any text content between JSX tags that looks like English prose must use `{t('some.key')}` instead of being hardcoded. User-visible strings must go through i18next so they can be translated to all supported locales (zh-CN, en-US, de-DE).
- **search_content invocation**:
  ```
  pattern: ">[A-Z][a-z]+( [a-z]+)*<"
  path: <frontend_src_dirs_from_step0>
  type: "tsx"
  outputMode: "content"
  ```

## False Positive Handling

This regex-based check will produce false positives. For each match, manually verify whether it is genuinely user-visible text. Exclude the following from violations:

- **HTML attributes**: `aria-label=`, `data-testid=`, `href=`, `src=`, `alt=` (but note: `alt` text IS user-visible — flag it)
- **URL strings**: `href="https://..."`, `src="/images/..."`
- **Component names**: `<SomeComponent>` inside JSX
- **Code identifiers**: variable names, import paths, type annotations
- **Comments**: `// This is a comment`
- **Already translated**: `<div>{t('some.key')}</div>` — already compliant

Only flag content that is truly visible to the end user: button labels, headings, paragraphs, placeholders, error messages, empty states, tooltips, etc.

## Severity

⚠️ **Warning** — due to false positive risk, each match requires manual review. Legitimate violations should be fixed but do not block merge.

## Execution

1. Run Step 0 to discover frontend source directories.
2. Run the search_content call on the discovered paths.
3. Manually review each match: distinguish true hardcoded text from false positives (URLs, attributes, component names, etc.).
4. Report only true violations with filePath, lineNumber, and the hardcoded text content.
