# Subtract Before You Add

Remove dead weight first, then build on the simpler base.

## When it applies

Sequencing an addition, refactor, or rewrite.

## The rule

Order the work so that subtraction comes before addition. Dead code, superseded paths, and compatibility shims obscure the real shape of the system. Deleting them first makes the addition you actually need smaller and safer, because you see the base you are building on.

## PawHaven notes

- Before adding a new API or variant, remove the old one it replaces in the same wave (see migrate-callers-then-delete-legacy-apis).
- A feature that touches a messy area: clean the area first in its own commit, then add the feature in the next one.
- Stale branches, unused exports, and orphaned styles are subtraction opportunities. The `turbo`/pnpm workspace is a good place to look for them.

## Anti-pattern

Building the new feature on top of the legacy path, then "cleaning up later". Cleanup later never happens.
