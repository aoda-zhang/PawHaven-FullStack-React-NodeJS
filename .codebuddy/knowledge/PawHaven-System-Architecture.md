# PawHaven — System Architecture Design

> **Version**: v3.0 | **Date**: 2026-07-10
> **Design Philosophy**: Pragmatic service decomposition. Modular monolith inside core-service. Extract only when necessary.
>
> **This document has been split into 3 focused docs for easier navigation.**

---

## Architecture Docs

| Document                                                                       | Content                                                                                                                                                                                            |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**System Architecture Overview**](./PawHaven-System-Architecture-Overview.md) | Philosophy, service decomposition, C4 model, data architecture, API gateway, event-driven communication, shared kernel, security, observability, deployment, ADRs, boundary enforcement, rationale |
| [**Frontend Architecture**](./PawHaven-Frontend-Architecture.md)               | Feature-based module architecture, package ecosystem, component boundaries, server-driven routing, state management, design token architecture, i18n architecture, boundary enforcement            |
| [**Backend Architecture**](./PawHaven-Backend-Architecture.md)                 | Core-service modular monolith, bounded contexts as NestJS modules, event-driven communication, module boundary enforcement                                                                         |

---

## Original Table of Contents (reference)

| #   | Section                            | Current Location                                                                                              |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Architecture Philosophy            | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 2   | Service Decomposition — 5 Services | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 3   | Core-Service: The Modular Monolith | [Backend Architecture](./PawHaven-Backend-Architecture.md)                                                    |
| 4   | Bounded Contexts as NestJS Modules | [Backend Architecture](./PawHaven-Backend-Architecture.md)                                                    |
| 5   | C4 Model — System Landscape        | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 6   | Data Architecture                  | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 7   | API Gateway Design                 | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 8   | Event-Driven Communication         | [System Overview](./PawHaven-System-Architecture-Overview.md) & [Backend](./PawHaven-Backend-Architecture.md) |
| 9   | Shared Kernel & Package Strategy   | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 10  | Frontend Architecture              | [Frontend Architecture](./PawHaven-Frontend-Architecture.md)                                                  |
| 11  | Security Architecture              | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 12  | Observability & Operations         | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 13  | Deployment Architecture            | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 14  | Architecture Decision Records      | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
| 15  | Module Boundary Enforcement        | [System Overview](./PawHaven-System-Architecture-Overview.md) & [Backend](./PawHaven-Backend-Architecture.md) |
| 16  | Why This Design Works              | [System Overview](./PawHaven-System-Architecture-Overview.md)                                                 |
