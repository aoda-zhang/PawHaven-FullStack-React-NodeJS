---
name: code-commit
description: Create and validate PawHaven commit messages using the current PW-<issue> branch and the root Commitlint rules.
---

# Code Commit

Load when the user asks to generate, validate, create, or push a Git commit.

## Required actions

1. **Verify the work branch** — Run `git branch --show-current`. Commits must be made on a work branch named exactly `PW-<issue-number>`. Never commit directly to `main` or `develop`.
2. **Analyze staged changes** — Run `git diff --cached --name-only` and `git diff --cached`. If nothing is staged, explain that and ask whether the user wants the relevant files staged; do not stage unrelated files.
3. **Determine commit type** — Choose one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
4. **Determine scope (optional)** — Use the affected module/package when it improves clarity.
5. **Write the subject** — Concise, imperative, and at least 5 characters. Preserve the repository's 100-character maximum for the complete header.
6. **Construct the message** — The required format is `[PW-<issue-number>] type(scope?): subject`. The ticket prefix must exactly match the current branch.
7. **Validate** — Run:
   ```bash
   printf '%s\\n' '[PW-119] chore: Update code-commit skill' | pnpm exec commitlint
   ```
   The repository Commitlint configuration also verifies that the prefix matches the checked-out branch. The Husky `commit-msg` hook repeats this validation during commit.
8. **Commit and push** — Only when the user explicitly authorizes the action in the current conversation and validation passes. Never bypass hooks with `HUSKY=0` or `--no-verify`.

## Commit format

```text
[PW-119] chore: Update code-commit skill
[PW-110] feat(search): Add animal search filters
[PW-121] fix(navigation): Remove active item background
```

## Commitlint rules

| Rule | Requirement |
| --- | --- |
| Ticket prefix | Required: `[PW-<issue-number>]` |
| Branch match | Ticket prefix must equal the current branch name |
| Type | `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore` |
| Scope | Optional |
| Subject | At least 5 characters |
| Header | Maximum 100 characters |

## Boundary

- Does not decide what files to stage; inspect staged changes and ask before staging.
- Does not bypass Commitlint or Husky.
- Does not create branches or pull requests; use the `pr-workflow` skill.
- Does not amend previous commits unless explicitly asked.
