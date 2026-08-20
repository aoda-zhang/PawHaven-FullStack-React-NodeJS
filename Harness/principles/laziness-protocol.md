# Laziness Protocol

Bias to deletion and the smallest change that solves the problem.

## When it applies

Refactoring, sizing a diff, or tempted to add abstractions, layers, or signal threading.

## The rule

Before adding anything, ask in order:

1. Can I delete something instead?
2. Can this be fixed with a smaller change?
3. Does the new abstraction earn its keep for 2+ real callers today?

The smallest change that solves the problem is the correct change. A diff you can't explain in one sentence is too big.

## PawHaven notes

- A new component, hook, or package is the last resort, not the first move. Components graduate to a package only when 2+ features use them.
- A shared abstraction with one caller is a candidate for inlining, not extraction.
- Deleting dead code is a legitimate task on its own. Do it first (see subtract-before-you-add).

## Anti-pattern

Bug fix that adds a new hook, a new utility, new state, and a new component when deleting one conditional would do.
