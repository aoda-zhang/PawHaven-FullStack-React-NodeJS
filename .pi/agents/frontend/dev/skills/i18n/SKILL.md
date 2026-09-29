---
name: i18n
description: >
  Internationalization standards for the PawHaven portal. Every user-facing string goes through
  `t()` with a semantic key in a per-feature locale file. All three locales ship together.
  Use when writing any visible copy, adding a key, or wiring a language selector.
  触发场景 / Trigger: i18n t translate locale language copy string text 翻译 多语言.
---

# i18n

## Rules

- No user-facing string literal in a component. Not a label, placeholder, `aria-label`, error
  message, empty state, or `document.title`.
- Keys are semantic, not literal: `reportAnimal.animal_type`, never `"Animal Type"`.
- Keys are `snake_case` inside a file, `camelCase` for cross-file access.

## File layout

One file per feature, plus the shared namespaces:

```
packages/i18n/locales/{en-US,zh-CN,de-DE}/
├── common.json
├── auth.json
├── home.json
├── reportAnimal.json
├── rescueDetail.json
├── errorMessage.json
└── documents/
```

- Adding a key means adding it to **all three** locales in the same change.
- `en-US`, `zh-CN`, `de-DE`. Never add a fourth without a stated need.
- Never translate a file in isolation. A key present in one locale and missing in another is a
  blocking finding.

## Usage

```tsx
const { t } = useTranslation();

// static key
<label>{t('reportAnimal.animal_type')}</label>;

// key stored next to its option, translated at render
const FILTER_OPTIONS = [{ value: 'all', labelKey: 'rescue_cases.filter_all' }];
t(option.labelKey);

// template literal over a constant — only when the value set is closed and static
t(`reportAnimal.${a.value}`);
```

- Store the **key**, not the translated string, in constants and option arrays.
- Pass `t` down only for static copy. Pass a rendered node for dynamic content.
- Interpolation: `t('common.count', { count })`. No string concatenation in JSX.
- Pluralization and gender go through i18next mechanisms, not manual `if`.

## Forbidden

| Banned                                       | Use                             |
| -------------------------------------------- | ------------------------------- |
| `Animal Type` in JSX                         | `t('reportAnimal.animal_type')` |
| `placeholder="Search..."`                    | `placeholder={t('...')}`        |
| `alt="A stray cat"`                          | `alt={t('...')}`                |
| translated string stored in a constant       | store the key                   |
| key added to one locale                      | add to all three                |
| English copy as the fallback source of truth | keep all three in sync          |

## Doctor

[i18n-doctor](../../../review/skills/i18n-doctor/SKILL.md) — hardcoded string detection ·
`scripts/check-locale-parity.mjs` — locale key parity
