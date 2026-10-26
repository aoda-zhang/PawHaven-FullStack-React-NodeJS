---
name: code-commit
description: Create and validate Git commit messages following the project's conventional commit format (type(scope?): subject) with commitlint rules.
---

# Code Commit

Load when the user wants to commit and push code changes, or when a commit message needs to be created or validated against the project's commitlint configuration.

## Required actions

1. **Analyze staged changes** — Run `git diff --cached --name-only` and `git diff --cached` to understand what changed.
2. **Determine commit type** — Map changes to one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
3. **Determine scope (optional)** — Identify the affected module/package (e.g., `parser`, `ui`, `api`, `auth`, `db`, `ci`).
4. **Write subject** — Concise description (≥5 chars, ≤100 chars total header) in imperative mood. Chinese allowed.
5. **Construct message** — Format: `type(scope?): subject` (e.g., `feat(parser): add new feature`).
6. **Validate with commitlint** — Run `pnpm commitlint --edit` or `echo "<message>" | pnpm commitlint` to verify.
7. **Commit and push** — Only when the user has explicitly instructed commit and push in the current conversation; otherwise stop after validation and report the message. If instructed and validation passes, run `git commit -m "<message>"` then `git push`.

## Commitlint rules (from commitlint.config.cjs)

| Rule               | Value                                               |
| ------------------ | --------------------------------------------------- |
| type-enum          | feat, fix, docs, style, refactor, perf, test, chore |
| scope-case         | any (disabled)                                      |
| subject-case       | any (disabled)                                      |
| subject-min-length | 5 characters                                        |
| header-max-length  | 100 characters                                      |
| Format             | `type(scope?): subject`                             |

## Examples

| Changes                      | Commit message                                    |
| ---------------------------- | ------------------------------------------------- |
| New API endpoint in apps/api | `feat(api): add user search endpoint`             |
| Fix typo in README           | `docs: fix typo in installation guide`            |
| Refactor auth service        | `refactor(auth): simplify token validation logic` |
| Update CI workflow           | `chore(ci): update node version to 20`            |
| Add unit tests for parser    | `test(parser): add unit tests for date parsing`   |

## Boundary

- Does not decide _what_ changes to stage; user must stage files first (`git add`).
- Does not bypass commitlint; validation failure blocks commit.
- Does not handle merge conflicts or rebase; only creates commit messages.
- Does not amend previous commits unless explicitly asked.
