---
name: task-classification
description: >
  Classify a request before a workflow is chosen — task type, secondary tasks, scope, domains,
  complexity, risk, confidence, clarification need — as one JSON artifact the user sees. Semantic
  intent, not keywords. Routes to the six canonical workflow prompts. Load at routing time, at the
  start of any non-trivial request, before planning or dispatching.
  触发场景 / Trigger: new request task routing workflow selection classify classification triage
  which workflow which process how to start where to start first step entry point, complexity scope
  risk size difficulty estimate 复杂度 难度 范围 风险 任务分类 路由, feature bug fix refactor
  architecture investigation performance 需求分类, ambiguous vague underspecified clarify needs
  clarification 澄清 需求不明确.
---

# Task Classification

Classify before selecting a workflow. The deliverable is one JSON block, and the user sees it.
**Classify semantic intent, not keywords.** Read what must be true when the task is done, not which
words the request contains. "Add a test for the adoption form" is not a feature — the behavior
already exists and nothing user-visible changes; it is `testing` scope inside a `refactor` that
strengthens the pin. "Improve the adoption form" is a feature. The verb in the request is not the
task type; the outcome is.

## The contract

```json
{
  "taskType": "feature | bug-fix | refactor | architecture-change | investigation | performance",
  "secondaryTasks": [],
  "scope": [],
  "complexity": "low | medium | high",
  "risk": "low | medium | high | critical",
  "domains": [],
  "confidence": 0.0,
  "workflow": "",
  "requiredAgents": [],
  "requiredVerification": [],
  "requiresClarification": false,
  "clarificationReason": null
}
```

- `taskType` — the single primary type, from the six below.
- `secondaryTasks` — other types present in the same request. They change required agents, review
  depth, and verification. They do **not** change the workflow.
