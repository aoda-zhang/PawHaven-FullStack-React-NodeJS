# Harness Validator

## Contents

- [Why this exists](#why-this-exists)
- [What the harness is now](#what-the-harness-is-now)
- [Automated: `pnpm pi-check`](#automated-pnpm-pi-check)
- [Automated: `pnpm check:links`](#automated-pnpm-checklinks)
- [Manual checks](#manual-checks)
- [1. Skill id is the directory name](#1-skill-id-is-the-directory-name)
- [2. Relative links resolve](#2-relative-links-resolve)
- [3. No references to a retired harness](#3-no-references-to-a-retired-harness)
- [Running them](#running-them)
- [Failure response](#failure-response)

> **Applies to**: manual validation before committing anything under `.pi/`, and CI if you wire it in.
> **Purpose**: integrity checks that the agent harness is internally consistent — no dangling skill
> grants, no dead agent targets, no broken relative links.

**Run the automated pair first.** Every change under `.pi/` clears `pnpm pi-check` and
`pnpm check:links` before it is committed; they are specified under
[Automated: `pnpm pi-check`](#automated-pnpm-pi-check) and
[Automated: `pnpm check:links`](#automated-pnpm-checklinks). The three [manual checks](#manual-checks)
below are what those two scripts do not cover, which is why they are still written out here.

## Why this exists

The harness is config, and config fails silently. A skill named in an agent's `skills:` frontmatter
that no longer exists does not error — the agent just quietly stops seeing it, and you find out weeks
later that a rule stopped being applied. A prompt naming an agent that was retired does not error
either; it falls back to the default agent and the command loses its methodology.

None of that is visible in a diff. These checks make it visible.

## What the harness is now

```
.pi/
├── settings.json                # skills paths, prompts paths, packages, subagents.agentOverrides
├── skills/
│   ├── <skill>/SKILL.md         # the router
│   ├── <skill>/references/*.md  # loaded on demand
│   └── code-review/
│       ├── SKILL.md             # meta-skill that dispatches to the doctors
│       └── <doctor>/SKILL.md    # nested doctors
├── prompts/
│   └── <name>.md                # slash command; frontmatter `description:` only
├── agents/
│   ├── <name>.md                # subagent definition; body IS the system prompt
│   └── frontend-dev/
│       ├── dev.md               # the frontend implementation lane
│       └── skills/              # agent-private skills, loaded via skillPath
└── npm/                         # pi-subagents + deps (gitignored)
```

The `skills/code-review/` directory holds 9 nested doctors — `architecture-doctor`,
`backend-doctor`, `boundary-doctor`, `i18n-doctor`, `react-doctor`, `style-doctor`, `test-doctor`,
`typecheck-doctor`, and `typescript-doctor`. The four frontend doctors were promoted out of the
retired `frontend/review/skills/` tree in the merge, so they are project skills that no agent grants
via `skillPath` any more. `reviewer` reaches all nine through this meta-skill's dispatch table, and
the eight it does not grant in frontmatter are named in `CATALOG_ONLY_SKILLS` in the validator.
`frontend-dev` grants `react-doctor` by name, because it runs it as a mandatory self-check.

**The skill ID is the directory name, and the frontmatter `name` must agree with it** — pi resolves a
skill's invocable name as frontmatter `name` falling back to the directory name, so `style-doctor/` with
`name: styling` would be invoked as `styling` while every reference in the repo still says
`style-doctor`. pi only _warns_ on a malformed name (lowercase `a-z0-9-`, no leading/trailing hyphen),
and never on a name that merely disagrees with its directory — so this drift is invisible to
`pnpm pi-check` and is manual check 1 below. A name containing a slash breaks `/skill:<name>`
invocation silently, which is the case AGENTS.md calls out by name.

`settings.json` lists the 9 `code-review/<doctor>` skills **individually** and must stay that way: pi
stops recursing at any directory containing a `SKILL.md`, so the doctors nested under the `code-review`
parent are only found via those explicit entries. Dropping one silently drops a skill.

## Automated: `pnpm pi-check`

`scripts/check-pi-harness.mjs` imports pi's own loaders, so the check fails for the same reasons pi
would fail at startup. It already covers:

- project skill, prompt, and agent **counts**, against the `EXPECTED_*` constants at the top of the
  script — those constants are the thing to update when the harness changes size.
- every required agent **name** is discovered under `.pi/agents/` (the scan skips `references/`,
  `skills/`, and `SKILL.md`, so nested agent bodies are found).
- every skill named in an agent's `skills:` frontmatter **resolves** — project skill or
  agent-private skill discovered via `skillPath`.
- duplicate skill names and duplicate agent names.
- each `npm:` package in `settings.json` is **installed** under `.pi/npm`, and its manifest-declared
  skill, prompt, and extension paths exist.
- every pi diagnostic (warning included) surfaced as a failure.
- every name in an agent's `allowedAgents:` **resolves to a discovered agent** — an unknown name
  falls back to a default agent at dispatch, so a retired lane silently loses its methodology.
- every `subagents.agentOverrides` key in `settings.json` **resolves to a discovered agent** —
  catches an override left behind by a rename.
- every name in a skill body's `requiredAgents` array **resolves to a discovered agent** — the
  array is the skill's dispatch contract and whoever runs it copies the names out verbatim, so a
  name left behind by a rename becomes a dispatch that resolves to nothing, and nothing else here
  reads a skill's body. Only the array is parsed, never prose.
- every agent `skillPath:` **exists on disk**, resolved relative to the agent definition file —
  `skillPath` is discovery-only, so a broken path drops an agent's private skills with no
  diagnostic.
- every discovered agent-private skill is **reachable from some agent's `skillPath:`** — an
  orphaned private skill is dead weight nobody loads.
- every project skill is **granted in at least one agent's `skills:` frontmatter**, or named in
  the `CATALOG_ONLY_SKILLS` allowlist at the top of the script with a comment naming the
  indirection that reaches it. This is the check that catches a doctor promoted to a project
  skill whose only grant was dropped: the count check, the duplicate-name check, and the
  agent-private `skillPath` reachability check would all still pass.

Do not duplicate this in a shell one-liner, and do not loosen its expectations to make a red run green
— update the counts deliberately, in the same change that adds or removes the resource.

## Automated: `pnpm check:links`

`scripts/check-md-links.mjs` resolves every relative markdown link **and every anchor** across `.pi/`,
`AGENTS.md`, `docs/`, `README.md`, and `README.cn.md`. It skips any directory named `npm`, `handoffs`,
`node_modules`, `dist`, or `build`, at any depth rather than by path prefix — so `.pi/npm` and
`.pi/handoffs` go unscanned, and so would a `docs/build` created tomorrow — and it exits non-zero
listing each break with the file it was found in.

The anchor half is the part a hand-rolled grep cannot do. A path check confirms the file is there; it
cannot tell you that `#the-gate-sequence` still names a heading that exists. That is what this check
catches: every target file present, every link plausible, and a reader sent to a heading that had
been renamed.

**It resolves anchors the way GitHub does, and the rule matters.** GitHub lowercases the heading,
drops every character that is not a word character, a space, or a hyphen, and turns each space into a
hyphen **without collapsing runs**. So `State access — the real names` slugifies to
`#state-access--the-real-names`, with a double hyphen where the em-dash was. A reader who slugifies
differently will "fix" a link that is already correct. Do not hand-edit an anchor that
`check:links` accepts, and when you do add one, write the double hyphen.

## Manual checks

These three are not covered by `pnpm pi-check` or `pnpm check:links`. Check 2 now has an automated
half, but the block below is still the way to see the whole link inventory at once.

### 1. Skill id is the directory name

`pi-check` reads pi's names and rejects unknown grants, but it never compares a name to its
directory. A skill whose directory was renamed while the frontmatter kept the old id — or the reverse —
loads fine and is referenced nowhere.

```bash
for f in $(find .pi/skills .pi/agents -name SKILL.md); do
  d=$(basename "$(dirname "$f")"); n=$(sed -n 's/^name:[[:space:]]*//p' "$f" | head -1)
  [ "$d" != "$n" ] && echo "  MISMATCH $f  dir=$d name=$n"
done
```

Empty output is the pass — currently 27 files scanned (18 project + 9 agent-private), zero
mismatches. Recurse to every `SKILL.md`,
not one level: the doctors sit at depth two (`code-review/*-doctor`) and the agent-private skills at
depth two (`frontend-dev/skills/*`), and they are the ones that drift. `.pi/npm` is not a scan root
here, so the package's own skills are not asserted against this repo's rule.

### 2. Relative links resolve

```bash
# every relative .md link in the harness, in AGENTS.md, and in the docs tree
grep -rhoE '\]\((\.{1,2}/[^)#]+)\)' .pi AGENTS.md docs README.md README.cn.md --include="*.md" \
  --exclude-dir=npm | sed -E 's/^\]\(//; s/\)$//' | sort -u
```

Resolve each against the file that contains it and confirm the target exists. A skill that links to a
deleted reference sends the reader nowhere, and it fails silently at exactly the moment someone needed
it. Exclude `.pi/npm` — that tree is installed dependencies, not this repo's prose.

`pnpm check:links` now runs this check, including the anchor half. The block is kept because it lists
the whole link inventory in one view, which is what makes an unexpected target visible; the script
tells you a link is broken, not which links it introduced.

Do not eyeball this. Earlier passes over this repo found 387 links; 7 were illustrative placeholders
in prose, and 1 was a real break that had been sitting there unnoticed.

### 3. No references to a retired harness

```bash
grep -rn "\.codebuddy/\|\.opencode/" .pi AGENTS.md docs README.md README.cn.md \
  --include="*.md" --exclude-dir=handoffs --exclude-dir=npm
```

Two harnesses have been retired before this one: `.codebuddy/`, then `.opencode/`. Any hit is either a
**live pointer** to a directory that no longer exists — a path a reader would copy and run — or a
historical note. Fix the first; keep the second only where it reads in past tense and names what
replaced it. `.pi/handoffs/` is excluded because those artifacts record the state of the tree at the
time they were written.

The scan covers `.pi/`, the root `AGENTS.md`, `docs/`, and both root READMEs. It used to cover only
the first two, and 17 dead `.opencode/` links sat in `docs/README.md`, `docs/README.cn.md`,
`README.md`, `README.cn.md`, and `docs/features/05-rescue-detail.md` for months — every one of them a
path a reader could copy. A check scoped to the harness alone cannot see a link the harness does not
contain.

## Running them

```bash
pnpm pi-check      # automated: harness structure
pnpm check:links   # automated: relative markdown links and anchors
```

Then run the three manual checks in [Manual checks](#manual-checks) by hand. They are not optional,
and they are not scriptable today.

The `scripts/harness-check.sh` an earlier version of this file recommended never existed and has not
been replaced by a shell script. What replaced it is the pair above: `pi-check` uses pi's own loaders
because nothing else can, and `check:links` is a Node script because anchors need a real Markdown
parser rather than grep.

## Failure response

1. **Do not ignore it.** A dangling grant or dead reference means an agent is running with less
   methodology than you think, and nothing in the output says so.
2. **Fix the reference, or restore the target.** Deleting a skill without removing the grants that
   name it is the common version of this bug.
3. **Re-run until it passes**, then commit the fix in its own small change.

## What was retired with `.opencode/`

The checks above replace four that belonged to the previous harness. They are listed so a reader who
finds them in an old document knows they no longer apply here:

- **Skill grants in `oh-my-opencode-slim.json`.** That config nested agents under `presets.<preset>`
  and granted skills there. pi grants skills per agent in the agent's own `skills:` frontmatter, and
  `pi-check` resolves them.
- **`<agent>_append.md`** prompt appends resolved by slim's built-in agent name list. pi has no append
  mechanism; an agent's body is its system prompt.
- **Frontmatter `agent:` in a command file** picking the runner. Nothing under `.pi/prompts/` declares
  `agent:` — pi prompts run in the session that invokes them.
- **`opencode debug agents`** as the source of truth for which agents exist. The equivalent here is the
  agent list that `pi-check` discovers, or `find .pi/agents -name '*.md' -not -path '*/skills/*'`.
