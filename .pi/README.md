# pi project harness

**`.pi/` is the owner of this project's agent assets.** Skills, slash-command workflows, and
subagent definitions live here. The `.opencode/` copy that preceded it was legacy, has been deleted,
and nothing in `.pi/` ever read from it.

This file is the map of the harness: what exists, why each piece is a separate thing, and where the
process is defined. It is not the process. The gate sequence, the evidence contract, and the fix
loop live in
[`harness-process.md`](./workflows/harness-process.md), and
the harness-integrity checks live in
[`harness-validator`](./skills/harness-validator/SKILL.md).
Both are linked rather than restated here, because a rule stated twice drifts from its copy.

## Layout

```
.pi/
├── settings.json          # skills, prompts, packages, subagent model config
├── skills/                # 19 project skills (SKILL.md + references/), the single registry
│   ├── <skill>/           # 10 top-level skills
│   └── code-review/       # meta-skill + 9 doctors nested underneath
├── workflows/             # 10 process definitions, flat (/bug-fix, /feature-development, /harness-process, …)
├── agents/                # 9 subagent definitions, grouped by role
│   ├── orchestrator/      # orchestrator.agent.md — plans, dispatches, verifies, hands off
│   ├── planning/          # explorer, planner, critic — read-only
│   ├── implementation/    # frontend-dev, backend-dev — the two writers
│   └── verification/      # tester, reviewer, browser-verifier — read-only
└── npm/                   # pi-subagents + deps (gitignored by npm/.gitignore)
```

