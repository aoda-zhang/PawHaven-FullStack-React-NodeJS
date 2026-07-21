---
name: i18n
description: >
  国际化标准 / Enterprise-Grade Internationalization (i18n) Standards.
  定义项目国际化规范：所有用户可见文案必须通过 t() 函数、语义化 key 命名（module.key 格式，多词 key 一律使用 snake_case 下划线，如 hero_headline_prefix）、三语同步（zh-CN/en-US/de-DE 必须同时更新）、禁止硬编码字符串、禁止拼接翻译、复数处理、日期/货币格式化、常用文案放入 common 模块。
  适用于 React/Next.js 应用的 i18next + react-i18next 技术栈。
  触发场景 / Trigger: 国际化 i18n internationalization localization l10n globalization g11n locale adaptation, 翻译 translation translate text string message copy localisation, 多语言 multi-language multilingual language support locale detection switching, locale language code region zh-CN en-US de-DE ja-JP ko-KR fr-FR es-ES, 文案 UX copy microcopy user-facing text label message string content wording, 硬编码字符串 hardcoded strings inline text literal string direct text embedding, t() function translate function i18n key lookup interpolation namespace, i18next react-i18next useTranslation Trans component HOC withTranslation, key naming semantic namespace module.key convention structure organization snake_case underscore, pluralization singular plural forms count variable interpolation, date formatting currency number formatting Intl locale-aware display, common module shared keys reusable translations frequently used, error messages empty state toast notification banner alert text, button labels CTA call to action action text label affordance, accessibility a11y aria-label lang attribute screen reader locale, concatenation avoidance string interpolation template literal translation, three-language sync simultaneous update consistency across locales.
version: 4.0
---

# Purpose

This skill defines the project's internationalization (i18n) standards.

Internationalization is not simply moving strings into translation files. Different languages have different grammar, plural rules, word order, punctuation, and sentence structure.

The application should never assume English grammar.

Apply this skill whenever working on:

- Pages
- Components
- Forms
- Dialogs
- Tables
- Navigation
- Validation
- Error handling
- Notifications
- Accessibility
- Metadata
- Emails
- PDFs
- Empty states
- Loading states
- Buttons
- Labels
- Validation messages
- Error messages
- SEO metadata

---

# Objectives

Every feature must:

- Support all project locales
- Never hardcode user-facing text
- Produce maintainable translation keys
- Keep translations consistent
- Be translator friendly
- Be scalable for future languages

---

# Principles

## Think in Messages, Not Strings

A translation represents an entire message.

Never build sentences by combining multiple translated fragments.

The translator—not the code—should control sentence structure.

---

# Project Data Structure

## Supported Locales

`zh-CN`, `en-US`, `de-DE` (defined in `packages/i18n/supportedLngs.js`)

## File Structure

Flat per-language files — one file per locale:

```
packages/i18n/locales/
  en-US.json
  zh-CN.json
  de-DE.json
```

## JSON Structure

Each locale file contains **module objects** at the top level. Every module is a separate object grouping related keys:

```json
{
  "common": {
    "cancel": "Cancel",
    "save_continue": "Save & Continue",
    "owner_text": "© {{year}} PawHaven by {{author}}. All rights reserved.",
    ...
  },
  "auth": {
    "login": "Log in",
    "signup": "Sign up",
    "login_subtitle": "Welcome back. Sign in to continue with your PawHaven account.",
    ...
  },
  "reportStray": {
    "report_animal": "Report Stray Animal",
    "animal_type": "Animal Type",
    ...
  },
  "rescueGuide": {
    "title": "Rescue Guide",
    "steps": [
      { "icon": "🕵️‍♀️", "title": "Assess if Rescue Is Needed", "desc": "..." },
      ...
    ],
    ...
  },
  "errorMessage": {
    "TOKEN_EXPIRED": "Your session has expired. Please log in again.",
    ...
  }
}
```

## Key Usage

Keys use **dot notation** with the module prefix:

```tsx
t('common.cancel');
t('auth.login');
t('reportStray.report_animal');
t('rescueGuide.title');
t('errorMessage.TOKEN_EXPIRED');
```

Parameters via interpolation:

```tsx
t('common.owner_text', { year: 2025, author: 'Aoda Zhang' });
t('reportStray.geolocation_error', { message: error.message });
```

When `returnObjects` is enabled, object/array values are accessible:

