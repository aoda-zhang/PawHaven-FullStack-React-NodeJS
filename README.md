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

**`.opencode/`** is the **AI-driven development engine** behind PawHaven — an agent orchestrator that turns every coding request into a structured pipeline: `plan → dispatch agents → verify with tests → review against architecture & patterns → update knowledge`.

👉 [Enter the harness](./.opencode/) — 7 skills, 5 slash-command workflows and 9 agents, plus the project rules they enforce

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
`context/` (how a change must look, and how the units fit together), `features/` (one portal
feature's frontend and backend detail), `product/` (the blueprint `features/` cite), and
`how-i-build/` (the reasoning behind the design system and the component library).

> `docs/features/` is **as-built** — one document per portal feature folder, each verified against
> the code. Gaps are recorded per feature, and
> [known defects](./docs/features/README.md#known-defects-in-the-code) are tabulated in the index.

### How I Build

| Document                                                              | Description                                                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Global Architecture](./docs/context/system-architecture-overview.md) | The whole system — services, packages, data flow, deployment                                  |
| [Frontend Architecture](./docs/context/frontend-architecture.md)      | The frontend units and the direction their dependencies run in                                |
| [Backend Architecture](./docs/context/backend-architecture.md)        | The backend services and packages, and how they depend on each other                          |
| [Design Tokens](./docs/how-i-build/design-tokens.md)                  | Why a design system, how the token layers are built, how the lint plugin holds them honest    |
| [UI Library](./docs/how-i-build/ui-library.md)                        | What `@pawhaven/ui` is, the quality gates around it, and how to browse and look up components |

---

# 🧑‍💻 Local Development

See [docs/context/development.md](./docs/context/development.md).

---

# 🌟 Contributing

Contributions are welcome.

If you would like to contribute:

1. Open an issue to discuss ideas
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

---
