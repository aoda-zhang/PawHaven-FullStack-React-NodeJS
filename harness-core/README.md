# harness-core

The repository-owned, provider-neutral AI development harness for PawHaven.

This directory is the **only** place an agent, a skill, a workflow, a rule, or a model tier is
defined. Everything a coding runtime loads is generated from here by an adapter. If a rule is written
anywhere else, one of the two copies is already wrong.

```text
harness-core/
├── capabilities/   agents and skills, grouped by cohesive capability
├── workflows/      what happens, in what order
├── rules/          invariants that outlive any one workflow
├── config/         the model policy — abstract intelligence tiers
├── adapters/       translation into one runtime's native layout
└── validation/     mechanical proof that the harness is internally correct
```

## The map

| Concern             | Canonical source                                     |
| ------------------- | ---------------------------------------------------- |
| Agents              | [capabilities/*/agents](capabilities)                |
| Skills              | [capabilities/*/skills](capabilities)                |
| Workflows           | [workflows/](workflows)                              |
| Rules               | [rules/](rules)                                      |
| Model tiers         | [config/model-policy.yaml](config/model-policy.yaml) |
| Runtime translation | [adapters/](adapters)                                |
| Harness correctness | [validation/](validation)                            |
| Project facts       | [../docs/](../docs)                                  |
| The repository map  | [../AGENTS.md](../AGENTS.md)                         |

The architecture these boundaries defend is in
[ARCHITECTURE.md](./ARCHITECTURE.md). Read that before changing the structure; read this file to find
something.

## Capability bundles

A capability is a cohesive area of work, and it may hold agents, skills, or both. The directory is the
classification — nothing inside repeats it.

| Capability                                                      | Holds                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [orchestration](capabilities/orchestration)                     | coordinating the task, reconnaissance, classification, and the principles that force a decision |
| [architecture-planning](capabilities/architecture-planning)     | writing a plan, and asking what the existing system establishes                                 |
| [frontend-development](capabilities/frontend-development)       | building frontend, its patterns, its tool gate, its tests                                       |
| [backend-development](capabilities/backend-development)         | building backend, its patterns, its tests                                                       |
| [testing](capabilities/testing)                                 | verifying behaviour against acceptance criteria                                                 |
| [code-review](capabilities/code-review)                         | judging a change, and the verdict                                                               |
| [browser-verification](capabilities/browser-verification)       | proving what the running application did                                                        |
| [development-foundations](capabilities/development-foundations) | cross-stack foundations: TypeScript, prose                                                      |
| [harness-maintenance](capabilities/harness-maintenance)         | changing the harness itself                                                                     |

## Commands

```bash
pnpm harness:check           # the canonical source is internally correct
pnpm harness:generate        # regenerate every runtime's output from it
pnpm harness:check:generated # the generated output is current, not merely present
pnpm check:links             # every relative link and anchor resolves
pnpm pi:check                # the Pi runtime's own loader accepts it
pnpm pi:smoke                # the Pi runtime actually wires it together
pnpm harness:verify          # all of the above, in the order that reports a real cause first
```

Run all of them before committing a harness change. A harness change that typechecks, packages, and
passes a link check but was never loaded by a runtime has not been validated.

## Changing the harness

Read [ARCHITECTURE.md](./ARCHITECTURE.md) for the invariants, then
[skill-authoring](capabilities/harness-maintenance/skills/skill-authoring/SKILL.md) or
[agent-authoring](capabilities/harness-maintenance/skills/agent-authoring/SKILL.md) for the procedure
that matches what you are changing.

Four rules cover most of it:

1. **One canonical owner per rule.** Everything else links to the owner. A rule stated twice is
   stated wrong once.
2. **Change the source, never the output.** Generated artifacts are disposable; they are rebuilt.
3. **No runtime syntax in canonical source.** A field that belongs to one runtime belongs in that
   runtime's adapter.
4. **A harness change is `risk: high`**, whatever its size, and it gets its own reviewable change.
   See [harness-change.md](workflows/harness-change.md).

## What is not here, and why

- **No `roles/`.** The capability directory already says what kind of work an agent does. A parallel
  classification is a second thing to keep in sync.
- **No `commands/`.** A workflow _is_ the user-facing process definition. Adapters surface it as
  whatever the runtime calls a command; there is no second source to keep in step.
- **No `schemas/`.** Agent communication is a runtime concern. The canonical source states semantic
  expectations in prose, because a JSON schema here would be a promise no runtime reads.
- **No project facts.** The module list, the token files, the export surface: those are
  [../docs/](../docs). A harness that restates them drifts from them.
- **No per-rule review skills.** A review _dimension_ is a question, not a skill. The rule belongs to
  the skill that owns the domain, and the detection belongs to the dimension.
