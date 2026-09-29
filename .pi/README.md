# pi project harness

**`.pi/` is the owner of this project's agent assets.** Skills, slash-command workflows, and
subagent definitions live here, not in `.opencode/`. The opencode copy is legacy and can be
deleted once you are satisfied with pi — nothing in `.pi/` reads from it.

## Layout

```
.pi/
├── settings.json          # skills, prompts, packages, subagent model config
├── skills/                # 22 skills (SKILL.md + references/)
├── prompts/               # 10 slash commands (/bug-fix, /new-feature, …)
├── agents/                # 6 PawHaven-specific subagent definitions
│   ├── architect.md       # read-only planning
│   ├── scout.md           # read-only recon
│   ├── frontend.md        # React/TS implementation
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
  ┌───┼───┬───┐
  ↓   ↓   ↓   ↓
architect  scout  reviewer
  │
frontend + backend
  │
tester
```

Each agent gets only the skills it needs via `skills:` frontmatter. No agent inherits
all 22 skills — context is minimized per agent.

## Model strategy

No model names are hardcoded in agent definitions. Agent overrides in `settings.json` set
only `thinking` levels. The actual model is inherited from the parent session's default
provider, so switching providers automatically switches all agents.

```json
"subagents": {
  "agentOverrides": {
    "scout":     { "thinking": "low" },
    "architect": { "thinking": "high" },
    "frontend":  { "thinking": "medium" },
    "backend":   { "thinking": "medium" },
    "tester":    { "thinking": "low" },
    "reviewer":  { "thinking": "high" }
  }
}
```

## Skills

22 skills in `.pi/skills/`, grouped by domain. Each agent loads a subset via `skills:`
frontmatter — zero duplication.

| Domain        | Skills                                                             | Used by                              |
| ------------- | ------------------------------------------------------------------ | ------------------------------------ |
| project rules | project-rules, principles                                          | all agents                           |
| frontend      | react, component, style, i18n, react-query, react-hook-form, redux | frontend                             |
| backend       | backend                                                            | backend                              |
| testing       | testing-standards                                                  | tester                               |
| code review   | code-review (8 doctors)                                            | reviewer                             |
| architecture  | architecture-design                                                | architect                            |
| standards     | writing-standards                                                  | architect, frontend, backend, tester |

## Slash commands (prompts)

10 slash commands in `.pi/prompts/`:

| Command                | What it does                                                 |
| ---------------------- | ------------------------------------------------------------ |
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

Validates: 22 skills, 10 prompts, 6 agents, zero diagnostics. Catches missing files,
invalid names, broken skill references, and missing package installs.
