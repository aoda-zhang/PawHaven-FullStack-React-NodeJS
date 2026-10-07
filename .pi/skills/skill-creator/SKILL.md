---
name: skill-creator
description: >
  Create, revise, or retire a skill in this harness. Use when adding a capability under .pi/skills/,
  when a skill has grown past its job, or when deciding whether a piece of knowledge belongs in a
  skill at all.
  Trigger: create a skill new skill write a skill edit a skill refactor a skill skill structure
  SKILL.md frontmatter description references progressive disclosure context window duplicate rule
  canonical owner.
---

# Skill Creator

A skill is reusable capability: **how to do a class of work**. It is not knowledge about PawHaven, not
a rule, not a process, and not a lane.

## Before creating

1. Read the existing skills: `ls .pi/skills/` and `ls .pi/skills/code-review/`.
2. Search for the capability you are about to write: `grep -rn "<topic>" .pi/skills/`.
3. Prefer editing an existing skill over adding one. A second skill for one domain is a second place a
   rule can drift.
4. Decide the canonical owner. Who else already states this rule? If the answer is not "nobody", you
   are duplicating, not authoring.
5. Confirm it is a skill.

## The skill decision test

Answer this question: **does this represent a reusable specialized capability?**

No means do not create a skill:

| What it actually is                                                    | Where it goes                               |
| ---------------------------------------------------------------------- | ------------------------------------------- |
| A PawHaven fact — the module list, the token files, the export surface | `docs/`                                     |
| A hard constraint — a thing that must never be violated                | the rule's existing owner, or the validator |
| Workflow ordering — what happens when                                  | `.pi/workflows/`                            |
| A rule that outlives one workflow — a threshold, a standard, a gate    | `.pi/policies/`                             |
| A responsibility that needs its own context, tools, or permissions     | an agent                                    |
| Which model a lane runs on                                             | `.pi/config/models.yaml`                    |
| A one-off task                                                         | nowhere. Just do the task                   |

A skill that only says what a technology recommends in general is not a skill. Every rule in this repo
answers one of three questions: **where is the code** (a file, an export, a line), **which command
catches it** (a command a reader can re-run), or **what did the older note get wrong** (a correction).
If a rule answers none of them, it is generic advice and belongs in a backlog, added only when a real
change shows the gap.

## Layout

```
skill-name/
├── SKILL.md       # required
├── references/    # only when the detail is longer than the workflow needs
├── scripts/       # only when a deterministic check belongs in a script rather than in prose
└── assets/        # only when a produced artifact is needed
```

Create no directory you have not put a file in. Never create `README.md`, `CHANGELOG.md`,
`QUICK_REFERENCE.md`, or `NOTES.md`. A skill contains only the files that carry it.

The directory name is the skill id and must equal the frontmatter `name`.

## SKILL.md rules

- YAML frontmatter with `name` and `description`.
- `description` states **what it does and when to use it**, plus trigger keywords. The description is
  the level-1 metadata an agent reads before deciding to load the skill, so a vague one means the
  skill never loads.
- Body: imperative, second person. "Run X. Do not do Y. Read A when B applies."
- Only the instructions needed to execute the task. Detail goes to `references/`.
- No history. No "previously", no "an earlier version", no account of what a previous harness did.
  That content occupies context and changes no decision.
- No generic advice the model already has.
- No rule that another skill, the validator, or the workflow already owns.
- Aim for 50–150 lines. Past roughly 500, stop and split into references.

## Progressive disclosure

Three levels, and each level is only loaded when the level above needs it:

```
metadata        ← always present
  SKILL.md      ← loaded when the skill is granted or opened
    references/ ← read only when the task reaches that area
```

`SKILL.md` tells the agent which reference to read and when, in a table. It does not contain the
reference's content. Information is maintained in exactly one of the two.

## Dependency direction

```
workflow → agent → skill → reference / script / asset
```

A skill may depend on another skill when composability is genuinely needed. It may never name a lane,
route work to one, invoke a workflow, reach into a policy, or act as an orchestrator. A reference is
never a second skill.

The rule in one line: a skill teaches a capability, and the capability has to be usable without the
process that happens to call it.

The registry is `.pi/skills/`, declared in `.pi/settings.json`. Never create a second registry, and
never place a `skills/` directory under `.pi/agents/`.

## Validate

```bash
pnpm pi-check      # frontmatter, name, grants, direction, size, reachability
pnpm check:links   # every relative link and anchor resolves
```

Update `EXPECTED_SKILLS` in `scripts/check-pi-harness.mjs` in the same change when the count moves.
A skill is registered in `.pi/settings.json`; a nested skill (under `code-review/`) needs its own
explicit entry, because the loader stops recursing at any directory holding a `SKILL.md`.

Then read the result as an agent would: is the trigger description enough to make you load it, and is
`SKILL.md` enough to act on it without opening every reference?

## Related

- Harness checks: [harness-validator](../harness-validator/SKILL.md)
- Creating an agent: [agent-creator](../agent-creator/SKILL.md)
- Prose rules: [writing-standards](../writing-standards/SKILL.md)
