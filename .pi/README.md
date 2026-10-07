# pi project harness

**`.pi/` owns this project's agent assets.** Skills, slash-command workflows, and subagent
definitions live here.

This file is the map: what exists, and where the process is defined. It is not the process. The gate
sequence, the evidence contract, and the fix loop live in
[`harness-process.md`](./workflows/harness-process.md); the harness-integrity checks live in
[`harness-validator`](./skills/harness-validator/SKILL.md). Both are linked rather than restated here,
because a rule stated twice drifts from its copy.

## Layout

```
.pi/
├── settings.json          # skill paths, prompt paths, packages, subagent thinking tiers
├── skills/                # the only skill registry
│   ├── <skill>/           # SKILL.md + references/ + scripts/
│   └── code-review/       # meta-skill + 9 doctors nested underneath
├── workflows/             # 10 process definitions, flat (/bug-fix, /feature-development, …)
├── agents/                # 9 subagent definitions, grouped by role
│   ├── orchestrator/      # plans, dispatches, verifies, hands off
│   ├── planning/          # explorer, planner, critic — read-only
│   ├── implementation/    # frontend-dev, backend-dev — the two writers
│   └── verification/      # tester, reviewer, browser-verifier — read-only
└── npm/                   # pi-subagents + deps (gitignored by npm/.gitignore)
```

Each agent's directory is its **role**, and its body declares that role and its **domain** with a
`**Role:**` / `**Domain:**` line. `pnpm pi-check` fails when either line is missing.

## Using it

1. `/trust` once. Project config only loads after trust.
2. `/reload` after changing anything under `.pi/`.
3. Commands in the `/` menu: `/bug-fix`, `/feature-development`, `/refactoring`, and the rest.
4. Subagents via the `subagent` tool: `Use explorer to scan the auth flow.`
5. `pnpm pi-check` and `pnpm check:links` validate the harness. Run both before committing anything
   in `.pi/`.

## Skill, agent, knowledge

**A skill is reusable capability** — how to do a class of work. It is a document, and anything that
reads it, in any context, gets it. Skills hold what a rule _is_.

**An agent is an independent reasoning context** — a context window plus a toolset. What makes it an
agent is what a skill or a workflow step cannot provide: a separate context, a permission boundary, or
a toolset.

**Knowledge is shareable; reasoning context is not.** Two lanes that both need the design-token rule
read the same skill. Two lanes that both need to judge the same diff are not the same context.

**`docs/` is the canonical home for PawHaven-specific project knowledge.** A skill holds capability,
never project facts. The facts a frontend rule checks against live in
[`docs/frontend-portal.md`](../docs/frontend-portal.md); the architecture record lives in
[`docs/architecture/`](../docs/architecture); the current measured state of the repo lives in
[`docs/quality/`](../docs/quality/README.md). No second project-knowledge hierarchy exists under
`.pi/`, because a second one is a second place to look and a second copy to drift.

Creating either is a defined procedure: [`skill-creator`](./skills/skill-creator/SKILL.md) for a
skill, [`agent-creator`](./skills/agent-creator/SKILL.md) for an agent. Both state the decision test
that says whether the thing you have is a skill, an agent, a rule, a doc, or a workflow step.

## The agent team

