# Model the Domain

Encode the domain in a structure instead of scattered conditionals.

## When it applies

Writing stateful logic, or code that branches a lot or repeats a shape assumption across files.

## The rule

Before writing `if` chains, name the data shape and pick an organizing structure:

- **State machine** — a flow with explicit states and transitions (wizard, upload, checkout).
- **Typed model** — the shape of the data as a TypeScript type; illegal states unrepresentable.
- **Table or registry** — mapping keys to behavior instead of `switch` on a string.
- **Reducer** — state transitions concentrated in one pure function.
- **Boundary** — external data parsed once at the edge, internal types trusted after.

Every structure decision starts with the data shape. Name it first.

## PawHaven notes

- React state: `if (status === 'loading') ... if (status === 'error') ...` duplicated across components is the smell. The status union + one reducer per flow is the fix.
- Server state belongs in TanStack Query keys; client state in Redux slices; forms in React Hook Form. The wrong home for a piece of state is itself a domain-modeling error.
- A type that allows impossible states (`status: string`, `value: number | null | undefined` where one is impossible) is a bug factory.

## Anti-pattern

The same `status` union checked in five components with slightly different branch sets, drifting out of sync.
