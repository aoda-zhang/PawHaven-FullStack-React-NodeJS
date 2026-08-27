# Agent Communication Protocol

> **Purpose**: Define structured output formats so agents can reliably parse each other's results.
> **Version**: v1.0 | **Date**: 2026-07-14

## 1. Why Structured Communication

Currently agents communicate through the orchestrator as plain text messages. This works but introduces ambiguity when:

- Frontend needs to understand backend's API contract
- Architect's decisions must be consumed by implementers
- Testing results must trigger specific actions
- Review findings must be actionable by the right agent

**Principle**: Every agent that produces output consumed by another agent MUST use a predictable format.

## 2. Structured Output Formats

### 2.1 Architect → Implementers (Frontend + Backend)

```
## Architecture Design: {Feature Name}

### Module Assignment
- **Owner**: {module or service name}
- **Rationale**: {why this module}

### API Contract
| Method | Path | Purpose | Request Schema | Response Schema |
|--------|------|---------|----------------|-----------------|
| GET | /api/... | ... | ... | ... |

### Database Changes
- **New models**: {list with key fields}
- **Modified models**: {list with changes}
- **Migration path**: {backward-compatible? data migration needed?}

### Event Contracts
| Event | Publisher | Subscribers | Payload Schema |
|-------|-----------|-------------|----------------|
| ... | ... | ... | ... |

### Shared Types (packages/shared/)
- {list of new Zod schemas and DTOs}

### Risks
| # | Risk | Level | Mitigation | Rollback |
|---|------|-------|------------|----------|
| 1 | ... | High/Medium/Low | ... | ... |

### Decision
✅ {what was decided}

### ADR
Created/Not needed: {path}
```

### 2.2 Frontend → Orchestrator (Implementation Result)

```
## Frontend Implementation: {Feature Name}

### Files Created
- `path/to/file.tsx` — {purpose}

### Files Modified
- `path/to/file.ts` — {what changed}

### API Contract (for backend handoff)
| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | /api/... | ... | ... |

Note: API contracts are drafted in `packages/shared/` for backend finalization.

### i18n Keys Added
- `module.key` (zh-CN, en-US, de-DE)

### Validation Results
- react-doctor: ✅ Pass / ❌ Fail
- typecheck: ✅ Pass / ❌ Fail
- lint: ✅ Pass / ❌ Fail

### Blocking Issues
- None / {list}

### Known Limitations
- None / {list of follow-ups}
```

### 2.3 Backend → Orchestrator (Implementation Result)

```
## Backend Implementation: {Feature Name}

### Files Created
- `path/to/file.ts` — {purpose}

### Files Modified
- `path/to/file.ts` — {what changed}

### API Contract (finalized — authoritative)
| Method | Path | Request Schema | Response Schema | Auth Required |
|--------|------|----------------|-----------------|---------------|
| GET | /api/... | ... | ... | Yes/No |

Contract location: `packages/shared/src/schemas/{name}.schema.ts`

### Database Changes
- **New models**: {Prisma model names}
- **Modified models**: {field changes}
- **Migration**: `npx prisma migrate dev --name {name}`

### Events Published
| Event | Payload Schema | Subscribers Expected |
|-------|---------------|---------------------|
| ... | ... | ... |

### Events Subscribed
| Event | Handler File | Purpose |
|-------|-------------|---------|
| ... | ... | ... |

### Validation Results
- typecheck: ✅ Pass / ❌ Fail
- lint: ✅ Pass / ❌ Fail
- build: ✅ Pass / ❌ Fail
- module boundary check: ✅ Pass / ❌ Fail

### Blocking Issues
- None / {list}

### Known Limitations
- None / {list of follow-ups}
```

### 2.4 Testing → Orchestrator (Test Results)

```
## Test Results: {Feature Name}

### Test Strategy Summary
- Unit tests: N files
- Integration tests: N files
- API tests: N files
- E2E tests: N files

### Results
| Level | ✅ Pass | ❌ Fail | Coverage % | Target % |
|-------|--------|--------|------------|----------|
| Unit | X | Y | Z% | W% |
| Integration | X | Y | Z% | W% |
| API | X | Y | Z% | W% |
| E2E | X | Y | N/A | N/A |

### ❌ Failing Tests
| Test | File:Line | Expected | Actual | Error |
|------|-----------|----------|--------|-------|
| ... | ... | ... | ... | ... |

### Root Cause Analysis (for each failure)
- **Test {name}**: {is it a code bug or a test issue?}
  → Action: {which agent should fix?}

### Coverage Gaps
- {uncovered edge cases, missing error paths}
```

### 2.5 Code Review → Orchestrator (Review Report)

