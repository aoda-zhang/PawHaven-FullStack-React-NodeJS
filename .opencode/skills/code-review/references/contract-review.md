# Contract Code Review Reference

Load when a diff changes API payloads, shared schemas/types, serialization, or a producer-consumer boundary.

## Review checklist

- Trace each changed contract from its canonical definition through affected producers and consumers
- Optionality / nullability: required vs optional fields, default values
- Enums: added/removed values, backward compatibility
- Validation: DTO constraints, custom validators, transformation pipes
- Serialization: class-transformer, JSON shape, date formats, nested objects
- Status / error shape: HTTP codes, error envelopes, error codes, trace IDs
- Backward compatibility: breaking vs non-breaking, versioning strategy
- Boundary tests: contract tests, pact, schema validation in CI

## For service calls

- Prefixes, auth claims, timeout/error mapping, payload shape when implicated

## Output

Name the affected producer-consumer pair and any breaking change. Use the finding format defined by the Reviewer agent.
