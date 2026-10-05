# Handoffs

Long-running or multi-agent work continues through a written handoff, not through the
conversation that produced it. A handoff is the artifact a fresh context reads instead of
re-deriving. Master prompt §18 defines the format; this file is the local contract.

## When to write one

Write a handoff when any of these is true:

- The work spans more than one session, or more than one agent lane.
- Work stops mid-task — blocked, parked, or out of context — and something else has to pick it up.
- A plan was approved and the executor is not the planner.
- A review is being handed to someone who did not write the diff.

Do not write one for a single reversible change that finished in one pass; `/handoff` produces the
review summary for those, and it lives in the reply.

If you are running a workflow prompt, write the handoff before you stop, not when someone asks. A
task that ends without one has handed off nothing.

## Where it lives

```
.pi/handoffs/<slug>.md
```

One file per task or per lane. `<slug>` is lowercase kebab-case, matching the branch or feature it
describes: `harness-implementation.md`, `adoption-application-flow.md`. Name it for the work, not
for the day.

Handoffs are committed project assets, not scratch notes. They record what was decided and what was
actually run, so a later session does not re-litigate either.

## Sufficiency rule

§18: **a handoff must be sufficient for a fresh context to continue without rediscovering
everything.**

Operationally: a reader with no memory of the originating conversation must be able to run the next
action using only this file plus the paths it names. Test before you finish — if the next step needs
a fact you hold in your head but did not write down, the handoff is incomplete. State the facts a
reader cannot infer from the repo: approvals, rejected options, commands already run with their
result, and what is deliberately untouched.

## Fields

All eight, in this order. Use the field names below as headings — they are the vocabulary, and a
missing field is a hole in the reader's model rather than an empty section.

| #   | Field                      | Requirement                                                                                                                                                                                                                                                                                             |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Task**                   | What was asked, in one paragraph. Point at the source of authority — a spec file, a plan, an issue, an owner instruction — rather than paraphrasing it and letting the reader trust the paraphrase. Name the branch. Record blocking runtime setup here if the work cannot start without it.            |
| 2   | **Current state**          | Where the work stands right now, one or two lines: inspected / planned / partially applied / waiting on a decision. Say what is in the working tree, not what you intend to do.                                                                                                                         |
| 3   | **Completed work**         | What is done and verifiable. Cite paths for every artifact — files, agents, skills, modules, commits. Name things you confirmed are already correct and must not be reworked; that is what stops a fresh context from duplicating finished work. Include the classification if the task was classified. |
| 4   | **Important decisions**    | Choices that constrain the remaining work, each with the reason and the option rejected. Mark which were user-approved. An unlabelled decision reads as open, and the next agent will make it again.                                                                                                    |
| 5   | **Verification performed** | Commands actually run, with what they showed. Per the no-plausibility rule, a claim with no command behind it is not verification. Say which checks are still expected and by whom.                                                                                                                     |
| 6   | **Known issues**           | Everything that will mislead a reader who does not know it: expected failures and their baseline, files that are dirty for unrelated reasons, ordering constraints between lanes, anything deliberately left broken.                                                                                    |
| 7   | **Remaining work**         | What is left, in execution order, grouped by lane or wave when the work is parallel. State each lane's file set and its explicit non-goals so a reader cannot drift outside it.                                                                                                                         |
| 8   | **Next action**            | The single next thing to do, phrased so it can be started without further reading. If it is a dispatch, name the lane and what it carries.                                                                                                                                                              |

## Template

Copy this block into a new file under `.pi/handoffs/` and fill every field. Delete bracketed prompts,
not headings.

````markdown
# Handoff — <task title>

## Task

<what was asked, in one paragraph>.
Authority: <path or instruction that defines the work>.
Branch: `<branch>`.
<optional: runtime setup required before work can start>.

## Current state

<inspected | planned | partially applied | waiting on a decision>.
Working tree: <what is modified, added, or untouched>.

## Completed work

- <done item>, at `<path>`
- <done item>
- Verified already compliant, do not rework: <list>

Classification (§6):

```json
{
  "taskType": "<feature|bug-fix|refactor|architecture-change|investigation|performance>",
  "secondaryTasks": [],
  "scope": [],
  "complexity": "<low|medium|high>",
  "risk": "<low|medium|high|critical>",
  "confidence": 0.0,
  "workflow": "<canonical prompt name>",
  "requiresClarification": false
}
```
````

## Important decisions

1. **<decision>** — <reason>. Rejected: <option>. <user-approved | agent-judgement>.

## Verification performed

- `<command>` — <what it showed>
- Expected and not yet run: `<command>`, run by <lane/role>

## Known issues

- <thing that will mislead a fresh context, and what to do about it>

## Remaining work

**Wave 1 (parallel, disjoint files):**

- **Lane <X> — <name>.** <scope>. Files: `<paths>`. Does NOT touch: `<paths>`.

## Next action

<the one thing to do next, startable without further reading>.

```

## Worked example

[`harness-implementation.md`](./harness-implementation.md) is the reference. It shows the decisions
field carrying owner approvals and rejected options, the verification field listing the grep/find
commands behind each claimed gap, a known-issues field that names the intermediate red state of
`pnpm pi-check` so a later lane does not chase it as a regression, and remaining work split into
waves with per-lane file sets and non-goals. Read it before writing your first handoff here.

## Related

- `/handoff` — the workflow that produces a review handoff for a finished change.
```