```tsx
const steps = t('rescueGuide.steps', { returnObjects: true }) as Step[];
```

## Current Modules

| Module         | Purpose                                        |
| -------------- | ---------------------------------------------- |
| `common`       | Shared strings used across multiple features   |
| `auth`         | Authentication pages (login, register, logout) |
| `home`         | Home page navigation                           |
| `reportStray`  | Stray animal reporting form                    |
| `rescueGuide`  | Rescue guide content                           |
| `errorMessage` | Error code to message mapping                  |

## Adding a New Module

1. Add a new top-level object key in each of the 3 locale files
2. Add all translation keys inside it
3. Use in components: `t('newModule.key')`

## Adding a New Locale

1. Add the locale code to `supportedLngs.js`
2. Create `locales/{locale}.json` with all module objects and keys
3. Mirror the structure from an existing locale file

---

# Rules

## 1. Never hardcode user-facing strings

❌ Bad

```tsx
<Button>Save</Button>
```

✅ Good

```tsx
<Button>{t('common.save')}</Button>
```

This applies to:

- Buttons
- Labels
- Titles
- Paragraphs
- Placeholders
- Tooltips
- Toasts
- Errors
- Empty states
- Loading text

---

## 2. Never use English as translation keys

❌ Bad

```json
{
  "Save changes": "Save changes"
}
```

```tsx
t('Save changes');
```

✅ Good

```json
{
  "common.save": "Save"
}
```

Translation keys describe meaning, not wording.

---

## 3. Translation keys must be semantic

Good

```
common.save
common.cancel

auth.login
auth.login_subtitle

reportStray.animal_type
reportStray.location

errorMessage.TOKEN_EXPIRED
```

Avoid

```
title1
button2
saveButton
text3
```

---

## 3a. Key naming format — always `snake_case`

Every key segment (after the module prefix and for sub-objects) MUST be written in `snake_case`: lowercase words separated by underscores. This applies to **all multi-word keys** — short and long alike. Never use `camelCase` or `kebab-case` for keys.

The only exception is error-code / constant maps (e.g. `errorMessage.TOKEN_EXPIRED`), which conventionally use `UPPER_SNAKE_CASE`.

✅ Good — underscores separate words:

```
hero.headline_prefix
hero.subtitle
home.report_stray_now
reportStray.animal_type
auth.login_subtitle
rescueGuide.assess_if_rescue_needed
```

❌ Bad — `camelCase` or mixed casing:

```
hero.headlinePrefix
hero.subTitle
home.reportStrayNow
auth.loginSubtitle
reportStray.animalType
```

Rule of thumb: if a key has more than one word, it MUST contain an underscore. A key like `hero_headline_prefix` is the canonical format to follow.

---

## 4. Translator-friendly keys

Keys should provide context.

Good

```
reportStray.has_injury
reportStray.injury_description
```

Bad

```
has
desc
```

Avoid ambiguous keys.

---

## 5. Organize translations by module

Each feature gets a top-level object in the locale JSON:

```
common      → shared strings
auth        → authentication
reportStray → stray reporting
rescueGuide → rescue guide
...
```

Avoid one massive flat list of keys.

---

## 6. Keep feature keys scoped; put shared strings in common

Strings used across multiple features MUST go into `common`:

```
common.save
common.cancel
common.delete
```

MUST NOT duplicate the same key or value across modules:

❌ Bad — duplicated key and value

```json
// In reportStray:
{ "save": "Save" }

// In rescueGuide:
{ "save": "Save" }
```

✅ Good — shared string lives in `common` only

```json
// common
{ "common.save": "Save" }

// reportStray (no "save" key)
{ "reportStray.report_animal": "Report Stray Animal" }

// rescueGuide (no "save" key)
{ "rescueGuide.title": "Rescue Guide" }
```

### 6a. When a value appears in multiple modules, extract it to common and update all usages

Whenever you notice the same **translation value** (the actual text) duplicated across two or more modules, it MUST be extracted into `common`. After extracting, you MUST also update every `t()` call that previously referenced the old module-scoped key to use the new `common.*` key. Do not leave stale duplicates or orphaned keys behind.

❌ Before — same value in auth and footer:

```json
// auth/en-US.json
{ "auth.email": "Email" }

// footer/en-US.json
{ "footer.email": "Email" }
```

