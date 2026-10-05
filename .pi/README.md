# pi project harness

**`.pi/` is the owner of this project's agent assets.** Skills, slash-command workflows, and
subagent definitions live here. The `.opencode/` copy that preceded it was legacy, has been deleted,
and nothing in `.pi/` ever read from it.

This file is the map of the harness: what exists, why each piece is a separate thing, and where the
process is defined. It is not the process. The gate sequence, the evidence contract, and the fix
loop live in
[`project-rules/references/orchestrator.md`](./skills/project-rules/references/orchestrator.md), and
the harness-integrity checks live in
[`project-rules/references/harness-validator.md`](./skills/project-rules/references/harness-validator.md).
Both are linked rather than restated here, because a rule stated twice drifts from its copy.

## Layout

```
.pi/
├── settings.json          # skills, prompts, packages, subagent model config
├── skills/                # 18 project skills (SKILL.md + references/)
│   ├── <skill>/           # 9 top-level skills
│   └── code-review/       # meta-skill + 9 doctors nested underneath
├── prompts/               # 9 slash commands (/bug-fix, /feature-development, …)
├── agents/                # 9 subagent definitions
│   ├── orchestrator.md    # plans + dispatches, holds no dedicated edit tool
│   ├── scout.md           # read-only recon
│   ├── architect.md       # read-only planning
│   ├── oracle.md          # read-only plan reviewer
│   ├── frontend-dev/      # dev.md = the React/TS writer (name: frontend-dev)
│   │   └── skills/        # its 9 private skills, loaded via skillPath
│   ├── backend-dev.md    # NestJS writer
│   ├── tester.md          # acceptance verification
│   ├── reviewer.md        # the only verdict producer
│   └── browser-verifier.md # drives the running portal, read-only toward source
├── handoffs/              # structured handoff artifacts for long-running work
└── npm/                   # pi-subagents + deps (gitignored by npm/.gitignore)
```

## Using it

1. `/trust` once. Project config only loads after trust.
2. `/reload` after changing anything under `.pi/`.
3. Commands appear in the `/` menu: `/bug-fix`, `/feature-development`, `/refactoring`, and the rest.
4. Subagents are available via the `subagent` tool: `Use scout to scan the auth flow.`
5. `/subagents-doctor` checks pi-subagents setup.
6. `pnpm pi-check` and `pnpm check:links` validate the harness. Run both before committing anything
   in `.pi/`.

## Skill vs agent vs knowledge

Three different things get confused here, and the confusion costs a refactor a week.

**A skill is reusable expertise.** It is a document. Anything that can read it, in any context, gets
it. Skills hold what a rule _is_: the token order, the gateway auth boundary, the evidence format.

**An agent is an independent reasoning context.** It is a context window plus a toolset. What makes
it an agent is what it holds that a skill or a workflow step cannot provide: a separate context, a
permission boundary, or a toolset.

**Knowledge is shareable, context is not.** The working rule is: **share knowledge, not reasoning
context.** Two lanes that both need the design-token rule should read the same skill. Two lanes that
both need to _judge the same diff_ should not be the same context.

That rule is why the four frontend doctors were promoted from agent-private skills to project skills.
While they were private, a developer and a reviewer could only read the same rule by sharing a
session, and the two sessions disagreed.

## The agent team

