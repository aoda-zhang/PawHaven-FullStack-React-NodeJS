# The Pi adapter

Translates the canonical harness into the layout the Pi runtime loads. Pi is the only implemented
adapter.

```bash
node harness-core/adapters/pi/generate.mjs           # write .pi/
node harness-core/adapters/pi/generate.mjs --check   # exit 1 on drift, write nothing
node harness-core/adapters/pi/validate.mjs           # prove pi's own loaders accept it
node harness-core/adapters/pi/smoke.mjs               # prove pi wires the agents together
```

## The generated tree

```text
.pi/
├── settings.json                                        # generated from the model policy + the tables below
├── README.md                                            # what this directory is
├── capabilities/<capability>/agents/<name>.md          # from harness-core/capabilities/…
├── capabilities/<capability>/skills/<skill>/…          # from harness-core/capabilities/…
├── workflows/*.md                                       # from harness-core/workflows/
├── workflows/patterns/*.md                             # from harness-core/workflows/patterns/
└── rules/*.md                                           # from harness-core/rules/
```

**It mirrors the canonical tree directory for directory.** That is the load-bearing decision: every
relative markdown link in a canonical file resolves identically here, so a link is either right in both
trees or wrong in both. Rewriting links per runtime would mean the canonical link checker and the
runtime's view of the same link could disagree, and neither would know.

Two consequences of Pi's discovery rules, both handled here rather than in the canonical source:

- **Pi's skill loader stops recursing at any directory holding a `SKILL.md`.** That is why one skill
  root is enough here: no skill in this harness contains another skill. If one ever did, its nested
  skills would each need an explicit entry, exactly as they did under the old nested layout.
- **Pi's prompt loader scans one directory and does not descend.** So every directory holding a workflow
  is listed in `prompts:`. The patterns directory is one of them — a workflow pattern is reached by a
  workflow, and routing never selects it.

## What the adapter decides, and why

Canonical agent frontmatter is five fields. Pi needs more, and every addition below is an adapter
decision with a reason, not a canonical fact.

| Canonical                      | Pi                                                            | Why                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authority: read-only`         | `permission: {write: deny, edit: deny}`                       | Pi gates `edit` and `write` by tool, not by role. A read-only agent therefore holds neither tool _and_ declares the denial.                              |
| `tools: [read, search, shell]` | `tools: read, grep, find, ls, bash`                           | Pi names each capability separately; the canonical vocabulary is coarser on purpose.                                                                     |
| `modelTier: strong`            | `subagents.agentOverrides.<name>.thinking`                    | The tier is abstract; the thinking level is Pi's. Rendered from [model-policy.yaml](../../config/model-policy.yaml).                                     |
| `skills: [a, b]`               | `skills: a, b` + `inheritSkills: false`                       | No agent inherits the whole discovered catalog. Context is the cost being managed.                                                                       |
| —                              | `systemPromptMode`, `inheritProjectContext`, `defaultContext` | Pi's context-inheritance model. Whether an agent starts clean, inherits the project, or forks the session is a runtime behaviour, so it is a table here. |
| —                              | `allowedAgents`, `allowNestedSubagents`, `maxSubagentDepth`   | Pi's dispatch configuration. Only the coordinating agent may dispatch; `maxSubagentDepth: 1` keeps a dispatched agent from dispatching again.            |
| `authority: write`             | `acceptanceRole: writer`                                      | Pi classifies an agent by whether it edits. Derived from `authority` so the two cannot disagree.                                                         |

### Runtime affordances with no canonical counterpart

```js
reviewer: {
  runtimeTools: ['watchdog_diff', 'contact_supervisor'];
}
```

Pi's subagent extension exposes these two tools. Neither is a responsibility — one gives the reviewer
the change's diff, the other a channel to report upward — so neither belongs in canonical source. A
third such tool means a third line here, with its reason.

### The permission boundary is not a sandbox

Pi rejects bash rules. `permission:` can gate `edit` and `write`; it **cannot** restrict what a `bash`
call runs, and there is no command allowlist in this runtime.

So the enforced boundary is the tool allowlist plus the denial, and the agents that hold a shell say so
in their own bodies rather than implying the prose is a sandbox. `validate.mjs` checks the generated
denial exists, because that is the part a generation regression could silently remove.

### Packages

`packages: ["npm:pi-subagents@0.76.0"]` — Pi loads its subagent extension from here. A runtime
dependency is an adapter fact: the canonical source does not know that this harness runs inside Pi.

## Validation

`validate.mjs` uses **Pi's own loaders** (`loadSkills`, `loadPromptTemplates`) so the check fails for
the same reasons Pi would fail at startup. That is the one thing this adapter does that the canonical
validator must never do, and keeping it here is what lets `validate-core.mjs` stay importable on a
machine with no runtime installed.

It checks that Pi accepted the generated skills, prompts, and package extensions; that every agent's
`allowedAgents` entry resolves; that a read-only agent denies writes and a writing agent does not; that
exactly one agent may dispatch; that no agent frontmatter declares a model; and that every agent has a
rendered tier.

## Adding a second runtime

Do not fork this adapter. Write a new one beside it, from
[adapters/README.md](../README.md). If a second runtime needs something the canonical model cannot
express, that is a finding about the model, and it belongs in its own change with the reasoning —
not smuggled into an agent body to make one adapter work.