```tsx
// SomeComponentA.tsx
t('auth.email');

// SomeComponentB.tsx
t('footer.email');
```

✅ After — deduplicated to common, all usages updated:

```json
// common/en-US.json
{ "common.email": "Email" }

// auth/en-US.json (key "email" removed)
// footer/en-US.json (key "email" removed)
```

```tsx
// SomeComponentA.tsx
t('common.email');

// SomeComponentB.tsx
t('common.email');
```

Steps:

1. Identify the duplicated value across locale files
2. Add it to the `common` module in all 3 locale files (en-US, zh-CN, de-DE)
3. Remove the duplicate from every module that had it (all 3 locales)
4. Search for all `t('oldModule.key')` usages in the codebase and replace with `t('common.key')`
5. Run typecheck to ensure no broken references

---

## 7. Reuse common translations

Prefer

```
common.save
common.cancel
common.delete
common.confirm
common.search
common.loading
```

Avoid duplicating

```
reportStray.save
rescueGuide.save
```

unless wording is actually different.

---

## 8. Never concatenate translated strings

❌ Bad

```tsx
t('common.welcome') + username;
```

```tsx
'Hello ' + name;
```

✅ Good

```tsx
t('common.welcomeUser', {
  name,
});
```

Translation

```
"welcomeUser": "Welcome {{name}}"
```

This allows translators to change word order.

---

## 9. Never Construct Sentences in Code

❌ Bad

```tsx
t('added') + ': ' + formatDate(date);
```

English may render correctly:

```
Added: January 1
```

Another language may require:

```
January 1 added
```

or

```
On January 1, this item was added.
```

✅ Good

```tsx
t('photo.addedDate', {
  date,
});
```

Translation files determine the correct sentence order.

---

## 10. Never Concatenate Translated Strings

❌ Bad

```tsx
t('welcome') + ' ' + username;
```

❌ Bad

```tsx
t('price') + ': ' + price;
```

Different languages may place variables in different positions.

✅ Good

```tsx
t('welcomeUser', {
  name: username,
});
```

---

## 11. Only Interpolate Dynamic Values

Interpolation should only be used for data such as:

- User names
- Dates
- Numbers
- Currency
- Percentages
- IDs
- Counts

Example

```tsx
t('common.owner_text', {
  year,
  author,
});
```

---

## 12. Avoid Interpolating Arbitrary Nouns

Avoid generic templates like:

```tsx
t('selectItem', {
  item: 'image',
});
```

Many languages require surrounding words to change depending on the noun's grammatical gender, case, or number.

Prefer dedicated messages.

Good

```
selectImage
selectVideo
selectFolder
```

instead of

```
select {{item}}
```

unless your localization team confirms it is grammatically safe.

---

## 13. Never Assume Word Order

English sentence structure is not universal.

Do not assume:

```
Verb + Object
Label + Value
Subject + Verb
```

Always allow translators to control the complete sentence.

---

## 14. Always support pluralization

Never manually write

```
1 item
2 items
```

Use the i18n framework's plural rules.

Pluralization differs across languages.

---

## 15. Never Manually Handle Pluralization

❌ Bad

```tsx
count === 1 ? '1 file' : `${count} files`;
```

Different languages have different plural rules.

Always use the i18n library's pluralization support.

Example

```tsx
t('items', {
  count,
});
```

---

## 16. Never Manipulate Translated Text

Avoid operations such as:

```tsx
text.toUpperCase()
text.toLowerCase()
text.split()
text.substring()
text.replace(...)
```

Case conversion, punctuation, spacing, and word boundaries differ across languages.

Formatting should be handled by the localization system whenever possible.

---

## 17. Do Not Assume Punctuation

Avoid writing punctuation outside translations.

❌

```tsx
t('common.warning') + ':';
```

Instead

```tsx
t('common.warningLabel');
```

The translator determines whether punctuation is required.

---

## 18. Translate every visible string

Including

- Buttons
- Labels
- Helper text
- Validation
- Dialogs
- Toasts
- Notifications
- Menus
- Tabs
- Table headers
- Search placeholders
- Empty states
- Loading indicators

---

## 19. Do not translate internal values

Never translate

- API field names
- Database values
- CSS class names
- IDs
- URLs
- Enum values

Instead map business values to translation keys.

Example

```
rescueStatus.pending
rescueStatus.completed
```

---

