---
name: i18n
description: >-
  Internationalization standards for PawHaven's user-visible text: every string a person
  reads resolves through t(), keys are semantic module.snake_case paths, and the three
  locales en-US, zh-CN and de-DE are updated together. Use when writing or editing
  user-facing copy, naming a translation key, deciding which module owns a string,
  touching t()/useTranslation/Trans, adding a module or a locale, or moving a value
  that turned out to be shared — triggers include locale codes, interpolation, plural
  forms, and the Chinese terms 国际化, 翻译, 多语言, 文案. i18n-doctor scans for violations of this; this skill defines them.
---

# i18n — Internationalization Standards

This skill governs how PawHaven's user-visible text is written, keyed, looked up, and kept in step across its three supported locales.

## When to use / when not to use

Use this skill when writing or changing any string a person can read — button and menu labels, headings, body copy, placeholders, tooltips, table headers, empty and loading states, toasts, validation and error text, `aria-label` / `alt` text, SEO metadata, and PDF or document text — and when:

- naming a translation key, or deciding which module owns it;
- touching code that calls `t()`, `useTranslation()`, or `Trans`;
- adding a module, adding a locale, or finding two modules that share a value;
- reviewing a change that adds, renames, or moves user-facing copy.

Do not use this skill for:

- **Scanning** a diff, file, or branch for hardcoded strings, non-`snake_case` keys, or locale-parity violations and reporting them as findings — that is [`i18n-doctor`](../../code-review/i18n-doctor/SKILL.md). This skill sets the standard; `i18n-doctor` detects violations of it.
- Deciding what a sentence should _say_. Copy decisions belong to the product owner and the translators. This skill only governs how approved copy is keyed and looked up.

## The one invariant

`en-US`, `zh-CN` and `de-DE` are the supported locales, declared in `packages/i18n/supportedLngs.js`. A string is not finished until all three locale files carry the key. A key present in one locale and absent from the others is not a partial translation — it is a silent fallback to English wearing a translation's clothes.

## Why a translation is a message, not a string

_Because word order, gender, case, plural count, and punctuation are properties of the language, and the only party that knows them is the translator._

A key is a handle on a whole sentence. Once code starts assembling a sentence out of translated pieces, that sentence is written in English and every other locale receives a word salad. Every rule under **String construction** is a consequence of this one sentence; a rule that is not a consequence of it does not belong here.

## Key naming

### 2. English text is a value, never a key

_Because a key that embeds English wording must be renamed the moment the copy is edited, and a rename is a silent break in every locale that did not get renamed with it._

```json
❌ { "Save changes": "Save changes" }
✅ { "common": { "save": "Save" } }
```

```tsx
❌ t('Save changes')
✅ t('common.save')
```

### 3. Keys describe meaning, not wording

_Because the key is what a translator reads to learn what the string is for; `title1` and `button2` tell them nothing, so the key forces a guess at the moment a mistake is most expensive._

```
common.save                   auth.login                 auth.login_subtitle
common.cancel                 reportAnimal.animal_type   rescueDetail.has_injury
errorMessage.TOKEN_EXPIRED
```

Avoid `title1`, `button2`, `text3`, `saveButton`.

### 3a. Every key segment is `snake_case`

_Because every key in the existing tree is `snake_case`, so one `camelCase` key makes the file inconsistent — which is what invites the next reader to start renaming things._

Lowercase words joined by underscores, for short keys and long ones alike: `hero.headline_prefix`, `home.report_stray_now`, `auth.login_subtitle`, `rescueGuide.assess_if_rescue_needed`. Never `hero.headlinePrefix`, `home.reportStrayNow`, or `kebab-case`.

The one exception is an error-code map, where the key is the constant itself and stays `UPPER_SNAKE_CASE` (`errorMessage.TOKEN_EXPIRED`).

### 4. Keys give a translator their context

_Because `desc` cannot be translated correctly out of context — a translator cannot tell whether it describes a field, a button, or an error — and the wrong guess ships silently._

Prefer `reportAnimal.injury_description` over `desc`; `reportAnimal.has_injury` over `has`.

## Module ownership and shared strings

### 5. One top-level module per feature

_Because a single flat namespace gives a reviewer no way to tell which feature a key belongs to, and gives two features no way to avoid colliding on the same name._

Each feature gets one top-level object in the locale files — `auth`, `reportAnimal`, `rescueDetail`, `home`. The module boundary is what keeps a rename inside one feature. `references/module-inventory.md` lists what exists today.

### 6. A string used by more than one feature lives in `common`

_Because the same key copied into two modules means two edits for every future wording change, and the copy that gets missed is the one that ships._

`common.save`, `common.cancel`, `common.delete` are used from anywhere. Do not declare the same key, or the same value, inside two feature modules.

### 6a. Finding a duplicated value is a fix, not a note

_Because a value duplicated across modules reads as two independent strings to the next person, so the drift stays invisible until one of the copies is wrong._

