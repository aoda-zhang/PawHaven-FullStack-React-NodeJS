[English](./README.md) | [中文](./README.cn.md)

# 🐾 PawHaven - Animal Rescue Platform

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![pnpm](https://img.shields.io/badge/Package-pnpm-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Community-7289DA?logo=discord&logoColor=white)](https://discord.gg/znnG258E)

**PawHaven** is a full-stack platform designed to support **stray animal rescue and adoption**, connecting volunteers, adopters, and the community.

The platform allows users to report rescue cases, track rescue progress, share rescue stories, and improve the visibility and coordination of rescue efforts.

In addition to the application itself, PawHaven also serves as a **practice of modern full-stack engineering**, focusing on scalable architecture, maintainable code, and efficient development workflows.

---

# 🛠 Prerequisites

- **Node.js**: `24.x`
- **pnpm**: `12.x`

Ensure you meet these version requirements before installing dependencies or running the project.

---

# ✨ Key Features

- **Rescue Case Management**  
  Create and track rescue cases, helping volunteers coordinate rescue operations.

- **Authentication & Authorization**  
  Secure authentication with JWT and role-based access control.

- **Knowledge Base**  
  Provide rescue guides and adoption knowledge through a centralized content system.

- **Community Interaction**  
  Share rescue stories and exchange experiences within the community.

---

# 🚀 Tech Stack & Highlights

| Layer        | Technology                                      | Highlights                                                      |
| ------------ | ----------------------------------------------- | --------------------------------------------------------------- |
| Frontend     | React, TypeScript, React Query, React Hook Form | Scalable component-based architecture                           |
| Backend      | NestJS, Node.js                                 | Microservices for service isolation                             |
| Architecture | Monorepo + `pnpm workspace`                     | Full-stack TypeScript with shared types across frontend/backend |
| Code Quality | ESLint, Prettier, Husky                         | Enforced standards, pre-commit hooks                            |
| CI/CD        | GitHub Actions                                  | Automated pipelines                                             |

---

# 🤖 AI Driver

**`.pi/`** is the **AI-driven development engine** behind PawHaven — an agent harness that turns every coding request into a structured pipeline: `classify → plan → dispatch lanes → verify → review against architecture & patterns → update docs`.

👉 [Enter the harness](./.pi/README.md) — 18 project skills, 9 slash-command workflows, 9 subagents, and the project rules they enforce. `pnpm pi-check` validates it.

---

# 🤝 Community

PawHaven is an open and evolving project.  
If you are interested in animal rescue, open-source development, or project architecture discussions, you are welcome to join the community.

💬 **Discord**  
👉 https://discord.gg/znnG258E

You can use the Discord server to:

- discuss project ideas and features
- talk about technical architecture
- ask development questions
- collaborate with other contributors

---

# 📚 Documentation

Documentation lives in [`docs/`](./docs/README.md), split by what each document is **for**:
`architecture/` (a technical point or a problem's design), `features/` (one portal feature's
frontend and backend detail), `product/` (the blueprint `features/` cite).

> `docs/features/` is **as-built** — one document per portal feature folder, each verified against
> the code. Gaps are recorded per feature, and
> [known defects](./docs/features/README.md#known-defects-in-the-code) are tabulated in the index.
> A feature doc is only as current as the last change that reconciled it, which is why the workflow
> reads the architecture docs and the code first, and writes these last.

### Product & Architecture

| Document                                                                            | Description                                                                       |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Product Strategy](./docs/product/PawHaven-Product-Strategy-EN.md)                  | Complete product blueprint — 7 modules, personas, value flywheel, roadmap         |
| [System Architecture](./docs/architecture/PawHaven-System-Architecture-Overview.md) | 4-service architecture, modular monolith, C4, gateway, security, design decisions |
| [Design System](./packages/design-system/README.md)                                 | Design tokens, Tailwind v4 theme, CSS utilities                                   |

### Authentication at a Glance

Browser JWT / cookies are owned by the **gateway** only. Per request it resolves the caller identity (F1–F4), refreshes when needed, and signs a short-lived **ES256 internal JWT** for the target service into the `x-gateway-jwt` header. Downstream services never see browser tokens — a global `InternalJwtGuard` verifies the internal JWT (fail closed) and handlers read the identity via `@InternalJwt()`, with endpoint policy expressed by `@Public()` / `@OptionalAuth()` / default-authenticated.

→ Full detail: [Authentication & Authorization Architecture](./docs/architecture/authentication-architecture.md).

### Engineering

| Document                                                                                          | Description                                                                             |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Project Standards](./.pi/skills/project-rules/SKILL.md)                                          | Coding conventions, tooling, workflows — enforced as a skill                            |
| [Authentication & Authorization Architecture](./docs/architecture/authentication-architecture.md) | Gateway-owned cookie JWT + internal ES256-JWT (InternalJwt) service auth, `roles` claim |
| [Route-Level Authentication](./docs/architecture/route_authentication.md)                         | Frontend route guard implementation                                                     |

---

# 🧑‍💻 Local Development

See [docs/development.md](./docs/development.md).

---

# 🌟 Contributing

Contributions are welcome.

If you would like to contribute:

1. Open an issue to discuss ideas
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

---
