---
name: pr-workflow
description: Manage issue-based branches and pull requests for PawHaven.
---

# PR Workflow

Use this workflow for issue-based code changes.

## Rules

- Create every work branch from the latest `develop`.
- Branch name: `PW-<issue-number>` (no suffix).
- Commit format: `[PW-<issue-number>] type(scope?): subject`.
- The commit ticket must match the current branch.
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
- Never commit directly to `main` or `develop`.
- Choose the PR target from the user's request or repository workflow. Ask if unclear; do not assume `develop`.
- Never discard user changes, bypass hooks, or bypass branch protection.

## Steps

### 1. Identify the issue

- Get the issue number from the user or an issue URL. If missing, ask; never invent one.
- Check the issue's scope, acceptance criteria, and status.
- Do not work on a closed issue unless the user asks.

### 2. Create the branch

- Run `git status --short`. If the worktree has changes, preserve them and ask how to proceed.
- Run `git fetch origin`.
- Update `develop` with fast-forward only:
  ```bash
  git switch develop
  git pull --ff-only origin develop
  ```
- Check whether `PW-<issue-number>` already exists. Inspect an existing branch; never reset it automatically.
- Create the branch from `develop`:
  ```bash
  git switch -c PW-<issue-number> develop
  ```
- Confirm the current branch name.

### 3. Implement and check

- Follow the issue acceptance criteria and repository instructions.
- Keep changes limited to the issue.
- Run relevant tests, lint, type checks, and build.
- Review `git diff`, `git diff --check`, and `git status`. Report checks not run.

### 4. Commit

- Review staged changes before committing.
- Use `[PW-<issue-number>] type(scope?): subject`.
- Ensure the ticket matches the current branch.
- Validate with `pnpm exec commitlint`; fix failures instead of bypassing the hook.
- Commit only with the user's authorization.

Example:
```text
Branch:  PW-122
Commit:  [PW-122] chore: Simplify PR workflow skill
```

### 5. Open a pull request

- Push the work branch.
- Confirm the PR target branch. Ask the user if it is unclear.
- Create the PR with a concise title, summary, test results, and `Closes #<issue-number>` when applicable.
- Verify the PR uses the confirmed target branch.

### 6. Review and merge

- Review the full diff and wait for required checks and reviews.
- Resolve blocking feedback and re-run affected checks.
- Merge only with the user's explicit authorization.
- Do not force-push or bypass repository protections.

## Stop and ask when

- The issue number or PR target is unclear.
- The worktree is not clean.
- The branch already exists and its state is uncertain.
- Fetching or updating `develop` fails.
- A merge conflict or blocking check needs a decision.
