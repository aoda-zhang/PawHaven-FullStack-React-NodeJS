# PawHaven Documentation Index

> Unified entry point for all project documentation

---

## 1. Product Strategy

| File                                                                  | Description                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [PawHaven-Product-Strategy-EN.md](./PawHaven-Product-Strategy-EN.md)  | Complete product blueprint v2.0 — animal lifecycle, persona model, feature map, MVP roadmap |
| [PawHaven-Product-Strategy.md](./PawHaven-Product-Strategy.md) (中文) | Chinese version of the product strategy                                                     |

**Key contents**: Full collaborative pipeline from discovery → rescue → medical → adoption, user role definitions (reporter / rescuer / adopter / clinic), core feature matrix, phased delivery plan.

---

## 2. System Architecture

| File                                                                              | Description                                                                                               |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [PawHaven-System-Architecture.md](./PawHaven-System-Architecture.md)              | System architecture design v2.0 — service decomposition, modular monolith, deployment topology, data flow |
| [PawHaven-System-Architecture-CN.md](./PawHaven-System-Architecture-CN.md) (中文) | Chinese version of the system architecture                                                                |

**Key contents**: Monorepo structure (`apps/backend/*` + `apps/frontend/*` + `packages/*` + `libs/*`), pragmatic service decomposition philosophy, modular monolith design inside core-service, API Gateway routing rules, inter-service communication patterns.

---

## 3. Figma Design Specification

| File                                           | Description                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [figma-design-spec.md](./figma-design-spec.md) | Full page design analysis based on `pawhaven.figma.site` — 8 sections with layout, interaction, and visual details |

**Key contents**: Section-by-section description of Nav / Hero / Rescue Cases / Adoptable Pets / Happy Endings / Knowledge Base / CTA Banner / Footer, responsive breakpoint behavior, design principles.

---

## 4. Design System

| File                                                               | Type                   | Description                                                                                      |
| ------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------ |
| [design-system.html](../packages/design-system/design-system.html) | HTML (open in browser) | Visual design system — Colors, Typography, Layout, Icons, and Images rendered with actual styles |
| [tokens/](../packages/design-system/tokens/)                       | CSS                    | 12 design token CSS variable files                                                               |
| [theme.css](../packages/design-system/theme.css)                   | CSS                    | Global theme definitions                                                                         |
| [utilities.css](../packages/design-system/utilities.css)           | CSS                    | Utility classes                                                                                  |
| [src/](../packages/design-system/src/)                             | TypeScript             | Design system source code                                                                        |

**Key contents**: `#f7823a` warm orange primary, Fraunces + Plus Jakarta Sans type system, Badge / Button / Card component specs, Lucide icon mapping, Unsplash image size standards.

---

## 5. Authentication

| File                                                               | Description                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| [authentication_architecture.md](./authentication_architecture.md) | Auth architecture overview — Cookie-based JWT flow, Gateway JWT Guard, Token Refresh mechanism, microservice trust chain |
| [route_authentication.md](./route_authentication.md)               | Frontend route-level auth — RequireAuth component, `/auth/me` verification flow, public route declaration                |

**Key contents**: `gateway` unified JWT verification + proactive refresh, `auth-service` handles issuing/rotation, `httpOnly` cookie security strategy, frontend obtains user identity via gateway-injected headers.

---

## 6. Engineering Standards

| File                                           | Description                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [project_standards.md](./project_standards.md) | Project standards — ESLint maintenance, code layering, dependency direction, Git workflow |

---

## 7. Feature Plan

| File                                 | Description                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| [feature_plan.md](./feature_plan.md) | Feature plan by module — infrastructure, auth, animal management, search, community, etc. |

---

## 8. Key Project Files

| File                                          | Description                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [AGENTS.md](../AGENTS.md)                     | AI Agent development rules — layering constraints, auth architecture notes, operating principles, validation commands |
| [README.MD](../README.MD)                     | Project README (English)                                                                                              |
| [READMECN.MD](../READMECN.MD)                 | Project README (中文)                                                                                                 |
| [package.json](../package.json)               | Monorepo root config (pnpm workspace)                                                                                 |
| [turbo.json](../turbo.json)                   | Turborepo build orchestration config                                                                                  |
| [pnpm-workspace.yaml](../pnpm-workspace.yaml) | pnpm workspace declaration                                                                                            |

---

## 9. Assets

| Directory            | Description                             |
| -------------------- | --------------------------------------- |
| [images/](./images/) | Embedded image assets for documentation |

---

## Document Relationship Map

```
PawHaven-Product-Strategy.md ──────────────────────┐
  (Product Blueprint v2.0)                          │
                                                    ├──→ PawHaven-System-Architecture.md
                                                    │      (Architecture based on product strategy)
                                                    │
figma-design-spec.md ───────────────────────────────┤
  (Figma Page Analysis)                             │
                                                    ├──→ design-system.html
                                                    │      (Design tokens & component specs)
authentication_architecture.md ─────────────────────┤
  (Auth Architecture)                               │
                                                    ├──→ route_authentication.md
                                                    │      (Frontend route auth implementation)
project_standards.md ───────────────────────────────┤
  (Code Standards)                                  │
                                                    ├──→ feature_plan.md
                                                    │      (Feature development plan)
                                                    │
AGENTS.md ──────────────────────────────────────────┘
  (AI Agent Constraints)
```

> **Suggested reading order**: Product Strategy → System Architecture → Figma Design → Design System → Auth Architecture → Engineering Standards
