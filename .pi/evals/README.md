# Harness evals

The harness is code, and code that is not measured drifts. This directory holds the evaluation
corpus defined by master prompt §26: fixed tasks, replayed against the harness, scored on the same
eight measures every run. §26's closing rule governs how results are used:

> **Improve the harness from observed failures rather than from theoretical complexity.**

No harness change — no new agent, no new skill, no re-routing, no added review step — is justified
here by "this looks like it would help". It is justified by a scored run that failed.

## Layout

```
.pi/evals/
├── README.md            # this file: measures, scoring, recording
├── feature/             # 5 tasks
├── bug-fix/             # 5 tasks
├── refactor/            # 3 tasks
├── architecture/        # 2 tasks
└── investigation/       # 2 tasks
```

17 tasks total. Corpus counts are part of the contract: changing a count is a §26 change, not
housekeeping.

`results/` is created on the first recorded run, by the run, and holds nothing checked in ahead of
time.

### Naming

One file per task: `<category>/<NN>-<kebab-slug>.md`, ordinal zero-padded, ordered as listed below.
The ordinal is the task's id — `feature/03-report-animal-draft.md` is **feature-03**. Files are
self-contained: a run reads one file and nothing else about the task.

| Id            | File                                                                                    | Primary surface                 |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| `feature-01`  | [`01-rescue-status-transition.md`](./feature/01-rescue-status-transition.md)            | rescue                          |
| `feature-02`  | [`02-adoption-application.md`](./feature/02-adoption-application.md)                    | adoption                        |
| `feature-03`  | [`03-report-wizard-steps.md`](./feature/03-report-wizard-steps.md)                      | report-animal                   |
| `feature-04`  | [`04-animal-follow-list.md`](./feature/04-animal-follow-list.md)                        | animal-follow (community)       |
| `feature-05`  | [`05-guide-pdf-email.md`](./feature/05-guide-pdf-email.md)                              | document-service pdf/email      |
| `bug-fix-01`  | [`01-gateway-session-refresh.md`](./bug-fix/01-gateway-session-refresh.md)              | gateway                         |
| `bug-fix-02`  | [`02-report-contact-dropped.md`](./bug-fix/02-report-contact-dropped.md)                | report-animal                   |
| `bug-fix-03`  | [`03-rescue-list-silent-skip.md`](./bug-fix/03-rescue-list-silent-skip.md)              | rescue                          |
| `bug-fix-04`  | [`04-pdf-payload-guard.md`](./bug-fix/04-pdf-payload-guard.md)                          | document-service pdf            |
| `bug-fix-05`  | [`05-home-adopted-double-count.md`](./bug-fix/05-home-adopted-double-count.md)          | home / adoption                 |
| `refactor-01` | [`01-status-label-color-registry.md`](./refactor/01-status-label-color-registry.md)     | portal rescue UI                |
| `refactor-02` | [`02-auth-credential-form.md`](./refactor/02-auth-credential-form.md)                   | portal auth                     |
| `refactor-03` | [`03-report-rescue-create.md`](./refactor/03-report-rescue-create.md)                   | core-service write path         |
| `arch-01`     | [`01-photo-storage-ownership.md`](./architecture/01-photo-storage-ownership.md)         | core-service + document-service |
| `arch-02`     | [`02-rescue-transition-ownership.md`](./architecture/02-rescue-transition-ownership.md) | rescue lifecycle                |
| `inv-01`      | [`01-report-versus-rescue-write.md`](./investigation/01-report-versus-rescue-write.md)  | report-animal vs rescue         |
| `inv-02`      | [`02-session-lifetime-trace.md`](./investigation/02-session-lifetime-trace.md)          | gateway + auth-service          |

Every task names real files and real endpoints. Verify a surface before acting on it — the repo
moves, and an eval that cites a deleted file is a stale eval, not a failing agent.

## How a run goes

1. Pin the commit. A run is against one SHA with a clean tree apart from `.pi/` itself.
2. Pick tasks. Either the whole corpus or a named subset; say which, and never mix subsets across
   runs without recording the subset.
3. Dispatch each task from a fresh parent context. Give the lane the eval file and nothing else —
   no hints, no prior run's output, no "we fixed this last time".
4. Let the classifier run. Record the classification JSON the harness produced, not the one the
   eval predicted. A mismatch is a result, not noise.
5. Score at the end of the run, while the evidence is still on screen. Nothing is scored from the
   agent's prose summary alone; the command is re-executed.
6. Record, then stop. A run that finds nothing is still recorded.

## The eight measures

Each is scored per task run, then averaged per category and per corpus.