| Agent              | What it does                                                                                                | Why it is an agent and not a skill or a prompt step                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orchestrator`     | Classifies, plans, dispatches, verifies the joined tree, hands off. Writes no code.                         | The entry point for a task needing more than one lane. It holds `subagent` and the project's skill grants. `defaultContext: fresh` is what makes a clean-context task possible.              |
| `explorer`         | Fast read-only recon. Returns compressed, checkable findings.                                               | It keeps a codebase sweep out of the planner's context. A skill cannot compress a session; a lane can return findings instead.                                                               |
| `planner`          | Writes the implementation plan: files, data shapes, boundaries. Read-only.                                  | A plan must be written by a context that has not already decided how to implement. A plan written by the lane that will execute it encodes that lane's assumptions as given.                 |
| `critic`           | Reads a proposed plan and answers one question: does the existing system establish its premises? Read-only. | Evidence about the existing system, not a second design. Conditional: it runs when a plan crosses a boundary or carries an expensive trade-off.                                              |
| `frontend-dev`     | Writes React/TypeScript, self-tests with react-doctor and the targeted checks.                              | It is the context that holds the change, separate from the one that judges it. It grants `frontend-patterns`, so a component author gets the methodology and a reviewer does not pay for it. |
| `backend-dev`      | Writes NestJS service code, self-tests with typecheck and the targeted tests.                               | Same reason on the other side of the stack, where the constraints differ enough to need their own system prompt.                                                                             |
| `tester`           | Verifies the implementation against the acceptance criteria, criterion by criterion. No `edit` or `write`.  | Verification by the author of the change is not verification. It emits evidence, not a verdict, because the verdict has exactly one producer.                                                |
| `reviewer`         | Reviews the diff across the code-review dimensions. The only lane that emits a verdict.                     | Self-review cannot catch a self-consistent mistake. One verdict producer means one standard for what counts as one. It has no edit tool, so findings go back to the developer lane.          |
| `browser-verifier` | Drives the running portal in a real browser and reports what the screen did.                                | A rendered result and a passing unit test are different facts, and only one of them is observable. Conditional: user-visible surfaces.                                                       |

Every lane holds only the skills it needs via `skills:` frontmatter, and all nine set
`inheritSkills: false`. No agent inherits the whole catalog, because context is the cost being
managed.

## Skills

21 project skills in `.pi/skills/`, grouped by domain. Each agent loads a subset via `skills:`
frontmatter, so there is one copy of every rule and one registry that holds all of them.

| Domain         | Skills                                          | Used by                                                                                                 |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| project rules  | principles                                      | all agents                                                                                              |
| harness        | harness-validator, skill-creator, agent-creator | whoever is changing `.pi/`                                                                              |
| classification | task-classification                             | the session that routes a request                                                                       |
| backend        | backend                                         | backend-dev                                                                                             |
| frontend lens  | frontend-patterns, typescript                   | frontend-dev (typescript also granted by backend-dev)                                                   |
| testing        | testing-standards                               | tester, browser-verifier                                                                                |
| code review    | code-review + 9 doctors                         | the review lane, through the `code-review` table; frontend-dev grants `react-doctor` for its self-check |
| architecture   | architecture-design                             | planner, critic                                                                                         |
| standards      | writing-standards                               | planner, frontend-dev, backend-dev, tester                                                              |

`settings.json` lists the 9 `code-review/<doctor>` skills individually and must keep doing so. pi stops
recursing at any directory containing a `SKILL.md`, so a doctor nested under the `code-review` parent
is only found through its explicit entry. Dropping one silently drops a skill.

## Slash commands (workflows)

10 process definitions in `.pi/workflows/`, one per slash command. Each names its numbered steps, its
decision points, and its failure recovery. None of them names a runner agent: a prompt runs in the
session that invokes it. The files stay flat, because pi's prompt loader scans one directory for `.md`
files and does not descend.

| Command                | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `/feature-development` | Plan, implement, validate a feature end to end |
| `/bug-fix`             | Reproduce, root-cause, fix, verify             |
| `/architecture-change` | Structural change across boundaries            |
| `/design-decision`     | Architecture/design choice from evidence       |
| `/investigation`       | Read-only question from evidence               |
| `/refactoring`         | Behavior-preserving restructure                |
| `/perf-issue`          | Diagnose and fix performance                   |
| `/parallel-execution`  | Split, run in parallel, join                   |
| `/handoff`             | Produce review handoff                         |
| `/harness-process`     | Read the gate sequence itself                  |

## The gate sequence

Nine stages from classification to the human's final review. The sequence, the conditions, the
evidence contract, and the bounded fix loop are defined once, in
[`harness-process.md`](./workflows/harness-process.md#the-gate-sequence). This file does not restate
them, because a third copy is a third thing to update.

## Human gates

The human decides at exactly two points. Everywhere else the harness runs to the end.

**Plan approval.** A Standard or Architectural task stops before implementation and presents the
classification and the plan. Trivial work does not stop.

**Final review.** Nothing is committed, pushed, or released without the human. The handoff is the
artifact they read.

## Model selection

No model name is hardcoded anywhere in `.pi/`. The harness follows whatever model the parent session
runs on, so switching providers switches every lane at once.

Tiering is the one thing that is pinned. `settings.json` sets `thinking` per lane through
`subagents.agentOverrides.<name>.thinking`, and that is the only tiering mechanism. The pattern: high
where a wrong answer is expensive to unwind (orchestration, plan authorship, plan review, review),
low where the work is mechanical (recon, browser checks).

## Changing the harness

A change under `.pi/` is `risk: high` and is not eligible for a lightweight workflow path. It is
harness configuration, and the harness is what makes every other task verifiable, so a quiet mistake
in it is a silent loss of a rule.

Before committing anything under `.pi/`:

```bash
pnpm pi-check      # skills, prompts, agents, grants, direction, size, reachability
pnpm check:links   # every relative markdown link and anchor resolves
```

`pi-check` imports pi's own loaders, so it fails for the reasons pi would fail at startup. Its checks
are listed, with what each one catches and how to read a failure, in
[`harness-validator`](./skills/harness-validator/SKILL.md). Four of them hold the one-way direction
between the layers, `Workflow -> Agent -> Skill -> Reference/Script`, and report with an
`ARCHITECTURE_VIOLATION:` prefix so a reversed dependency is distinguishable from a missing file.
Every allowlist entry in the script is a place the direction has to be argued for, so a new entry
ships with the reason next to it.

The `EXPECTED_*` constants at the top of `scripts/check-pi-harness.mjs` are the thing to update when
the harness changes size, deliberately, in the same change that adds or removes the resource.
