# Failure policy

What happens when a check fails. Three questions, in order: is it a defect or a wrong plan,
where does it go, and how many times may it go there.

## The bounded fix loop

Verification or review fails. The finding goes back to the lane that wrote the code, which
fixes it and re-runs its own self-test. Independent review runs again on the new code, and
independent verification runs again if it ran the first time. That is one cycle.

**Maximum 3 cycles.** On the third failure, stop. Report `WORKFLOW BLOCKED` with every
unresolved finding, the command output behind each one, and what each remaining finding would
need. Hand it to the human. Do not dispatch a fourth cycle. A loop that never terminates is
not diligence, it is a task that has stopped reporting.

**The reviewer does not fix. It reports, and the developer fixes.** A review lane that edits
the diff is no longer independent, and it also leaves the fix unverified by the pass that
followed it. The separation is what the loop depends on, so it holds even when the fix looks
trivial.

## When to return to planning

Not every failure belongs in the fix loop. The discriminator is the finding's own claim.

Route it to the fix loop when the finding says **the implementation is wrong**: a behaviour
defect, a missing test, a broken build, a finding scoped to the files that were approved.

Return to planning when the finding says **the plan is wrong**:

- the architecture is wrong, or a boundary the plan assumed does not hold in the code
- the approved scope is insufficient to finish the task
- a new API is needed, public or shared, and it does not exist yet
- the data model must change
- the requirements changed while the work was in flight
- the implementation needs a materially different approach from the approved one

Return to planning means re-entering stage 1 with the finding as the new input, not patching
around it inside the current approval. If the re-plan changes scope or risk, the human gate at
stage 3 applies again, because the thing being approved is a different thing.

Reworking a wrong plan inside a fix loop produces more of the wrong thing. Each cycle looks
bounded and none of them address the finding.

## When combined-tree verification fails

This refines the router above rather than replacing it. Classify the failure before routing
it, because the same failing check carries a different owner depending on which one it is.

| Category                                | What it means                                                   | Route                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `IMPLEMENTATION_FAILURE`                | This domain's code is wrong                                     | Back to that domain's implementation worker, through [the bounded fix loop](#the-bounded-fix-loop).                              |
| `TEST_FAILURE`                          | A test is wrong or stale                                        | The orchestrator decides first whether the test or the implementation is at fault, then routes to whichever one owns it.         |
| `INTEGRATION_FAILURE`                   | The domains disagree at the boundary                            | Back to the orchestrator, re-routed through contract analysis to **every** affected domain. Never to a single developer.         |
| `SCOPE_OR_REQUIREMENT_FAILURE`          | The implementation does not meet the agreed requirement         | That is the "the plan is wrong" branch, so back to [planning](#when-to-return-to-planning).                                      |
| `ENVIRONMENT_OR_INFRASTRUCTURE_FAILURE` | The code may be correct and the environment blocks verification | Report it as-is. Do **not** route an application-code change to an implementation worker, because nothing in the diff is broken. |

**When a failure could be classified either way, take the more specific category and say
why.** A frontend/backend contract disagreement is also arguably a requirement failure, but
`INTEGRATION_FAILURE` names the boundary that broke rather than the intent and carries the
route that reaches **every** affected domain, so it is the one that governs; the report states
the category it took and the reason.

**The writing lane authors the test.** When `TEST_FAILURE` lands on a test that is missing
rather than wrong, `tester` has already reported that criterion as `unverifiable` and named
the check that would settle it. That report is the authorisation that surfaces the need, not
the authority to write it. The task prompt or the bounded fix loop decides whether a test gets
written, and the implementation lane owning that domain authors it. `tester` is not a second
developer, and a check its author wrote is not independent evidence.

## Retrying a unit in a parallel wave

Rules for a wave of independent units, where a whole-wave retry is the failure mode to avoid.

- **Re-dispatch only the unit that failed.** The others passed; re-running them costs the
  whole wave and proves nothing new.
- **Check the working tree before re-dispatching.** `git status --short` tells you whether the
  failed unit left partial work behind that the next attempt will build on top of.
- **A wave that times out is a sizing failure, not a defect in the unit.** Split it smaller.
  Do not retry the same size.
- **A dispatch that fails to launch at all is an environment failure.** Stop; do not consume
  the fix loop on it.

Escalation carries the failure, its evidence, the attempts made so far, the affected domain,
the suspected root cause, and what is still uncertain. The fix loop stays bounded wherever a
branch lands in it: maximum 3 cycles, then `WORKFLOW BLOCKED`.
