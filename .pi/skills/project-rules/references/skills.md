# Skill Authority

> **Applies to**: whoever writes or edits anything under `.pi/skills/` and `.pi/agents/*/skills/`.
> **Purpose**: what a skill is allowed to assert, and what earns a new rule.

## A skill states what this repo does

A skill is a record of a decision this codebase already made. It is not a tutorial and not a
restatement of how the technology works in general.

| A skill may assert                                    | A skill may not assert                    |
| ----------------------------------------------------- | ----------------------------------------- |
| The pattern this repo uses, with the file it lives in | What the technology recommends in general |
| A constraint that a command here enforces             | A constraint a reader might wish for      |
| A correction to an older, wrong note                  | A rule with no example in this repo       |

Concretely, every rule in a PawHaven skill should be answerable to one of three questions:

1. **Where is the code?** — name the file, the export, or the line.
2. **Which command catches it?** — `pnpm typecheck`, `pnpm token-check`, `pnpm pi-check`, a `rg`
   pattern the reviewer can re-run.
3. **What did the older note get wrong?** — if the answer is nothing, the rule may be generic advice
   and does not belong here yet.

The `backend` skill is the reference implementation. Its [Corrections to the old
docs](../../backend/SKILL.md#corrections-to-the-old-docs) section lists six claims inherited from a
retired harness that turned out to be false, which is exactly what a skill earns its keep doing: the
reader learns which note not to trust.

## Best practice is a backlog, not a gate

General React, TypeScript, NestJS, or accessibility practice is **not** in these skills yet, and adding
it is not free. A generic rule in a skill is a finding a reviewer must adjudicate on every future
change, and this repo has no tooling to enforce most of it — so it arrives as recurring noise rather
than as a standard.

**This repo has no mechanism for scoring a run.** No task suite, no metric, nothing that reports
whether a harness change helped. The foundation under every rule in these skills is therefore weaker
than it looks, and this file should not pretend otherwise. Two things stand in for measurement, and
neither is measurement:

1. **The command ran.** A rule naming a command you have executed, and whose output you have actually
   seen, is grounded. A rule you have not run is a hypothesis.
2. **A real change found the gap.** The strongest prompt is a review of an actual change where the
   current skills did not catch something, or two agents independently reaching for advice the
   skills do not carry. Record in one line, next to the rule, what prompted it.

That is a lower bar than a measured one, and it is the actual bar here. Do not argue for a rule by
asserting that it is best practice — the two questions are whether **this repo now does the thing**,
and whether **anyone would notice if it stopped**.

**The question a rule has to answer is "does this repo do this?", never "should code do this?"** A
rule the repo does not yet follow belongs in a backlog note, or nowhere.

**When adding a rule, run its command.** Paste the output into the skill if the rule is not obvious
from the pattern alone. A rule whose command has never been executed is a hypothesis, and it is the
commonest way a skill in this repo became wrong: written from what the technology usually looks like,
with nothing in the harness to notice.

## Every rule is executable in this harness

A rule naming a tool that does not exist is worse than no rule, because it looks like a gate and is
not one. The vocabulary is:

| Instead of                                   | Write                                             |
| -------------------------------------------- | ------------------------------------------------- |
| `search_content`, `search_file`, `read_file` | a `rg` or `find` command                          |
| `execute_command`                            | a `bash` command                                  |
| `read_lints`                                 | `pnpm typecheck`, `pnpm lint`                     |
| `use_skill("<name>")`                        | read the `SKILL.md` path                          |
| `task` / `background: true` / `task_status`  | the `subagent` tool, `async`, `bg_wait`, `status` |

Those first four belonged to a retired harness and survived in several doctors. A reviewer following
one cannot run it, and the finding it was supposed to produce never appears.

## Corrections beat silence

When a skill is wrong, fix it in the same change and record what it used to say. A silently corrected
skill teaches nothing, and the next reader re-derives the same wrong belief from a different skill.
Sections named _Corrections_, or a dated note under the rule, are how a skill carries that history —
see [`backend`](../../backend/SKILL.md) and the i18n
[module inventory](../../../agents/frontend-dev/skills/i18n/references/module-inventory.md), which
dates its counts and says they are an indication, not a contract.

## What a skill must not name

A path that does not exist. `apps/frontend/admin` was scanned by two doctors for months; only
`apps/frontend/portal` exists. When a skill lists example paths, either verify them or mark the list
as illustrative and say so in the same breath — `typecheck-doctor` does the latter, `react-doctor`
did not, and the difference is invisible until an agent tries to run it.

## Related

- [Documentation rules](./documentation.md) — the read/write order a skill's claims must respect
- [Harness validator](./harness-validator.md) — the integrity checks before committing anything here
- [Architecture rules](./architecture.md) — the service and package map these skills describe
