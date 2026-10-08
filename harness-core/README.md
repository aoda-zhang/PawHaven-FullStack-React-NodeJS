# harness-core

The repository-owned, provider-neutral AI development harness for PawHaven.

This directory is the **only** place an agent, a skill, a workflow, a rule, or a model tier is
defined. Everything a coding runtime loads is generated from here by an adapter. If a rule is written
anywhere else, one of the two copies is already wrong.

```text
harness-core/
├── plugins/          every agent and skill, grouped by cohesive domain
│   ├── architecture/              agents: architect, oracle · skills: architecture-design
│   ├── frontend-development/      agents: frontend-developer · skills: frontend-patterns, react-doctor, testing-frontend
│   ├── backend-development/       agents: backend-developer · skills: backend, backend-testing
│   ├── javascript-typescript/     skills: typescript
│   ├── testing/                  agents: tester · skills: testing-standards
│   ├── code-review/              agents: reviewer · skills: code-review
│   ├── orchestration/            agents: orchestrator, scout · skills: task-classification, principles
│   ├── browser-verification/     agents: browser-verifier · skills: browser-verification
│   ├── harness-maintenance/      skills: agent-authoring, skill-authoring, harness-validation
│   └── writing/                  skills: writing-standards
├── workflows/       canonical workflow definitions (feature-development, bug-fix, …)
│   └── patterns/      reusable execution patterns (parallel-execution)
├── rules/           cross-cutting invariants (verification, failure, contract, human-gates)
├── config/          model-policy.yaml — abstract tiers; no provider names
├── validation/      mechanical proof that the harness is internally correct
└── adapters/        translation into one runtime's native layout
    └── pi/          the implemented adapter → generates .pi/
```

## The map

| Concern             | Canonical source                                       |
| ------------------- | ------------------------------------------------------ |
| Plugins, agents     | [plugins/](./plugins)                                  |
| Skills              | each `plugins/<plugin>/skills/<skill>/SKILL.md`        |
| Workflows           | [workflows/](./workflows)                              |
| Rules               | [rules/](./rules)                                      |
| Model tiers         | [config/model-policy.yaml](./config/model-policy.yaml) |
| Runtime translation | [adapters/pi/](./adapters/pi)                          |
| Harness correctness | [validation/](./validation)                            |
| Project facts       | [../docs/](../docs)                                    |
| The repository map  | [../AGENTS.md](../AGENTS.md)                           |

The architecture these boundaries defend is in [ARCHITECTURE.md](./ARCHITECTURE.md). Read that before
changing the structure; read this file to find something.

## Where do I add…?

| You want to add…          | Put it in                                                               |
| ------------------------- | ----------------------------------------------------------------------- |
| An agent                  | `plugins/<plugin>/agents/<name>.md` (runtime-neutral frontmatter)       |
| A skill                   | `plugins/<plugin>/skills/<skill>/SKILL.md` + `references/`, `scripts/`  |
| A user-facing command     | `plugins/<plugin>/commands/` (only when one genuinely exists)           |
| A workflow                | `workflows/<name>.md` (or `workflows/patterns/` for a reusable pattern) |
| A cross-cutting invariant | `rules/<name>.md`                                                       |
| A model tier change       | `config/model-policy.yaml` (abstract tiers only)                        |
| Pi runtime behaviour      | `adapters/pi/` — never in canonical source                              |

## Capability bundles

A plugin is a cohesive area of work, and it may hold agents, skills, or both. The directory is the
classification — nothing inside repeats it. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full
vocabulary (plugin / agent / skill / workflow / rule / adapter) and the boundaries between them.

| Plugin                                                 | Holds                                                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [architecture](plugins/architecture)                   | design decisions, system boundaries                                                             |
| [frontend-development](plugins/frontend-development)   | writing frontend, its patterns, its tool gate, its tests                                        |
| [backend-development](plugins/backend-development)     | writing backend, its patterns, its tests                                                        |
| [javascript-typescript](plugins/javascript-typescript) | the TypeScript skill (shared by frontend and backend)                                           |
| [testing](plugins/testing)                             | verifying behaviour against acceptance criteria                                                 |
| [code-review](plugins/code-review)                     | judging a change, and the verdict                                                               |
| [orchestration](plugins/orchestration)                 | coordinating the task, reconnaissance, classification, and the principles that force a decision |
| [browser-verification](plugins/browser-verification)   | proving what the running application did                                                        |
| [harness-maintenance](plugins/harness-maintenance)     | changing the harness itself                                                                     |
| [writing](plugins/writing)                             | prose standards shared across the harness                                                       |

## Commands

```bash
pnpm harness:generate      # regenerate .pi/ from this directory
pnpm harness:validate      # validate the canonical source (this directory)
pnpm harness:smoke         # prove the Pi runtime loads what was generated
pnpm harness:verify        # validate + generate-check + links + pi check + pi smoke
```

Run all of them before committing a harness change. A harness change that typechecks, packages, and
passes a link check but was never loaded by a runtime has not been validated.

## Changing the harness

Read [ARCHITECTURE.md](./ARCHITECTURE.md) for the invariants, then
[agent-authoring](plugins/harness-maintenance/skills/agent-authoring/SKILL.md) or
[skill-authoring](plugins/harness-maintenance/skills/skill-authoring/SKILL.md) for the procedure that
matches what you are changing. Broader process: [harness-change.md](./workflows/harness-change.md).

Four rules cover most of it:

1. **One canonical owner per rule.** Everything else links to the owner. A rule stated twice is
   stated wrong once.
2. **Change the source, never the output.** Generated artifacts (`.pi/`) are disposable; they are rebuilt.
3. **No runtime syntax in canonical source.** A field that belongs to one runtime belongs in that
   runtime's adapter.
4. **A harness change is its own reviewable change.** See
   [harness-change.md](./workflows/harness-change.md).

## What is not here, and why

- **No `roles/`.** The plugin directory already says what kind of work an agent does. A parallel
  classification is a second thing to keep in sync.
- **No `commands/` unless one exists.** A workflow _is_ the user-facing process definition. Plugins that
  genuinely expose a command get a `commands/` directory; the others do not.
- **No `schemas/`.** Agent communication is a runtime concern. The canonical source states semantic
  expectations in prose, because a JSON schema here would be a promise no runtime reads.
- **No project facts.** The module list, the token files, the export surface: those are
  [../docs/](../docs). A harness that restates them drifts from them.
- **The retired directories are gone.** Their contents now live under `plugins/`. A reference to the
  retired layout fails validation.
