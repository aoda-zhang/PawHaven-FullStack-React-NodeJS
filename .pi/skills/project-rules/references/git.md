# Git Rules

> **Applies to**: All agents. Defines git workflow and commit conventions.

## 1. Branch Strategy

- `develop` — Main development branch. All features merge here.
- Feature branches: `feature/<short-description>` or `fix/<short-description>`.
- Never commit directly to `develop` without a feature branch (except for harness configuration:
  `.pi/`).

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

Examples: `feat(rescue): add 7-stage state machine`, `docs(agents): update planner agent rules`

## 3. Pre-Commit Checks

- TypeScript typecheck passes for all changed packages.
- Lint passes (ESLint + Prettier).
- No `console.log` in backend code.
- Commit message follows the convention.

## 4. Commit Hygiene

- One commit per logical change. Avoid mega-commits.
- `.pi/` changes: committed as `docs(harness): ...` or `chore(harness): ...`.
- Code changes: committed as `feat|fix|refactor(scope): ...`.

## 5. Pushes and PRs

- Push to feature branch, create PR to `develop`.
- Code review required before merging non-trivial changes.
- Never force push to `develop` or shared branches.

## 6. Agent's Git Scope

The root `AGENTS.md` is authoritative here, and it is stricter than what this file used to say.
**No agent commits anything unless the user explicitly asks.** The rule covers every agent alike, the
main session and every subagent, and it covers source, scripts, tests, config, and docs. Being asked
to _make a change_ is not permission to commit it.

Scope per role, with the lanes that fill each role named in
[the gate sequence](../../../workflows/harness-process.md#the-gate-sequence):

- **Implementation roles** leave their changes in the working tree. They commit only on an explicit
  human request, never on their own initiative.
- **Verification roles** hold no write access to application source, so a commit is not theirs to
  make. They report and the human decides.
- **The coordination role** writes no source, so it has nothing to commit. It proposes the commit
  split in the handoff and stops there.

No lane pushes, opens a PR, force-pushes, resets, cleans, or deletes a branch without asking. Those
touch shared history and the old one is not always recoverable.

"Can commit on request" is permission, not a standing licence. The permission is the request that
carried it, and it does not extend to the next change.
