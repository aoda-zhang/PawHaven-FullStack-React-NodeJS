---
name: pr-workflow
description: Standardize issue-driven Git branches, commits, pull requests, and merges for PawHaven. Use whenever starting or finishing a code task that must be tracked by a GitHub issue.
---

# PawHaven PR Workflow

Use this skill for every issue-driven code change in the PawHaven repository.

## Non-negotiable conventions

- Base branch: `develop`.
- Work branch format: `PW-<issue-number>` exactly. Do not append a description or suffix.
- Commit format: `[PW-<issue-number>] type(scope?): subject`.
- The ticket in every commit message must exactly match the currently checked-out work branch.
- Allowed commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
- Pull request base: `develop`.
- Never commit work directly to `main` or `develop`.

Examples:

```text
Branch:  PW-122
Commit:  [PW-122] chore: Add PR workflow skill
PR:      PW-122 Add PR workflow skill -> develop
```

## 1. Resolve and validate the issue

1. Obtain the GitHub issue number from the user's request or an explicit issue URL.
2. If no issue number is available, stop and ask the user to create or identify an issue. Never invent an issue number.
3. Inspect the issue title, description, acceptance criteria, labels, and state using GitHub CLI or the available GitHub integration.
4. Confirm the issue belongs to `aoda-zhang/PawHaven-FullStack-React-NodeJS`. Do not start work against a closed issue unless the user explicitly requests it.

## 2. Create the work branch from the latest develop

1. Inspect the working tree with `git status --short`. If there are unrelated or uncommitted changes, stop and ask how to handle them. Never discard or silently stash user work.
2. Fetch remote refs: `git fetch origin`.
3. Check out the base branch and fast-forward it only:
   ```bash
   git switch develop
   git pull --ff-only origin develop
   ```
4. Verify the working tree is clean and the local `develop` matches `origin/develop`.
5. Construct the branch name as `PW-<issue-number>` and validate it against `^PW-[0-9]+$`.
6. Check whether the branch already exists locally or remotely. If it exists, inspect its base and contents before deciding whether it can be reused; never reset, overwrite, or force-update it automatically.
7. Create the branch from develop:
   ```bash
   git switch -c PW-<issue-number> develop
   ```
8. Verify `git branch --show-current` returns the exact expected branch name.

Do not create a work branch from `main`, another feature branch, or a stale local `develop`.

## 3. Implement and verify

1. Follow the issue's acceptance criteria and the repository's `AGENTS.md` and relevant OpenCode skills.
2. Keep changes scoped to the issue. Do not bundle unrelated cleanup.
3. Run relevant tests, type checks, lint, build, and repository quality checks as appropriate.
4. Inspect `git diff`, `git diff --check`, and `git status`. Report any checks that could not be run; do not claim they passed.

## 4. Generate and validate commit messages

1. Inspect the staged changes with `git diff --cached --stat` and `git diff --cached`.
2. Generate a concise imperative subject describing the actual staged changes.
3. Use this exact format:
   ```text
   [PW-<issue-number>] type(scope?): subject
   ```
4. The ticket prefix must equal the current branch name. For example, on `PW-119`, this is valid:
   ```text
   [PW-119] chore: Update code-commit skill
   ```
5. Validate the message with the repository's Commitlint command before committing:
   ```bash
   printf '%s\\n' '[PW-<issue-number>] chore: Describe the change' | pnpm exec commitlint
   ```
6. The Husky `commit-msg` hook performs the same validation on every commit. If validation fails, fix the message; never bypass the hook with `HUSKY=0`, `--no-verify`, or equivalent.
7. Commit only after the user has authorized committing, and only after validation succeeds.

## 5. Push and open the pull request

1. Confirm the current branch still matches `^PW-[0-9]+$`.
2. Push the branch:
   ```bash
   git push -u origin PW-<issue-number>
   ```
3. Open a pull request with:
   - Head: `PW-<issue-number>`
   - Base: `develop` (always)
   - A concise title describing the change.
   - A summary, implementation notes, and actual test results.
   - A `Closes #<issue-number>` reference when the PR fully resolves the issue.
4. Verify the created PR's base is `develop`. If it is not, correct it before proceeding.
5. Do not target `main` directly.

## 6. Review and merge into develop

1. Review the complete diff and confirm the PR contains only issue-related changes.
2. Wait for required CI checks and requested reviews to complete. Resolve review feedback and re-run affected checks.
3. Do not merge a draft PR, a failing PR, or a PR with unresolved blocking feedback.
4. Merge into `develop` only when the user explicitly authorizes the merge and repository requirements are satisfied. Creating a PR does not itself authorize merging.
5. Use the repository's permitted merge method. Do not force-push, bypass branch protection, or delete branches unless explicitly authorized.
6. After merge, verify the PR's merged state and the resulting base branch.

## Recovery and safety

- **No issue number:** stop and ask; do not guess.
- **Dirty working tree:** preserve all changes and ask before proceeding.
- **No develop branch or fetch failure:** stop; do not fall back to main.
- **Branch already exists:** inspect it; never reset it automatically.
- **Commit ticket mismatch:** correct the message to match the current branch, or switch to the intended branch only after verifying the worktree is safe.
- **Commitlint failure:** inspect the error and fix the message/configuration; never bypass validation.
- **Merge conflict:** stop, inspect, and resolve deliberately. Never force-push as a shortcut.
- **Checks or review pending:** leave the PR open and report what remains.
