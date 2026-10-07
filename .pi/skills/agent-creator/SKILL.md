---
name: agent-creator
description: >
  Create, revise, or retire an agent in this harness. Use when a responsibility needs its own context,
  toolset, or permission boundary — and to decide whether it does.
  Trigger: create an agent new agent subagent definition agent.md role domain responsibilities
  tools grants subagent tool context window dispatch verification responsibility.
---

# Agent Creator

An agent is a **responsibility boundary**, not a knowledge container. An agent is a context window
plus a toolset. What makes it an agent is what a skill or a workflow step cannot provide: a separate
context, a toolset, or a permission boundary.

## Before creating

Answer all six. A "no" on any of them means do not create an agent.

1. Does this responsibility need an independent context?
2. Does it need different tools or capabilities?
3. Does it need different permissions?
4. Does it have a distinct verification responsibility?
5. Is it genuinely reusable?
6. Can an existing agent own it instead?

If what you actually have is a new step, a new skill, a new prompt, or a new technology, it is not an
agent. Name the existing agent that owns it, or write the skill.

## Layout

```
.pi/agents/<role>/<name>/<name>.agent.md
```

The directory an agent lives in is its **role**: coordination, planning, implementation, or
verification. The file name and the frontmatter `name` agree. A body is the agent's whole system
prompt, so it declares the pair explicitly:

```
**Role:** <role> · **Domain:** <domain or —>
```

Both lines are required, and `pnpm pi-check` fails when either is missing.

## Frontmatter

| Field                  | Rule                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| `name`                 | The lane's identity. Unique.                                                     |
| `description`          | When to dispatch this lane, not what it knows.                                   |
| `tools`                | The minimum that does the job. `subagent` belongs only to the coordinating lane. |
| `skills`               | Grants by name. An agent reaches a skill by naming it here.                      |
| `inheritSkills`        | `false`, so the lane carries exactly its grants.                                 |
| `allowedAgents`        | Only on the lane that dispatches.                                                |
| `allowNestedSubagents` | Only on the lane that dispatches, with `maxSubagentDepth` bounding it.           |

## What an agent defines

Role, responsibility, capabilities, tools, skills, input, output, constraints, and what it must verify
before it reports.

## What an agent must not contain

- Large technical knowledge. That is a skill.
- Project documentation. That is `docs/`.
- A workflow engine, a sequence, or a retry policy. Ordering is `.pi/workflows/`.
- A copy of a skill, a rule, another agent's instructions, or an agent-local skill registry.

An agent **references** a skill, a doc, a rule, or a tool. It never copies one. When the body needs a
rule that already exists, link it and stop.

## Dependency direction

```
workflow → agent → skill
```

The coordinating lane may delegate to other lanes. A worker lane does not dispatch, and does not call
another worker: a change nobody independent has read has not been reviewed, and a worker that reviews
its own sibling's work is not independent. One lane produces the verdict on a diff.

## Validate

```bash
pnpm pi-check      # discovery, frontmatter, grants, direction, role/domain
pnpm check:links   # every relative link and anchor resolves
```

Update `EXPECTED_AGENTS` and, if tiering changed, `agentOverrides` in `.pi/settings.json` in the same
change. An `agentOverrides` key left behind by a rename is inert, so the lane silently runs at the
default thinking level and nothing says so.

## Retiring one

Remove the definition, then remove every grant, every `allowedAgents` entry, every `agentOverrides`
key, and every link that named it. `pnpm pi-check` fails on each of those, which is the point: a
dangling reference to a lane that no longer exists resolves to nothing and loses the methodology
silently.

## Related

- Harness checks: [harness-validator](../harness-validator/SKILL.md)
- Creating a skill: [skill-creator](../skill-creator/SKILL.md)
- Prose rules: [writing-standards](../writing-standards/SKILL.md)
