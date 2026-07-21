# PawHaven 文档索引

> 所有项目文档的统一入口

---

## 1. 产品策略

| 文件                                                                           | 说明                                                             |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| [PawHaven-Product-Strategy.md](./PawHaven-Product-Strategy.md)                 | 完整产品蓝图 v2.0 — 动物生命周期、角色模型、功能地图、MVP 路线图 |
| [PawHaven-Product-Strategy-EN.md](./PawHaven-Product-Strategy-EN.md) (English) | 英文版产品策略                                                   |

**核心内容**：从发现→救助→医疗→领养的完整协作流程，用户角色定义（发现者 / 救助者 / 领养者 / 诊所），核心功能矩阵，分阶段交付计划。

---

## 2. 系统架构

| 文件                                                                           | 说明                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [PawHaven-System-Architecture-CN.md](./PawHaven-System-Architecture-CN.md)     | 系统架构设计 v2.0 — 服务拆分、模块化单体、部署拓扑、数据流 |
| [PawHaven-System-Architecture.md](./PawHaven-System-Architecture.md) (English) | 英文版系统架构                                             |

**核心内容**：Monorepo 结构（`apps/backend/*` + `apps/frontend/*` + `packages/*` + `libs/*`），务实服务拆分哲学，core-service 模块化单体设计，API Gateway 路由规则，服务间通信模式。

---

## 3. Figma 设计稿规约

| 文件                                           | 说明                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| [figma-design-spec.md](./figma-design-spec.md) | 基于 `pawhaven.figma.site` 的完整页面设计分析 — 8 个 section 的布局、交互、视觉细节 |

**核心内容**：Nav / Hero / Rescue Cases / Adoptable Pets / Happy Endings / Knowledge Base / CTA Banner / Footer 逐段描述，响应式断点行为，设计原则。

---

## 4. 设计系统

| 文件                                                               | 类型               | 说明                                                          |
| ------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------- |
| [design-system.html](../packages/design-system/design-system.html) | HTML（浏览器打开） | 可视化设计系统 — 颜色、字体、布局、图标、图片均以实际样式渲染 |
| [tokens/](../packages/design-system/src/tokens/)                   | CSS                | 12 组设计 Token CSS 变量文件                                  |
| [theme.css](../packages/design-system/src/theme.css)               | CSS                | 全局主题定义                                                  |
| [utilities.css](../packages/design-system/src/utilities.css)       | CSS                | 工具类样式                                                    |
| [src/](../packages/design-system/src/)                             | TypeScript         | 设计系统源码                                                  |

**核心内容**：`#f7823a` 暖橙主色、Fraunces + Plus Jakarta Sans 字体体系、Badge / Button / Card 组件规范、Lucide 图标映射、Unsplash 图片尺寸标准。

---

## 5. 认证授权

| 文件                                                               | 说明                                                                                     |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [authentication_architecture.md](./authentication_architecture.md) | Auth 架构全貌 — Cookie-based JWT 流、Gateway JWT Guard、Token Refresh 机制、微服务信任链 |
| [route_authentication.md](./route_authentication.md)               | 前端路由鉴权 — RequireAuth 组件、`/auth/me` 验证流程、公开路由声明                       |

**核心内容**：`gateway` 统一 JWT 校验 + 主动刷新，`auth-service` 负责签发/轮换，`httpOnly` cookie 安全策略，前端通过 gateway 注入头获取用户身份。

---

## 6. 工程规范

| 文件                                           | 说明                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| [project_standards.md](./project_standards.md) | 项目规范 — ESLint 维护、代码分层、依赖方向、Git 工作流 |

---

## 7. 功能计划

| 文件                                 | 说明                                                    |
| ------------------------------------ | ------------------------------------------------------- |
| [feature_plan.md](./feature_plan.md) | 各模块功能清单 — 基础设施、认证、动物管理、搜索、社区等 |

---

## 8. 关键项目文件

| 文件                                          | 说明                                                            |
| --------------------------------------------- | --------------------------------------------------------------- |
| [AGENTS.md](../AGENTS.md)                     | AI Agent 开发规范 — 分层约束、Auth 架构说明、操作原则、验证命令 |
| [README.MD](../README.MD)                     | 项目英文 README                                                 |
| [READMECN.MD](../READMECN.MD)                 | 项目中文 README                                                 |
| [package.json](../package.json)               | Monorepo 根配置（pnpm workspace）                               |
| [turbo.json](../turbo.json)                   | Turborepo 构建编排配置                                          |
| [pnpm-workspace.yaml](../pnpm-workspace.yaml) | pnpm workspace 声明                                             |

---

## 9. 资源文件

| 目录                 | 说明             |
| -------------------- | ---------------- |
| [images/](./images/) | 文档内嵌图片资源 |

---

## 文档关系图

```
PawHaven-Product-Strategy.md ──────────────────────┐
  （产品蓝图 v2.0）                                  │
                                                    ├──→ PawHaven-System-Architecture.md
                                                    │      （基于产品策略的系统架构）
                                                    │
figma-design-spec.md ───────────────────────────────┤
  （Figma 页面分析）                                 │
                                                    ├──→ design-system.html
                                                    │      （设计 Token 与组件规范）
authentication_architecture.md ─────────────────────┤
  （Auth 架构全貌）                                  │
                                                    ├──→ route_authentication.md
                                                    │      （前端路由鉴权实现）
project_standards.md ───────────────────────────────┤
  （代码规范）                                       │
                                                    ├──→ feature_plan.md
                                                    │      （功能开发计划）
                                                    │
AGENTS.md ──────────────────────────────────────────┘
  （AI Agent 开发约束）
```

> **建议阅读顺序**：产品策略 → 系统架构 → Figma 设计 → 设计系统 → Auth 架构 → 工程规范
