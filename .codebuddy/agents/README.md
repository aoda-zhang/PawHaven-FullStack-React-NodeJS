# Agents

The **execution layer** of the .codebuddy. Each agent is a named role that the orchestrator (`pawhaven`) spawns via team mode or sync mode. Every agent follows a strict workflow (numbered steps, no skipping), owns its report format (see `../docs/agent-communication-protocol.md`), and returns a Step Completion Checklist as evidence.

## The Orchestrator

| Agent                     | Role                                                                                                                                                                                          | Pipeline Position          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| [pawhaven](./pawhaven.md) | **Main dispatcher.** Receives the request, classifies scope, plans the agent-level dispatch, spawns subagents, maintains the memory log, triggers review, and reports back. Never implements. | Start · coordination · end |

## Implementation & Analysis Agents

| Agent                                     | Role                                                                                                                                                                                           | Pipeline Position                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [architect](./architect.md)               | **Architecture authority.** Inspects the current architecture, defines the technical design (API contracts, DB changes, events), analyzes impact and risk, creates ADRs when needed.           | After planning, before implementation |
| [frontend](./frontend.md)                 | **Frontend commander.** Owns the frontend lifecycle: Step 1 analyze → Step 2 plan files & skills → Step 3 implement → Step 4 validate → Step 5 report.                                         | After architect                       |
| [backend](./backend.md)                   | **Backend commander.** Owns the backend lifecycle: Step 1 analyze → Step 2 plan modules/files → Step 3 implement → Step 4 validate → Step 5 report. Finalizes the authoritative API contract.  | After architect                       |
| [testing](./testing.md)                   | **Quality gate.** Designs the test strategy, implements tests, executes them, reports results with coverage.                                                                                   | After implementation                  |
| [code-review](./code-review.md)           | **Adversarial review gate.** Two passes — TECH REVIEW (best practices, anti-patterns) and PATTERN REVIEW (fits the project's patterns & architecture). Reports per-pass verdicts; never fixes. | Last gate before handoff              |
| [knowledge-update](./knowledge-update.md) | **Docs keeper.** Sole owner of `../docs/` and the root READMEs. Propagates knowledge changes to every dependent file.                                                                          | After the task                        |

## Workflow Membership

Each agent declares which workflow segment it runs and which principles it enforces in its `### 1a. Wiring` section. The orchestrator (`pawhaven.md`) holds the full dispatch table.

**Related**: [Workflows](../workflows/README.md) · [Communication Protocol](../docs/agent-communication-protocol.md)
