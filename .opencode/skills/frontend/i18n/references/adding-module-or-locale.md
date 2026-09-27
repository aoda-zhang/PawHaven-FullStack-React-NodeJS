# Adding a module or a locale

Procedures for the two changes that alter the shape of the locale tree rather than the content of a single key. Read this before creating a new top-level module object, or before touching `packages/i18n/supportedLngs.js`. This file carries the procedure and the commands; the rules it serves live in `SKILL.md` and are not repeated here.

## Adding a module

A module is one file per locale, and the file's single top-level object is the module name.

1. Create `packages/i18n/locales/<locale>/<module>.json` for **all three** locales — `en-US`, `zh-CN`, `de-DE`. A module present in one locale only fails silently at runtime.
2. Give each file a single top-level key equal to the module name, and nest every key of that feature beneath it:

   ```json
   { "volunteer": { "apply": "Apply to volunteer", "apply_hint": "..." } }
   ```

3. Name the module after the feature that owns the strings, not the page that first needed it — a module that follows a page gets renamed when the page moves.
4. Before adding a string, search `packages/i18n/locales/en-US/` for the same text. If it already exists, apply the module-ownership rules in `SKILL.md` instead of adding a second key — moving an existing key is a rename that touches every call site.
5. Read it as `t('<module>.<key>')` from the feature's components, through `useTranslation()`.
6. Run the parity check below and confirm the new key appears in all three locales.

## Adding a locale

Adding a locale is a four-file change, and the app cannot start without all of it.

1. Add the locale code to `packages/i18n/supportedLngs.js`:

   ```js
   export const supportedLngs = ['zh-CN', 'en-US', 'de-DE', 'fr-FR'];
   ```

2. Create `packages/i18n/locales/<locale>/` with the **full** module file set, mirroring an existing locale directory file for file. Copying `en-US` and translating the values is the shortest path to parity.
3. Create `packages/i18n/locales/<locale>/documents/` with the same document sub-tree. The document instance throws on startup if this directory is missing, so a locale without it breaks PDF generation even when the app runs.
4. Add the locale to the `fallbackLng` map in `packages/i18n/index.js` if it should fall back to itself rather than to `en-US`; the current map pins each locale to itself, with `default: ['en-US']` behind them.
5. The new code appears in the language switcher automatically, because the switcher reads `supportedLngs` rather than a hardcoded list.

## Checking parity

There is no CI gate for this. Run the bundled script before claiming a change is done — execute it and
read its stdout rather than reading the script's source, and do not reassemble the comparison by hand.

```bash
node .opencode/skills/code-review/i18n-doctor/scripts/check-locale-parity.mjs \
  --locales packages/i18n/locales --reference en-US
```

Exit `0` means the three locales hold identical leaf-key sets. Every printed `missing` and `only` line
is a key that exists in one locale and not another — usually a key added to `en-US` and forgotten
elsewhere, or a rename applied to two of the three files. The walk is recursive, so a new module or a
new document under `documents/pdf/` is covered by the same run; the `jq` one-liner this replaced globbed
`locales/$L/*.json` and skipped the PDF tree without saying so.

To read one key path in all three locales, pass the dot path and the module file it lives in:

```bash
for L in en-US zh-CN de-DE; do
  printf '%s ' "$L"
  jq -r --arg p 'reportAnimal.report_animal' 'getpath($p | split("."))' \
    "packages/i18n/locales/$L/reportAnimal.json"
done
```

```
en-US Report Stray Animal
zh-CN 上报流浪动物
de-DE Fundtier melden
```

`null` in any column means that locale is missing the key.

To confirm a module exists in every locale, compare the file sets:

```bash
diff <(ls packages/i18n/locales/en-US) <(ls packages/i18n/locales/zh-CN)
```

## Finding an orphaned key

A key nothing reads is drift: it looks like coverage and behaves as dead weight. After a rename or an extraction into `common`, confirm the retired path has no remaining callers:

```bash
grep -rn "'<oldModule>.<oldKey>'" apps/frontend/portal/src apps/backend packages
```

An empty result is the expected outcome. A hit means a call site still points at a key that no longer exists, and the component will render the raw key path.
