[English](./README.md) | [中文](./README.cn.md)

# 🐾 PawHaven - 流浪动物救援与领养平台

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

# 🛠 环境准备

- **Node.js**: `24.x`
- **pnpm**: `12.x`

安装依赖或运行项目前，请确保满足以上版本要求。

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

**`.opencode/`** 是 PawHaven 背后的 **AI 驱动开发引擎** —— 一个 Agent 编排器，将每个开发请求转化为结构化流水线：`规划 → 分发 Agent → 测试验证 → 对照架构与模式审查 → 知识更新`。

👉 [进入 harness](./.opencode/) —— 7 个 skill、5 个斜杠命令工作流、9 个 agent,以及它们强制的项目规则

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

文档在 [`docs/`](./docs/README.md)，按每份文档的**用途**分类：`context/`（一次改动应该长什么样、
各单元怎么组合）、`features/`（单个 feature 的前后端细节）、`product/`（`features/` 引用的蓝图）、
`how-i-build/`（design system 与组件库背后的设计理由）。

> ⚠️ `docs/features/` 是**蓝图，不是现状** —— 11 个 feature 中有 7 个写到的后端模块并不存在，
> 其中的领域事件在后端代码里一次都没出现。

### 我怎么搭的

| 文档                                                       | 说明                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [全局架构](./docs/context/system-architecture-overview.md) | 整个系统 —— 服务、包、数据流、部署                              |
| [前端架构](./docs/context/frontend-architecture.md)        | 前端各单元，以及它们之间的依赖方向                              |
| [后端架构](./docs/context/backend-architecture.md)         | 后端各服务与包，以及它们之间的依赖关系                          |
| [Design Token 体系](./docs/how-i-build/design-tokens.md)   | 为什么需要 design system、token 分层怎么建、lint 插件怎么守住它 |
| [UI Library 体系](./docs/how-i-build/ui-library.md)        | `@pawhaven/ui` 是什么、周围有哪些质量门禁、怎么浏览和检索组件   |

---

# 🧑‍💻 本地开发

本地开发请见 [docs/context/development.md](./docs/context/development.md)。

---

# 🌟 贡献指南

欢迎贡献代码与想法：

1. 打开 issue 讨论想法
2. Fork 仓库
3. 创建功能分支
4. 提交 Pull Request

详情请查看 [LICENSE](./LICENSE) 文件。
