**English** | [中文](./README.cn.md) | [Deutsch](./README.de.md)

# 🐾 PawHaven - Animal Rescue Platform

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![pnpm](https://img.shields.io/badge/Package-pnpm-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**PawHaven** is a full-stack platform designed to support **stray animal rescue and adoption**, connecting volunteers, adopters, and the community.

The platform allows users to report rescue cases, track rescue progress, share rescue stories, and improve the visibility and coordination of rescue efforts.

In addition to the application itself, PawHaven also serves as a **practice of modern full-stack engineering**, focusing on scalable architecture, maintainable code, and efficient development workflows.


## Core product journey

The diagram below summarizes the main animal journey, from the initial report to rescue, care, and adoption.

```mermaid
flowchart TD
    A["Someone discovers a stray pet"] --> B["Submit an animal report"]
    B --> C["PENDING_REVIEW<br/>Hidden from public view"]
    C --> D["Volunteer reviews the report"]

    D -->|Reject| E["REJECTED<br/>Remains unpublished"]
    D -->|Approve| F["NEEDS_HELP<br/>Becomes publicly visible"]

    F --> G["Community discovers, follows, and comments"]
    F --> H["Rescue and care journey"]

    H --> I["User submits a status-change request"]
    I --> J["Volunteer reviews the request"]
    J -->|Reject| H
    J -->|Approve| K["Official animal status is updated"]
    K --> L["Rescue, treatment, and recovery"]
    L --> M["AWAITING_ADOPTION, where appropriate"]
    M --> N["ADOPTED after the adoption handover"]
```

---

# How I Build

| Document                                                              | Description                                                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Global Architecture](./docs/context/system-architecture-overview.md) | The whole system — services, packages, data flow, deployment                                  |
| [Frontend Architecture](./docs/context/frontend-architecture.md)      | The frontend units and the direction their dependencies run in                                |
| [Backend Architecture](./docs/context/backend-architecture.md)        | The backend services and packages, and how they depend on each other                          |
| [Design Tokens](./docs/how-i-build/design-tokens.md)                  | Why a design system, how the token layers are built, how the lint plugin holds them honest    |
| [UI Library](./docs/how-i-build/ui-library.md)                        | What `@pawhaven/ui` is, the quality gates around it, and how to browse and look up components |

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

PawHaven is an open and evolving project. If you are interested in animal rescue, open-source development, or contributing to the project, you are welcome to get involved.

💬 **Interested in contributing?**

Feel free to [reach out to me on WhatsApp](https://wa.me/8619102632826). I'd be happy to connect, discuss ideas, and explore ways we can work together.

**Contributions are always welcome!**

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
