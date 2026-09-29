# Harness Validator

## Contents

- [Why this exists](#why-this-exists)
- [What the harness is now](#what-the-harness-is-now)
- [Checks](#checks)
- [1. Skill grants resolve](#1-skill-grants-resolve)
- [2. Every skill has a router and a description](#2-every-skill-has-a-router-and-a-description)
- [3. Command `agent:` targets exist](#3-command-agent-targets-exist)
- [4. Append files match a real slim agent](#4-append-files-match-a-real-slim-agent)
- [5. Relative links resolve](#5-relative-links-resolve)
- [6. No references to the retired harness](#6-no-references-to-the-retired-harness)
- [Running them](#running-them)
- [Failure response](#failure-response)

> **Applies to**: manual validation, and CI if you wire it in.
> **Purpose**: integrity checks that the agent harness is internally consistent — no dangling skill
> grants, no dead `agent:` targets, no broken relative links.

## Why this exists

The harness is config, and config fails silently. A skill named in `oh-my-opencode-slim.json` that no
longer exists does not error — the agent just quietly stops seeing it, and you find out weeks later
that a rule stopped being applied. A command with `agent: architect` after `architect` was retired
does not error either; it falls back to the default agent and the command loses its methodology.

None of that is visible in a diff. These checks make it visible.

## What the harness is now

```
.opencode/
├── opencode.json                  # { "lsp": true }
├── oh-my-opencode-slim.json       # preset: models, per-agent skill grants, disabled agents
├── oh-my-opencode-slim/
│   └── <agent>_append.md          # pure prompt append onto a slim built-in agent
├── agent/
│   └── <name>.md                  # custom subagent; body IS the system prompt
├── command/
│   └── <name>.md                  # slash command; frontmatter `agent:` picks the runner
└── skills/
    ├── <skill>/SKILL.md           # the router
    └── <skill>/references/*.md    # loaded on demand
```

**The directory name is the skill ID, not the frontmatter `name`.** `skills/frontend/style/` is
invoked as `style` even though its frontmatter says `name: styling`. A mismatch in frontmatter
`name` is a cosmetic display label; a mismatch between the directory name and what the config grants
is a real outage.

## Checks

### 1. Skill grants resolve

The highest-value check. Every skill listed in any `skills` array in `oh-my-opencode-slim.json`, and
every `*_append.md` that names a skill, must resolve to a real skill directory — in the project
(`.opencode/skills/`) **or** in the user's global set (`~/.config/opencode/skills/`).

The real config shape nests agents **directly** under each preset. There is no `agents` key, so read
`presets.<preset>.<agent>.skills`. An earlier version of this check iterated `presets.<preset>.agents`,
which is always `undefined` — the loop body never ran, the check printed `PASS`, and it could not
detect a dangling grant in the very file it reads.

Three things make the check work, and all three were wrong before:

- **Traverse the config by shape.** Select agents by "entry carrying a `skills` array" rather than a
  hardcoded name list, so it cannot silently skip a grant again. It exits non-zero on a broken grant,
  and also on zero grants checked, so a traversal that stops matching anything fails loudly instead of
  passing quietly.
- **Build the skill-id set recursively.** A skill id is the basename of any directory holding a
  `SKILL.md`, and those are nested one and two levels deep (`code-review/*-doctor`, `frontend/*`).
  A top-level `readdirSync` misses all 15 of them, which turns every one into a false "missing skill"
  report. 39 false positives train you to ignore the check, which is worse than having none.
- **Include the global skill set.** A grant may legitimately name a skill the project does not ship.
  `presets.*.oracle` grants `simplify`, which lives only in `~/.config/opencode/skills/simplify/` and is
  managed by the plugin, not by this repo. A check that only looks at `.opencode/skills/` reports it
  as dangling, and the correct response to that report is to stop trusting the check. Searching only
  the project directory is what made `simplify` look broken in the first place. The global root is
  resolved through `os.homedir()` and is skipped silently when absent, so the check still runs on a
  machine with no global skills.

```bash
node -e '
const fs = require("fs"), os = require("os"), path = require("path");
const cfg = JSON.parse(fs.readFileSync(".opencode/oh-my-opencode-slim.json", "utf8"));
const have = new Set(), clash = [];
function add(id) { if (have.has(id)) clash.push(id); else have.add(id); }
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (fs.existsSync(path.join(p, "SKILL.md"))) add(e.name);
    walk(p);
  }
})(".opencode/skills");
const projectCount = have.size;
const globalRoot = path.join(os.homedir(), ".config", "opencode", "skills");
let globalCount = 0;
if (fs.existsSync(globalRoot)) {
  for (const e of fs.readdirSync(globalRoot, { withFileTypes: true })) {
    if (e.isDirectory() && fs.existsSync(path.join(globalRoot, e.name, "SKILL.md"))) { add(e.name); globalCount++; }
  }
}
if (clash.length) console.log(`  WARN duplicate skill id basename: ${[...new Set(clash)].join(", ")}`);
console.log(`  ids: ${projectCount} project + ${globalCount} global`);
let bad = 0, checked = 0;
for (const [setName, set] of Object.entries(cfg.presets || {})) {
  for (const [agent, spec] of Object.entries(set)) {
    if (!spec || !Array.isArray(spec.skills)) continue;
    for (const s of spec.skills) {
      if (s === "*" || s.startsWith("!")) continue;
      checked++;
      if (!have.has(s)) { console.log(`  FAIL ${setName}/${agent} grants missing skill "${s}"`); bad++; }
    }
  }
}
if (bad) { console.log(`  ${bad} broken grant(s) of ${checked} checked`); process.exit(1); }
if (!checked) { console.log("  FAIL 0 grants checked — the traversal matched nothing"); process.exit(1); }
console.log(`  PASS (${checked} grants checked, ${have.size} skills known)`);
'
```

An empty result is the goal. A new skill that nobody grants is dead weight; a grant that resolves to
nothing in **either** root is a silent hole. Note that `"skills": ["*"]` is a wildcard and is not
counted, so the checked total will not match the total number of entries in the file.

### 2. Every skill has a router and a description

A skill is any directory containing a `SKILL.md`. `frontend/` has no `SKILL.md` of its own — it is a
grouping directory — while `code-review/` has one _and_ sub-skills, because it is a meta-skill that
dispatches to them. Recurse; do not assume one level.

```bash
for f in $(find .opencode/skills -name SKILL.md); do
  n=$(echo "$f" | sed 's|.*/skills/||; s|/SKILL.md||')
  head -1 "$f" | grep -q '^---$' || echo "  FAIL $n has no frontmatter"
  grep -q '^description:' "$f"   || echo "  FAIL $n has no description"
done
```

`description` is what the model matches against when deciding to load the skill. A missing or vague
one means the skill is never chosen, and nothing reports that.

Skill IDs currently in the repo, all reachable as granted:

| Group                   | IDs                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| repo-wide               | `principles` · `project-rules` · `writing-standards`                                                                                                                    |
| backend                 | `backend` · `testing-standards`                                                                                                                                         |
| architecture            | `architecture-design`                                                                                                                                                   |
| frontend (`/`)          | `react` · `component` · `style` · `i18n` · `react-query` · `redux` · `react-hook-form`                                                                                  |
| review (`code-review/`) | the meta-skill plus `typecheck-doctor` · `react-doctor` · `style-doctor` · `i18n-doctor` · `backend-doctor` · `boundary-doctor` · `architecture-doctor` · `test-doctor` |

A skill that no agent is granted is dead weight. Either grant it or delete it.

### 3. Command `agent:` targets exist

```bash
opencode debug agents | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
  const names = new Set(JSON.parse(d).map(a => a.name)); console.log([...names].join("\n"));})'
```

Every `agent:` value in `.opencode/command/*.md` must be in that list. Currently all nine commands
target `orchestrator`. A command pointing at a retired agent silently loses its methodology.

### 4. Append files match a real slim agent

`<agent>_append.md` is resolved by agent name. An append for an agent that does not exist is a file
nobody reads.

```bash
ls .opencode/oh-my-opencode-slim/*_append.md | sed 's/.*\///;s/_append\.md//' | tr '\n' ' '; echo
```

Valid names are slim's registry: `orchestrator`, `fixer`, `designer`, `oracle`, `explorer`,
`librarian`, `council`, `councillor`. A **custom agent in `.opencode/agent/` cannot have an append
and cannot be granted project skills** — its skill list is the global set only. If a custom agent
needs a rule, the rule goes in its own body.

### 5. Relative links resolve

```bash
# every relative .md link in the harness and in AGENTS.md
grep -rhoE '\]\((\.{1,2}/[^)#]+)\)' .opencode AGENTS.md --include="*.md" \
  | sed -E 's/^\]\(//; s/\)$//' | sort -u
```

Resolve each against the file that contains it and confirm the target exists. A skill that links to a
deleted reference sends the reader nowhere, and it fails silently at exactly the moment someone needed
it.

Do not eyeball this. Earlier passes over this repo found 387 links; 7 were illustrative placeholders
in prose, and 1 was a real break that had been sitting there unnoticed.

### 6. No references to the retired harness

```bash
grep -rn "\.codebuddy/agents\|\.codebuddy/workflows\|dispatcher\.md\|main-agent\.md" \
  .opencode AGENTS.md --include="*.md"
```

Any hit is a stale reference. `.codebuddy/workflows/*.md` were byte-synced source copies of the
commands and are gone; a link to one resolves to nothing.

## Running them

There is no `scripts/harness-check.sh`. It was recommended by an earlier version of this file and
never existed. Until someone writes it, run the blocks above by hand or fold them into a
`package.json` script.

Prefer a real markdown link checker (`lychee`, `markdown-link-check`) for check 5 once there are
enough links for grep to be the wrong tool.

## Failure response

1. **Do not ignore it.** A dangling grant or dead `agent:` target means an agent is running with
   less methodology than you think, and nothing in the output says so.
2. **Fix the reference, or restore the target.** Deleting a skill without removing its grants is the
   common version of this bug.
3. **Re-run until it passes**, then commit the fix in its own small change.