| #   | Measure                     | Unit                                 | Scored as                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Task success**            | 1 / 0 per task                       | 1 only when every criterion under the eval's **Observable success criteria** passes on the named surface and each item in **What a good run must produce** exists. A single failed criterion is 0 — no partial credit, because partial is what hides regressions.                                             |
| 2   | **Verification pass rate**  | % of claimed commands                | Over the run's `<verification>` block: commands the validator re-executed and got `pass`, divided by commands the lane claimed. Re-run means run, not read. A claimed `pass` that fails on replay is counted as a failed verification **and** a task failure.                                                 |
| 3   | **Review findings**         | count, split blocking / non-blocking | From the independent review (`/handoff` → `reviewer`, fresh context) over the run's diff. Both numbers are recorded; a run with zero findings across several consecutive runs is suspect — check whether the reviewer ran.                                                                                    |
| 4   | **Review/fix rounds**       | integer                              | Dispatch → review → fix → clean. 1 means the first diff passed review. A run that hits the cap without converging is recorded as a failure and re-run at the cap+1 to prove it is not a fluke.                                                                                                                |
| 5   | **Regression rate**         | % of tasks                           | Tasks where a check green before the change is red after: `pnpm typecheck`, `pnpm lint` against its recorded baseline, `pnpm test`. Diff against baseline before calling anything a regression — `pnpm lint` has pre-existing failures.                                                                       |
| 6   | **Token usage**             | input + output per task              | Harness-reported totals for the parent plus all lanes on that task. Recorded, never used to accept or reject a run; it is the cost side of a comparison after measures 1–5 agree.                                                                                                                             |
| 7   | **Latency**                 | minutes per task                     | Wall clock from dispatch to the final `<result>`, and per lane where lanes are parallel. Same role as token usage: comparison, not gating.                                                                                                                                                                    |
| 8   | **Human intervention rate** | count per task                       | Owner contacts after dispatch — `need_decision`, clarification requests, approvals the plan should have covered. Counted from the run log. The headline health signal for a supposedly autonomous harness: rising interventions with flat task success means the harness is pushing work back onto the human. |

Measures 1–5 gate; 6–7 only compare. A change that improves tokens while dropping task success is
not an improvement.

## Recording results

One file per run:

```
.pi/evals/results/<YYYY-MM-DD>-<short-sha>.md
```

It contains, in this order:

1. **Header** — date, commit SHA, branch, parent model and thinking overrides in effect, tasks run,
   and any deviation from the standard procedure (deviations invalidate comparison with prior runs).
2. **Task table** — one row per task:

   ```
   | id | success | verif % | findings (blk/non-blk) | rounds | regression | tokens in/out | min | interventions | classification matched? | notes |
   ```

   `classification matched?` is `yes` / `no: <predicted> → <actual>` — predicted comes from the eval
   file's **Expected classification**, actual from what the harness emitted.

3. **Category rollup** — the eight measures per category, plus corpus totals.
4. **Failure ledger** — one entry per failed task: what the eval expected, what happened, the command
   and its output, the root cause in harness terms (agent, skill, prompt, classification, workflow
   step), and the harness change it argues for — or `none: task-level, not harness-level`.
5. **Unchanged note** — if nothing failed, say so in one line. Do not pad.

Results are evidence, not status reports. Every number must be reproducible from the run log or a
re-executed command.

## Reading the corpus against §26

The corpus is deliberately narrow. It covers six surfaces — rescue, report-animal, adoption,
animal-follow, gateway/session, document-service PDF — because those carry the platform's real
traffic and its auth and PII risk. It does **not** cover the notification, content, or volunteer
modules named in `AGENTS.md`: they have no code in `apps/backend/core-service/src/modules/`, so an
eval written against them would be ungroundable. Before adding coverage there, land the modules
first; adding a task with no real surface creates a green run about nothing.

## Changing an eval

- Grounded in code that exists at the commit of the change. Cite files, not intentions.
- Classification fields follow master prompt §6 (taskType, secondaryTasks, scope, complexity, risk)
  with §8 scope categories, §9 complexity, §10 risk floors. Auth, sessions, tokens, PII and security
  boundaries are high risk at minimum; irreversible data operations are critical.
- The **Real surfaces** and **Observable success criteria** sections are load-bearing. If code moves,
  update the eval in the same change and note it in the next run's header, or the run measures drift
  and calls it agent behaviour.
- A task that repeatedly produces the same failure for reasons outside the harness — flaky port,
  missing Chromium, empty database — is fixed in the task's setup notes, not scored away.
