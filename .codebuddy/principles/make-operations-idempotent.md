# Make Operations Idempotent

Converge to the same end state, no matter how many times the operation runs.

## When it applies

Designing commands, lifecycle steps, or loops that run amid retries, double-clicks, or re-mounts.

## The rule

An operation that can run twice must produce the same result as running it once. Mutations should be safe to retry; effects should not duplicate work; state transitions should be re-entrant.

## PawHaven notes

- A submit button that can be clicked twice must not create two records. Disable in-flight, and make the mutation idempotent by key where the backend supports it.
- TanStack Query `invalidateQueries` and mutation callbacks should be safe to fire more than once.
- Effects that subscribe, fetch, or write should clean up after themselves (no duplicate subscriptions on re-mount).
- Optimistic updates must roll back cleanly when the request retries or fails.

## Anti-pattern

A double-click creates a duplicate order, and the fix is "tell users not to double-click".
