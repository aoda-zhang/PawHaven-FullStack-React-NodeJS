# Code quality

Is the code written well? This dimension is **stack-neutral**: it applies to a NestJS service, a React
component, and a shared package alike. React-specific and NestJS-specific questions belong to
[frontend.md](./frontend.md) and [backend.md](./backend.md).

## Complexity

- **Is there more structure than the problem needs?** A branch, an abstraction, or an indirection that
  exists for one caller is cost paid on every read.
- **Is a function doing two things?** Split at the point where the two halves would be named
  differently in a commit message.
- **Is nesting deeper than the logic?** Early return beats a flag variable beats a nested conditional.
- **Is a name carrying a condition?** `processData`, `handleStuff`, `check`: the name says nothing, so
  the body has to be read to know what it does.

Complexity is a finding when it makes the change hard to verify or hard to change, not when a number
crosses a threshold.

## Duplication

- **Two callers of the same three lines** is not duplication. Two callers of the same thirty lines is.
- **Duplication across a boundary is a different defect.** The same shape written on both sides of a
  contract is a missing shared type. That belongs to [architecture.md](./architecture.md) and to the
  TypeScript skill's placement rule.
- **Duplication that a rename would remove** is duplication that should never have been written.

## Dead code

- An exported symbol with no consumer anywhere.
- A branch whose condition can never be false, or is never true.
- A comment describing behaviour the code no longer has.
- A feature flag that is permanently on or permanently off.

Dead code is worse than no code: it reads as a live path and it is maintained by nobody.

## Error handling

- **Is the failure handled where it can be handled?** Swallowing an error to keep a render alive hides
  the defect it was hiding.
- **Does the error say what happened and what the caller can do?** A message nobody can act on is
  decoration.
- **Does the error leak internals?** A database driver's error text reaching a client is an
  information-disclosure defect, not a style issue. The backend skill owns the shape of the thrown
  error.
- **Is a caught error used?** An empty `catch` that does not rethrow, log, or change control flow is
  a finding.

## Maintainability

- **Will the next reader know why?** A comment that explains why is worth keeping; one that restates
  the code is noise.
- **Is the change readable as a diff?** A rename bundled with a behaviour change is two changes, and a
  reviewer cannot see either.
- **Is a new concept named?** An undeclared concept in three files is three concepts.
- **Does the code state the constraint it obeys?** A rule a reader has to infer from surrounding code
  will be broken by the next change.

## Unnecessary abstraction

- **Does the abstraction have two implementations today?** An interface with one implementation and no
  test double is indirection.
- **Does the abstraction name the concept or the mechanism?** `parseRescueReport` is a concept;
  `JsonStringifier` is a mechanism.
- **Would deleting it make the code worse?** If not, deleting it is the smaller change.

## What this dimension does not judge

Stack rules, boundary rules, type rules, test rules, security rules, and performance rules each have
their own reference. A finding that is really one of those is filed under that dimension, so it is
fixed by whoever owns the rule rather than reinterpreted here.

## Related

- The project constraints a change must not violate: [AGENTS.md](../../../../../../AGENTS.md)
- Where the measured pre-existing state is recorded: [docs/quality](../../../../../../docs/quality/README.md)
