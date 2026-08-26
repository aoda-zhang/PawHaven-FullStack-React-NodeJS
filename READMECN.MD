[English](./README.MD) | [中文](./READMECN.MD)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![pnpm](https://img.shields.io/badge/Package-pnpm-F69220?logo=pnpm&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Discord](https://img.shields.io/badge/Discord-社区-7289DA?logo=discord&logoColor=white)](https://discord.gg/znnG258E)

**PawHaven** 是一个全栈平台，旨在支持**流浪动物救援和领养**，连接志愿者、领养者和社区。

平台允许用户报告救援案例、跟踪救援进度、分享救援故事，并提升动物救援信息的可见性与协调效率。

除了应用功能外，PawHaven 也是**现代全栈工程实践**的展示，注重可扩展架构、可维护代码和高效开发流程。

---

# ✨ 核心功能

- **救援案例管理**  
  创建和跟踪救援案例，帮助志愿者协调救援行动。

- **认证与权限**  
  使用 JWT 和基于角色的访问控制保证用户安全。

- **知识库**  
  提供救援指南和领养知识，通过集中式内容系统管理。

- **社区互动**  
  分享救援故事、交流经验，增强社区互动与连接。

---

# 🚀 技术栈与亮点

| 层级     | 技术                                            | 亮点                            |
| -------- | ----------------------------------------------- | ------------------------------- |
| 前端     | React, TypeScript, React Query, React Hook Form | 可扩展的组件化架构              |
| 后端     | NestJS, Node.js                                 | 微服务隔离，模块化单体          |
| 架构     | Monorepo + `pnpm workspace`                     | 全栈 TypeScript，前后端共享类型 |
| 代码规范 | ESLint, Prettier, Husky                         | 强制代码标准、pre-commit 钩子   |
| CI/CD    | GitHub Actions                                  | 自动化流水线                    |

---

# 🤖 AI Driver

**.codebuddy** 是 PawHaven 背后的 **AI 驱动开发引擎** —— 一个 Agent 编排器，将每个开发请求转化为结构化流水线：`规划 → 分发 Agent → 测试验证 → 对照架构与模式审查 → 知识更新`。

👉 [进入 .codebuddy 引擎](./.codebuddy/README.md) —— 工作流、Agent、技能、原则与任务日志

---

# 🤝 社区

PawHaven 是一个开放且持续发展的项目，欢迎对动物救援、开源开发或项目架构讨论感兴趣的朋友加入社区。

💬 **Discord**  
👉 https://discord.gg/znnG258E

在 Discord 你可以：

- 讨论项目想法和功能设计
- 探讨技术架构
- 提问开发相关问题
- 与其他贡献者协作

---

# 📚 文档

详细文档请查看 [`.codebuddy/docs`](./.codebuddy/docs/README.md) 目录：

### 产品与架构

| 文档                                                                 | 说明                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| [产品策略](./.codebuddy/docs/PawHaven-Product-Strategy-EN.md) (英文) | 完整产品全景设计 — 7 个模块、用户画像、价值闭环、路线图 |
| [系统架构](./.codebuddy/docs/PawHaven-System-Architecture.md)        | 5 服务架构、模块化单体、DDD、事件驱动、架构决策记录     |
| [设计系统](./packages/design-system/README.MD)                       | Design tokens、Tailwind v4 主题、CSS 工具类             |

### 工程

| 文档                                                                   | 说明                     |
| ---------------------------------------------------------------------- | ------------------------ |
| [Monorepo 与项目规范](./.codebuddy/docs/project_standards.md)          | 编码规范、工具链、工作流 |
| [身份认证与授权架构](./.codebuddy/docs/authentication-architecture.md) | JWT 认证流程与 RBAC 设计 |
| [路由级认证](./.codebuddy/docs/route_authentication.md)                | 前端路由守卫实现         |

---

# 🌟 贡献指南

欢迎贡献代码与想法：

1. 打开 issue 讨论想法
2. Fork 仓库
3. 创建功能分支
4. 提交 Pull Request

详情请查看 [LICENSE](./LICENSE) 文件。