- `scope` — from the twelve categories in [Scope](#scope). Only categories you actually touched.
- `complexity` — orchestration depth, not diff size. See [Complexity](#complexity).
- `risk` — verification depth, and independent of `complexity`. See [Risk](#risk).
- `domains` — the implementation capabilities the task needs. See [Domains](#domains).
- `confidence` — 0.0–1.0. Below ~0.6 means the request is ambiguous; set `requiresClarification`.
- `workflow` — the canonical prompt this routes to. See [Routing](#routing).
- `requiredAgents` — agents whose involvement the risk and scope justify. Name them from
  `.pi/agents/`; do not add an agent that has nothing to check.
- `requiredVerification` — the checks that must pass, and who runs them. A lane with no named
  validator has not finished.
- `requiresClarification` / `clarificationReason` — see [Output rules](#output-rules).

Worked examples for every type: [references/worked-examples.md](./references/worked-examples.md).

## Task types

Each type has a positive test and a nearest neighbour it is most often confused with. Check the
neighbour before committing.

| Type                  | Positive test                                                                                                                      | Nearest neighbour — the test that separates them                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `feature`             | New user-visible or system behavior that does not exist yet                                                                        | `refactor` — if behavior is materially unchanged, it is not a feature. "Add autosave" is a feature. |
| `bug-fix`             | Existing behavior is incorrect and must be restored or corrected                                                                   | `refactor` — if the pinned behavior was already wrong, you are fixing it, not preserving it.        |
| `refactor`            | Behavior materially unchanged while structure or implementation improves                                                           | `feature` / `bug-fix` — any behavior change makes it one of those instead.                          |
| `architecture-change` | Changes system boundaries, domain ownership, service responsibilities, major data flow, infrastructure, or cross-service contracts | `feature` — the size is not the signal; crossing a service or contract boundary is.                 |
| `investigation`       | The user primarily wants understanding or evidence, not a code change                                                              | `bug-fix` — if there is a defect to repair, that is the primary and the investigation is secondary. |
| `performance`         | The primary objective is a measured performance improvement                                                                        | `bug-fix` — a bug is wrong, perf is slow. No measurement, no `performance`.                         |

A request can fail every positive test because two types are genuinely in play. That is a signal to
name one as primary and put the other in `secondaryTasks` — not to average them.

## Secondary tasks

Tasks carry more than one dimension; the primary picks the workflow, the secondaries set the
weight.

- "Refactor the adoption form and add autosave." → primary `feature`, secondary `refactor`. The
  autosave is new behavior; the form cleanup rides along. The refactor raises review depth, because
  behavior must stay pinned while structure moves.
- "Fix the auth bug by redesigning session management." → primary `bug-fix`, secondary
  `architecture-change`, `risk: high`. The reported failure is what the user wants gone.

Never let a secondary task take over the routing. If the architecture change is the bulk of the
work, say so plainly in the reply; the workflow may be `architecture-change` after all.

## Scope

Use only the categories the request actually touches:

```text
frontend  backend  database  api  gateway  core-service  document-service
shared    testing  infrastructure  documentation  cross-system
```

`cross-system` means the change spans more than one of the four services — say which, do not leave
it as a bare category.

**Discover scope, never guess it.** A scope category you inferred from the request text is a
hypothesis. Grep for the files, packages, and services the change lands in and confirm before
emitting the JSON. An unverified `scope` sends the wrong agent to the wrong tree.

Work on `.pi/` is `infrastructure`. It gets no scope category of its own.

## Domains

`domains` answers which implementation capabilities the task needs, which is to say which workers
must run:

```json
"domains": ["frontend", "backend", "database"]
```

`frontend` and `backend` are the two that dispatch today, and `database` joins them when the change
is schema or persistence work. The list is deliberately open: `devops`, `mobile`, `data`, `security`
and others may be added later without changing anything else in the harness.

`scope` keeps its values unchanged. It says where in the repository the change lands, and `gateway`,
`core-service`, `document-service`, and `cross-system` name services and boundaries in this repo
rather than capabilities, so they have no home in `domains`.

**A value may appear in both lists, and that is not duplication.** They answer different questions,
and different parts of the workflow read them. `scope` says where, `domains` says which workers.
`database` stays in `scope` and also appears in `domains` for exactly that reason.

## Complexity

Complexity is **orchestration depth** — how much delegation and planning the task justifies. Line
count is not complexity; a five-file change inside one service is not a high-complexity task, and a
two-file change to an auth contract is.

Complexity and risk are **separate and independent**. Complexity measures how much the task is to
orchestrate, and risk measures how badly a wrong answer is paid for. Low complexity never buys a
lighter path when risk is high: a two-file change to authentication behavior is technically small and
operationally high-risk, so it takes the strong path in full.

- **low** — localized, one layer, established pattern, low ambiguity, straightforward verification.
  Bind it on complexity **and** risk together, because the fast path is `low` and `low` only. Do the
  work in the main session when both are low. Dispatching on a small diff with a high risk costs more
  than it saves.
- **medium** — multiple files or layers, non-trivial state or data flow, several tests, moderate
  uncertainty. Dispatch per workstream, join the results yourself.
- **high** — multiple services, architecture boundaries, database changes, security-sensitive flows,
  ambiguous domain behavior, integration that is hard to verify. Plan first, dispatch in verifiable
  units, require a named validator per unit.

## Risk

Risk sets verification depth.

Always at least **high**: authentication, authorization, permissions, credentials, tokens, sessions,
PII, security boundaries. In this repo that also covers anything touching the gateway's cookie and
internal-JWT boundary — see `docs/architecture/authentication-architecture.md`.

A change to the harness itself is **high at minimum** and may not take a lightweight path:
`.pi/agents`, `.pi/skills`, `.pi/prompts`, `.pi/settings.json`, workflow definitions, model
configuration, orchestrator behaviour. A harness change affects every future development task, so a
wrong one is paid for repeatedly and stays invisible until much later.

**critical** is reserved for destructive operations: destructive database migrations, destructive data
operations, production infrastructure changes.

A `critical` classification **requires explicit human confirmation before any irreversible
execution**. State the operation, say what it destroys, and wait. Proposing the plan is fine;
running it is not. `critical` is never cleared by an agent's own confidence.

## Routing

| `taskType`            | `workflow`            | Prompt                                                      |
| --------------------- | --------------------- | ----------------------------------------------------------- |
| `feature`             | `feature`             | [feature-development](../../prompts/feature-development.md) |
| `bug-fix`             | `bug-fix`             | [bug-fix](../../prompts/bug-fix.md)                         |
| `refactor`            | `refactor`            | [refactoring](../../prompts/refactoring.md)                 |
| `architecture-change` | `architecture-change` | [architecture-change](../../prompts/architecture-change.md) |
| `investigation`       | `investigation`       | [investigation](../../prompts/investigation.md)             |
| `performance`         | `performance`         | [perf-issue](../../prompts/perf-issue.md)                   |

`design-decision`, `parallel-execution`, and `handoff` are not task types. They are stages inside
the workflows above; reach them from the routed workflow, not instead of it.

### Routing the lanes

`taskType` picks the workflow. The lane sequence comes from `complexity`, `risk`, and `domains` read
together: `domains` decides which workers appear, and the other two decide how much surrounds them.

**`low` complexity, `low` risk, `domains: [frontend]`.** `orchestrator` → `frontend-dev` → `tester` →
`reviewer` → the human. No planner and no plan review, because the work sits in one layer with a
straight verification. The developer self-test still runs, since a lane that has not checked its own
work has no evidence to hand on.

**`medium` complexity, `medium` risk, `domains: [frontend, backend]`.** `orchestrator` → `architect`
as the planner → **the shared contract** → `frontend-dev` and `backend-dev`, in parallel only where
the dependencies permit → `tester` → `browser-verifier` on a user-facing surface → `reviewer` →
combined-tree verification. `oracle` plan review is conditional; the human plan approval is not,
because a two-domain feature is Standard work at minimum. A full-stack task is **composed** from two
domains, and no `fullstack-dev` worker exists or should be created for it. Composition is what the
orchestrator already does, and a role for it would be a role with nothing of its own to check.

**`low` complexity, `high` risk, `domains: [backend]`.** The strong path in full: planner, plan
review, a named validator per unit, independent review, and the human gate, because high risk forces
every one of them however small the diff is. This is the shape the routing has to get right.

### The shared contract

When `domains` interact, the shared contract is settled before the independent implementation starts,
so neither worker is guessing at the boundary the other is about to land.

A contract is a durable handoff artifact that describes a boundary. It is not an agent, not a skill,
and not a subsystem. At the code level that boundary is
[`packages/shared/types`](../../../packages/shared/types), the types and Zod schemas both sides
import instead of re-declaring. When a contract turns out to be insufficient mid-flight, the worker's
next move is in
[the contract change gate](../project-rules/references/orchestrator.md#the-contract-change-gate).

## Output rules

1. **Show the JSON to the user before the workflow starts.** It is the artifact they correct. Emit
   the object itself — no prose wrapper, no truncated field list.
2. **`requiresClarification: true` is a successful outcome.** Guessing past an ambiguous request and
   building the wrong thing is the failure. Ask the specific question in `clarificationReason`, set
   the field you cannot determine, and stop there.
3. **Revise it in the open.** Classification is a first read, not a verdict. If the work reveals the
   primary type was wrong, say which field changed and why.
4. **Never classify from keywords alone.** If the type came from a word in the request rather than
   from the outcome, keep going until the outcome is known.
5. **When the scope touches the harness, say which validation the change must pass.** A `.pi/` change
   runs `pnpm pi-check`, and the reply names it. Leaving the validator implicit is how a change
   renames a path, breaks a link, and reports itself verified.
