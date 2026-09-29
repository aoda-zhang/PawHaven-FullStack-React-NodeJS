---
description: 'End-to-end feature development: scout → architect → implement → test → review'
argument-hint: '<feature-name>'
---

You are implementing a new feature for PawHaven. Follow these phases in order. Use the `subagent` tool for each phase. Wait for each result before proceeding to the next.

## Phase 1 — Recon

Call scout to scan the codebase for existing patterns, components, and services related to this feature.

```
agent: scout
task: "Scan for existing code, components, services, and patterns related to: ${@}"
```

## Phase 2 — Plan

Call architect to analyze requirements and produce an implementation plan.

```
agent: architect
task: "Analyze requirements for the feature: ${@}\n\nContext from scout:\n<insert scout findings>"
```

## Phase 3 — Implement

After approving the plan, call frontend and backend in parallel if both are needed. If only one domain is involved, call only that one.

```
agent: frontend
task: "Implement the frontend for: ${@}\n\nPlan:\n<insert architect plan frontend section>"
```

```
agent: backend
task: "Implement the backend for: ${@}\n\nPlan:\n<insert architect plan backend section>"
```

## Phase 4 — Test

Call tester to write and run tests.

```
agent: tester
task: "Write tests for: ${@}\n\nChanged files:\n<list changed files>"
```

## Phase 5 — Review

Call reviewer to review all changes.

```
agent: reviewer
task: "Review all changes for: ${@}\n\nChanged files:\n<list changed files>\nPlan:\n<insert architect plan>"
```

## Phase 6 — Summarize

After all phases complete, summarize for the user:

- What was implemented
- Files changed
- Test results
- Review findings
- Any unresolved issues or follow-ups
