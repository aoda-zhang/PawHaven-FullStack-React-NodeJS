---
name: harness-validator
description: >
  Harness integrity validation — the checks that keep `.pi/` internally consistent. The automated
  pair is `pnpm pi-check` (structure, grants, dependency direction, size, reachability) and
  `pnpm check:links` (relative markdown links and anchors); a few manual checks remain. Load before
  committing anything under `.pi/`, and when a skill, agent, workflow, or grant is added, renamed, or
  removed.
  Trigger: harness integrity check harness validation pi-check check:links skill grant dangling
  grant unknown skill broken link anchor skill id directory name mismatch .pi change harness
  refactor skill rename agent rename before commit.
---

# Harness Validator

Run the automated pair. Every change under `.pi/` clears `pnpm pi-check` and `pnpm check:links`
before it is committed.

```bash
pnpm pi-check      # automated: harness structure, direction, size, reachability
pnpm check:links   # automated: relative markdown links and anchors
```

A harness is config, and config fails silently. A skill named in an agent's `skills:` frontmatter
that no longer exists does not error — the agent quietly stops seeing it, and the rule stops being
applied weeks before anyone notices. None of that is visible in a diff. These checks make it visible.

## What `pnpm pi-check` covers

`scripts/check-pi-harness.mjs` imports pi's own resource loaders, so it fails for the same reasons pi
would fail at startup. It is the only place the concrete checks are implemented; do not duplicate them
in a shell one-liner.

| Check                | Fails when                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| Counts               | The skill, prompt, or agent count differs from `EXPECTED_*`                                              |
| Grant resolution     | An agent grants a skill name that resolves to nothing                                                    |
| Reference resolution | `allowedAgents`, `agentOverrides`, or a `requiredAgents` array names something that does not exist       |
| `skillPath`          | A path resolves to nothing, or a private skill no `skillPath` reaches                                    |
| Orphan skill         | A project skill no agent grants and that is not catalog-only                                             |
| Empty grant          | `inheritSkills: false` with no `skills:` to compensate                                                   |
| Role/domain          | An agent body is missing its `**Role:**` or `**Domain:**` line                                           |
| Duplicate name       | Two resources answer to one invocable skill name                                                         |
| Size                 | A `SKILL.md` exceeds `MAX_SKILL_LINES`                                                                   |
| Skill id             | A `SKILL.md`'s frontmatter `name` differs from its directory name, so one of the two resolves to nothing |
| Reachability         | A file under a skill's `references/` is named nowhere in that skill                                      |
| `skill -> agent`     | A skill names a lane in backticks instead of naming a role or a stage                                    |
| `skill -> workflow`  | A skill links into `.pi/workflows/`, except on the pinned allowlist                                      |
| Second registry      | A `skills/` directory appears under `.pi/agents/`                                                        |
| Second dispatcher    | An agent other than the coordinating one holds `subagent`                                                |
| Skill cycle          | Two skills each have to be read before the other, outside a `## Related` section                         |

The `EXPECTED_*` constants at the top of the script are the thing to update when the harness changes
size, deliberately, in the same change that adds or removes the resource. Never loosen an expectation
to turn a red run green.

`ARCHITECTURE_VIOLATION:` prefixes the direction checks, so a reversed dependency is distinguishable
from a missing file. Each allowlist entry in the script is a place the direction had to be argued for,
so a new entry ships with its reason next to it.

## What `pnpm check:links` covers

`scripts/check-md-links.mjs` resolves every relative markdown link **and every anchor** across `.pi/`,
`AGENTS.md`, `docs/`, and both root READMEs. It skips any directory named `npm`, `node_modules`,
`dist`, or `build`, at any depth.

**It resolves anchors the way GitHub does.** GitHub lowercases the heading, drops every character that
is not a word character, a space, or a hyphen, and turns each space into a hyphen **without collapsing
runs**. So `State access — the real names` slugifies to `#state-access--the-real-names`, with a double
hyphen where the em-dash was. A reader who slugifies differently will "fix" a link that is already
correct. Do not hand-edit an anchor that `check:links` accepts.

## Manual checks

Two things the scripts do not cover.

### 1. The whole link inventory in one view

```bash
grep -rhoE '\]\((\.{1,2}/[^)#]+)\)' .pi AGENTS.md docs README.md README.cn.md --include="*.md" \
  --exclude-dir=npm | sed -E 's/^\]\(//; s/\)$//' | sort -u
```

`check:links` tells you a link is broken; this tells you which links exist, so an unexpected target is
visible. Do not eyeball a subset — read the whole list.

### 2. No live pointer into a retired harness

```bash
grep -rn "\.codebuddy/\|\.opencode/" .pi AGENTS.md docs README.md README.cn.md \
  --include="*.md" --exclude-dir=npm
```

A hit is either a **live pointer** to a directory that no longer exists, which a reader would copy and
run, or a past-tense historical note. Fix the first. `pnpm quality-check` mechanizes this scan; the
grep remains as the manual inventory.

## Failure response

1. **Do not ignore it.** A dangling grant or a dead reference means an agent is running with less
   methodology than you think, and nothing in the output says so.
2. **Fix the reference, or restore the target.** Deleting a skill without removing the grants that
   name it is the common version of this bug.
3. **Re-run until it passes**, then commit the fix in its own change.

## Related

- Harness map: [.pi/README.md](../../README.md)
- Authoring a skill: [skill-creator](../skill-creator/SKILL.md)
- Authoring an agent: [agent-creator](../agent-creator/SKILL.md)
