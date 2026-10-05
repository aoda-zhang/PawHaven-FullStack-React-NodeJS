# Worked Examples

One full classification per task type, plus three boundary cases. Each is a request in PawHaven's
domain, with the reasoning that fixes the primary type and the evidence that set scope.

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
  "confidence": 0.85,
  "workflow": "feature",
  "requiredAgents": [
    "architect",
    "frontend-dev",
    "backend-dev",
    "tester",
    "browser-verifier"
  ],
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
`browser-verifier` is in required verification because a form with a success state is only proven on
the real surface.

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
  "confidence": 0.9,
  "workflow": "bug-fix",
  "requiredAgents": ["browser-verifier"],
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
  "confidence": 0.8,
  "workflow": "refactor",
  "requiredAgents": ["tester"],
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
  "confidence": 0.9,
  "workflow": "architecture-change",
  "requiredAgents": [
    "architect",
    "oracle",
    "backend-dev",
    "reviewer",
    "tester"
  ],
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
request path and its auth boundary move. Complexity is high for the same reason. The
`documentation` secondary is not optional — the boundary decision has to outlive the change.

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
  "confidence": 0.85,
  "workflow": "investigation",
  "requiredAgents": ["scout"],
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
  "confidence": 0.75,
  "workflow": "performance",
  "requiredAgents": ["scout", "backend-dev", "tester"],
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
causing errors, it is a `bug-fix` and the workflow changes.

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
  "confidence": 0.8,
  "workflow": "refactor",
  "requiredAgents": ["tester"],
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
  "confidence": 0.85,
  "workflow": "refactor",
  "requiredAgents": ["reviewer"],
  "requiredVerification": [
    "pnpm pi-check exits 0 — 18 project skills, 9 agent-private skills, 9 prompts, 9 agents load with zero diagnostics",
    "node scripts/check-md-links.mjs . reports 0 broken",
    "npx prettier --check clean on every changed file"
  ],
  "requiresClarification": false,
  "clarificationReason": null
}
```

Why `risk: high` rather than `low`. The diff is four moved files, but a harness change affects every
future development task, so a wrong one is paid for repeatedly and stays invisible until much later.
`scope` is `infrastructure` because `.pi/` has no scope category of its own. `reviewer` is required
because the risk is high and no lane reviews its own change. `refactor` is the primary type because
the harness's behaviour is unchanged and only its structure moves, and `documentation` is a
secondary because the reference file that stated the old nesting has to change in the same pass.
`pnpm pi-check` is named in the reply rather than left implicit, which is what a harness scope owes.