```
## Code Review: {Feature Name}

### Scope: {frontend / backend / full-stack}
### Mode: {normal / fallback}

### Gate — Figma Design Match (UI tasks only, feeds TECH verdict)
✅ Pass / ⚠️ Degraded / ❌ Fail (with severity classification)

### TECH REVIEW — Layer 1 scans + Layer 3 feature & logic
| Sub-Skill | ❌ Blocking | ⚠️ Warning | 💡 Suggestion |
|-----------|------------|------------|---------------|
| typecheck-doctor | X | 0 | 0 |
| react-doctor | X | 0 | 0 |
| style-doctor | X | Y | Z |
| i18n-doctor | 0 | Y | 0 |
| backend-doctor | X | 0 | 0 |

| Check | Status | Detail |
|-------|--------|--------|
| Feature completeness | ✅/❌ | ... |
| Data flow | ✅/❌ | ... |
| Error/loading/empty states | ✅/⚠️ | ... |
| Accessibility | ✅/⚠️ | ... |

### PATTERN REVIEW — Layer 1 scans + Layer 2 architecture + Layer 4 contracts
| Sub-Skill | ❌ Blocking | ⚠️ Warning | 💡 Suggestion |
|-----------|------------|------------|---------------|
| boundary-doctor | X | 0 | 0 |
| architecture-doctor | X | Y | Z |

| Check | Status | Detail |
|-------|--------|--------|
| Module responsibility | ✅/❌/⚠️ | ... |
| Dependency direction | ✅/❌ | ... |
| Feature isolation | ✅/❌ | ... |
| API consistency | ✅/⚠️ | ... |
| ADR coverage | ✅/💡 | ... |

| Check | Status | Detail |
|-------|--------|--------|
| Zod schema match (full-stack) | ✅/❌ | ... |
| Endpoint path match (full-stack) | ✅/❌ | ... |

### ❌ Blocking Issues
| # | Pass | Layer | Rule | File:Line | Issue |
|---|------|-------|------|-----------|-------|
| 1 | TECH/PATTERN | ... | ... | ... | ... |

### ⚠️ Warnings
| # | Pass | Layer | Rule | File:Line | Issue |
|---|------|-------|------|-----------|-------|

### 💡 Suggestions
| # | Pass | Layer | Rule | File:Line | Issue |
|---|------|-------|------|-----------|-------|

### Verdicts
- **Tech Review verdict**: ✅ Pass / ⚠️ Needs minor fixes / ❌ Blocked
- **Pattern Review verdict**: ✅ Pass / ⚠️ Needs minor fixes / ❌ Blocked
- **Overall**: ✅ Pass / ⚠️ Needs minor fixes / ❌ Blocked — {which agent must fix what}
```

## 3. Communication Rules

### 3.1 Output Ownership

- Each agent owns its output format — no other agent modifies it
- The orchestrator is the only agent that reads and routes all outputs
- If Agent B needs Agent A's output, it goes through the orchestrator

### 3.2 Contract Finalization (Frontend ↔ Backend)

```
1. Frontend DRAFTS API contract → packages/shared/
2. Frontend reports contract location to orchestrator
3. Orchestrator passes contract to backend
4. Backend REVIEWS and FINALIZES the contract → packages/shared/
5. Backend reports final contract + any changes to orchestrator
6. Orchestrator notifies frontend of final contract → frontend aligns
```

### 3.3 Error Propagation

- Testing reports failures → orchestrator routes to the implementing agent (not review)
- Review reports blocking issues → orchestrator routes to the responsible agent
- Never skip the chain: Step 1 Fix → Step 2 Retest → Step 3 Re-review

### 3.4 Structured Parsing

- All key-value pairs in reports should use consistent delimiters
- File paths: backtick-wrapped (`` `path/to/file.ts` ``)
- Statuses: ✅ Pass, ❌ Fail, ⚠️ Warning, 💡 Suggestion
- Severity: ❌ Blocking, ⚠️ Warning, 💡 Suggestion

### 3.5 Memory Log — The Progress Document

All workflow progress goes to **today's memory file**, `.codebuddy/memory/YYYY-MM-DD.md` (git-ignored, append-only). The orchestrator writes the task section; in Split & Sync mode, each unit appends its own unit section and reads the whole file as the fork-join barrier:

- **Per task**: append a new `## Task: {Task ID}` section when the plan is approved.
- **Per stage**: append a `## Phase:` digest (what the agent produced, validation result, whether its Step Completion Checklist was present) plus a pointer to the full structured report above.
- **Per loop**: a blocking finding routes back to the responsible implementer (Step 1 Fix → Step 2 Retest → Step 3 Re-review); each pass is recorded.
- **Per stuck point**: append to the Stuck Log (what timed out, what was partially done, how it was recovered).
- **At completion**: append the final `## Handoff` section, then ask the user **"是否需要清空运行log？"** — **Yes** → clear the file contents (keep the header), **No** → keep; the next task appends below.

If a task stalls, the memory log is the single place to read the latest progress: the Stuck Log says where it stopped, the last `## Phase:` says what finished, the Handoff section says whether it is done on purpose.

## 4. Cross-Reference

**Related Docs**: [System Architecture Overview](./PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](./PawHaven-Frontend-Architecture.md) | [Backend Architecture](./PawHaven-Backend-Architecture.md)
