# PawHaven Documentation Index

> Unified entry point for all project documentation

---

## 1. Product Strategy

| File                                                                 | Description                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [PawHaven-Product-Strategy-EN.md](./PawHaven-Product-Strategy-EN.md) | Complete product blueprint v2.0 — animal lifecycle, persona model, feature map, MVP roadmap |

**Key contents**: Full collaborative pipeline — Step 1 discovery → Step 2 rescue → Step 3 medical → Step 4 adoption, user role definitions (reporter / rescuer / adopter / clinic), core feature matrix, phased delivery plan.

---

## 2. System Architecture

| File                                                                                   | Description                                                                                                       |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [PawHaven-System-Architecture.md](./PawHaven-System-Architecture.md)                   | System architecture design v3.11 — service decomposition, modular monolith, deployment topology, data flow        |
| [PawHaven-System-Architecture-Overview.md](./PawHaven-System-Architecture-Overview.md) | System architecture v3.11 — 5 services, API gateway routing (internal-JWT auth), event catalog, data architecture |

**Key contents**: Monorepo structure (`apps/backend/*` + `apps/frontend/*` + `packages/*` + `libs/*`), pragmatic service decomposition philosophy, modular monolith design inside core-service, API Gateway routing rules, inter-service communication patterns.

---

## 3. Figma Design Specification

| File                                           | Description                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [figma-design-spec.md](./figma-design-spec.md) | Full page design analysis based on `pawhaven.figma.site` — 8 sections with layout, interaction, and visual details |

**Key contents**: Section-by-section description of Nav / Hero / Rescue Cases / Adoptable Pets / Happy Endings / Knowledge Base / CTA Banner / Footer, responsive breakpoint behavior, design principles.

---

## 4. Design System

| File                                                            | Type       | Description                        |
| --------------------------------------------------------------- | ---------- | ---------------------------------- |
| [tokens/](../../packages/design-system/src/tokens/)             | CSS        | 12 design token CSS variable files |
| [theme.css](../../packages/design-system/src/theme.css)         | CSS        | Global theme definitions           |
| [utilities.css](../../packages/design-system/src/utilities.css) | CSS        | Utility classes                    |
| [src/](../../packages/design-system/src/)                       | TypeScript | Design system source code          |

**Key contents**: `#f7823a` warm orange primary, Fraunces + Plus Jakarta Sans type system, Badge / Button / Card component specs, Lucide icon mapping, Unsplash image size standards.

---

## 5. Authentication

| File                                                               | Description                                                                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [authentication-architecture.md](./authentication-architecture.md) | Auth architecture — gateway-owned cookie JWT, HS256 internal-JWT (InternalJwt) trust chain, token refresh, downstream policy |
| [route_authentication.md](./route_authentication.md)               | Frontend route-level auth — authenticated parent route (`requireUser` loader), `/auth/me` verification flow                  |

**Key contents**: `gateway` is the sole JWT owner (InternalJwtService identity resolution + proactive refresh), `auth-service` issues/rotates tokens, downstream services verify the HS256 internal-JWT claims (`x-gateway-jwt`) via the global InternalJwtGuard, frontend reads its profile from `/auth/me`.

---

## 6. Engineering Standards

| File                                           | Description                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [project_standards.md](./project_standards.md) | Project standards — ESLint maintenance, code layering, dependency direction, Git workflow |

---

## 7. Feature Workflows

> One end-to-end workflow doc per feature. pawhaven loads the relevant doc when asked to build a feature.

| File                                                                                           | Feature                                                 | MVP |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --- |
| [feature-workflows/README.md](./feature-workflows/README.md)                                   | Index of all feature workflows + feature→module mapping | —   |
| [feature-workflows/01-auth.md](./feature-workflows/01-auth.md)                                 | Authentication & Authorization                          | P0  |
| [feature-workflows/02-report-animal.md](./feature-workflows/02-report-animal.md)               | Report a Stray Animal                                   | P0  |
| [feature-workflows/03-rescue-case.md](./feature-workflows/03-rescue-case.md)                   | Rescue Case Lifecycle                                   | P0  |
| [feature-workflows/04-volunteer.md](./feature-workflows/04-volunteer.md)                       | Volunteer Network & Case Claiming                       | P0  |
| [feature-workflows/05-adoption.md](./feature-workflows/05-adoption.md)                         | Adoption                                                | P1  |
| [feature-workflows/06-rescue-stories.md](./feature-workflows/06-rescue-stories.md)             | Rescue Stories                                          | P2  |
| [feature-workflows/07-knowledge-base.md](./feature-workflows/07-knowledge-base.md)             | Knowledge Base                                          | P2  |
| [feature-workflows/08-notifications.md](./feature-workflows/08-notifications.md)               | Notifications                                           | P0  |
| [feature-workflows/09-profile-achievements.md](./feature-workflows/09-profile-achievements.md) | Profile & Achievements                                  | P1  |
| [feature-workflows/10-homepage-discovery.md](./feature-workflows/10-homepage-discovery.md)     | Homepage & Discovery                                    | P0  |
| [feature-workflows/11-bootstrap.md](./feature-workflows/11-bootstrap.md)                       | Bootstrap & Server-Driven Routing                       | P0  |

---

## 8. Key Project Files

| File                                             | Description                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [pawhaven.md](../agents/pawhaven.md)             | AI Agent orchestration rules — complexity classification, workflow selection, agent dispatch, operating principles |
| [README.MD](../../README.MD)                     | Project README (English) — see also `.codebuddy/README.md` for .codebuddy-specific docs                            |
| [READMECN.MD](../../READMECN.MD)                 | Project README (中文)                                                                                              |
| [package.json](../../package.json)               | Monorepo root config (pnpm workspace)                                                                              |
| [turbo.json](../../turbo.json)                   | Turborepo build orchestration config                                                                               |
| [pnpm-workspace.yaml](../../pnpm-workspace.yaml) | pnpm workspace declaration                                                                                         |

---

## Document Relationship Map

```
PawHaven-Product-Strategy-EN.md ───────────────────────┐
  (Product Blueprint v2.0)                              │
                                                        ├──→ PawHaven-System-Architecture.md
                                                        │      (Architecture based on product strategy)
                                                        │
figma-design-spec.md ───────────────────────────────────┤
  (Figma Page Analysis)                                 │
                                                        ├──→ design-system.html
                                                        │      (Design tokens & component specs)
authentication-architecture.md ─────────────────────────┤
  (Auth Architecture)                                   │
                                                        ├──→ route_authentication.md
                                                        │      (Frontend route auth implementation)
project_standards.md ───────────────────────────────────┤
  (Code Standards)                                      │
                                                        ├──→ feature-workflows/ (01-auth … 11-bootstrap)
                                                        │      (Per-feature build workflows)
                                                        │
pawhaven.md ───────────────────────────────────────────┘
  (AI Agent Orchestration)
```

> **Suggested reading order**: Step 1 Product Strategy → Step 2 System Architecture → Step 3 Figma Design → Step 4 Design System → Step 5 Auth Architecture → Step 6 Engineering Standards → Step 7 Feature Workflows (load the relevant feature doc when building)
