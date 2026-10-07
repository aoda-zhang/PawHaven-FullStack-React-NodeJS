# Worked Examples

One full classification per task type, plus three boundary cases and the two routing shapes the
process file's lane sequences key on
([harness-process.md](../../../workflows/harness-process.md#lane-shapes)). Each is a request in
PawHaven's domain, with the reasoning that fixes the primary type and the evidence that set scope and
domains.

Every example carries `scope` and `domains` together. Read the pair: `scope` says where the change
lands, `domains` says which implementation capabilities run.

---

## 1. Feature — "Let people report a stray animal from the portal"

New user-visible behavior: a reporting flow that does not exist today.

```json
{
  "taskType": "feature",
  "secondaryTasks": [],
  "scope": [
    "frontend",
    "backend",
    "api",
    "core-service",
    "shared",
    "testing",
    "documentation"
  ],
  "complexity": "medium",
  "risk": "low",
  "domains": ["frontend", "backend"],
  "confidence": 0.85,
  "workflow": "feature",
  "requiredAgents": ["planning", "implementation", "verification"],
  "requiredVerification": [
    "pnpm typecheck green",
    "shared Zod schema imported by both sides — not re-declared",
    "browser-verifier: report form renders, validates, submits, and shows the success state"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why `feature` and not `refactor`: nothing exists to preserve. Complexity is medium, not high — one
service owns reporting, and the contract lives in `packages/shared` without a boundary change.
`domains` is `frontend` and `backend`, two workers and no schema work, so `database` stays out of it
while remaining in `scope`. The `verification` role is in required verification because a form with a
success state is only proven on the real surface.

---

## 2. Bug fix — "The report form loses its data after a validation error"

Existing behavior is incorrect.

```json
{
  "taskType": "bug-fix",
  "secondaryTasks": [],
  "scope": ["frontend"],
  "complexity": "low",
  "risk": "low",
  "domains": ["frontend"],
  "confidence": 0.9,
  "workflow": "bug-fix",
  "requiredAgents": ["verification"],
  "requiredVerification": [
    "repro on the portal form before the fix",
    "same repro passes after the fix",
    "pnpm typecheck green"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why not `refactor`: the pre-change behavior is the defect. A refactor pins behavior; this task
changes it back to what it should have been. `confidence` is high because the repro is stated.

---

## 3. Refactor — "AnimalCard duplicates the badge logic; pull it out"

```json
{
  "taskType": "refactor",
  "secondaryTasks": [],
  "scope": ["frontend", "testing"],
  "complexity": "low",
  "risk": "low",
  "domains": ["frontend"],
  "confidence": 0.8,
  "workflow": "refactor",
  "requiredAgents": ["verification"],
  "requiredVerification": [
    "existing AnimalCard tests pass unchanged before and after the extraction",
    "all AnimalCard call sites migrated; no duplicate badge markup left"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why not `feature`: no new user-visible behavior. The nearest neighbour is `bug-fix` — if the
duplicated badge logic is also _wrong_ on one of the two call sites, that is a second finding, and
it is reported separately rather than folded into a behavior-preserving refactor.

---

## 4. Architecture change — "Move PDF generation out of core-service into document-service"

Changes service responsibilities and cross-service contracts.

```json
{
  "taskType": "architecture-change",
  "secondaryTasks": ["refactor", "documentation"],
  "scope": [
    "backend",
    "api",
    "gateway",
    "core-service",
    "document-service",
    "infrastructure",
    "documentation"
  ],
  "complexity": "high",
  "risk": "high",
  "domains": ["backend"],
  "confidence": 0.9,
  "workflow": "architecture-change",
  "requiredAgents": ["planning", "implementation", "verification"],
  "requiredVerification": [
    "callers migrated in one wave; no dual path left",
    "core-service no longer imports the PDF module",
    "pnpm typecheck and targeted tests green across both services",
    "docs/architecture/ updated in the same change"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why `risk: high`: the gateway proxies `/api` to the service that now owns the contract, so the
request path and its auth boundary move. Complexity is high for the same reason. `domains` is
`backend` alone, because one worker does the whole move however many services it crosses. `gateway`
and `cross-system` describe where the change lands and stay out of `domains`. The `documentation`
secondary is not optional: the boundary decision has to outlive the change.

---

## 5. Investigation — "Where are animal status transitions enforced?"

The user wants to know where the rule lives. No change is requested.

```json
{
  "taskType": "investigation",
  "secondaryTasks": [],
  "scope": ["backend", "core-service"],
  "complexity": "low",
  "risk": "low",
  "domains": ["backend"],
  "confidence": 0.85,
  "workflow": "investigation",
  "requiredAgents": ["planning"],
  "requiredVerification": [
    "each claim cites a file or call path read this session",
    "stated explicitly if the answer is incomplete"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why not `bug-fix`: nothing is described as broken. If the follow-up is "and it lets a rescued
animal go back to reported", that is a `bug-fix` with this as the investigation, and the workflow
becomes `bug-fix`.

---

## 6. Performance — "Animal search takes four seconds; make it fast"

```json
{
  "taskType": "performance",
  "secondaryTasks": [],
  "scope": ["backend", "core-service", "database", "testing"],
  "complexity": "medium",
  "risk": "low",
  "domains": ["backend", "database"],
  "confidence": 0.75,
  "workflow": "performance",
  "requiredAgents": ["planning", "implementation", "verification"],
  "requiredVerification": [
    "baseline time recorded before any change",
    "post-fix time recorded on the same surface and compared to the baseline",
    "a regression guard exists for the measured path"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why not `bug-fix`: a bug is wrong; this is slow. The discriminator is measurement — without a
baseline number this cannot be `performance`, and if the slowness turns out to be a broken index
causing errors, it is a `bug-fix` and the workflow changes. `database` appears in both lists because
the index is where the fix lands and the query layer is the worker that has to reason about it.

---

## 7. Boundary — "Add tests for the adoption form"

The trap case. The word "add" plus a feature-shaped noun reads as a feature; it is not.

```json
{
  "taskType": "refactor",
  "secondaryTasks": [],
  "scope": ["frontend", "testing"],
  "complexity": "low",
  "risk": "low",
  "domains": ["frontend"],
  "confidence": 0.8,
  "workflow": "refactor",
  "requiredAgents": ["verification"],
  "requiredVerification": [
    "the new tests fail when the form behavior is broken"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

The behavior is unchanged and untested, so the job is to strengthen the pin — `refactor`'s step 1.
`testing` is scope; it is not one of the six task types. If the tests reveal the form is actually
broken, that is a second classification, and the bug is reported as a `bug-fix`.

---

## 8. Ambiguous — "Make the animal page better"

```json
{
  "taskType": "feature",
  "secondaryTasks": [],
  "scope": [],
  "complexity": "",
  "risk": "low",
  "domains": [],
  "confidence": 0.2,
  "workflow": "",
  "requiredAgents": [],
  "requiredVerification": [],
  "requiresClarification": true,
  "clarificationReason": "'Better' is not an outcome. Which is it: a new capability on the page (feature), a layout or state defect (bug-fix), a query that is slow (performance), or a cleanup of the page's components (refactor)?"
}
```

Unknown fields stay empty rather than guessed. This is the honest outcome, and it is a successful
classification — the alternative is building the wrong thing and calling it verified.

---

## 9. Harness change — "Make the review skill load its own doctors instead of nesting them"

A `.pi/skills/` change. No task type names this, and a seventh type is not added, because
`architecture-change` would route to service boundaries, competing designs, migration waves, and
`docs/architecture/` edits, none of which apply to a skill file. The risk floor and the named
validator carry it instead.

```json
{
  "taskType": "refactor",
  "secondaryTasks": ["documentation"],
  "scope": ["infrastructure", "documentation"],
  "complexity": "medium",
  "risk": "high",
  "domains": [],
  "confidence": 0.85,
  "workflow": "refactor",
  "requiredAgents": ["verification"],
  "requiredVerification": [
    "pnpm pi-check exits 0 — 19 project skills, 10 prompts, 9 agents load with zero diagnostics, and no skills/ directory under .pi/agents/",
    "node scripts/check-md-links.mjs . reports 0 broken",
    "npx prettier --check clean on every changed file"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why `risk: high` rather than `low`. The diff is four moved files, but a harness change affects every
future development task, so a wrong one is paid for repeatedly and stays invisible until much later.
`scope` is `infrastructure` because `.pi/` has no scope category of its own. `domains` is empty,
because no current domain describes the work and the list stays open until one does; adding a
`harness` value to cover this one example is not worth a term every other classification then has to
consider. The `verification` role is required because the risk is high and no lane reviews its own
change.
`refactor` is the primary type because the harness's behaviour is unchanged and only its structure
moves, and `documentation` is a secondary because the reference file that stated the old nesting has
to change in the same pass. `pnpm pi-check` is named in the reply rather than left implicit, which is
what a harness scope owes.

---

## 10. Full-stack feature — "Show a rescue case's progress as a public timeline"

`medium` complexity, `medium` risk, `domains: [frontend, backend]`. The shape the lane sequences
route with two implementation roles.

```json
{
  "taskType": "feature",
  "secondaryTasks": ["documentation"],
  "scope": ["frontend", "backend", "api", "core-service", "shared", "testing"],
  "complexity": "medium",
  "risk": "medium",
  "domains": ["frontend", "backend"],
  "confidence": 0.85,
  "workflow": "feature",
  "requiredAgents": ["planning", "implementation", "verification"],
  "requiredVerification": [
    "shared Zod schema for the timeline entries, imported by both sides and not re-declared",
    "frontend and backend units run in parallel only after the contract is settled",
    "browser-verifier: the timeline renders, orders, and handles a case with no entries",
    "pnpm typecheck and pnpm build:local green on the combined tree"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why `medium` risk: nothing here touches authentication, permissions, credentials, or PII, so the
risk floor does not apply, and nothing in the change is destructive. Complexity is medium because
two domains and a shared payload cross between them. No `fullstack-dev` worker is dispatched and
none should be created for this shape. The work is composed from the two domains that already exist,
with the contract settled first so neither worker guesses at the boundary.

---

## 11. Low complexity, high risk — "Shorten the gateway access-token lifetime to 5 minutes"

`low` complexity, `high` risk, `domains: [backend]`. The shape that must not take the fast path.

```json
{
  "taskType": "feature",
  "secondaryTasks": ["testing"],
  "scope": ["backend", "gateway", "api", "testing"],
  "complexity": "low",
  "risk": "high",
  "domains": ["backend"],
  "confidence": 0.8,
  "workflow": "feature",
  "requiredAgents": ["implementation", "verification"],
  "requiredVerification": [
    "the auth suite green against the new lifetime",
    "no handler infers a session's age from a window of its own",
    "reviewer and the human gate both run, because high risk forces them whatever the diff size"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why complexity is low: one constant, one service, an established pattern, and a verification the
suite already knows how to run. Why risk is high: the value governs token lifetime, so the
authentication floor applies however small the change is. That is what keeping `complexity` and
`risk` separate buys. Low complexity buys nothing here, so the planner, the plan review, the named
validator, the independent review, and the human gate all run over a one-line diff. `domains` is
`backend` because the implementation worker is the backend lane, while `gateway` stays in `scope`
alone, naming the service rather than a capability.
