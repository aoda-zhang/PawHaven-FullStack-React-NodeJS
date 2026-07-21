# Workflow: Feature Development

> **Applies to**: New feature implementation (full-stack or single-side)
> **Trigger**: User requests a new feature
> **Owner**: PawHaven Orchestrator

## Pipeline

```
USER REQUEST
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 0: CLASSIFY & PLAN (Orchestrator)       │
│                                             │
│ - Classify scope: frontend / backend / full-stack │
│ - Choose dispatch mode: sync / team         │
│ - Produce agent-level execution plan         │
│ - Present to user → WAIT for approval       │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 1: ARCHITECT (if complex change)        │
│                                             │
│ Delegate to: architect agent                │
│                                             │
│ - Analyze requirements                      │
│ - Read architecture docs                    │
│ - Inspect existing code                     │
│ - Define: module assignment, API design,     │
│   DB changes, event contracts, shared types │
│ - Assess risks + document alternatives      │
│ - Create ADR if architecturally significant │
│ - Output: structured architecture design    │
│                                             │
│ Skip for: trivial UI-only or config changes │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 2: FRONTEND IMPLEMENTATION              │
│                                             │
│ Delegate to: frontend agent                 │
│                                             │
│ - Read architecture design (if from Step 1) │
│ - Read frontend architecture docs           │
│ - Read Figma design (if UI task)            │
│ - Explore existing features for patterns    │
│ - Plan: files, skills, dependencies         │
│ - Implement: types → APIs → components →    │
│   i18n → route registration                │
│ - Validate: react-doctor, typecheck, lint   │
│ - Report: files created + modified          │
│                                             │
│ For full-stack: draft API contracts in      │
│ packages/shared/ for backend to finalize    │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 3: BACKEND IMPLEMENTATION               │
│                                             │
│ Delegate to: backend agent                  │
│                                             │
│ - Read architecture design (if from Step 1) │
│ - Read backend architecture docs            │
│ - Explore existing modules for patterns     │
│ - Finalize shared types (Zod schemas, DTOs) │
│ - Plan: files, module assignment            │
│ - Implement: types → Prisma → entities →    │
│   DTOs → use-cases → events → service →    │
│   controller → module                      │
│ - Validate: typecheck, lint, build          │
│ - Report: files + API contract for frontend │
│                                             │
│ ⚠️ If frontend drafted types, backend      │
│   reviews and finalizes the authoritative   │
│   version in packages/shared/               │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 4: TESTING                              │
│                                             │
│ Delegate to: testing agent                  │
│                                             │
│ - Analyze implementation code               │
│ - Design test strategy (unit/integration/   │
│   API/E2E based on change type)            │
│ - Implement tests next to source files      │
│ - Execute: all levels                       │
│ - Report: pass/fail + coverage              │
│ - If failures: report back (do NOT fix)     │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 5: CODE REVIEW                         │
│                                             │
│ Delegate to: code-review agent              │
│                                             │
│ - Gate: Figma design match (UI only)        │
│ - Layer 1: 6 sub-skills (automated scans)   │
│ - Layer 2: Architecture & design review     │
│ - Layer 3: Feature requirements review      │
│ - Layer 4: Type contract review (full-stack)│
│ - Report: Blocking / Warning / Suggestion   │
│                                             │
│ If Blocking issues: re-spawn relevant agent │
│ to fix, then re-review                      │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 6: KNOWLEDGE SYNC                       │
│                                             │
│ Delegate to: knowledge-update agent         │
│ (auto-triggered on knowledge file changes)  │
│                                             │
│ - If architecture changed → update docs     │
│ - If new ADR created → update indexes       │
│ - Cascade updates to dependent docs         │
│ - Update root READMEs if needed             │
│                                             │
│ Skip if no architectural changes            │
└─────────────────────────────────────────────┘
    │
    ▼

┌─────────────────────────────────────────────┐
│ STEP 7: SUMMARIZE (Orchestrator)             │
│                                             │
│ - Collect reports from all agents           │
│ - Present summary: what was built, changes, │
│   any follow-ups or known issues            │
│ - Preview frontend if applicable            │
└─────────────────────────────────────────────┘
```

## Scope-Specific Variations

### Frontend-Only Feature

Skip Steps 1 (architect), 3 (backend). Run Steps 2 → 4 → 5 → 7.

### Backend-Only Feature

Skip Steps 1 (architect), 2 (frontend). Run Steps 3 → 4 → 5 → 7.

### Trivial Change (1 file, no new features)

Skip Steps 1, 4. Run Steps 2 or 3 → 5 → 7.

## Decision Points

| Decision                | When                                                              | Default                         |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------- |
| Include architect step? | New module, new service, cross-module impact, DB schema changes   | YES for complex, NO for simple  |
| Sequential vs parallel? | Frontend depends on backend API? Backend needs frontend contract? | Sequential (frontend → backend) |
| Team mode vs sync?      | Task needs >300s? Reads architecture docs? Creates 2+ files?      | Team mode for complex           |

## Failure Recovery

Every step in the pipeline has a failure path. When a step fails, the orchestrator MUST handle it:

```
IF STEP N FAILS:

1. Identify the failure type:
   - Validation failure (typecheck/lint/test → fixable by the same agent)
   - Implementation gap (missing feature/edge case → agent re-implements)
   - Architecture issue (design wrong → back to architect)
   - Blocking review issue (violations found → back to implementing agent)

2. Route to the responsible agent:
   - Validation/test failure → same agent re-fixes and re-validates
   - Implementation gap → same agent extends implementation
   - Architecture issue → back to architect agent (Step 1)
   - Review blocking issue → back to frontend/backend agent (Step 2 or 3)

3. After fix:
   - Fix → Re-test → Re-review (Step 4 → Step 5)
   - NEVER skip re-testing after a fix
   - NEVER skip re-review after re-testing

4. Maximum retries:
   - IMPLEMENTATION: 3 attempts per step before escalating to architect
   - REVIEW: 2 blocking-issue rounds before flagging for user decision

5. If maximum retries exceeded:
   - Report to the user with: what was attempted, why it failed, what decision is needed
   - Do NOT loop indefinitely
```

### Common Failure Scenarios

| Failure                                                                     | Occurrence | Recovery                                                                                  |
| --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| Typecheck fails after implementation                                        | Step 2/3   | Agent fixes type errors → re-runs typecheck                                               |
| Tests fail after implementation                                             | Step 4     | Testing reports to orchestrator → implementing agent fixes → re-test                      |
| Review finds blocking violation                                             | Step 5     | Orchestrator re-spawns implementing agent with specific issue → fix → re-test → re-review |
| API contract mismatch (frontend vs backend)                                 | Step 3     | Backend reports mismatch → orchestrator notifies frontend → frontend aligns               |
| Architect design incomplete (missing edge case found during implementation) | Step 2/3   | Agent reports gap → orchestrator re-spawns architect for amendment                        |
