---
description: Split a long implementation into independent units, run them in parallel, and join them
---

# Parallel Execution

Split a long implementation into small, independently executable units, run them in parallel as
background tasks, and join them once every unit reports.

You own this task. Split, dispatch, join, verify. Stay in the lead.

Use this when the implementation is genuinely long: multi-file, cross-module, or containing two or more
workstreams with no dependency between them. A single sequential dispatch is better when the work is one
concern.

**You are the barrier.** You hold the task IDs, you check them, and you collect the results. A unit
never waits on a sibling and never re-reads shared state — it does its work and returns. There is no
shared memory file, and no unit polls for one.

## Steps

1. **Split into units**, named in dependency order. Each unit must be:
   - one concern — one module, one file group, one API path
   - independently executable, with no runtime dependency on a sibling
   - owned by exactly one lane: `frontend-dev` or `backend-dev` on implementation, `architect` or
     `oracle` on a design or evidence unit
   - ended by a verifiable check: typecheck, lint, build, or a targeted test

   Units with no dependency on each other go in the same wave. If a unit cannot be verified on its own,
   it is not a unit — merge it into its dependent.

   Every unit runs in its **own independent context**. A unit is not handed another unit's private
   reasoning, its intermediate notes, or a transcript of what a sibling found. It receives a named
   scope, a named data shape, and observable success criteria, and nothing else. Passing one unit's
   draft plan or half-written output to a second unit couples them, which is what the split exists to
   prevent.

2. **Announce the split** in your reply before dispatching, so the human can see the decomposition and
   stop you cheaply if a unit is wrong.

   | Unit | Lane           | Scope                  | Depends on | Verify with                                 |
   | ---- | -------------- | ---------------------- | ---------- | ------------------------------------------- |
   | U1   | `backend-dev`  | Prisma model + service | —          | `pnpm --filter @pawhaven/core-service test` |
   | U2   | `backend-dev`  | report-animal service  | U1         | same                                        |
   | U3   | `frontend-dev` | API paths + gate UI    | U2         | `pnpm --filter @pawhaven/portal test`       |

3. **Dispatch the wave in parallel.** Fire every unit with one `subagent` call, `async: true`, then
   return immediately. Each dispatch carries:
   - the unit ID, its exact scope, and what is explicitly **out** of scope
   - the working directories and package boundaries it operates in, not a list of every file to touch —
     the unit plans its own edits inside the scope you named
   - the named data shape, if the unit introduces one
   - the exact verification command and the observable result that counts as passing
   - the skills it needs by name
   - an `output` path, so the unit's result survives the run

   Keep each prompt self-contained. A background unit cannot ask you a question, so anything you leave
   implicit becomes a guess.

4. **Check status without disturbing the units.** `bg_wait { nonBlocking: true }` subscribes to an exact
   run's completion without polling, and an ordinary async run notifies this session natively when it
   finishes. Never re-dispatch a unit to ask for status: that re-wakes the child and burns model work on
   a unit that was already progressing. To nudge a running unit use the supervisor channel
   (`subagent_supervisor`, action `reply`).

5. **Collect results.** Each unit's `<result>` carries its `<changes>`, `<verification>`, and `<risks>`.
   Relay each unit's verification exactly as it was reported and write your own reading across the
   units — [relaying what a lane reported](../../rules/verification.md#relaying-what-a-lane-reported).

6. **Verify the combined tree.** Individual unit checks do not prove the integration; run the full set
   on the merged result — [stage 8](../../rules/verification.md#stage-8-combined-tree-verification).
   Run the harness checks when any unit touched the harness: a harness change that typechecks and packages can
   still fail to load. If integration fails, classify and route it —
   [when combined-tree verification fails](../../rules/failure.md#when-combined-tree-verification-fails).
   A merge conflict between two units is yours to resolve directly.

7. **Advance.** Report what landed, what failed and how it was retried, and the combined-tree results.
   Then continue with the workflow that invoked this one.

## When a unit fails

[Retrying a unit in a parallel wave](../../rules/failure.md#retrying-a-unit-in-a-parallel-wave)
holds the rules: re-dispatch only the failed unit, check the working tree before re-dispatching, treat a
whole-wave timeout as a sizing failure, and stop on a dispatch that never launched.

## Reply

The split table, each unit's outcome and its verification evidence, the combined-tree results, and what
advanced. Name the principle that changed the split.
