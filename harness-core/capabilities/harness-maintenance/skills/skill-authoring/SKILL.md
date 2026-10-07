---
name: skill-authoring
description: >
  How to define a skill in this harness, and how to decide whether what you have needs one. A skill
  is a reusable, composable capability with exactly one canonical owner for its rules. Read before
  adding, splitting, merging, renaming, or retiring a skill.
  Trigger: create skill new skill write a skill edit a skill skill structure SKILL.md frontmatter
  description references progressive disclosure duplicate rule canonical owner capability bundle.
---

# Skill authoring

## Before creating

1. **List what exists.** Read the capability bundles, not a directory you remember.
2. **Search for the capability.** A second skill for one domain is a second place a rule drifts.
3. **Prefer editing.** Splitting a 400-line skill into a router plus references beats adding a
   neighbour.
4. **Name the canonical owner.** Who else already states this rule? If the answer is not "nobody", you
   are duplicating, not authoring.
5. **Confirm it is a skill.**

## Is it a skill?

> Does this represent a reusable, focused capability?

No means it goes elsewhere:

| What it actually is                                                                | Where it goes                        |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| A fact about this repository — the module list, the token files, an export surface | `docs/`                              |
| A hard constraint — a thing that must never be violated                            | the rule's existing owner            |
| Workflow ordering                                                                  | a **workflow**                       |
| An invariant that outlives one workflow                                            | a **rule**                           |
| A responsibility with its own context, authority, or verification                  | an **agent**                         |
| How to detect a rule violation                                                     | a **script** inside the owning skill |
| Which intelligence tier an agent runs at                                           | the **model policy**                 |
| A one-off task                                                                     | nowhere. Do the task                 |

A skill that only restates what a technology recommends in general is not a skill. Every rule here
answers at least one of: **where the code is**, **which command catches it**, or **what an older note
got wrong**.

## Where a skill lives

```
harness-core/capabilities/<capability>/skills/<name>/SKILL.md
```

The directory name is the skill's identity and must equal its `name`. The capability it sits in is the
statement that this knowledge serves that cohesive purpose — which is why the placement is a decision
and not a filing convention.

## Structure

```
<name>/
├── SKILL.md       # required
├── references/    # only when the detail is longer than the router needs
├── scripts/       # only when a deterministic check belongs in code
└── assets/        # only when a produced artifact is needed
```

**Create no directory you have not put a file in.** No `README.md`, no `CHANGELOG.md`, no
`NOTES.md`, no `QUICK_REFERENCE.md`. A skill contains only the files that carry it.

## SKILL.md rules

- YAML frontmatter with `name` and `description`, and nothing runtime-specific.
- **`description` states what capability it provides, when to use it, and its trigger context.** It is
  the level-1 metadata read before the skill is opened, so a vague description means the skill never
  loads.
- Body: imperative, second person. "Run X. Do not do Y. Read A when B applies."
- **It is a router and an operating guide, not a knowledge base.** Detail goes to `references/`.
- No history. No "previously", no "an earlier version", no account of a previous harness. That content
  occupies context and changes no decision.
- No rule another skill, a rule file, or a workflow already owns.
- Past roughly 250 lines, stop and split. A skill that has to be that long is two skills or a missing
  reference.

## Progressive disclosure

```
frontmatter   ← always present; the only thing read before deciding to open
  SKILL.md    ← read when the skill is opened
    references/  ← read only when the task reaches that area
      scripts/   ← executed, never read
```

`SKILL.md` carries a table saying which reference to read and when. It does not contain the
reference's content. Information is maintained in exactly one of the two.

## One rule, one owner

This is the rule the whole harness turns on.

> Every rule has exactly one canonical owner. Everything else **points at** it.

A rule that is stated in two places is stated wrong in one of them, and nothing says which. So:

- The **implementation** rule lives in the skill that owns the domain: how to style, how to type, how
  to build a backend, how to write a test.
- The **detection** rule — the command, and how to judge a violation — lives in the review dimension
  that owns the check.
- A **script** executes a rule. It never restates one, and it never contains project architecture.

When you catch yourself writing "all user-visible text must be translated" twice, delete one copy and
replace it with a link to the owner.

## Dependencies

```
workflow → agent → skill → reference / script / asset
```

A skill may depend on another skill when composability is genuinely needed. It may never name an agent
to dispatch to, start a workflow, or act as an orchestrator.

The rule in one line: **a skill teaches a capability, and the capability has to be usable without the
process that happens to call it.**

## Validate

```bash
pnpm harness:check     # canonical structure, name/directory agreement, reachability, direction
pnpm harness:generate  # regenerate every runtime's output
pnpm pi:check          # the runtime's own loader accepts what was generated
pnpm check:links       # every relative link and anchor resolves
```

Then read the result as an agent would: is the description enough to make you load it, and is `SKILL.md`
enough to act on without opening every reference?

## Retiring one

Remove the definition, then remove every grant that names it and every link to it. A skill deleted
without its grants removed leaves agents quietly running with less methodology than you think.

## Related

- Defining an agent: [agent-authoring](../agent-authoring/SKILL.md)
- Keeping the harness correct: [harness-validation](../harness-validation/SKILL.md)
