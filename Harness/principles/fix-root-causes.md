# Fix Root Causes

Trace each symptom to its root cause. Reproduce first, ask why until you reach it.

## When it applies

Debugging.

## The rule

A symptom can be patched at many levels; only the root cause is the fix. Reproduce the failure first (you cannot prove a fix to a bug you cannot reproduce), then trace: why does this happen, why is this branch taken, why does this value arrive wrong. Keep asking why until the answer is the cause, not a symptom. A "belt and suspenders" change that might help is a hypothesis, not a fix.

## PawHaven notes

- A runtime error traced to its source: check the actual data shape at the boundary before "fixing" the component that consumes it.
- A flaky test is a real bug until proven otherwise. Find the race or the shared state; re-running it is not a fix.
- i18n text that shows raw keys is usually a missing key or wrong namespace, not a rendering bug.

## Anti-pattern

Fixing a crash by wrapping the call in a `try/catch` that swallows the error, when the root cause is an unvalidated payload at the API boundary.