When the same text turns up in two or more modules, complete all four steps — skipping the last one leaves broken call sites behind:

1. add the key to `common` in all three locale files;
2. remove the duplicate from every module that had it, in all three locale files;
3. update every `t()` caller to the `common.*` key, including files outside the feature being worked on;
4. grep for the retired key path to confirm nothing still points at it.

### 7. Reuse before you create

_Because a near-duplicate key is cheaper to notice today than to reconcile later, once two features disagree about what `reportAnimal.save` and `rescueGuide.save` were meant to cover._

Prefer `common.search`, `common.loading`, `common.confirm` over a feature-scoped copy. Create a feature-scoped key only when the wording is genuinely different.

## String construction

### 8. One key per message — never assemble a sentence in code

_Because word order, gender, case, and punctuation belong to the language, so a sentence stitched together from fragments is an English sentence wearing a translation's clothes: correct in `en-US`, unreadable everywhere else._

This merges the three places the old rule set stated the same prohibition.

```tsx
❌ t('added') + ': ' + formatDate(date)
❌ t('common.welcome') + username
❌ 'Hello ' + name
```

```json
{ "rescueDetail": { "added_date": "Added on {{date}}" } }
```

```tsx
✅ t('rescueDetail.added_date', { date })
```

The translator — not the component — decides where the variable sits and what punctuation surrounds it.

### 11. Interpolate data, not words

_Because an interpolated value is a hole in a sentence, and only a value with no grammatical obligations of its own can fill that hole in any language._

Interpolate names, dates, counts, numbers, currency, percentages, and IDs:

```tsx
t('common.owner_text', { year, author });
```

### 12. Do not inject an arbitrary noun into a template

_Because a noun's gender, case, and number change the words around it, so `select {{item}}` cannot be rendered correctly for `image` in every language at once._

Write one message per noun — `reportAnimal.select_image`, `reportAnimal.select_video`, `reportAnimal.select_folder` — rather than a single `select_item` template, unless a localization reviewer has confirmed the generic form is grammatically safe.

### 13. Do not assume English word order

_Because "Verb + Object", "Label + Value", and "Subject + Verb" are English habits, and a template that bakes one in forces every other locale into a sentence it does not use._

Let the whole sentence live in the translation. A key that requires a word before a variable and a different word after it is a key that cannot be reordered — which is Rule 8 again by another route.

### 16. Do not manipulate translated text

_Because case conversion, splitting, and substring boundaries are English-shaped operations: `.toUpperCase()` on a German noun and `.split(' ')` on a Chinese sentence both produce garbage._

`toUpperCase`, `toLowerCase`, `split`, `substring`, and `replace` on a translated value are defects. If the value needs different casing or splitting, it needs a different key.

### 17. Punctuation belongs inside the translation

_Because a colon is not decoration — in some scripts it is a full-width character, and in others the word order already carries the meaning._

```tsx
❌ t('common.warning') + ':'
✅ t('common.warning_label')
```

### 26. Do not split one sentence across styled fragments

_Because a fragment set is a sentence assembled in code with extra steps, so it re-introduces Rule 8 through the back door._

```tsx
❌ t('pricing.get') + t('pricing.images', { count }) + t('pricing.for') + t('pricing.price', { amount })
```

Translate the complete message. When only part of it needs emphasis, put the markup inside the message and render it with `<Trans>`.

### 27. Translated text is content, never data

_Because a comparison or a parse against a translated string is a rule written in one language, and it breaks the moment the wording is edited or the locale changes._

Never parse, split, regex, or branch on a translated value. Branch on the underlying value and translate only the display.

## Translation coverage

### 1 and 18. Everything a person can read is translated

_Because the string that was forgotten is invisible in review — it looks deliberate — and it is the one the user reads in a language they did not choose._

```tsx
❌ <Button>Save</Button>
✅ <Button>{t('common.save')}</Button>
```

That covers buttons, labels, headings, body copy, placeholders, tooltips, menus, tabs, table headers, search placeholders, empty states, loading indicators, toasts, notifications, and dialogs.

### 19. Internal values are not translated

_Because an API field name, a CSS class, and an enum value are wire formats, and translating one produces a lookup that misses at runtime instead of an ugly-looking string._

`reportAnimal.cat` is a key. The `cat` in a form payload is a code that selects the key, never the text to display — the same for a status arriving from the API, and for an id like `rescueDetail.case_id`. Map the value to a key and let the locale file carry the words.

### 20. Validation messages are translated

_Because a validation message is the one piece of text a user is guaranteed to read, and it is usually the last one wired up._

`validation.required`, `validation.email`, `validation.minLength`, `validation.maxLength` — never a hardcoded message beside the rule.

### 21. Backend messages are mapped, never shown

_Because a backend message is written in one language, addressed to a developer, and free to change without a translation review._

Map every error to a key — `errorMessage.TOKEN_EXPIRED`, `errorMessage.INVALID_CREDENTIALS` — and let the locale file carry the text.

