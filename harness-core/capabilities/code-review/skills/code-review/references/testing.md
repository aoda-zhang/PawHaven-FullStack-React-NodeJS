# Testing review

Is the behaviour this change claims to deliver actually covered by a check that would fail if it
regressed? The **methodology** — runner, placement, what a test has to earn — is owned by
[testing-standards](../../../../testing/skills/testing-standards/SKILL.md). Read it there. This file is
how a reviewer judges whether the evidence in front of it is sufficient.

This dimension applies to **every** review, whatever the scope. A change with no test evidence is not
exempt because the diff is backend-only.

The other question — does the behaviour satisfy the criteria — is `tester`'s. You weigh the evidence
it reports; you do not re-derive acceptance.

## Test existence

- **Does a changed file that adds or modifies behaviour have a test?** Absence is a finding with the
  changed file's path.
- **Does the test cover the changed behaviour**, or does it cover a neighbour that already existed?
  A suite that grew while the behaviour moved is not coverage.
- **Is the exemption real?** Pure configuration, type-only, and design-token changes may be exempt.
  State the reason; do not assume it.
- **Both placements count.** This repository keeps frontend tests in a `tests/` directory inside the
  feature and API-layer tests in the feature's `api/tests/`. Checking only one of them reports a
  false gap.

Severity: `MAJOR` when the governing workflow requires tests, `MINOR` otherwise.

## Assertion quality

- **Does the assertion observe the changed behaviour?** A render with no assertion proves the module
  imported. An assertion on a constant proves arithmetic.
- **Is the negative case covered?** A validation rule with no test for the rejected input is half
  implemented.
- **Is the assertion at the right level?** A service tested through three layers at once fails for one
  reason at a time.
- **Would this test fail if the behaviour broke?** That is the whole gate. If nothing about the change
  could make it fail, it is not a test of the change.

Severity: `MAJOR` when the assertion is trivially true, `MINOR` when it is real but narrow.

## Mocking correctness

- **Is the environment stubbed rather than the thing under test?** A component test that mocks the
  component's own collaborators proves that the mocks compose.
- **Does a persistence double distinguish the call shapes the service actually uses?** One that treats
  a narrow lookup and a full read as a single shape passes a test the real client would fail.
- **Is anything mocked that the change is about?** Mocking the subject of the review removes the
  review's subject from the evidence.

Severity: `MAJOR`.

## Test location

- Is the test where this repository puts tests? Co-location is the convention, and the wrong directory
  is what makes the next author put it in the wrong directory too.
- Is the runner the one this repository uses? A test written for a runner that is not installed cannot
  run, and a suite that cannot run is not evidence.

Severity: `MINOR` for location, `MAJOR` for a runner that is not installed.

## Untested error path

The most common real gap, and the one to look for first:

- Is the failure branch of a changed code path reachable by a test?
- Is a rejected request, a validation failure, a permission denial, or a not-found covered?
- Is the thrown error asserted as the typed exception the code raises, or is its message the thing
  under test?

Severity: `MAJOR` for a changed error path with no test.

## Untested edge state

- Empty, single, and many.
- Loading, error, and success, where the change is user-visible.
- The boundary value, not just a value near it.

## Test execution evidence

A test file nobody ran is not evidence. Establish what ran:

```bash
pnpm --filter <package> test
```

- Report the command and its real output: counts, and any failing assertion.
- **A suite you did not run is `NOT RUN`.** It is never an inferred pass.
- **A failing suite is `BLOCKING`.** A known pre-existing failure is reported as such and never
  quietly accepted.
- **The combined tree is a separate gate.** Individual suites pass while the tree does not build;
  that check belongs to whoever owns the combined result, and a review that claims the tree is green
  without running it is asserting nothing.

## What is sufficient

Say plainly which of the changed behaviours have an executable check, and which do not. That list is
the most useful thing this dimension produces, and a review that reports a coverage number instead has
answered a question nobody asked. There is no coverage threshold in this repository; do not quote one
as a project rule.
