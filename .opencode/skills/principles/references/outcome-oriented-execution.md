# Outcome-Oriented Execution

Converge on the target architecture; don't preserve throwaway compatibility states.

## When it applies

Planned rewrites and migrations with explicit phase boundaries.

## The rule

Each phase should end closer to the target architecture. A compatibility shim is acceptable only when it is a stepping stone with a known deletion date. Throwaway compatibility states that linger become the new legacy.

## PawHaven notes

- A migration from one state library to another should converge on the target, not maintain dual code paths indefinitely.
- When migrating callers of an API, do it in one wave (see migrate-callers-then-delete-legacy-apis) rather than letting two APIs coexist forever.

## Anti-pattern

"Both the old and new path work, we'll delete the old one later." There is no later.
