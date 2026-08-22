# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for PawHaven.

## What is an ADR?

An ADR documents **why** a significant architectural decision was made, not just **what** was decided. It captures context, alternatives considered, and consequences — both positive and negative.

## When to Write an ADR

Write an ADR when:

- Introducing a new service, module, or major subsystem
- Changing an existing architectural pattern (e.g., moving from monolith to microservices)
- Selecting a technology with significant long-term impact
- Modifying cross-module communication patterns (events, APIs, shared types)
- Any decision that affects more than one team or more than one module

## Template

Use `ADR-001-template.md` as the starting point for every new ADR.

## Naming Convention

- `ADR-NNN-short-title.md`
- Sequential numbering (001, 002, ...)
- Short, descriptive title in kebab-case

## Status Lifecycle

```
Proposed → Accepted → [Deprecated | Superseded]
```

- **Proposed**: Under discussion, not yet ratified
- **Accepted**: Ratified and in effect
- **Deprecated**: No longer relevant, but kept for historical context
- **Superseded**: Replaced by a newer ADR. Link to the successor.

## Directory Structure

```
.codebuddy/docs/ADR/
├── README.md              # This file
├── ADR-001-template.md    # Template for new ADRs
├── ADR-002-*.md           # Individual ADRs
├── ADR-003-*.md
└── ...
```

> **Rule**: Never delete an ADR. Mark it as Deprecated or Superseded instead. The history of decisions is as valuable as the current state.
