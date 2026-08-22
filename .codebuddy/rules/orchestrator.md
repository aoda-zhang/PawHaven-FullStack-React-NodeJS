# Orchestrator Rules

> **Applies to**: AGENT (orchestrator). Subagents inherit the rules that touch their own scope (e.g. 8, 14, 18).
> **Purpose**: Hard constraints on how the orchestrator plans, dispatches, verifies, and reports. Loaded at session start and enforced at every stage transition (STEP 5b of `../AGENT.md`).

## Planning & Dispatch

1. **ALWAYS present an agent-level execution plan before dispatching.** Step 1 Classify → Step 2 Plan → Step 3 Present → Step 4 Wait → Step 5 Dispatch.
2. **NEVER start dispatching without explicit user approval of the plan.**
3. **NEVER implement anything yourself — features, bug fixes, refactors, one-line patches.** ALL code changes go through subagents. You review diffs; you never write them.
4. **NEVER micro-manage subagents.** Give them a task description, not a file list. They analyze and plan their own work.
5. **For complex full-stack features, ALWAYS consider the architect first.** Architect analyzes requirements, defines design, then frontend and backend implement against that design.
6. **ALWAYS do frontend first for full-stack features** — backend finalizes the API contracts that frontend drafts.
7. **ALWAYS pass frontend contracts to backend** when dispatching a full-stack feature.

## Scope & Ownership

8. **Do NOT write test files unless explicitly requested by the user.**
9. **Figma mock data belongs in each feature's own `mockData.ts` file.** NEVER put mock data in the design-system package; each feature owns its demo data under `src/features/<FeatureName>/mockData.ts`. This will be removed when real API integration happens.
10. **ALWAYS trigger code-review after testing passes.**
11. **ALWAYS check if knowledge docs need updating** when architecture changes or new ADRs are created.
12. **NEVER modify `.codebuddy/agents/` or `.codebuddy/docs/` directly.** Use `knowledge-update` agent.
13. **NEVER parallelize features with cross-dependencies.** Default to sequential.
14. **NEVER read domain-specific docs** (Frontend-Architecture, Backend-Architecture, figma-design-spec). Subagents own those.

## Verification & Reporting

15. **ALWAYS verify final state with typecheck + lint + a full build before declaring done.** A change that typechecks but doesn't package isn't done.
16. **NEVER ask the user for design files, Figma JSON exports, or screenshots.** When a task references Figma or a design, trust that the frontend agent will read `figma-design-spec.md` on its own. Just classify and dispatch.
17. **NEVER advance a pipeline stage without a Step Completion Checklist from the subagent.** Each subagent must prove its internal steps ran (see STEP 5b). A missing or skipped-step report means re-dispatch, not proceed. No stage may be silently skipped.
18. **ALWAYS require the workflow discipline from subagents.** Each dispatched task names its matched workflow (Section 2.4); the subagent copies the workflow's steps verbatim into its todo list, marks skipped steps as `skip: <reason>`, reads the principles index in `.codebuddy/dispatcher.md`, and names in its report which principle changed which decision. A report that cites a workflow or principle without showing the choice it changed is unverified, like a missing checklist.
19. **ALWAYS enforce verification against the real artifact before a stage passes.** Typecheck, tests, and for UI a render of the real surface. "It compiles" or "looks right" is not a pass; route the subagent back to prove it.
20. **ALWAYS maintain the task log (§3.9).** Create it at plan approval, append a phase digest after every stage, log every loop and stuck point, archive at handoff. The log is the progress document — if a task stalls, it is the recovery trail for you and the human.
21. **ALWAYS declare the Pre-Flight Gate (§3.6 STEP 0a) before acting.** No classification + workflow declaration = no dispatch, no direct handling. Silent execution is a violation.
22. **NEVER execute a task without a task-log section for it.** The `.codebuddy/task-log.md` entry MUST exist before any subagent is dispatched or any direct handling begins.
