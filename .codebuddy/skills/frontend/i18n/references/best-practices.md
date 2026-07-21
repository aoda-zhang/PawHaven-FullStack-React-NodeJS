# i18n — Best Practices

Companion to `SKILL.MD`. Load when adding or auditing user-facing text.

## Non-negotiable rules

- Every user-visible string goes through `t()` — no hardcoded text, no English-as-key.
- Keys are semantic dot notation: `module.key` (e.g. `common.save`, `auth.login`).
- Three locales always in sync: `zh-CN`, `en-US`, `de-DE`.
- Shared strings live only in `common`; never duplicate a key/value across modules.
- If the same translation value appears in 2+ modules → extract to `common`, update all `t()` calls.

## Think in messages, not strings

- Never concatenate: `t('welcome') + name`. Use `t('welcomeUser', { name })`.
- Never build sentences in code — translators own grammar and word order.
- Only interpolate dynamic data (names, dates, counts, currency), not arbitrary nouns.
- Never `.toUpperCase()` / `.split()` / manipulate translated text.
- Punctuation belongs inside the translation, not appended in code.

## Coverage

- Translate: buttons, labels, validation, errors, empty/loading states, aria/alt, SEO metadata.
- Do NOT translate: API field names, DB values, CSS classes, IDs, URLs, enums — map to keys.
- Use i18n plural rules; never manual `count === 1 ? ...`.
- Use locale-aware formatting for dates/numbers/currency (Intl), never manual.

## Review checklist

No hardcoded strings · semantic keys · module org · reused common · no dup values ·
interpolation correct · pluralization · no backend messages exposed · all 3 locales updated ·
no unused keys introduced.
