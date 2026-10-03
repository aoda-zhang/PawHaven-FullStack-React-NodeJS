---
name: i18n-doctor
description: >
  Internationalization compliance detection. Scans JSX for hardcoded English text (missing t() function),
  ensuring all user-visible text goes through i18next translation. Technical attributes (URLs, test IDs) are exempt.
  Also detects non-snake_case translation keys (multi-word keys must use underscores, e.g. hero_headline_prefix).
  Trigger: i18n internationalization hardcoded string t() translation locale snake_case key naming underscore.
---

# i18n-doctor — Internationalization Compliance

## Responsibility

Ensure all user-visible text uses the `t()` translation function from react-i18next. No hardcoded strings in JSX.

## Step 0: Discover Frontend Source Directories and Locales

Dynamically locate frontend source directories using multiple strategies. i18n setup files vary across projects (`i18n.ts`, `i18n/index.js`, a standalone `packages/i18n` package, etc.), so do not rely on a single filename.

### Strategy 1: known frontend apps

```bash
find apps/frontend -type d -name src -not -path '*/node_modules/*'
```

`apps/frontend/portal` is the only frontend app. Strategies 2 and 3 exist so that stays a finding
rather than an assumption.

### Strategy 2: cross-validate with react-i18next usage

```bash
rg -l "from 'react-i18next'" apps/frontend --glob '*.tsx'
```

### Strategy 3: i18n entry files (fallback)

If the first two strategies return nothing:

```bash
find . \( -name 'i18n.ts' -o -name 'i18n' -type d \) -not -path '*/node_modules/*' -not -path './.pi/*'
```

### Locale completeness check

Identify the project's locale directory, then **execute** the bundled parity script and read its
output:

```bash
node .pi/agents/frontend/review/skills/i18n-doctor/scripts/check-locale-parity.mjs \
  --locales packages/i18n/locales --reference en-US
```

Execute it — do not read its source and do not reconstruct the check by hand. A bundled script's code
never enters your context; only its stdout and exit code do. That is the whole point of shipping it
as a script, and the reason this replaces the old `jq` one-liners (which also assumed an undeclared
external binary and silently skipped the nested `documents/pdf/` tree).

Each locale is a **directory** containing one `<module>.json` per module plus a `documents/pdf/`
sub-tree — there is no flat `locales/en-US.json`. A locale directory missing from the script's
`found=` list is a Blocking issue; so is every key the script lists as `missing` or `only`.

### Target list output

Before running Rule 1, list every discovered frontend source directory and the verified locale files in the report. This prevents silent empty scans and documents locale coverage.

Use the discovered paths throughout all search rules below.

## Rules

### Rule 1: Hardcoded English text in JSX

- **Severity**: ⚠️ Warning
- **Command**:
  ```bash
  rg -n '>[A-Z][a-z]+( [a-z]+)*<' apps/frontend/portal/src --glob '*.tsx' \
    --glob '!**/node_modules/**' --glob '!**/*.test.tsx' --glob '!**/*.spec.tsx'
  ```
- **Explanation**: Any text content between JSX tags that looks like English prose must use `{t('some.key')}` instead of being hardcoded. User-visible strings must go through i18next so they can be translated to all supported locales (zh-CN, en-US, de-DE).
- **The portal's own UI ships CJK strings directly** in places — see Known hits below — so this
  command is a _starting point for review_, not a verdict. A match needs the manual pass in
  [False Positive Handling](#false-positive-handling).

### Rule 2: Locale key parity

- **Severity**: ❌ Blocking
- **Path**: `scripts/check-locale-parity.mjs`, run from the workspace root
- **Script**: `node .pi/agents/frontend/review/skills/i18n-doctor/scripts/check-locale-parity.mjs` (accepts
  `--locales <dir>`, default `packages/i18n/locales`, and `--reference <locale>`, default `en-US`).
  Zero dependencies — Node builtins only.
- **Execution**: Run the script. Never read the file to work out what it does; the source stays out of
  context and only the stdout and exit code come back. Exit `0` means every locale matches the
  reference, `1` means drift, `2` means bad input (missing locales dir, missing reference locale).
- **Explanation**: Every supported locale must hold the same leaf-key set as the reference. A key
  missing from one locale renders as the raw key path there while looking fine everywhere else, and a
  key that exists only in one locale is a rename applied to two of three files. The script walks every
  `*.json` under each locale directory including the nested `documents/pdf/` sub-tree, and builds
  dotted paths from the top-level key inside each file rather than from its name — `rescueGuide.json`
  holds the top-level key `rescueGuide`, and `rescueCases.json` holds `rescue_cases`.
- **Validation**: Report each line the script prints as `missing` or `only`. Report the `found=` list
  when a locale PawHaven supports (`en-US`, `zh-CN`, `de-DE`) is absent from it. A non-zero exit
  other than the drift itself is a harness problem, not a finding — say so rather than reporting it
  as missing translations.

### Rule 3: Non-snake_case translation keys

- **Severity**: ⚠️ Warning
- **Command**:
  ```bash
  rg -n "t\(['\"][\w]+\.[\w]*[a-z][A-Z][\w]*['\"]" apps/frontend/portal/src \
    --glob '*.ts' --glob '*.tsx' \
    --glob '!**/node_modules/**' --glob '!**/*.test.tsx' --glob '!**/*.spec.tsx'
  ```
- **Explanation**: Translation keys must be `snake_case` (lowercase words joined by underscores, e.g. `hero_headline_prefix`). The module prefix (before the first dot) may remain camelCase (`reportStray`, `rescueGuide`), but every key segment after the dot must use underscores. A `camelCase` segment after the dot is a violation. This rule scans `t()` call arguments for a lowercase-then-uppercase letter within the key segment.
- **False positive handling**: `errorMessage.TOKEN_EXPIRED`-style UPPER_SNAKE_CASE error-code maps are allowed and must NOT be flagged. Only flag keys where a lowercase letter is immediately followed by an uppercase letter (true `camelCase`).

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
2. Run Rule 1 on the discovered source directories.
3. Run Rule 2 (execute `scripts/check-locale-parity.mjs`) and read its stdout.
4. Run Rule 3 on the discovered source directories to detect non-snake_case keys.
5. Manually review each Rule 1 match: distinguish true hardcoded text from false positives (URLs, attributes, component names, etc.).
6. Report: list discovered directories and locale files, then list each true violation with file path, line number, and the hardcoded text content or the offending key.

## Known hits — pre-existing, report as such

Two observations that are true of the codebase today, so a review does not re-derive them as a
regression:

- **Rule 2 currently passes.** All three locales are present (`de-DE`, `en-US`, `zh-CN`), with 396
  keys each apart from one `zh-CN` plural variant marked `n/a`. The script also prints a warning that
  `footer` and `rescueGuide` are each claimed by both `documents/pdf/<name>.json` and `<name>.json`
  and share one namespace — a real collision risk, not a failure, and not something to fix in an
  unrelated change.
- **Rule 1 returns matches that are not all violations.** The portal ships CJK strings inline in
  several components rather than through `t()`. Those are genuine i18n gaps worth reporting once,
  marked pre-existing — not per review, and never as a blocking finding.

## Related

- i18n standards: [i18n skill](../../../dev/skills/i18n/SKILL.md)
- styling: [style-doctor](../style-doctor/SKILL.md)
