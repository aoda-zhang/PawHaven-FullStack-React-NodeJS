# Task Log — The Progress Document

> **One temporary runtime file**: `Harness/task-log.md` (Harness root, same level as `README.md`).
> It records what each stage produced, so the next stage can reference it, and a stuck task can be traced back through it.
> It is **git-ignored** (`.gitignore` → `Harness/task-log.md`) and never committed.

## 1. Who owns it

The **orchestrator only** (`main-agent.md`) creates, appends to, and clears the task log. Subagents never write to it.

Keeping it orchestrator-only preserves hub-and-spoke (`docs/agent-communication-protocol.md` §3.1): a subagent's full structured report stays in its reply, and the orchestrator records a one-paragraph digest plus a pointer to that report in the log. The log is the **index and the recovery trail**, not a second copy of the reports.

## 2. When it is created and updated

| Event                                                  | Action                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Task accepted, plan approved (§3.1 of `main-agent.md`) | Append a new `## Task: {Task ID}` section to `Harness/task-log.md` (header + plan)   |
| Each subagent stage completes                          | Append a `## Phase:` section (digest + pointer + validation + checklist status)      |
| A subagent times out or is re-spawned                  | Append to the `## Stuck Log`                                                         |
| A blocking finding routes back to an implementer       | Record the loop: finding → agent → re-fix → retest → re-review                       |
| Task completed (summary presented to the user)         | Append the final `## Handoff` section, then ask the user **"是否需要清空运行log？"** |
| User answers **Yes**                                   | Clear the file contents (keep only the `# Task Log — The Progress Document` header)  |
| User answers **No**                                    | Keep the file as-is; the next task appends a new `## Task:` section below            |

The task log is a **runtime artifact**, not documentation: it carries progress between stages and explains a stalled task. Because it is git-ignored, nothing deletes or archives it automatically — the human decides. Sequential tasks may accumulate in the single file until the human says "clear".

## 3. File structure

One file, many tasks. Each task is a top-level `## Task: {Task ID}` section inside `Harness/task-log.md`:

```markdown
# Task Log — The Progress Document

## Task: 2026-08-20-adoption-list

- **Workflow**: {feature-development / bug-fix / refactoring / perf-issue / design-decision / architecture-change}
- **Started**: {date} (span if multi-day)
- **Scope**: {frontend / backend / full-stack / architecture}

## Plan

...

## Phase: {Architect}

...

## Stuck Log

...

## Handoff

...
```

`{Task ID}` keeps the naming convention `YYYY-MM-DD-{slug}` (e.g. `2026-08-20-adoption-list`). A task spanning multiple days keeps the start date in the ID and notes the span in the header.

## 4. Template

```markdown
## Task: {YYYY-MM-DD-{slug}}

- **Workflow**: {feature-development / bug-fix / refactoring / perf-issue / design-decision / architecture-change}
- **Started**: {date} (span if multi-day)
- **Scope**: {frontend / backend / full-stack / architecture}

## Plan

{agent-level dispatch plan from §3.2 of main-agent.md: who runs, in what order}

## Phase: {Architect}

- **Agent / mode**: {architect · team mode}
- **Input contract**: {what this stage consumed}
- **Output digest**: {what it produced, one paragraph}
- **Full report**: {pointer to the structured output}
- **Validation**: {typecheck / tests / render result}
- **Step Completion Checklist**: ✅ present / ❌ missing → re-dispatched
- **Blocking**: {none / what, routed to whom}

## Phase: {Frontend}

...same shape...

## Phase: {Code Review}

- **Tech Review verdict**: {pass / minor fixes / blocked}
- **Pattern Review verdict**: {pass / minor fixes / blocked}
- **Blocking loop**: {finding → agent → re-fix → retest → re-review, one line per pass}

## Stuck Log

| Time   | Stage   | Symptom                   | Recovery                           | Status                   |
| ------ | ------- | ------------------------- | ---------------------------------- | ------------------------ |
| {time} | {stage} | {what timed out / failed} | {team-mode re-spawn, re-test, ...} | {resolved / in progress} |

## Handoff

- **Status**: handed off
- **Verification**: typecheck ✅ · tests ✅ · build ✅
- **PR**: opened manually by the human
- **Next**: ask the user **"是否需要清空运行log？"** → Yes → clear, No → keep
```

## 5. Clearing it — the user decides

The task log is a runtime file outside git; nothing clears it automatically. The protocol:

1. When the final summary is presented (STEP 7 of `main-agent.md`), the orchestrator **must** ask: **"是否需要清空运行log？"** (or in English: "Clear the run log? Yes / No").
2. **Yes** → clear the file contents, keeping only the `# Task Log — The Progress Document` header. The file is ready for the next task.
3. **No** → leave the file untouched; the next task appends a new `## Task:` section below the previous one.

## 6. Reading it when a task stalls

If a task seems stuck, read the log top to bottom:

1. **The Stuck Log** answers "where did it stop": the last row shows the failing stage and its recovery.
2. **The last `## Phase:` section** answers "what actually finished": a missing checklist in any row means that stage was re-dispatched, never trusted.
3. **The `## Handoff` section**, when present, answers "is it done": a handed-off task is stopped on purpose for human review, not stuck.

## 7. Cross-Reference

**Related Docs**: [Agent Communication Protocol](./agent-communication-protocol.md) | [Orchestrator Agent](../main-agent.md) | [Review Handoff](../workflows/handoff.md)
