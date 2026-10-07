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
   - owned by exactly one lane (`frontend-dev` or `backend-dev` on implementation work, `critic` on a
     design or decision unit)
   - ending in a verifiable check (typecheck, lint, build, or a targeted test)

   Units with no dependency on each other go in the same wave. If a unit cannot be verified on its
   own, it is not a unit — merge it into its dependent.

   Every unit runs in its **own independent context**. A unit must not be handed another unit's
   private reasoning, its intermediate notes, or a transcript of what a sibling found. It receives a
   named scope, a named data shape, and observable success criteria, and nothing else. Passing one
   unit's draft plan or half-written output to a second unit couples them and is what the split
   exists to prevent.

2. **Announce the split.** State the table in your reply before dispatching, so the human can see
   the decomposition and stop you cheaply if a unit is wrong.

   | Unit | Lane           | Scope                  | Depends on | Verify with                                 |
   | ---- | -------------- | ---------------------- | ---------- | ------------------------------------------- |
   | U1   | `backend-dev`  | Prisma model + service | —          | `pnpm --filter @pawhaven/core-service test` |
   | U2   | `backend-dev`  | report-animal service  | U1         | same                                        |
   | U3   | `frontend-dev` | API paths + gate UI    | U2         | `pnpm --filter @pawhaven/portal test`       |

3. **Dispatch the wave in parallel.** Fire every unit with one `subagent` call, `async: true`, then
   return immediately — do not wait on any of them. Each dispatch MUST carry:
   - the unit ID, its exact scope, and what is explicitly **out** of scope
   - the working directories and package boundaries the unit operates in, not a list of every file
     it should touch. The unit plans its own edits inside the scope you named.
   - the named data shape, if the unit introduces one
   - the exact verification command and the observable result that counts as passing
   - the relevant skills by name, and any principle text the lane cannot load itself
   - an `output` path, so the unit's result survives past the run

   Keep each prompt self-contained. A background unit cannot ask you a question, so anything you
   leave implicit becomes a guess. Use a workflow script when you want the wave joined automatically
   rather than by hand.

4. **Check status without disturbing the units.** `bg_wait { nonBlocking: true }` subscribes to an
   exact run's completion without polling, and an ordinary async run notifies this session natively
   when it finishes. Either is a progress check.

   **Never re-dispatch a unit to ask for status.** That re-wakes the child and burns model work on a
   unit that was already progressing. To nudge a running unit, use the supervisor channel
   (`subagent_supervisor`, action `reply`).

   If a unit is genuinely stuck rather than slow, send it a follow-up message, or cancel it and
   re-split. Do not spam it.

5. **Collect results.** Each unit's `<result>` block carries its `<changes>`, `<verification>`, and
   `<risks>`. Read every unit's report, relay each unit's verification exactly as it was reported, and
   write your own reading across the units, per
   [Evidence](./harness-process.md#evidence-what-a-pass-requires).

6. **Verify the combined tree.** Individual unit checks do not prove the integration. Run the full
   set on the merged result:

   ```bash
   pnpm typecheck
   pnpm build:local
   pnpm test
   ```

   Add `pnpm pi-check` to that set when any unit touched `.pi/`. A harness change that typechecks and
   packages can still fail to load, and `pi-check` is the check that proves it loads.

   `pnpm lint` already fails from 13 pre-existing errors (3 in `gateway`, 10 in `backend-core`) —
   diff against baseline before calling it a regression. An older number in this file said 14; the
   measured baseline is 13.

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
- **A dispatch fails to launch at all** — extension, runner, or lane error. Stop. That is a harness
  fault, not a unit that needs re-splitting, and silently retrying in a different mode hides it.

## Reply

The split table, each unit's outcome and its verification evidence, the combined-tree check results,
and what advanced. Name the principle that changed the split — `sequence-verifiable-units` is
usually the one that forced a boundary, via the `principles` skill.