## 20. Validation messages must be translated

Good

```
validation.required
validation.email
validation.minLength
validation.maxLength
```

Never hardcode validation messages.

---

## 21. Error messages

Backend messages must never be shown directly.

Always map backend errors to translation keys.

Example

```
errors.network
errors.timeout
errors.unauthorized
errors.notFound
```

---

## 22. Localize Formatting

Never manually format:

- Dates
- Time
- Currency
- Numbers
- Percentages

Always use locale-aware formatting utilities.

---

## 23. Accessibility must be translated

Translate

- aria-label
- aria-description
- alt
- title
- screen reader text

Accessibility is part of localization.

---

## 24. SEO metadata

Translate

- title
- description
- Open Graph
- Twitter cards
- Metadata
- Structured data (when appropriate)

---

## 25. Design UI for Translation

Do not design layouts that depend on English text length.

Avoid:

- Fixed-width buttons
- Fixed-width labels
- Hardcoded spacing based on English
- Splitting one sentence across multiple components

Expect translations to be significantly longer or shorter.

---

## 26. Do Not Split Styled Sentences

Avoid

```
Get
10 images
for
$2.99
```

where every fragment is a separate translation.

Many languages require different word order.

Prefer translating the complete message whenever possible.

---

## 27. Treat Translation as Content

Translation is not code.

Never:

- Parse translated strings
- Split translated strings
- Build logic around translated values

Business logic should never depend on localized text.

---

# Code Review Checklist

Before completing a task verify:

- No hardcoded user-facing strings
- Translation keys are semantic
- Translation keys use `snake_case` (multi-word keys separated by underscores, e.g. `hero_headline_prefix`); no `camelCase` keys
- Module-based organization is followed
- Common translations are reused
- No duplicated keys across modules (shared strings must live in `common` only)
- No duplicated values across modules; when found, extract to `common` and update all `t()` references
- Interpolation is used correctly
- Pluralization is supported
- Validation messages are translated
- Error messages are translated
- Accessibility strings are translated
- Metadata is translated
- Dates and numbers are localized
- No backend messages are exposed directly
- New keys exist in every supported language (`zh-CN`, `en-US`, `de-DE`)
- No unused translation keys were introduced

And also verify:

- No concatenated translations
- No manually constructed sentences
- No English grammar assumptions
- Only dynamic values are interpolated
- No arbitrary noun interpolation
- No manual pluralization
- No string manipulation on translated text
- No punctuation outside translations
- Locale-aware formatting is used
- UI supports longer translations
- Complete messages are translated
- Business logic is independent of localized text

---

# Common Mistakes

Avoid:

- Hardcoded English strings
- English sentences as translation keys
- String concatenation
- Duplicate translation keys
- Duplicating keys or values across modules (shared strings belong in common; if a duplicate value is found, extract it to common and update all `t()` references)
- Ambiguous key names
- `camelCase` or `kebab-case` key names (multi-word keys must be `snake_case`, e.g. `hero_headline_prefix`)
- Translating internal identifiers
- Manual pluralization
- Manual date formatting
- Missing accessibility translations
- Missing SEO translations
- Renaming existing keys without migration
- Exposing backend error messages
- Creating feature-specific keys for common wording

And also avoid:

- Building sentences with "+"
- Assuming English word order
- Manual plural rules
- Injecting arbitrary nouns into generic templates
- Using string operations on translated content
- Designing layouts only for English
- Splitting one sentence into multiple translated fragments
- Depending on translated text for application logic

---

# Definition of Done

A feature is considered internationalized only if:

- Every user-facing string is translated
- Translation keys follow project conventions
- Translation keys use `snake_case` for all multi-word keys (`hero_headline_prefix`), no `camelCase`
- All supported locales are updated
- Accessibility text is localized
- Metadata is localized
- Validation and errors are localized
- Formatting is locale-aware
- CI passes all i18n validation
- No hardcoded UI strings remain

And a feature satisfies linguistic safety only if:

- Every message is language-independent
- Translators control sentence structure
- The UI does not rely on English grammar
- Localization libraries handle pluralization and formatting
- The layout remains usable across supported languages
- Business logic is completely decoupled from translated content

## Related

- Best practices: [references/best-practices.md](references/best-practices.md)
- Hardcoded-string detection: [i18n-doctor](../../code-review/i18n-doctor/SKILL.MD)
