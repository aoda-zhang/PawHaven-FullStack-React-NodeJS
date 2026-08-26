# Boundary Discipline

Guards at system boundaries; trust internal types; keep business logic pure.

## When it applies

Wiring validation, error handling, or framework adapters.

## The rule

Parse, validate, and normalize external data once at the boundary (API responses, storage, i18n keys, user input). Inside the boundary, trust your types. Business logic stays pure and framework-free where possible.

## PawHaven notes

- API responses are validated at the data layer (zod or equivalent), not ad-hoc `as` casts scattered through components.
- TanStack Query hooks are the boundary for server state; components consume already-typed data.
- i18n keys are a boundary: `t('key')` at the edge, typed keys, no string literals leaking through the app.
- React Hook Form handles input validation at the form boundary; the domain layer receives validated values.

## Anti-pattern

`response.data as SomeType` in a component, trusting an unvalidated server payload because "the backend guarantees it".
