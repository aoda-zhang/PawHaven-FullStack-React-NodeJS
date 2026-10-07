# pi project harness

**`.pi/` owns this project's agent assets.** Skills, policies, slash-command workflows, subagent
definitions, and the model registry live here.

This file is the map. It is not the process: ordering lives in [`workflows/`](./workflows), the stable
cross-workflow rules live in [`policies/`](./policies), and the harness-integrity checks live in
[`harness-validator`](./skills/harness-validator/SKILL.md). Each is linked rather than restated,
because a rule stated twice drifts from its copy.

## Layout

```
.pi/
├── settings.json          # skill paths, prompt paths, packages, subagent thinking tiers
├── config/
│   └── models.yaml        # the model registry: tier -> thinking + model, and lane -> tier
├── skills/                # the only skill registry
│   ├── <skill>/           # SKILL.md + references/ + scripts/
│   └── code-review/       # meta-skill + 9 doctors nested underneath
├── policies/              # stable rules shared by every workflow
├── workflows/             # 10 process definitions, flat (/bug-fix, /feature-development, …)
├── agents/                # 9 subagent definitions, grouped by role
│   ├── orchestrator/      # plans, dispatches, verifies, hands off
│   ├── planning/          # scout, architect, oracle — read-only
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
4. Subagents via the `subagent` tool: `Use scout to scan the auth flow.`
5. `pnpm pi-check` and `pnpm check:links` validate the harness. Run both before committing anything
   in `.pi/`.

## Four layers, and what each answers

| Layer        | Question                                                  | Where        |
| ------------ | --------------------------------------------------------- | ------------ |
| **Skill**    | How do I do this class of work?                           | `skills/`    |
| **Policy**   | What is the rule that outlives one workflow?              | `policies/`  |
| **Workflow** | What happens, in what order?                              | `workflows/` |
| **Agent**    | Who is responsible, with its own context and permissions? | `agents/`    |

**Knowledge is shareable; reasoning context is not.** Two lanes that both need the design-token rule
read the same skill. Two lanes that both need to judge the same diff are not the same context.

**`docs/` is the canonical home for PawHaven-specific project knowledge.** A skill holds capability;
`docs/architecture/` holds the facts a design is checked against; `docs/frontend-portal.md` holds the
portal's operational index; `docs/quality/` holds the current measured state. No second
project-knowledge hierarchy exists under `.pi/`.

Creating a skill or an agent is a defined procedure:
[`skill-creator`](./skills/skill-creator/SKILL.md) and
[`agent-creator`](./skills/agent-creator/SKILL.md). Both state the decision test that says whether what
you have is a skill, an agent, a policy, a doc, or a workflow step.

## Policies

The stable rules every workflow applies. A workflow owns ordering; a policy owns a threshold or a
standard. Neither restates the other.

| Policy                                                   | Owns                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [verification-policy](./policies/verification-policy.md) | The gate sequence, which stages are conditional, lane shapes, and what a `PASS` requires             |
| [failure-policy](./policies/failure-policy.md)           | The bounded fix loop, when to return to planning, combined-tree failure classification, unit retries |
| [contract-policy](./policies/contract-policy.md)         | What a contract is, who settles it, the `CONTRACT_CHANGE_REQUIRED` gate and its route                |
| [human-gate-policy](./policies/human-gate-policy.md)     | The autonomy line, the two human gates, and what is never an agent's to decide                       |

## The agent team

| Agent              | What it does                                                                                               | Why it is an agent and not a skill or a prompt step                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orchestrator`     | Classifies, plans, dispatches, verifies the joined tree, hands off. Writes no code.                        | The entry point for a task needing more than one lane. It holds `subagent` and the project's skill grants. `defaultContext: fresh` is what makes a clean-context task possible.              |
| `scout`            | Fast read-only recon. Returns compressed, checkable findings.                                              | It keeps a codebase sweep out of the planner's context. A skill cannot compress a session; a lane can return findings instead.                                                               |
| `architect`        | Writes the implementation plan: files, data shapes, the shared contract, acceptance criteria. Read-only.   | A plan must be written by a context that has not already decided how to implement. A plan written by the lane that will execute it encodes that lane's assumptions as given.                 |
| `oracle`           | Answers what the existing system establishes about a plan's premises. Read-only.                           | Evidence about the existing system, not a second design. Conditional: it runs when a plan crosses a boundary or carries an expensive trade-off.                                              |
| `frontend-dev`     | Writes React/TypeScript, self-tests with react-doctor and the targeted checks.                             | It is the context that holds the change, separate from the one that judges it. It grants `frontend-patterns`, so a component author gets the methodology and a reviewer does not pay for it. |
| `backend-dev`      | Writes NestJS service code, self-tests with typecheck and the targeted tests.                              | Same reason on the other side of the stack, where the constraints differ enough to need their own system prompt.                                                                             |
| `tester`           | Verifies the implementation against the acceptance criteria, criterion by criterion. No `edit` or `write`. | Verification by the author of the change is not verification. It emits evidence, not a verdict, because the verdict has exactly one producer.                                                |
| `reviewer`         | Reviews the diff across the code-review dimensions. The only lane that emits a verdict.                    | Self-review cannot catch a self-consistent mistake. One verdict producer means one standard for what counts as one.                                                                          |
| `browser-verifier` | Drives the running portal in a real browser and reports what the screen did.                               | A rendered result and a passing unit test are different facts, and only one is observable. Conditional: user-visible surfaces.                                                               |

