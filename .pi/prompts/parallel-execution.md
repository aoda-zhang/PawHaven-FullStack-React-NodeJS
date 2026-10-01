---
description: Split a long implementation into independent units, run them in parallel, and join them
---

# Parallel Execution

Split a long implementation into small, independently executable units, run them in parallel as
background tasks, and join them once every unit reports.

**You own this task.** Split, dispatch, join, verify. Stay in the lead.

Use this when the implementation is genuinely long: multi-file, cross-module, or containing two or
more workstreams with no dependency between them. A single sequential dispatch is better when the
work is one concern.

## Why no shared memory file

An earlier version of this workflow used a `.codebuddy/memory/YYYY-MM-DD.md` file as a fork-join
barrier: each unit appended its status, re-read the file, and polled until every sibling was done.
That was a workaround for a runtime with no join primitive. It is obsolete and that directory does
not exist.

**You are the barrier.** You hold the task IDs, you check them, and you collect the results. A unit
never waits on a sibling and never re-reads shared state — it does its work and returns.

## Steps

1. **Split into units.** Name them U1..UN in dependency order. Each unit MUST be:
   - one concern (one module, one file group, one API path)
   - independently executable, with no runtime dependency on a sibling
   - owned by exactly one lane (`dev` or `backend` on implementation work, `oracle` on a design
     or decision unit)
   - ending in a verifiable check (typecheck, lint, build, or a targeted test)

   Units with no dependency on each other go in the same wave. If a unit cannot be verified on its
   own, it is not a unit — merge it into its dependent.

2. **Announce the split.** State the table in your reply before dispatching, so the human can see
   the decomposition and stop you cheaply if a unit is wrong.

   | Unit | Lane      | Scope                  | Depends on | Verify with                                 |
   | ---- | --------- | ---------------------- | ---------- | ------------------------------------------- |
   | U1   | `backend` | Prisma model + service | —          | `pnpm --filter @pawhaven/core-service test` |
   | U2   | `backend` | report-animal service  | U1         | same                                        |
   | U3   | `dev`     | API paths + gate UI    | U2         | `pnpm --filter @pawhaven/portal test`       |

3. **Dispatch the wave in parallel.** Fire every unit with `task` and `background: true`, then
   return immediately — do not wait on any of them. Each prompt MUST carry:
   - the unit ID, its exact scope, and what is explicitly **out** of scope
   - the absolute file paths to work in, not inlined file contents
   - the named data shape, if the unit introduces one
   - the exact verification command and the observable result that counts as passing
   - the relevant skills by name, and any principle text the lane cannot load itself

   Keep each prompt self-contained. A background agent cannot ask you a question, so anything you
   leave implicit becomes a guess.

4. **Check status without disturbing the units.** Use `task_status` on each task ID. It is
   read-only and does not re-wake the agent.

   **Never poll a unit by re-invoking `task` against its ID.** That re-wakes the child and burns
   model work on a unit that was already progressing. `task_status` is the only progress check.

   If a unit is genuinely stuck rather than slow, send it a queued instruction with `task_message`
   (non-interrupting) or cancel it with `task_cancel` and re-split. Do not spam it.

5. **Collect results.** `task_result` returns the final text of a completed task, and a status
   message while one is still running. Read every unit's report and **write your own summary** — do
   not pass a subagent's words through as your own.

6. **Verify the combined tree.** Individual unit checks do not prove the integration. Run the full
   set on the merged result:

   ```bash
   pnpm typecheck
   pnpm build:local
   pnpm test
   ```

   `pnpm lint` already fails from 14 pre-existing errors (3 in `gateway`, 11 in `backend-core`) —
   diff against baseline before calling it a regression.

   If integration fails, route the fix to the owning lane with `task`, naming the failing command
   and the output. A merge conflict between two units is yours to resolve directly.

7. **Advance.** Report what landed, what failed and how it was retried, and the combined-tree check
   results. Then continue with the workflow that invoked this one.

## When a unit fails

- **One unit failed, others succeeded.** Do not discard the wave. Collect what succeeded, re-dispatch
  only the failed unit with the failure output in the prompt.
- **A unit reported done but its files are not on disk.** Check `git status` and recent
  modifications before re-dispatching — a lost result channel does not mean lost edits. Redoing the
  work blindly is how you clobber a correct change.
- **The whole wave timed out or lost its result channel.** That is a sizing failure, not a bug in
  the unit. Split smaller. Do not retry the same size.

## Reply

The split table, each unit's outcome and its verification evidence, the combined-tree check results,
and what advanced. Name the principle that changed the split — `sequence-verifiable-units` is
usually the one that forced a boundary, via the `principles` skill.
