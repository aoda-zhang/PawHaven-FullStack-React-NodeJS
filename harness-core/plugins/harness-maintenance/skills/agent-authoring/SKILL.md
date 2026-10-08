---
name: agent-authoring
description: >
  How to define an agent in this harness, and how to decide whether what you have needs one. An
  agent is a responsibility with its own context, tools, and authority — not a knowledge container and
  not a workflow step. Read before adding, renaming, splitting, merging, or retiring an agent.
  Trigger: create agent new agent subagent definition responsibilities tools authority context
  dispatch rename retire split merge agent.md modelTier.
---

# Agent authoring

## When an agent earns its place

An agent is worth creating only when the responsibility needs **at least one** of these that a skill
or a workflow step cannot provide, **and** it is reusable:

1. **Independent context** — the work needs its own context window, separate from whoever asked.
2. **A different toolset** — it needs capabilities no existing agent holds.
3. **A different authority boundary** — it must be unable to do something, or able to do something, that
   its neighbours cannot.
4. **A distinct verification concern** — it has to check something the others do not check.
5. **A reusable responsibility** — it will be dispatched again, by someone other than its author.

Then answer the last question:

> Can an existing agent own it instead?

If yes, extend that agent. A second agent for one responsibility is a second place the method drifts.

## When it is not an agent

| What you actually have                                    | Where it goes                                |
| --------------------------------------------------------- | -------------------------------------------- |
| Technology knowledge, or a rule about how to do something | a **skill**                                  |
| A new step in a process                                   | the **workflow**                             |
| A threshold or standard that outlives one workflow        | a **rule**                                   |
| A fact about this repository                              | `docs/`                                      |
| A way to expose a workflow to a user                      | the **workflow** itself; adapters surface it |
| A model choice                                            | the **model policy**                         |

A skill that grows into a 6000-line technology handbook has the wrong shape: split the knowledge into
references, not the agent into more agents.

## Where an agent lives

```
harness-core/plugins/<capability>/agents/<name>.md
```

The **directory is the classification**. An agent does not repeat its capability in its body, and it
does not carry a role or domain line: the path already says which bundle owns it, and a second copy of
that classification is a second thing to keep in sync.

A capability bundle is chosen by **cohesive purpose**, not by directory layout. `frontend-development`
holds everything that serves building frontend: the agent, the implementation patterns, the tool
integration, the frontend tests. `code-review` is separate, because implementation and judging a
change are different responsibilities and one agent must never do both.

## Frontmatter

Canonical frontmatter is runtime-neutral. The full schema and the validator are in the harness's
architecture rules; these are the fields that carry meaning:

| Field         | Rule                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `name`        | The agent's identity, unique across the harness. Equal to the file stem.                                         |
| `description` | **When to dispatch this agent**, not what it knows. This is what a reader reads to choose.                       |
| `modelTier`   | An abstract tier from the model policy. Never a model name.                                                      |
| `authority`   | `read-only` or `write`. The one thing about authority that must be canonical, because every adapter enforces it. |
| `skills`      | Grants by name. The agent reaches knowledge; it never inlines it.                                                |
| `tools`       | Neutral capability names from a closed set. Not runtime tool identifiers.                                        |

**Forbidden in canonical source**: anything naming a specific runtime's field, tool, permission syntax,
configuration file, or dispatch mechanism. Those belong to the adapter, and an adapter that cannot
express a field does not get the field smuggled into the canonical body instead.

**Forbidden in the body**: large technical knowledge, project documentation, a workflow engine, a
sequence, a retry policy, or a copy of a skill's rules. An agent **references**; it never **copies**.

## The body

Imperative, second person, and short. It answers five questions and stops:

- **Purpose** — what this agent is for, in one paragraph.
- **Scope** — where it acts, and what is explicitly not its job.
- **Responsibilities** — what it does, as a list a reader can check.
- **Expected behaviour** — the rules that change what it does at a decision point.
- **Verification responsibility** — what it must prove before it reports.

It also has to report something. A result contract — the fields it returns, what each means — belongs
here, because it is the shape its caller dispatches on.

## Dependencies

```
workflow → agent → skill → reference / script / asset
```

Rules are cross-workflow invariants and may be referenced by a workflow, an agent, a skill, or the
validator.

- The coordinating agent may dispatch. A worker does not dispatch, and does not call another worker.
- A skill may not route work to an agent, start a workflow, or implement orchestration.
- An agent does not carry a second copy of a skill's rules. It grants the skill.

## Validate

```bash
pnpm harness:check     # canonical structure, names, grants, references, tiers, direction
pnpm harness:generate  # regenerate every runtime's output
pnpm pi:check          # the runtime's own loader accepts what was generated
pnpm check:links       # every relative link and anchor resolves
```

Run all four before a harness change is considered done. The first catches a broken reference at the
source; the second is what makes the generated output current; the third is the only one that proves a
runtime accepts it.

## Retiring one

Remove the definition, then remove every grant, every dispatch permission entry, every model-policy
assignment, and every link that named it. The validator fails on each of those, which is the point: a
dangling reference to an agent that no longer exists resolves to nothing and loses the methodology
silently.

## Related

- Defining a skill: [skill-authoring](../skill-authoring/SKILL.md)
- Keeping the harness correct: [harness-validation](../harness-validation/SKILL.md)
- Prose rules for everything above: [writing-standards](../../../writing/skills/writing-standards/SKILL.md)
