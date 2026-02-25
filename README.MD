[English](README.MD) | [中文](READMECN.MD)

# 🐾 PawHaven - Animal Rescue Platform

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![pnpm](https://img.shields.io/badge/Package-pnpm-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

PawHaven is a full-stack platform designed to provide a safe rescue and adoption environment for stray animals, connecting volunteers, adopters, and the community. Users can report rescue cases, share stories, participate in community interactions, and enable efficient flow and sharing of rescue information.

---

## 🧠 Core Modules & Technical Practices

- **Authentication & Authorization**  
  Implements role-based access control to ensure user data security and operational compliance. Utilizes JWT and permission strategies, with unified validation across frontend and backend, enhancing system security.

- **Rescue Case Management Module**  
  Supports creation, review, status tracking, and operational guidance of rescue cases, automating business processes.

- **Knowledge Base & Content Management**  
  Provides dynamic content updates and multi-platform synchronization, supporting knowledge sharing such as rescue guides and adoption processes. Integrated with CMS and API design for centralized management and real-time updates.

- **Community Interaction & Story Sharing**  
  Builds information exchange and emotional connection among users, supporting comments, likes, and sharing features. Combines frontend componentization and backend event push for smooth interactive experience.

---

## ✨ Technical Highlights

- Monorepo architecture with modular design for unified management of frontend, backend, and shared components, enabling efficient collaboration.
- Shared type definitions and reusable components across frontend and backend, reducing duplicate development and improving code consistency.
- Frontend modular structure using React Hook Form and React Query to optimize form management and data caching.
- Backend microservices architecture supporting independent deployment and data isolation, improving scalability and system stability.
- Complete CI/CD pipeline with automated build, testing, and deployment for reliable continuous delivery.
- Emphasis on engineering practices, supporting scalable architecture design and code standards, enhancing team collaboration efficiency.

---

## 🧰 Tech Stack & Tooling

- **Frontend:** React + Redux Toolkit (state management) + React Query (data caching) + React Hook Form (form management)
- **Backend:** NestJS (microservices framework) + Prisma (database ORM) + MongoDB (document database)
- **Shared Packages:** UI component library, TypeScript types, and utility functions for cross-platform reuse and consistent standards
- **Infrastructure:** pnpm + TurboRepo monorepo setup with GitHub Actions for automated CI/CD

---

## 📚 Table of Contents

- [💻 Application Overview](./docs/overview.md)
- ⚙️ Monorepo Setup & Development Standards
- 🗄️ Repository Structure & Code Organization
- 🧱 Shared Components & Reusable Utilities
- 📡 Backend Service Design & API Management
- 🗃️ Frontend Architecture & State Management Practices
- ⚠️ Error Handling, Monitoring & Logging
- 🚀 CI/CD & Deployment Pipelines
