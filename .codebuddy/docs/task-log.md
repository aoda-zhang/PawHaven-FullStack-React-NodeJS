# Task Log — Format & Lifecycle

The **runtime progress document** for every PawHaven task. Lives at `.codebuddy/task-log.md`
(same level as the repo `README.md`). **Git-ignored — never commit it.**

It is owned by the orchestrator (`pawhaven.md` §3.9) and used as the fork-join barrier
in the **Parallel Execution (Split & Sync)** workflow (`workflows/parallel-execution.md`).

---

## Lifecycle

1. **Open** — when a plan is approved (STEP 0), append a new task section:
   `## Task: {YYYY-MM-DD-{slug}}` with the header + agent-level plan.
2. **Append phases** — after every subagent stage, append a `## Phase:` section:
   what the agent produced, the validation result, whether its Step Completion
   Checklist was present.
3. **Record loops** — a blocking review finding routes back to the implementer
   (Fix → Retest → Re-review); log each pass.
4. **Stuck Log** — log every timeout/partial/stuck point and its recovery (§3.7).
5. **Handoff** — when the task completes, append the final `## Handoff` section.
   Then the orchestrator asks the user **"是否需要清空运行log？"** — Yes → clear the
   file contents (keep the header); No → keep; the next task appends below.

---

## Split & Sync Unit Table (fork-join barrier)

In `parallel-execution.md` STEP 1b, after the architect step, the orchestrator appends:

```md
## Split Plan
| Unit | Owner   | Scope                 | Status  |
|------|---------|-----------------------|---------|
| U1   | backend | Prisma model          | WAITING |
| U2   | backend | report-stray service  | WAITING |
| U3   | frontend| API paths + gate      | WAITING |
```

Each unit subagent, after implementing + validating its unit:

1. Updates its own row to `DONE` (or `FAILED`).
2. Appends its own report under a `### Unit U1 — DONE` heading (files changed,
   validation evidence, Step Completion Checklist).
3. **Reads the ENTIRE log** and checks every sibling unit's status.
4. If ALL units are DONE → the barrier is released → it reports back.
5. If ANY sibling is NOT DONE → it keeps re-reading the log (waiting) until all
   are DONE, then reports back.
6. If its OWN unit FAILED → appends `### Unit U1 — FAILED` + reason and reports
   back immediately (does NOT wait for siblings).

**Write rules**:

- Append-only. New content goes at the end or under the writer's own unit heading.
- A unit NEVER edits another unit's section or row.
- The orchestrator owns everything outside the unit sections (Split Plan table,
  phase digests, Stuck Log, Handoff).

---

## Section Templates

```md
## Task: 2026-08-22-report-animal-rescue-data-link

**Goal**: one line.
**Pipeline**: architect → frontend → backend → testing → code-review → knowledge-update.
**Complexity**: Trivial / Standard / Architectural.
**Decisions**: D1, D2, ... (user-approved)

## Phase: Architect — DESIGN COMPLETE
- Design doc: ADR-001 ... (link)
- Step Completion Checklist: present / missing
- Validation: design reviewed, risks listed

## Phase: Split & Sync — ALL UNITS DONE
| Unit | Owner   | Status |
|------|---------|--------|
| U1   | backend | DONE   |
| U2   | backend | DONE   |
| U3   | frontend| DONE   |
- Integration check: typecheck ✓ lint ✓ build ✓

## Stuck Log
- 2026-08-22 14:32 — backend subagent timed out (300s); re-dispatched as team mode; recovered.
```
