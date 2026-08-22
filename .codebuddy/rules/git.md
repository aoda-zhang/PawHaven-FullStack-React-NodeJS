# Git Rules

> **Applies to**: All agents. Defines git workflow and commit conventions.

## 1. Branch Strategy

- `develop` — Main development branch. All features merge here.
- Feature branches: `feature/<short-description>` or `fix/<short-description>`.
- Never commit directly to `develop` without a feature branch (except for `Harness/` configuration).

## 2. Commit Conventions

Format: `<type>(<scope>): <description>`

| Type       | When                                                |
| ---------- | --------------------------------------------------- |
| `feat`     | New feature                                         |
| `fix`      | Bug fix                                             |
| `docs`     | Documentation only                                  |
| `refactor` | Code change that doesn't add a feature or fix a bug |
| `chore`    | Build, CI, dependencies, config                     |
| `test`     | Adding or updating tests                            |
| `style`    | Formatting, whitespace (not CSS styling)            |

Examples: `feat(rescue): add 7-stage state machine`, `docs(agents): update architect agent rules`

## 3. Pre-Commit Checks

- TypeScript typecheck passes for all changed packages.
- Lint passes (ESLint + Prettier).
- No `console.log` in backend code.
- Commit message follows the convention.

## 4. Commit Hygiene

- One commit per logical change. Avoid mega-commits.
- `Harness/` changes: committed as `docs(agents): ...` or `chore(config): ...`.
- Code changes: committed as `feat|fix|refactor(scope): ...`.

## 5. Pushes and PRs

- Push to feature branch, create PR to `develop`.
- Code review required before merging non-trivial changes.
- Never force push to `develop` or shared branches.

## 6. Agent's Git Scope

- Agents NEVER commit code unless the user explicitly requests it.
- Agents CAN stage and commit `Harness/` configuration changes (their own domain).
- The orchestrator does NOT commit — only subagents may commit their own work.
