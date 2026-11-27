# flow-gate

One human gate for the repository, plus a set of unconditional denies. `policy.mjs` holds the
decisions; `index.ts` wires them to the permission hook and the slash command; `policy.test.mjs`
pins every row of the decision table.

## Invariants

The plugin constrains **irreversible** operations only:

- **Publishing git history.** `git add`, `commit`, `push`, `tag`, `merge`, `branch <name>`, and the
  `gh pr` publishing subcommands are allowed only while an active commit grant exists. Read-only git
  commands stay allowed without a grant.
- **Writes into `.git/`**, destructive git verbs, git flags that redirect configuration, hooks,
  output, or the repository location, and nested OpenCode runtimes are denied unconditionally.

Ordinary file edits are not gated here. Git makes an edit reversible, and the written plan plus the
diff review is what catches over-reach; gating every edit behind a short-lived token costs more than
it prevents.

A grant is human-only: slash commands are the one input no model tool can produce. Grants are
project-scoped and outlive the session that created them, so a subagent inherits its parent's
approval.

## Commands

```text
/approve-commit [<ttl>] [<note...>]
/approve-commit revoke
/approve-commit status
```

- The first token is the TTL when it is a whole number of minutes (`45`) or hours (`2h`). Bare
  numbers are minutes. `0`, values above the maximum, and fractional values are refused.
- The TTL defaults to 30 minutes, capped at 120. A configured default is clamped into that range.
- The note is the remaining free text, trimmed and limited to 200 characters. The whole-text notes
  `*`, `all`, `any`, and `everything` are refused because they describe no change.
- A grant stores an absolute expiry time and expires exactly at it: once the clock reaches the
  expiry, the grant is inactive.
- On success the command echoes the TTL, absolute local expiry time, note, and the matching revoke
  command.
- `revoke` clears the grant; `status` reports it. Both refuse trailing tokens.
- Unparseable input changes nothing. A command never partially grants.

## Unconditionally denied

No grant makes these possible:

- edits outside the project root or anywhere under a `.git` directory;
- destructive git verbs: `reset`, `rebase`, `revert`, `cherry-pick`, `clean`, `restore`,
  `update-ref`, `filter-branch`, `reflog`, `checkout`, `stash drop|clear|pop`,
  `branch -d|-D|-m`, plus `rm` and `mv` as shell commands;
- git flags that redirect configuration, hooks, output, or the repository location (`-c`,
  `--ext-diff`, `--output`, `--no-verify`, `--git-dir`, `--work-tree`);
- nested OpenCode runtimes (`opencode run|serve|service|plugin`, directly or through
  `npx`/`pnpm exec`/`pnpm dlx`);
- shell writes that target `.git/` (redirects, `tee`, `cp`, `install`).

A git verb that is neither explicitly read-only nor explicitly publishing is denied, because an
agent alias can hide a mutation behind a name the allowlist does not know.

## What this does not enforce

- The implementer and tester can still write files through shell commands their agent rules allow
  (redirects, heredocs, interpreters). The gate narrows permissions; it is not a file-write
  sandbox. Combined-diff review before hand-off is the mitigation.
- Approval breadth is bounded by the TTL, human authorship of the slash command, and diff review —
  not by a path allowlist. One commit approval covers any publishing command until the grant
  expires.
- The orchestrator's inability to edit files or run shell commands is enforced by its agent
  frontmatter, a static capability; the plugin cannot widen it.
- The gate cannot widen anything. It can only deny, narrow an `ask` to `allow` for a positively
  classified read-only command, or leave the event untouched; and if the plugin fails to load, the
  orchestrator's static deny stays in force.
- If a rule in [`docs/context/agent-constraints.md`](../../../docs/context/agent-constraints.md)
  and this gate disagree, the rule wins — report the gap instead of following the gate. This
  README describes the mechanism; it does not license behaviour the rules forbid.
