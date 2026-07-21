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

### Gate — Figma Design Match (UI tasks only)
✅ Pass / ⚠️ Degraded / ❌ Fail (with severity classification)

### Layer 1 — Automated Scans
| Sub-Skill | ❌ Blocking | ⚠️ Warning | 💡 Suggestion |
|-----------|------------|------------|---------------|
| typecheck-doctor | X | 0 | 0 |
| react-doctor | X | 0 | 0 |
| style-doctor | X | Y | Z |
| boundary-doctor | X | 0 | 0 |
| i18n-doctor | 0 | Y | 0 |
| backend-doctor | X | 0 | 0 |
| architecture-doctor | X | Y | Z |

### Layer 2 — Architecture & Design
| Check | Status | Detail |
|-------|--------|--------|
| Module responsibility | ✅/❌/⚠️ | ... |
| Dependency direction | ✅/❌ | ... |
| Feature isolation | ✅/❌ | ... |
| API consistency | ✅/⚠️ | ... |
| ADR coverage | ✅/💡 | ... |

### Layer 3 — Feature Requirements
| Check | Status | Detail |
|-------|--------|--------|
| Feature completeness | ✅/❌ | ... |
| Data flow | ✅/❌ | ... |
| Error/loading/empty states | ✅/⚠️ | ... |
| Accessibility | ✅/⚠️ | ... |

### Layer 4 — Type Contract (full-stack only)
| Check | Status | Detail |
|-------|--------|--------|
| Zod schema match | ✅/❌ | ... |
| Endpoint path match | ✅/❌ | ... |

### ❌ Blocking Issues
| # | Layer | Rule | File:Line | Issue |
|---|-------|------|-----------|-------|
| 1 | ... | ... | ... | ... |

### ⚠️ Warnings
| # | Layer | Rule | File:Line | Issue |
|---|-------|------|-----------|-------|

### 💡 Suggestions
| # | Layer | Rule | File:Line | Issue |
|---|-------|------|-----------|-------|

### Verdict
✅ Pass / ⚠️ Needs minor fixes / ❌ Blocked — {which agent must fix what}
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
- Never skip the chain: Fix → Retest → Re-review

### 3.4 Structured Parsing

- All key-value pairs in reports should use consistent delimiters
- File paths: backtick-wrapped (`` `path/to/file.ts` ``)
- Statuses: ✅ Pass, ❌ Fail, ⚠️ Warning, 💡 Suggestion
- Severity: ❌ Blocking, ⚠️ Warning, 💡 Suggestion

## 4. Cross-Reference

**Related Docs**: [System Architecture Overview](./PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](./PawHaven-Frontend-Architecture.md) | [Backend Architecture](./PawHaven-Backend-Architecture.md)
