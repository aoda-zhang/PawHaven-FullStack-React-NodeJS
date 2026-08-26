# Parallel Execution (Split & Sync)

Split a long implementation into small, independently executable units, run them in
parallel, and synchronize them through the task log — a fork-join barrier on
`.codebuddy/task-log.md`.

You own this task. Split, dispatch, join, verify. Stay in the lead.

**Use this workflow AFTER the architect step (STEP 1) when the implementation is
estimated to take a long time:** multi-file, cross-module, likely to exceed the
300-second sync subagent timeout, or containing 2+ independent workstreams. The
alternative is a single sequential implementation that risks a timeout and a stuck
pipeline (see `pawhaven.md` §3.7).

## Steps

1. **Split into units.** Decompose the implementation into small units (U1..UN).
   Each unit MUST be:
   - one concern (one module, one file group, one API path fix)
   - independently executable (no runtime dependency on a sibling unit)
   - owned by exactly one agent type (frontend / backend / testing)
   - ending in a verifiable check (typecheck, lint, build, or a targeted test)
     Name them U1..UN in dependency order. Units with no dependency between them may
     run in the same wave.

2. **Write the Split Plan to the task log.** Under the task section in
   `.codebuddy/task-log.md`, append:

   ```
   ## Split Plan
   | Unit | Owner   | Scope                 | Status  |
   |------|---------|-----------------------|---------|
   | U1   | backend | Prisma model          | WAITING |
   | U2   | backend | report-stray service  | WAITING |
   | U3   | frontend| API paths + gate      | WAITING |
   ```

   All statuses start `WAITING`.

3. **Dispatch the wave in parallel.** `team_create()` then `task(name="U1", team_name=..., mode="bypassPermissions")` for every unit. Each unit prompt MUST contain:
   - the unit ID and scope
   - the exact sync protocol (step 4) copied word-for-word
   - named data shapes / success criteria for the unit

4. **Sync protocol (each unit).** Copy into every unit prompt:

   ```
   SYNC PROTOCOL (mandatory):
   1. Implement your unit. Validate it (typecheck/lint/build for your scope).
   2. APPEND your completion to the task log (.codebuddy/task-log.md):
      - update your row: | U1 | ... | DONE |
      - append a unit report: ### Unit U1 — DONE (files changed, validation
        evidence, Step Completion Checklist)
      Append-only: never edit another unit's section.
   3. READ THE ENTIRE task log.
   4. Check every sibling unit's status in the Split Plan table.
   5. If ALL units are DONE → barrier released → return your final report now.
   6. If ANY sibling is NOT DONE → keep waiting: re-read the log after a short
      delay; repeat until ALL units are DONE, then return your final report.
   7. If YOUR unit FAILED → append ### Unit U1 — FAILED with the reason, return
      immediately with FAILED status (do NOT wait for siblings).
   ```

5. **Join the barrier.** When the log shows ALL units DONE, collect the unit
   reports. Run the integration check on the COMBINED tree: `pnpm typecheck`,
   `pnpm lint`, `pnpm build`. If integration fails, route the fix back to the
   owning unit (or fix it directly if it is a merge conflict).

6. **Advance.** Hand the verified, integrated diff to the next pipeline stage
   (STEP 4 Testing). Record the join result in the task log.

## Reply

The split plan (units + owners + statuses), the sync/barrier outcome (each unit's
digest and whether it waited for siblings), the integration check result on the
combined tree, and what advanced to the next pipeline stage. Name the principles
that changed a decision.