| Agent              | What it does                                                                                                         | Why it is an agent and not a skill or a prompt step                                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orchestrator`     | Classifies, plans, dispatches, verifies the joined tree, hands off. Writes no code.                                  | It is the entry point for a task that needs more than one lane. It needs a context outside the caller's session that still holds `subagent` and the project's skill grants. `defaultContext: fresh` is what makes a clean-context task possible. |
| `scout`            | Fast read-only recon. Returns compressed, checkable findings.                                                        | It keeps a codebase sweep out of the planner's context. A skill cannot compress a session; a lane can return findings instead. `thinking: low` because speed is the product.                                                                     |
| `architect`        | Writes the implementation plan: files, data shapes, boundaries. Read-only.                                           | The plan must be written by a context that has not already decided how to implement. A plan written by the lane that will execute it encodes that lane's assumptions as given.                                                                   |
| `oracle`           | Reads a proposed plan and answers one question: is it fit to implement? Read-only.                                   | The planner reading its own plan is not a review. Conditional: it runs when a plan crosses a boundary or carries an expensive trade-off.                                                                                                         |
| `frontend-dev`     | Writes React/TypeScript, self-tests with React Doctor and the targeted checks.                                       | It is the context that holds the change, separate from the one that judges it. It carries the nine private React skills, so a component author gets the methodology loaded and a reviewer does not pay for it.                                   |
| `backend-dev`      | Writes NestJS service code, self-tests with typecheck and the targeted tests.                                        | Same reason as `frontend-dev`, on the other side of the stack. Its constraints differ from the frontend's, so it needs its own system prompt rather than a branch in one.                                                                        |
| `tester`           | Verifies the implementation against the acceptance criteria, criterion by criterion.                                 | Verification by the author of the change is not verification. It emits evidence, not a verdict, because the verdict has exactly one producer.                                                                                                    |
| `reviewer`         | Reviews the diff across the code-review dimensions. The **only** lane that emits `VERDICT: PASS` or `VERDICT: FAIL`. | Self-review cannot catch a self-consistent mistake. It is the single place a verdict is produced, so there is one standard for what counts as one. It has no edit tool, so findings go back to the developer lane.                               |
| `browser-verifier` | Drives the running portal in a real browser and reports what the screen did.                                         | A rendered result and a passing unit test are different facts, and only one of them can be observed. It holds no edit tool, so it cannot "fix while verifying" and lose independence. Conditional: it runs on user-visible surfaces.             |

Every lane holds only the skills it needs via `skills:` frontmatter, plus `skillPath` for
agent-private skills. No agent inherits all 18 project skills, because context is the cost being
managed.

`orchestrator` is the only agent holding `subagent`. `maxSubagentDepth: 1` keeps every lane it
dispatches a leaf, so recursion cannot grow.

## What was removed and why

This was a reduction, not a relocation. Two agent definitions were deleted, and nine agents remain.

**`frontend` is gone.** It was a router whose only job was splitting a writer from a reviewer. It
held no independent context of its own, so it could not review anything; it delegated to `dev` and
`review`. A dispatch already names its lane, so the router added a hop and no capability.

**`review` is gone.** It was a second review lane carrying the same review dimensions as `reviewer`
with a different verdict format, which meant two ways to say the same thing and two places to look
for a verdict. Its work is `reviewer`'s. Its four frontend doctors (react, style, i18n,
typescript) were promoted to project skills under `code-review/`, so the rules survive the merge and
both the writer and the reader reach them.

**`dev` is now `frontend-dev`.** With the router gone, a bare `dev` was ambiguous on its own. The
directory moved from `.pi/agents/frontend/dev/` to `.pi/agents/frontend-dev/` and carries its nine
private skills with it.

## Skills

18 project skills in `.pi/skills/`, grouped by domain. Each agent loads a subset via `skills:`
frontmatter, so there is one copy of every rule.

| Domain         | Skills                                                                                                                                      | Used by                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| project rules  | project-rules, principles                                                                                                                   | all agents                                                                                                            |
| classification | task-classification                                                                                                                         | main session, at routing time                                                                                         |
| backend        | backend                                                                                                                                     | backend-dev                                                                                                           |
| testing        | testing-standards                                                                                                                           | tester, browser-verifier                                                                                              |
| code review    | code-review + 9 doctors (`architecture-`, `backend-`, `boundary-`, `i18n-`, `react-`, `style-`, `test-`, `typecheck-`, `typescript-doctor`) | reviewer (all nine, through the `code-review` dispatch table), frontend-dev (`react-doctor` only, for its self-check) |
| frontend facts | frontend                                                                                                                                    | frontend-dev                                                                                                          |
| architecture   | architecture-design                                                                                                                         | architect, oracle                                                                                                     |
| standards      | writing-standards                                                                                                                           | architect, frontend-dev, backend-dev, tester                                                                          |

9 agent-private skills sit outside `.pi/skills/` and load only into `frontend-dev` via
`skillPath: ./skills`. They hold the **lens**: how to write React here. The **facts** that lens
checks against live once in the shared `frontend` project skill, so a rule and the fact it checks
cannot drift apart.

| Agent          | Private skills                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `frontend-dev` | react, component, style, i18n, react-query, react-hook-form, redux, typescript, frontend-patterns |

`settings.json` lists the 9 `code-review/<doctor>` skills individually and must keep doing so. pi
stops recursing at any directory containing a `SKILL.md`, so a doctor nested under the `code-review`
parent is only found through its explicit entry. Dropping one silently drops a skill.

## Slash commands (prompts)

9 slash commands in `.pi/prompts/`:

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

## The gate sequence

Nine stages from classification to the human's final review, with three of them conditional on
scope and risk. It is defined once, in
[`orchestrator.md`](./skills/project-rules/references/orchestrator.md#the-gate-sequence), along with
the [evidence contract](./skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires)
that says what a `PASS` is and
[the bounded fix loop](./skills/project-rules/references/orchestrator.md#the-bounded-fix-loop) that
decides whether a failure is an implementation defect or a wrong plan.

This file does not restate those rules. A third copy is a third thing to update.

## Human gates

The human decides at exactly two points, and everywhere else the harness runs to the end.

**Plan approval.** A Standard or Architectural task stops before implementation and presents the
classification and the plan. Trivial work does not stop, because there is nothing to weigh.

**Final review.** Nothing is committed, pushed, or released without the human. The handoff is the
artifact they read. `/handoff` produces it and stops there.

## Model selection

No model name is hardcoded anywhere in `.pi/`. This repo pins no provider and no model, and that is
deliberate: it means the harness follows whatever model the parent session runs on, and switching
providers switches every lane at once.

Tiering is the one thing that is pinned. `settings.json` sets `thinking` per agent through
`subagents.agentOverrides.<name>.thinking`, and that is the only tiering mechanism. The model itself
is inherited from the parent session.

```json
"subagents": {
  "agentOverrides": {
    "orchestrator":     { "thinking": "high" },
    "oracle":           { "thinking": "high" },
    "scout":            { "thinking": "low" },
    "architect":        { "thinking": "high" },
    "frontend-dev":     { "thinking": "medium" },
    "backend-dev":      { "thinking": "medium" },
    "tester":           { "thinking": "medium" },
    "reviewer":         { "thinking": "high" },
    "browser-verifier": { "thinking": "low" }
  }
}
```

The pattern is legible: high where a wrong answer is expensive to unwind (orchestration, plan
review, plan authorship, review), low where the work is mechanical (recon, browser checks).

## Changing the harness

A change under `.pi/` is `risk: high` and is not eligible for a lightweight workflow path. It is
harness configuration, and the harness is what makes every other task verifiable, so a quiet mistake
in it is a silent loss of a rule. [`task-classification`](./skills/task-classification/SKILL.md)
carries the classification rules; this section only says what the change has to clear.

Before committing anything under `.pi/`:

```bash
pnpm pi-check      # 18 project skills, 9 prompts, 9 agents, 9 agent-private skills, zero diagnostics
pnpm check:links   # every relative markdown link and anchor resolves
```

`pi-check` imports pi's own loaders, so it fails for the reasons pi would fail at startup: wrong
counts, a skill grant that names nothing, an `allowedAgents` or `agentOverrides` key left behind by
a rename, a `requiredAgents` name in a skill body left behind by the same rename, a `skillPath` that
resolves to nothing, a project skill no agent grants. The
`EXPECTED_*` constants at the top of `scripts/check-pi-harness.mjs` are the thing to update when the
harness changes size, deliberately, in the same change that adds or removes the resource.

`check:links` runs `scripts/check-md-links.mjs` over `.pi/`, `AGENTS.md`, `docs/`, and both root
READMEs. It resolves anchors as well as paths, which is the half a grep cannot do and the half that
catches a link whose heading was renamed. It skips any directory named `npm`, `handoffs`, `node_modules`,
`dist`, or `build`, at any depth rather than by path prefix — so `.pi/npm` and `.pi/handoffs` go
unscanned, and so would a `docs/build` created tomorrow.

Three checks stay manual, because no script covers them today: a skill's directory name matching its
frontmatter `name`, the whole link inventory in one view, and no live pointer to a retired harness.
All three, with the commands, are in
[`harness-validator.md`](./skills/project-rules/references/harness-validator.md#manual-checks).