Every lane holds only the skills it needs via `skills:` frontmatter, and all nine set
`inheritSkills: false`. No agent inherits the whole catalog, because context is the cost being managed.

**Permission boundaries.** Seven of the nine lanes carry no `edit` or `write` tool and declare
`permission: { write: deny, edit: deny }`. `pnpm pi-check` fails when a verification lane loses either.
That is the strongest boundary this runtime offers, and it is not a command boundary: pi rejects bash
rules, so a lane that holds `bash` can still write through it. `pi-guard` is the documented answer for
command-level policy and is not installed here. The agents that hold `bash` say so plainly rather than
pretending the prose is a sandbox.

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
| architecture   | architecture-design                             | architect, oracle                                                                                       |
| standards      | writing-standards                               | architect, frontend-dev, backend-dev, tester                                                            |

`settings.json` lists the 9 `code-review/<doctor>` skills individually and must keep doing so. pi stops
recursing at any directory containing a `SKILL.md`, so a doctor nested under the `code-review` parent is
only found through its explicit entry. Dropping one silently drops a skill.

## Workflows

10 process definitions in `.pi/workflows/`, one per slash command. Each names its numbered steps, its
decision points, and its failure recovery. None of them names a runner agent: a prompt runs in the
session that invokes it. The files stay flat, because pi's prompt loader scans one directory for `.md`
files and does not descend — which is also why `policies/` is a separate directory rather than a
subdirectory of `workflows/`: a policy is not a slash command.

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `/feature-development` | Plan, implement, validate a feature end to end         |
| `/bug-fix`             | Reproduce, root-cause, fix, verify                     |
| `/architecture-change` | Structural change across boundaries                    |
| `/design-decision`     | Architecture/design choice from evidence               |
| `/investigation`       | Read-only question from evidence                       |
| `/refactoring`         | Behavior-preserving restructure                        |
| `/perf-issue`          | Diagnose and fix performance                           |
| `/parallel-execution`  | Split, run in parallel, join                           |
| `/handoff`             | Produce review handoff                                 |
| `/harness-process`     | Read the routing and the coordination rules themselves |

## Model registry

**No agent, workflow, or skill names a model.** `.pi/config/models.yaml` is the single source: a tier
carries `capability`, `thinking`, `model`, and `fallback`, and a lane is assigned a tier.

`scripts/sync-model-tiers.mjs` renders `subagents.agentOverrides` in `.pi/settings.json` from that file,
and `pnpm pi-check` fails when the two disagree, so a lane cannot quietly run at a tier other than the
recorded one. Edit the registry, re-run the script, run `pi-check`.

Today every tier sets `model: inherit`, because this repo deliberately pins no provider — the harness
follows whatever model the parent session runs on. The tiers still do real work: they carry `thinking`,
and they carry the policy that orchestration, plan authorship, plan review, and the code verdict are
`strong` while recon and classification are `fast`. Pinning a provider later is one line per tier, and no
agent changes.

## Changing the harness

A change under `.pi/` is `risk: high` and is not eligible for a lightweight workflow path. It is harness
configuration, and the harness is what makes every other task verifiable, so a quiet mistake in it is a
silent loss of a rule.

Before committing anything under `.pi/`:

```bash
pnpm pi-check      # skills, agents, grants, direction, size, reachability, models
pnpm check:links   # every relative markdown link and anchor resolves
```

`pi-check` imports pi's own loaders, so it fails for the reasons pi would fail at startup. Its checks are
listed, with what each one catches and how to read a failure, in
[`harness-validator`](./skills/harness-validator/SKILL.md). The direction checks hold the one-way order
`Workflow -> Agent -> Skill -> Reference/Script`, an agent cannot declare a model outside the registry, a
verification lane cannot lose its write denial, and every allowlist entry in the script is a place the
direction had to be argued for, so a new entry ships with the reason next to it.

The `EXPECTED_*` constants at the top of `scripts/check-pi-harness.mjs` are the thing to update when the
harness changes size, deliberately, in the same change that adds or removes the resource.
