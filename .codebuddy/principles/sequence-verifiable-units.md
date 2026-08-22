# Sequence Work into Verifiable Units

Break work into small units that each end in a check. Verify each before the next.

## When it applies

Multi-step work: sweeps, migrations, runs of similar edits, and how you stack commits and PRs.

## The rule

Each unit of work ends in a check (typecheck, test, render). Verify it passes before starting the next unit. Order delivery so the sequence proves itself: the failing case lands before the fix, the pinned behavior lands before the refactor, the baseline trace lands before the optimization.

## PawHaven notes

- A bug fix: commit the failing repro first, then the fix, so the sequence demonstrates the fix.
- A refactor: pin the behavior (test or snapshot) before moving code; keep the pin green through the move.
- A perf pass: capture the baseline measurement before changing anything; re-measure after.
- Stacked PRs should each be landable and independently verifiable.

## Anti-pattern

One giant change that does everything, with a single "it typechecks" check at the end, so you cannot tell which part broke what.
