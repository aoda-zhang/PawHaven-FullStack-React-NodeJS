---
name: task-classification
description: >
  Classify a request before a workflow is chosen — task type, secondary tasks, scope, domains,
  complexity, risk, confidence, clarification need — as one JSON artifact the user sees. Semantic
  intent, not keywords. Load at routing time, at the start of any non-trivial request, before
  planning or dispatching.
  Trigger: new request task routing workflow selection classify classification triage which workflow
  which process how to start where to start first step entry point, complexity scope risk size
  difficulty estimate, feature bug fix refactor architecture investigation performance, ambiguous
  vague underspecified clarify needs clarification.
---

# Task Classification

Classify before a workflow is chosen. The deliverable is one JSON block, and the user sees it.

**Classify semantic intent, not keywords.** Read what must be true when the task is done, not which
words the request contains. "Add a test for the adoption form" is not a feature — the behavior
already exists and nothing user-visible changes. "Improve the adoption form" is a feature. The verb in
the request is not the task type; the outcome is.

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
- `secondaryTasks` — other types present in the same request. They raise review depth and
  verification; they do not change the routing.
- `scope` — from the twelve categories in [Scope](#scope). Only the categories you actually touched.
- `complexity` — orchestration depth, not diff size.
- `risk` — verification depth, independent of `complexity`.
- `domains` — the implementation capabilities the task needs.
- `confidence` — 0.0–1.0. Below ~0.6 means the request is ambiguous; set `requiresClarification`.
- `workflow` — the canonical prompt this routes to. The mapping from `taskType` to workflow lives in
  [the process document](../../workflows/harness-process.md#routing-a-request-to-a-workflow). Emit
  it; do not follow it here.
- `requiredAgents` — the roles the risk and scope justify, by role name (`planning`,
  `implementation`, `verification`), not by lane. Do not name a role that has nothing to check.
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

A request can fail every positive test because two types are genuinely in play. Name one as primary
and put the other in `secondaryTasks` — do not average them.

## Scope

Use only the categories the request actually touches:

```text
frontend  backend  database  api  gateway  core-service  document-service
shared    testing  infrastructure  documentation  cross-system
```

`cross-system` means the change spans more than one of the four services — say which, do not leave it
as a bare category. Work on `.pi/` is `infrastructure` and gets no category of its own.

**Discover scope, never guess it.** A category inferred from the request text is a hypothesis. Grep
for the files, packages, and services the change lands in and confirm before emitting the JSON. An
unverified `scope` sends the wrong agent to the wrong tree.

## Domains

`domains` says which implementation capabilities the task needs, which is which workers must run.

```json
"domains": ["frontend", "backend", "database"]
```

`frontend` and `backend` dispatch today; `database` joins them for schema or persistence work. The
list is deliberately open — `devops`, `mobile`, `data`, `security` may be added later without changing
anything else.

`scope` and `domains` answer different questions and a value may appear in both. `scope` says where in
the repository the change lands; `domains` says which capabilities it needs. `gateway`,
`core-service`, `document-service`, and `cross-system` name services and boundaries, not capabilities,
so they have no home in `domains`.

## Complexity

Complexity is **orchestration depth** — how much planning and delegation the task justifies. Line
count is not complexity; a five-file change inside one service is not high-complexity, and a two-file
change to an auth contract is.

- **low** — localized, one layer, established pattern, low ambiguity, straightforward verification.
  Do the work in the main session when risk is low too. The fast path is `low` complexity **and** `low`
  risk, and nothing else buys it.
- **medium** — multiple files or layers, non-trivial state or data flow, several tests, moderate
  uncertainty.
- **high** — multiple services, architecture boundaries, database changes, security-sensitive flows,
  ambiguous domain behavior, integration that is hard to verify. Plan first, and require a named
  validator per unit.

Complexity and risk are separate. Low complexity never buys a lighter path when risk is high.

## Risk

Risk sets verification depth.

Always at least **high**: authentication, authorization, permissions, credentials, tokens, sessions,
PII, security boundaries — including anything touching the gateway's cookie and internal-JWT boundary.

A change to the harness itself is **high at minimum** and may not take a lightweight path:
`.pi/agents`, `.pi/skills`, `.pi/workflows`, `.pi/settings.json`, model configuration, orchestration
behavior. A harness change affects every future task, so a wrong one is paid for repeatedly and stays
invisible until much later.

**critical** is reserved for destructive operations: destructive database migrations, destructive data
operations, production infrastructure changes. A `critical` classification requires explicit human
confirmation before any irreversible execution. State the operation, say what it destroys, and wait.
`critical` is never cleared by an agent's own confidence.

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
5. **When the scope touches the harness, name the validation it must pass.** A `.pi/` change runs
   `pnpm pi-check`, and the reply names it. Leaving the validator implicit is how a change renames a
   path, breaks a link, and reports itself verified.

## Related

- Principles: [principles](../principles/SKILL.md)
