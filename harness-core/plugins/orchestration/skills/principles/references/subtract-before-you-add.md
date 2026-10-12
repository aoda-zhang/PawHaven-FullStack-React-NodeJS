# Subtract Before You Add

Remove dead weight first, then build on the simpler base. Bias to the smallest change that solves the
problem.

## When it applies

Sequencing an addition, refactor, or rewrite. Sizing a diff. Tempted to add an abstraction, a layer,
or signal threading.

## The rule

Before adding anything, ask in order:

1. Can I delete something instead?
2. Can this be fixed with a smaller change?
3. Does the new abstraction earn its keep for 2+ real callers today?

Then order the work so subtraction comes before addition. Dead code, superseded paths, and
compatibility shims obscure the real shape of the system. Deleting them first makes the addition
smaller and safer, because you see the base you are building on.

The smallest change that solves the problem is the correct change. A diff you cannot explain in one
sentence is too big.

## In this repo

- Before adding a new API or variant, introduce the replacement, migrate every caller, and delete the
  old one in the same wave. Two APIs coexisting forever is the failure this rule prevents.
- A new component, hook, or package is the last resort, not the first move. Components graduate to a
  package only when 2+ features use them; an abstraction with one caller is a candidate for inlining.
- A feature that touches a messy area: clean the area first in its own commit, then add the feature in
  the next one.
- Stale branches, unused exports, and orphaned styles are subtraction opportunities. The
  turbo/pnpm workspace is a good place to look for them.

## Anti-patterns

- Building the new feature on top of the legacy path, then "cleaning up later". Cleanup later never
  happens.
- A bug fix that adds a hook, a utility, new state, and a component when deleting one conditional
  would do.
