# PawHaven 文档索引

> 所有项目文档的统一入口

---

## 1. 产品策略

| 文档                                                                 | 说明                                                                 |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [PawHaven-Product-Strategy-EN.md](./PawHaven-Product-Strategy-EN.md) | 完整产品蓝图 v2.0 — 动物生命周期、用户画像模型、功能地图、MVP 路线图 |

**核心内容**：完整协作流程 — 第 1 步发现 → 第 2 步救援 → 第 3 步医疗 → 第 4 步领养，用户角色定义（报告者 / 救援者 / 领养者 / 诊所），核心功能矩阵，分阶段交付计划。

---

## 2. 系统架构

| 文档                                                                                   | 说明                                                       |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [PawHaven-System-Architecture.md](./PawHaven-System-Architecture.md)                   | 系统架构设计 v2.0 — 服务拆分、模块化单体、部署拓扑、数据流 |
| [PawHaven-System-Architecture-Overview.md](./PawHaven-System-Architecture-Overview.md) | 系统架构 v3.0 — 5 个服务、API 网关路由、事件目录、数据架构 |
| [ADR/](./ADR/)                                                                         | 架构决策记录 — 记录决策的**原因**，而不仅仅是**结果**      |

**核心内容**：Monorepo 结构（`apps/backend/*` + `apps/frontend/*` + `packages/*` + `libs/*`），务实的服务拆分理念，core-service 内的模块化单体设计，API 网关路由规则，服务间通信模式。

---

## 3. Figma 设计规范

| 文档                                           | 说明                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| [figma-design-spec.md](./figma-design-spec.md) | 基于 `pawhaven.figma.site` 的完整页面设计分析 — 8 个区块的布局、交互和视觉细节 |

**核心内容**：Nav / Hero / 救援案例 / 可领养宠物 / 幸福结局 / 知识库 / CTA 横幅 / 页脚的分区块描述，响应式断点行为，设计原则。

---

## 4. 设计系统

| 文档                                                               | 类型                   | 说明                                                          |
| ------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| [design-system.html](../packages/design-system/design-system.html) | HTML（在浏览器中打开） | 视觉设计系统 — 颜色、排版、布局、图标和图片，使用实际样式渲染 |
| [tokens/](../packages/design-system/src/tokens/)                   | CSS                    | 12 个设计 token CSS 变量文件                                  |
| [theme.css](../packages/design-system/src/theme.css)               | CSS                    | 全局主题定义                                                  |
| [utilities.css](../packages/design-system/src/utilities.css)       | CSS                    | 工具类                                                        |
| [src/](../packages/design-system/src/)                             | TypeScript             | 设计系统源代码                                                |

**核心内容**：`#f7823a` 暖橙色主色，Fraunces + Plus Jakarta Sans 字体系统，Badge / Button / Card 组件规范，Lucide 图标映射，Unsplash 图片尺寸标准。

---

## 5. 认证

| 文档                                                               | 说明                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [authentication-architecture.md](./authentication-architecture.md) | 认证架构概述 — 基于 Cookie 的 JWT 流程、Gateway JWT Guard、Token Refresh 机制、微服务信任链 |
| [route_authentication.md](./route_authentication.md)               | 前端路由级认证 — RequireAuth 组件、`/auth/me` 验证流程、公开路由声明                        |

**核心内容**：`gateway` 统一 JWT 验证 + 主动刷新，`auth-service` 处理签发/轮换，`httpOnly` Cookie 安全策略，前端通过网关注入的头部获取用户身份。

---

## 6. 工程标准

| 文档                                           | 说明                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| [project_standards.md](./project_standards.md) | 项目标准 — ESLint 维护、代码分层、依赖方向、Git 工作流 |

---

## 7. 功能工作流

> 每个功能一个端到端工作流文档。pawhaven 在构建功能时加载相关文档。

| 文档                                                                                           | 功能                               | MVP |
| ---------------------------------------------------------------------------------------------- | ---------------------------------- | --- |
| [feature-workflows/README.md](./feature-workflows/README.md)                                   | 所有功能工作流索引 + 功能→模块映射 | —   |
| [feature-workflows/01-auth.md](./feature-workflows/01-auth.md)                                 | 认证与授权                         | P0  |
| [feature-workflows/02-report-animal.md](./feature-workflows/02-report-animal.md)               | 报告流浪动物                       | P0  |
| [feature-workflows/03-rescue-case.md](./feature-workflows/03-rescue-case.md)                   | 救援案例生命周期                   | P0  |
| [feature-workflows/04-volunteer.md](./feature-workflows/04-volunteer.md)                       | 志愿者网络与案例认领               | P0  |
| [feature-workflows/05-adoption.md](./feature-workflows/05-adoption.md)                         | 领养                               | P1  |
| [feature-workflows/06-rescue-stories.md](./feature-workflows/06-rescue-stories.md)             | 救援故事                           | P2  |
| [feature-workflows/07-knowledge-base.md](./feature-workflows/07-knowledge-base.md)             | 知识库                             | P2  |
| [feature-workflows/08-notifications.md](./feature-workflows/08-notifications.md)               | 通知                               | P0  |
| [feature-workflows/09-profile-achievements.md](./feature-workflows/09-profile-achievements.md) | 个人资料与成就                     | P1  |
| [feature-workflows/10-homepage-discovery.md](./feature-workflows/10-homepage-discovery.md)     | 首页与发现                         | P0  |
| [feature-workflows/11-bootstrap.md](./feature-workflows/11-bootstrap.md)                       | 引导与服务器驱动路由               | P0  |

---

## 8. 关键项目文件

| 文件                                          | 说明                                                           |
| --------------------------------------------- | -------------------------------------------------------------- |
| [pawhaven.md](./agents/pawhaven.md)           | AI Agent 编排规则 — 复杂度分类、工作流选择、代理调度、操作原则 |
| [README.MD](../README.MD)                     | 项目 README（英文）                                            |
| [READMECN.MD](../READMECN.MD)                 | 项目 README（中文）                                            |
| [package.json](../package.json)               | Monorepo 根配置（pnpm workspace）                              |
| [turbo.json](../turbo.json)                   | Turborepo 构建编排配置                                         |
| [pnpm-workspace.yaml](../pnpm-workspace.yaml) | pnpm workspace 声明                                            |

---

## 文档关系图

```
PawHaven-Product-Strategy-EN.md ───────────────────────┐
  (产品蓝图 v2.0)                                       │
                                                        ├──→ PawHaven-System-Architecture.md
                                                        │      (基于产品策略的架构设计)
                                                        │
figma-design-spec.md ───────────────────────────────────┤
  (Figma 页面分析)                                      │
                                                        ├──→ design-system.html
                                                        │      (设计 token 与组件规范)
                                                        │
authentication-architecture.md ─────────────────────────┤
  (认证架构)                                            │
                                                        ├──→ route_authentication.md
                                                        │      (前端路由认证实现)
                                                        │
project_standards.md ───────────────────────────────────┤
  (代码标准)                                            │
                                                        ├──→ feature-workflows/ (01-auth … 11-bootstrap)
                                                        │      (按功能构建工作流)
                                                        │
pawhaven.md ───────────────────────────────────────────┘
  (AI Agent 编排)

ADR/ ───────────────────────────────────────────────────┐
  (架构决策记录)
```

> **建议阅读顺序**：第 1 步 产品策略 → 第 2 步 系统架构 → 第 3 步 Figma 设计 → 第 4 步 设计系统 → 第 5 步 认证架构 → 第 6 步 工程标准 → 第 7 步 功能工作流（构建时加载相关功能文档）→ 第 8 步 ADR（了解架构背景）
