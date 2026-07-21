# Workflow: Architecture Change

> **Applies to**: Architecture-level changes (new service, module restructure, paradigm shift, data model redesign)
> **Trigger**: User requests a significant architectural change, or architect agent identifies one
> **Owner**: PawHaven Orchestrator (with Architect Agent as primary executor)

## Pipeline

```
ARCHITECTURE CHANGE REQUEST
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 0: SCOPING (Orchestrator)               │
│                                             │
│ - Is this truly an architecture change?     │
│   (See triggers below)                      │
│ - Classify impact scope                     │
│ - Present plan → WAIT for approval          │
│                                             │
│ ⚠️ Architecture changes require extra       │
│   caution. Always use the full pipeline.    │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 1: ANALYSIS (Architect Agent)           │
│                                             │
│ - Deep-read ALL architecture docs           │
│ - Inspect ALL affected modules/services     │
│ - Map complete dependency graph of affected │
│   components (frontend AND backend)         │
│ - Identify ALL consumers of changed APIs    │
│                                             │
│ Output: Impact Analysis Document            │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 2: DESIGN (Architect Agent)             │
│                                             │
│ - Propose solution with full detail:        │
│   • New module/service structure            │
│   • Migration path (step-by-step)           │
│   • API contract changes (old → new)        │
│   • Database migration plan                 │
│   • Event contract changes                  │
│   • Shared type changes                     │
│   • Frontend adaptation plan                │
│                                             │
│ - Document alternatives considered          │
│ - Assess risks with mitigation + rollback   │
│                                             │
│ Output: Architecture Decision Document      │
│ + ADR (mandatory for all arch changes)      │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 3: REVIEW (Orchestrator + User)         │
│                                             │
│ - Present architecture decision to user     │
│ - Discuss trade-offs and risks              │
│ - User MUST explicitly approve before       │
│   implementation begins                     │
│                                             │
│ ⚠️ This is the LAST checkpoint before      │
│   irreversible changes begin.               │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 4: IMPLEMENTATION                       │
│                                             │
│ Execute in order:                            │
│                                             │
│ 4a. Backend structural changes first         │
│     - Create new module/service skeleton    │
│     - Migrate existing code (if applicable) │
│     - Update Prisma schema + migration      │
│     - Update shared types                   │
│                                             │
│ 4b. Backend logic adaptation                 │
│     - Update use-cases to new structure     │
│     - Update event handlers                 │
│     - Update service facades                │
│     - Update controllers                    │
│     - Add deprecation notices on old APIs   │
│                                             │
│ 4c. Frontend adaptation                      │
│     - Update to new API contracts           │
│     - Update to new shared types            │
│     - Reorganize features if needed         │
│                                             │
│ 4d. Testing (all levels)                     │
│     - Unit tests for new structure          │
│     - Integration tests for migration       │
│     - E2E for critical flows                │
│     - Regression test full suite            │
│                                             │
│ 4e. Code review                              │
│     - All layers (1-4)                      │
│     - Architecture-doctor specifically      │
│     - Verify all cross-references updated   │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 5: DOCUMENTATION (Knowledge Update)     │
│                                             │
│ - Update ALL affected architecture docs     │
│ - Add new ADR to ADR/ directory             │
│ - Update cross-references                   │
│ - Update root READMEs                       │
│ - Mark superseded ADRs                      │
│ - Update product strategy if scope changed  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ STEP 6: VALIDATION (Orchestrator)            │
│                                             │
│ - Full project typecheck                    │
│ - Full project lint                         │
│ - Full test suite passes                    │
│ - No broken imports or dead code            │
│ - All ADR cross-references valid            │
│ - All knowledge docs consistent             │
│                                             │
│ Report: summary of changes + any tech debt  │
│ introduced (should be minimal or none)      │
└─────────────────────────────────────────────┘
```

## Triggers — What Counts as an Architecture Change

| Change                           | Example                                               | Requires ADR |
| -------------------------------- | ----------------------------------------------------- | ------------ |
| New backend service              | Splitting core-service into separate deployables      | YES          |
| Module split/merge               | Splitting `content` into `stories` + `knowledge-base` | YES          |
| Cross-cutting pattern change     | Switching from events to direct service calls         | YES          |
| Database paradigm change         | Moving from embedding to referencing                  | YES          |
| Auth mechanism change            | Adding OAuth2, changing JWT algorithm                 | YES          |
| Major version upgrade            | NestJS 10 → 11 with breaking API changes              | DEPENDS      |
| New package dependency direction | Adding a circular dependency between packages         | YES          |
| Feature reorganization           | Moving features between frontend apps                 | YES          |

## Migration Principles

1. **Backward compatibility first** — old APIs work during migration period
2. **Deprecate before remove** — add deprecation notices, wait 1+ sprint, then remove
3. **Test at every step** — don't wait until the end to verify
4. **Document the migration** — future maintainers need to understand why
5. **Rollback plan required** — every step must be reversible until final cutover

## Failure Recovery

Architecture changes are the highest-risk pipeline. Recovery is more conservative:

```
IF ANY STEP FAILS:

1. Design rejected by user (Step 3):
   → Architect revises design based on user feedback
   → Re-present for approval
   → Max 3 design iterations before suggesting a different approach

2. Implementation uncovers design flaw:
   → Stop implementation immediately
   → Back to Step 1 (Analysis) — architect re-analyzes with the new information
   → Update ADR with the correction
   → Re-implement from the corrected design

3. Migration fails (Step 4):
   → Execute rollback plan for the completed sub-step
   → Architect revises migration path
   → Re-attempt with revised migration
   → Max 2 migration attempts before reverting ALL changes and reassessing

4. Validation fails at Step 6:
   → Re-spawn the relevant agent (frontend/backend) for fixes
   → Re-test ALL levels (not just the failing one)
   → Re-validate full project

5. ADR becomes invalid mid-change:
   → This is a critical failure — the architecture premise was wrong
   → Mark ADR as "Superseded" with explanation
   → Create new ADR with corrected decision
   → Back to Step 1

Rule: Architecture changes have NO maximum retry limit on design.
       But they have a HARD LIMIT of 3 implementation attempts before requiring
       a complete re-assessment by the architect.
```
