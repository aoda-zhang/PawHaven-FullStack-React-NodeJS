# ADR-001: ADR Template

| Field             | Value           |
| ----------------- | --------------- |
| **Status**        | Accepted        |
| **Date**          | 2026-07-14      |
| **Deciders**      | Architect Agent |
| **Supersedes**    | --              |
| **Superseded By** | --              |

## Context

ADR (Architecture Decision Record) documents are used to capture architecturally significant decisions made during development. This template defines the standard format for all ADRs in the PawHaven project.

Each ADR captures one decision, its context, the options considered, and the consequences of the choice. ADRs are immutable once accepted — they can be superseded by new ADRs but never modified.

## Decision

All ADRs MUST follow this format:

```markdown
# ADR-{NNN}: {Title}

| Field             | Value                                         |
| ----------------- | --------------------------------------------- |
| **Status**        | Proposed / Accepted / Deprecated / Superseded |
| **Date**          | YYYY-MM-DD                                    |
| **Deciders**      | Who made the decision                         |
| **Supersedes**    | ADR-XXX (if replacing a previous decision)    |
| **Superseded By** | ADR-YYY (if this ADR was replaced)            |

## Context

What problem are we solving? What constraints or forces are in play?
Include relevant technical, business, and organizational context.

## Decision

What did we decide? Be specific and actionable.
Include implementation details where relevant.

## Consequences

What becomes easier? What becomes harder? What are the trade-offs?
Be honest about downsides — no decision is perfect.

## Alternatives Considered

| Option | Why Rejected |
| ------ | ------------ |
| ...    | ...          |
```

## Consequences

**Positive:**

- Consistent decision documentation across the project
- New team members can understand why choices were made
- Revisiting past decisions is easier with full context

**Negative:**

- Requires discipline to write ADRs for significant decisions
- ADRs must be kept up-to-date (superseded when replaced)

## Alternatives Considered

| Option                        | Why Rejected                                               |
| ----------------------------- | ---------------------------------------------------------- |
| Informal design docs only     | No standard format; hard to search and reference           |
| Decision log in a single file | Doesn't scale with project growth; hard to cross-reference |
| No documentation at all       | Impossible to onboard or revisit past decisions            |
