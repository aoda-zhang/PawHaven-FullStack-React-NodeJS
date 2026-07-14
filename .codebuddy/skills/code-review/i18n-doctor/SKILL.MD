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

## Step 0: Discover Frontend Source Directories and Locales

Dynamically locate frontend source directories using multiple strategies. i18n setup files vary across projects (`i18n.ts`, `i18n/index.js`, a standalone `packages/i18n` package, etc.), so do not rely on a single filename.

### Strategy 1: known frontend apps
Find every `src/` directory under `apps/frontend/`:

```
search_file: pattern="**/src/" target_directory=<workspace_root>/apps/frontend recursive=true
```

### Strategy 2: cross-validate with react-i18next usage
Find every `.tsx` file that imports `react-i18next` to confirm active i18n usage:

```
search_content: pattern="from ['\"]react-i18next['\"]" path=<workspace_root>/apps/ type="tsx" outputMode="files_with_matches"
```

### Strategy 3: i18n entry files (fallback)
If the first two strategies return nothing, search for i18n setup files:

```
search_file: pattern="**/i18n.ts" target_directory=<workspace_root> recursive=true
search_file: pattern="**/i18n/index.*" target_directory=<workspace_root> recursive=true
```

### Locale completeness check
Identify the project's locale directory and verify all required locales exist:

```
search_file: pattern="**/locales/" target_directory=<workspace_root> recursive=true
list_dir: target_directory=<discovered_locales_dir>
```

Required locales for PawHaven: `zh-CN.json`, `en-US.json`, `de-DE.json`. If any are missing, report it as a Blocking issue.

### Target list output
Before running Rule 1, list every discovered frontend source directory and the verified locale files in the report. This prevents silent empty scans and documents locale coverage.

Use the discovered paths throughout all search rules below.

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

### Rule 2: Locale completeness

- **Severity**: ❌ Blocking
- **Tool**: `list_dir` or `search_file`
- **Path**: The discovered locale directory (e.g., `packages/i18n/locales/`)
- **Explanation**: All three supported locales must be present. Missing a locale file means the feature cannot be fully localized.
- **Validation**: Verify `zh-CN.json`, `en-US.json`, and `de-DE.json` exist in the locale directory.

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

1. Run Step 0 to discover frontend source directories and locale files. **Output the discovered directories and verified locale files explicitly.**
2. Run Rule 1 (search_content) on the discovered source directories.
3. Run Rule 2 (locale check) on the discovered locale directory.
4. Manually review each Rule 1 match: distinguish true hardcoded text from false positives (URLs, attributes, component names, etc.).
5. Report: list discovered directories and locale files, then list each true violation with filePath, lineNumber, and the hardcoded text content.
