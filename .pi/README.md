# pi project harness

**`.pi/` is the owner of this project's agent assets.** Skills, slash-command workflows, and
subagent definitions live here. The opencode copy that preceded it was legacy, has been deleted,
and nothing in `.pi/` ever read from it.

## Layout

```
.pi/
├── settings.json          # skills, prompts, packages, subagent model config
├── skills/                # 14 project skills (SKILL.md + references/)
├── prompts/               # 9 slash commands (/bug-fix, /feature-development, …)
├── agents/                # 11 subagent definitions
│   ├── orchestrator.md    # plans + dispatches, holds no edit tools
│   ├── architect.md       # read-only planning
│   ├── scout.md           # read-only recon
│   ├── oracle.md          # read-only decision challenger
│   ├── frontend/
│   │   ├── frontend.md    # router: implementation → dev, review → review
│   │   ├── dev/           # React/TS writer + 9 private skills (skillPath)
│   │   └── review/        # findings-only review + 4 private doctors (skillPath)
│   ├── backend.md         # NestJS implementation
│   ├── tester.md          # test authoring
│   ├── reviewer.md        # read-only review
│   └── browser-verifier.md # drives the running portal, read-only toward source
├── handoffs/              # structured handoff artifacts for long-running work
└── npm/                   # pi-subagents + deps (gitignored by npm/.gitignore)
```

## Using it

1. `/trust` once — project config only loads after trust.
2. `/reload` after changing anything here.
3. Commands appear in the `/` menu: `/bug-fix`, `/feature-development`, `/refactoring`, …
4. Subagents are available via the `subagent` tool: `Use scout to scan the auth flow.`
5. `/subagents-doctor` checks pi-subagents setup.
6. `pnpm pi-check` validates skills, prompts, and agents.

## Subagent architecture

```
Main Pi Agent
      │
  subagent tool
      │
  ├── orchestrator         (fresh context; plans, dispatches, verifies — no edit tools)
  │     │
  │     └── architect · scout · oracle · backend · dev · review
  │                          · frontend · tester · reviewer · browser-verifier
  │
  ├── architect · scout · oracle    (read-only: plan, recon, challenge)
  ├── reviewer                      (read-only review)
  ├── frontend ── routes to ── dev (writer) · review (findings only)
  ├── backend                       (writer)
  ├── tester                        (writer)
  └── browser-verifier              (drives the running portal, verifies, edits nothing)
```

Each agent gets only the skills it needs via `skills:` frontmatter, plus `skillPath` for
agent-private skills. No agent inherits all 14 project skills — context is minimized per agent.

### Why `orchestrator` exists

Every project agent used to be a leaf lane; the only agent holding `subagent` was `frontend`, pinned
to `dev` and `review`. So a task that needed to start from a clean parent context had nowhere to go: a
context outside this session has no dispatch rights and no project skill grants. Two agents working
real tasks reported executing their required lanes inline as a result, and one reported that **no
independent reviewer ever ran on its diff** — on a change that introduced the project's first
role-gated endpoint.

It holds **no `edit` or `write` tool**, so "never implement it yourself" is enforced by the toolset
rather than by discipline. `defaultContext: fresh` is what makes it usable as a task parent, and
`maxSubagentDepth: 1` keeps every lane it dispatches a leaf so recursion cannot grow.

## Model strategy

No model names are hardcoded in agent definitions. Agent overrides in `settings.json` set
only `thinking` levels. The actual model is inherited from the parent session's default
provider, so switching providers automatically switches all agents.

```json
"subagents": {
  "agentOverrides": {
    "orchestrator":      { "thinking": "high" },
    "oracle":            { "thinking": "high" },
    "scout":             { "thinking": "low" },
    "architect":         { "thinking": "high" },
    "frontend":          { "thinking": "high" },
    "dev":               { "thinking": "medium" },
    "review":            { "thinking": "high" },
    "backend":           { "thinking": "medium" },
    "tester":            { "thinking": "low" },
    "reviewer":          { "thinking": "high" },
    "browser-verifier":  { "thinking": "low" }
  }
}
```

## Skills

14 project skills in `.pi/skills/`, grouped by domain. Each agent loads a subset via `skills:`
frontmatter — zero duplication.

| Domain         | Skills                    | Used by                         |
| -------------- | ------------------------- | ------------------------------- |
| project rules  | project-rules, principles | all agents                      |
| classification | task-classification       | main session, at routing time   |
| backend        | backend                   | backend                         |
| testing        | testing-standards         | tester                          |
| code review    | code-review (5 doctors)   | reviewer, review                |
| architecture   | architecture-design       | architect                       |
| standards      | writing-standards         | architect, dev, backend, tester |

13 agent-private skills sit outside `.pi/skills/` and load only into their owning agent via
`skillPath` frontmatter. They hold the **lens** — how to write, and what to flag. The **facts** both
lenses need live once in the shared `frontend` project skill, so a rule and the fact it checks cannot
drift apart:

| Agent  | Private skills                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------- |
| dev    | react, component, style, i18n, react-query, react-hook-form, redux, typescript, frontend-patterns |
| review | react-doctor, style-doctor, i18n-doctor, typescript-doctor                                        |

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

## Validating

```bash
pnpm pi-check
```

Validates: 14 project skills, 13 agent-private skills, 9 prompts, 11 agents — zero
diagnostics. Catches missing files, invalid names, broken skill references, and missing
package installs.
