# pi project harness

**`.pi/` is the owner of this project's agent assets.** Skills, slash-command workflows, and
subagent definitions live here, not in `.opencode/`. The opencode copy is legacy and can be
deleted once you are satisfied with pi — nothing in `.pi/` reads from it.

## Layout

```
.pi/
├── settings.json          # skills, prompts, packages, subagent model config
├── skills/                # 12 project skills (SKILL.md + references/)
├── prompts/               # 10 slash commands (/bug-fix, /new-feature, …)
├── agents/                # 9 subagent definitions
│   ├── architect.md       # read-only planning
│   ├── scout.md           # read-only recon
│   ├── oracle.md          # read-only decision challenger
│   ├── frontend/
│   │   ├── frontend.md    # router: implementation → dev, review → review
│   │   ├── dev/           # React/TS writer + 10 private skills (skillPath)
│   │   └── review/        # findings-only review + 4 private doctors (skillPath)
│   ├── backend.md         # NestJS implementation
│   ├── tester.md          # test authoring
│   └── reviewer.md        # read-only review
└── npm/                   # pi-subagents + deps (gitignored by npm/.gitignore)
```

## Using it

1. `/trust` once — project config only loads after trust.
2. `/reload` after changing anything here.
3. Commands appear in the `/` menu: `/bug-fix`, `/new-feature`, `/refactoring`, …
4. Subagents are available via the `subagent` tool: `Use scout to scan the auth flow.`
5. `/subagents-doctor` checks pi-subagents setup.
6. `pnpm pi-check` validates skills, prompts, and agents.

## Subagent architecture

```
Main Pi Agent
      │
  subagent tool
      │
  ├── architect · scout · oracle    (read-only: plan, recon, challenge)
  ├── reviewer                      (read-only review)
  ├── frontend ── routes to ── dev (writer) · review (findings only)
  ├── backend                       (writer)
  └── tester                        (writer)
```

Each agent gets only the skills it needs via `skills:` frontmatter, plus `skillPath` for
agent-private skills. No agent inherits all 12 project skills — context is minimized per agent.

## Model strategy

No model names are hardcoded in agent definitions. Agent overrides in `settings.json` set
only `thinking` levels. The actual model is inherited from the parent session's default
provider, so switching providers automatically switches all agents.

```json
"subagents": {
  "agentOverrides": {
    "scout":     { "thinking": "low" },
    "architect": { "thinking": "high" },
    "frontend":  { "thinking": "high" },
    "dev":       { "thinking": "medium" },
    "review":    { "thinking": "high" },
    "backend":   { "thinking": "medium" },
    "tester":    { "thinking": "low" },
    "reviewer":  { "thinking": "high" }
  }
}
```

## Skills

12 project skills in `.pi/skills/`, grouped by domain. Each agent loads a subset via `skills:`
frontmatter — zero duplication.

| Domain        | Skills                    | Used by                         |
| ------------- | ------------------------- | ------------------------------- |
| project rules | project-rules, principles | all agents                      |
| backend       | backend                   | backend                         |
| testing       | testing-standards         | tester                          |
| code review   | code-review (5 doctors)   | reviewer, review                |
| architecture  | architecture-design       | architect                       |
| standards     | writing-standards         | architect, dev, backend, tester |

14 agent-private skills sit outside `.pi/skills/` and load only into their owning agent via
`skillPath` frontmatter:

| Agent  | Private skills                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| dev    | react, component, style, i18n, react-query, react-hook-form, redux, typescript, frontend-context, frontend-patterns |
| review | react-doctor, style-doctor, i18n-doctor, typescript-doctor                                                          |

## Slash commands (prompts)

10 slash commands in `.pi/prompts/`:

| Command                | What it does                                                 |
| ---------------------- | ------------------------------------------------------------ |
| `/feature-development` | Plan, implement, validate a feature end to end               |
| `/new-feature <name>`  | Full pipeline: scout → architect → implement → test → review |
| `/bug-fix`             | Reproduce, root-cause, fix, verify                           |
| `/architecture-change` | Structural change across boundaries                          |
| `/design-decision`     | Architecture/design choice from evidence                     |
| `/investigation`       | Read-only question from evidence                             |
| `/refactoring`         | Behavior-preserving restructure                              |
| `/perf-issue`          | Diagnose and fix performance                                 |
| `/parallel-execution`  | Split, run in parallel, join                                 |
| `/handoff`             | Produce review handoff                                       |

## Validating

```bash
pnpm pi-check
```

Validates: 12 project skills, 14 agent-private skills, 10 prompts, 9 agents — zero
diagnostics. Catches missing files, invalid names, broken skill references, and missing
package installs.