### 23. Accessibility text is translated

_Because screen-reader output is user-facing text with no visual fallback, so a hardcoded `aria-label` is invisible to sighted reviewers and announced verbatim to the user._

`aria-label`, `aria-description`, `alt`, `title`, and any visually hidden helper text all go through `t()`.

### 24. SEO and document metadata is translated

_Because `<title>`, the description, Open Graph, and Twitter card text are indexed and previewed per locale, and an English-only default silently outranks the localized page._

The same holds for PDF and printable document text, which lives in a separate locale tree — see `references/locale-files.md`.

### 25. The layout has to survive translation

_Because German runs roughly a third longer than English while Chinese runs shorter with different line breaks, so a layout pinned to English text length breaks in one direction or the other._

No fixed-width buttons or labels, no spacing derived from English text, and no sentence split across components. Assume every translation is both longer and shorter than the English.

## Plurals, dates, and numbers

### 14. Plurals come from the i18n library

_Because plural rules are per-language — English has two forms, Chinese one, Polish several — so `count === 1 ? '1 file' : ...` is an English rule written in code._

This merges the two places the old rule set stated the same prohibition.

```json
{
  "imageUpload": {
    "count_one": "{{count}} image",
    "count_other": "{{count}} images"
  }
}
```

```tsx
✅ t('imageUpload.count', { count })
```

### 22. Dates, times, numbers, and currency are formatted by locale

_Because month names, decimal separators, digit grouping, and currency placement are all locale-specific, and a hand-built format string is correct in exactly one locale._

Format every user-visible date, time, number, percentage, and currency through `Intl` against the active locale, not through string concatenation.

## Where translations come from

### 28. Features read translations through `react-i18next`

_Because `@pawhaven/i18n` is infrastructure — provider, detection, resource loading — and a feature that imports the instance directly bypasses the provider it renders under, which breaks it in tests and in the PDF renderer._

```tsx
❌ import { i18n } from '@pawhaven/i18n'; i18n.t('common.save');
✅ import { useTranslation } from 'react-i18next'; const { t } = useTranslation();
```

Three named escape hatches exist, and features, pages, and components are not among them:

| Import                         | Who may use it                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `@pawhaven/i18n/i18nProvider`  | the app root, once                                                                           |
| `@pawhaven/i18n/supportedLngs` | a locale switcher that must enumerate locales (`packages/frontend-core`, `LanguageSelector`) |
| `@pawhaven/i18n/resources`     | the backend PDF engine, which builds its own instance                                        |

The bare side-effect import of `@pawhaven/i18n` appears once, in `packages/frontend-core` (`utils/reactQuery.ts`), to make translations available to non-React code.

## Review gates

There is no automated i18n check in CI and no type-level key checking, so nothing below fails on its own. Run these before calling a change done.

**Three-locale parity** — every new key must exist in all three locales. Execute the bundled script
and read its stdout; do not rebuild the comparison by hand, and do not read the script's source. It
covers the nested `documents/pdf/` tree as well as the top-level modules, which the `jq` one-liner this
replaced did not — it globbed `locales/$L/*.json` and skipped every PDF document key without saying so.

```bash
node .opencode/skills/code-review/i18n-doctor/scripts/check-locale-parity.mjs \
  --locales packages/i18n/locales --reference en-US
```

Exit `0` means the three locales hold identical leaf-key sets; exit `1` means the printed `missing` and
`only` lines are keys that exist in one locale and not another — usually a key added to `en-US` and
forgotten elsewhere, or a rename applied to two of the three files. Exit `2` means bad input (no
locales dir, or the reference locale is absent), which is a harness problem rather than a translation
finding.

**No orphans** — a key nothing reads is drift; a key that lost its last reader during a rename is a broken call site:

```bash
grep -rn "<module>.<key>" apps/frontend/portal/src apps/backend packages
```

**No new hardcoded string, no assembled sentence, no direct import** — scan the diff for literal text in JSX, a `t()` call on the right of a `+`, and `from '@pawhaven/i18n'`. When the task is a review rather than an edit, hand that scan to `i18n-doctor` instead of doing it by hand.

## References

- [`references/locale-files.md`](references/locale-files.md) — the locale directory tree, the file-name-to-key-path mapping, the JSON key schema, and the separate document/PDF tree, plus the runtime options that shape lookup. Read before adding a key in an unfamiliar module, before touching PDF or document text, or when a `t()` path must be resolved to a file on disk.
- [`references/adding-module-or-locale.md`](references/adding-module-or-locale.md) — the step-by-step procedure for adding a translation module and for adding a fourth locale, with the parity check to run afterwards. Read when creating a new top-level module object, or when `supportedLngs.js` is being changed.
- [`references/module-inventory.md`](references/module-inventory.md) — the modules that exist today, each one's top-level key and size. Read when deciding whether a string is already covered by an existing module, or whether a new module is warranted.