Each agent's directory is its **role**, and the agent body declares that role and its **domain**
with a `**Role:**` / `**Domain:**` line. `pnpm pi-check` fails when either line is missing, so the
pair is checked rather than conventional. `.pi/skills/` is the only skill registry, and an agent
receives a skill by granting it by name. The full role/domain model
lives in [Roles, domains, and the knowledge boundary](#roles-domains-and-the-knowledge-boundary),
and [`orchestrator/orchestrator.agent.md`](./agents/orchestrator/orchestrator.agent.md) owns the
statement of it.

## Using it

1. `/trust` once. Project config only loads after trust.
2. `/reload` after changing anything under `.pi/`.
3. Commands appear in the `/` menu: `/bug-fix`, `/feature-development`, `/refactoring`, and the rest.
4. Subagents are available via the `subagent` tool: `Use explorer to scan the auth flow.`
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

That rule is why the frontend methodology the writer holds now lives in `.pi/skills/` with everything
else — one `frontend-patterns` skill with per-area references, granted once. While those rules sat
inside `implementation/frontend-dev/skills/`, a reviewer could only reach them
by reading another lane's directory, and two copies of a rule is how this harness once taught hook
names that do not exist.

## The agent team

| Agent              | What it does                                                                                                         | Why it is an agent and not a skill or a prompt step                                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orchestrator`     | Classifies, plans, dispatches, verifies the joined tree, hands off. Writes no code.                                  | It is the entry point for a task that needs more than one lane. It needs a context outside the caller's session that still holds `subagent` and the project's skill grants. `defaultContext: fresh` is what makes a clean-context task possible. |
| `explorer`         | Fast read-only recon. Returns compressed, checkable findings.                                                        | It keeps a codebase sweep out of the planner's context. A skill cannot compress a session; a lane can return findings instead. `thinking: low` because speed is the product.                                                                     |
| `planner`          | Writes the implementation plan: files, data shapes, boundaries. Read-only.                                           | The plan must be written by a context that has not already decided how to implement. A plan written by the lane that will execute it encodes that lane's assumptions as given.                                                                   |
| `critic`           | Reads a proposed plan and answers one question: is it fit to implement? Read-only.                                   | The planner reading its own plan is not a review. Conditional: it runs when a plan crosses a boundary or carries an expensive trade-off.                                                                                                         |
| `frontend-dev`     | Writes React/TypeScript, self-tests with React Doctor and the targeted checks.                                       | It is the context that holds the change, separate from the one that judges it. It grants `frontend-patterns` by name, so a component author gets the methodology loaded and a reviewer does not pay for it.                                      |
| `backend-dev`      | Writes NestJS service code, self-tests with typecheck and the targeted tests.                                        | Same reason as `frontend-dev`, on the other side of the stack. Its constraints differ from the frontend's, so it needs its own system prompt rather than a branch in one.                                                                        |
| `tester`           | Verifies the implementation against the acceptance criteria, criterion by criterion. Holds no `edit` or `write`.     | Verification by the author of the change is not verification. It emits evidence, not a verdict, because the verdict has exactly one producer. A missing check is a report, not a test.                                                           |
| `reviewer`         | Reviews the diff across the code-review dimensions. The **only** lane that emits `VERDICT: PASS` or `VERDICT: FAIL`. | Self-review cannot catch a self-consistent mistake. It is the single place a verdict is produced, so there is one standard for what counts as one. It has no edit tool, so findings go back to the developer lane.                               |
| `browser-verifier` | Drives the running portal in a real browser and reports what the screen did.                                         | A rendered result and a passing unit test are different facts, and only one of them can be observed. It holds no edit tool, so it cannot "fix while verifying" and lose independence. Conditional: it runs on user-visible surfaces.             |

Every lane holds only the skills it needs via `skills:` frontmatter, and all nine set
`inheritSkills: false`. No agent inherits the whole catalog, because context is the cost being
managed. The consequences of that are in
[Roles, domains, and the knowledge boundary](#roles-domains-and-the-knowledge-boundary).

`orchestrator` is the only agent holding `subagent`. `maxSubagentDepth: 1` keeps every lane it
dispatches a leaf, so recursion cannot grow.

## Roles, domains, and the knowledge boundary

**Implementation is a role, not an agent name.** A role says what a worker does in the workflow: it
implements a scoped unit inside its own domain and self-tests before it reports. A domain says which
technical capability it operates in. `frontend-dev` is role `implementation`, domain `frontend`.
`backend-dev` is role `implementation`, domain `backend`.

**A new domain needs a new agent, not a new workflow.** A `devops-dev` would be role
`implementation`, domain `devops`, and the gate sequence, the routing rules, and the verification
chain are already domain-neutral, so nothing in the process moves. The one place the word registers
is the `domains` field of the classification artifact, whose value list
[`task-classification`](./skills/task-classification/SKILL.md#domains) is deliberately open. If that
claim turned out to be false, the process would change in exactly the places
[`harness-process.md`](./workflows/harness-process.md#the-gate-sequence) already
names, and the only genuinely new artifact would be a grant set: which skills the lane holds, which
tools it may use, and where its findings route. The harness does not ship `devops-dev` today,
because a model that accommodates future domains does not have to contain them.

**Multi-domain work is composition, not a new role.** The `frontend + backend` shape is
`orchestrator` → `planner` → the shared contract → `frontend-dev` and `backend-dev`, in
parallel only where the dependencies permit → `tester` → `browser-verifier` on a user-facing surface
→ `reviewer` → combined-tree verification by the orchestrator. The shared contract is settled before
either worker starts, and where it has a code-level expression it is
[`packages/shared/types`](../packages/shared/types), the schemas both sides import instead of
re-declaring. No `fullstack-dev` exists and none should be created. A role with nothing of its own to
check is not a role: it would hold no contract either domain worker cannot hold, and the only work it
performed would be two workers' work plus a join the orchestrator already does.

**The knowledge boundary is the grant, not the label.** All nine agents set `inheritSkills: false`
and declare their own `skills:`, so a worker receives exactly its grants and nothing else. A future
domain worker does not inherit the whole catalog by arriving. The process that enforces it is in
[the coordination role's rules](./workflows/harness-process.md#the-coordination-roles-rules), not restated here.

**`docs/` is the canonical home for PawHaven-specific project knowledge.** `.pi/skills/` holds
reusable technical capability, plus the operational index in
[docs/frontend-portal.md](../docs/frontend-portal.md#what-this-file-is), which is where an agent reads
that the portal's files live and what they are called. No second project-knowledge hierarchy was
created under `.pi/`, because a second one is a second place to look and a second copy to drift.

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
agent moved from `.pi/agents/frontend/dev/dev.md` to
`.pi/agents/implementation/frontend-dev/frontend-dev.agent.md`, and the nine React skills that once
travelled with it were dissolved into `.pi/skills/frontend-patterns/references/` beside every other skill.

## Skills

19 project skills in `.pi/skills/`, grouped by domain. Each agent loads a subset via `skills:`
frontmatter, so there is one copy of every rule and one registry that holds all of them.

| Domain         | Skills                                                                                                                                      | Used by                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| project rules  | principles                                                                                                                                  | all agents                                                                                                            |
| harness        | harness-validator                                                                                                                           | reviewer                                                                                                              |
| classification | task-classification                                                                                                                         | main session, at routing time                                                                                         |
| backend        | backend                                                                                                                                     | backend-dev                                                                                                           |
| testing        | testing-standards                                                                                                                           | tester, browser-verifier                                                                                              |
| code review    | code-review + 9 doctors (`architecture-`, `backend-`, `boundary-`, `i18n-`, `react-`, `style-`, `test-`, `typecheck-`, `typescript-doctor`) | reviewer (all nine, through the `code-review` dispatch table), frontend-dev (`react-doctor` only, for its self-check) |
| frontend lens  | frontend-patterns, typescript                                                                                                               | frontend-dev (typescript also granted by backend-dev)                                                                 |
| frontend facts | [docs/frontend-portal.md](../docs/frontend-portal.md) (project knowledge, not a skill)                                                      | frontend-dev                                                                                                          |
| architecture   | architecture-design                                                                                                                         | planner, critic                                                                                                       |
| standards      | writing-standards                                                                                                                           | planner, frontend-dev, backend-dev, tester                                                                            |

The frontend **lens** skill holds how to write React here, and the **facts** that lens checks
against live once in [docs/frontend-portal.md](../docs/frontend-portal.md), so a rule and the fact
it checks cannot drift apart. Nothing under `.pi/agents/` holds a skill, and `pnpm pi-check` fails
if a `skills/` directory reappears there.

`settings.json` lists the 9 `code-review/<doctor>` skills individually and must keep doing so. pi
stops recursing at any directory containing a `SKILL.md`, so a doctor nested under the `code-review`
parent is only found through its explicit entry. Dropping one silently drops a skill.

## What a skill may assert

A skill states what this repo does — the pattern this repo uses with the file it lives in, a
constraint a command here enforces, a correction to an older wrong note. It never states what the
technology recommends in general, a constraint a reader might wish for, or a rule with no example
in this repo. Every rule should answer one of three questions: **where is the code?** (the file,
the export, the line), **which command catches it?** (`pnpm typecheck`, a `rg` pattern the reviewer
can re-run), **what did the older note get wrong?** — if nothing, the rule may be generic advice and
does not belong here yet. General best practice is a backlog, added only when a real change shows
the gap. Name a tool by the command that runs it: `rg` / `find` for search, `bash` for execution,
read the `SKILL.md` path for a skill, the `subagent` tool for dispatch.

## Slash commands (workflows)

10 process definitions in `.pi/workflows/`, one per slash command. Each names its numbered steps,
its decision points, and its failure recovery. None of them names a runner agent: a prompt runs in
the session that invokes it. The files stay flat, because pi's prompt loader scans one directory
for `.md` files and does not descend — a nested subdirectory would not be found, and the slash
command would silently stop existing.

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

Nine stages from classification to the human's final review, three of them conditional on scope and
risk. A `browser-verifier` pass is conditional too, but it is not a numbered stage, so it is not part
of the count. The sequence, the conditions, and that count are defined once, in
[`harness-process.md`](./workflows/harness-process.md#the-gate-sequence), along with
the [evidence contract](./workflows/harness-process.md#evidence-what-a-pass-requires)
that says what a `PASS` is and
[the bounded fix loop](./workflows/harness-process.md#the-bounded-fix-loop) that
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
    "critic":           { "thinking": "high" },
    "explorer":         { "thinking": "low" },
    "planner":          { "thinking": "high" },
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
pnpm pi-check      # 19 project skills, 10 prompt commands, 9 agents, 0 agent-private skills, zero diagnostics
pnpm check:links   # every relative markdown link and anchor resolves
```

`pi-check` imports pi's own loaders, so it fails for the reasons pi would fail at startup: wrong
counts, a skill grant that names nothing, an `allowedAgents` or `agentOverrides` key left behind by
a rename, a `requiredAgents` name in a skill body left behind by the same rename, a `skillPath` that
resolves to nothing, a project skill no agent grants, an agent body missing its `Role:` or `Domain:`
line. The
`EXPECTED_*` constants at the top of `scripts/check-pi-harness.mjs` are the thing to update when the
harness changes size, deliberately, in the same change that adds or removes the resource.

Four of its checks hold the one-way direction between the layers, `Workflow -> Agent -> Skill ->
Reference/Script`, and report with an `ARCHITECTURE_VIOLATION:` prefix so a reversed dependency is
distinguishable from a missing file: a skill that names a lane in backticks, a second skill registry
under `.pi/agents/`, dispatch held by an agent other than the coordinating one, and a circular skill
dependency whose members each have to be read before the next. A duplicate skill name is a secondary
assertion, and it is dormant today because pi's own loader already reports the collision; it is kept
because it is the only assertion that states what a collision costs, which is one of the two skills
becoming unreachable behind a name that resolves to whichever pi loaded first. Each allowlist entry in
the script is a place the direction has to be argued for, so a new entry ships with the reason next
to it.

`check:links` runs `scripts/check-md-links.mjs` over `.pi/`, `AGENTS.md`, `docs/`, and both root
READMEs. It resolves anchors as well as paths, which is the half a grep cannot do and the half that
catches a link whose heading was renamed. It skips any directory named `npm`, `node_modules`,
`dist`, or `build`, at any depth rather than by path prefix — so `.pi/npm` goes
unscanned, and so would a `docs/build` created tomorrow.

Two checks stay manual, because no script covers them today: a skill's directory name matching its
frontmatter `name`, and the whole link inventory in one view.
Both, with the commands, are in
[`harness-validator`](./skills/harness-validator/SKILL.md#manual-checks).
