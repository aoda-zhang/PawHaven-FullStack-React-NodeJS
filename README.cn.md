[English](./README.md) | [中文](./README.cn.md)

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

| 依赖项       | 版本 / 说明                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| **Node.js**  | `24.x` —— 由 `.nvmrc` 与 `engines.node` 锁定，CI 在运行时读取该字段                         |
| **pnpm**     | `12.x` —— `packageManager: pnpm@12.4.1`，可用 `corepack enable && corepack install` 启用    |
| **MongoDB**  | 需要一个可连接的实例；`core-service`、`auth-service`、`document-service` 各自使用独立连接串 |
| **Chromium** | 由 `puppeteer` 提供 —— `document-service` 运行时会启动无头 Chromium 渲染 PDF                |

继续前先确认工具链：

```bash
node -v   # v24.x
pnpm -v   # 12.x
```

---

# 📦 安装步骤

### 1. 克隆并安装依赖

```bash
git clone https://github.com/aoda-zhang/PawHaven-Enterprise-FullStack-React-NestJS.git
cd PawHaven-Enterprise-FullStack-React-NestJS
pnpm install
```

`pnpm install` 会触发 `core-service` 与 `auth-service` 的 Prisma `postinstall` 钩子。若跳过了它，或生成的 client 已过期，请显式重新生成：

```bash
pnpm --filter @pawhaven/core-service --filter @pawhaven/auth-service prisma:generate-mongodb
```

### 2. 生成共享的内部 JWT 密钥对

所有服务共用**同一对** ES256（P-256）密钥：网关签发短时效内部 JWT，下游服务负责验签。每个服务各自生成密钥会导致跨服务验签失败（网关用 A 签，验签方却拿 B 验）。

```bash
node scripts/generate-internal-jwt-keys.mjs
```

脚本输出两个 base64 编码的 PEM 值，填入对应服务的环境变量：

| 变量                       | 需要配置的服务                                               |
| -------------------------- | ------------------------------------------------------------ |
| `INTERNAL_JWT_PRIVATE_KEY` | `gateway`、`core-service`（签发方）                          |
| `INTERNAL_JWT_PUBLIC_KEY`  | `auth-service`、`core-service`、`document-service`（验签方） |

### 3. 创建环境变量文件

每个应用会按 `.env.local.<env>` → `.env.<env>` → `.env.local` → `.env` 的顺序从自身目录加载，叠加在 `src/config/<env>/env/index.json` 之上。复制仓库自带的示例并填写：

```bash
for app in gateway core-service auth-service document-service; do
  cp "apps/backend/$app/.env.example" "apps/backend/$app/.env"
done
cp apps/frontend/portal/.env.example apps/frontend/portal/.env
```

| 变量                                                                         | 所属应用                                             | 用途                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| `CORE_SERVICE_MONGODB` / `AUTH_SERVICE_MONGODB` / `DOCUMENT_SERVICE_MONGODB` | `core-service` / `auth-service` / `document-service` | MongoDB 连接串                          |
| `CORE_SERVICE_DB`                                                            | `gateway`                                            | Session 存储连接串                      |
| `JWT_SECRET`                                                                 | `gateway`、`auth-service`                            | 签发/校验浏览器会话 JWT                 |
| `AUTH_PRIVATEKEY`                                                            | `gateway`                                            | 网关侧鉴权密钥                          |
| `CORE_SERVICE_HOST` / `AUTH_SERVICE_HOST` / `DOCUMENT_SERVICE_HOST`          | `gateway`（`core-service` 也需配置 auth 主机）       | 上游服务地址                            |
| `INTERNAL_JWT_PRIVATE_KEY` / `INTERNAL_JWT_PUBLIC_KEY`                       | 见上表                                               | 服务间内部 ES256 JWT                    |
| `PAWHAVEN_USER_API_BASE_URL`                                                 | `portal`                                             | 网关地址（`http://localhost:8080/api`） |

### 4. 构建，然后启动

```bash
pnpm build:local   # 先构建 packages/*，再构建所有应用 —— 首次启动前务必执行
pnpm dev:local     # 清理占用开发端口的残留进程，再以监听模式启动全部服务
```

应用消费的是 `packages/*` 的**构建产物**而非源码，因此**改动 `packages/` 下任何内容后都要重新执行 `pnpm build:local`**。

启动后可访问：

| 应用             | 地址                           |
| ---------------- | ------------------------------ |
| Portal（前端）   | http://localhost:3001          |
| Gateway          | http://localhost:8080          |
| core-service     | http://localhost:8081/api-docs |
| auth-service     | http://localhost:8082/api-docs |
| document-service | http://localhost:8083/api-docs |

每个服务都挂载了 Swagger UI（`/api-docs`），但 `NODE_ENV=production` 时会关闭。

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

# 💡 使用示例

### 走一遍前端页面

先执行 `pnpm dev:local`，再打开 http://localhost:3001。

| 页面         | 路由                       | 认证要求 |
| ------------ | -------------------------- | -------- |
| 首页         | `/`                        | 公开     |
| 登录         | `/auth/login`              | 公开     |
| 注册         | `/auth/register`           | 公开     |
| 救援指南     | `/rescue/guides`           | 公开     |
| 救援案例列表 | `/rescue-cases`            | 公开     |
| 案例详情     | `/rescue/detail/:animalID` | 公开     |
| 上报动物     | `/report-animal`           | 需登录   |

Vite 开发服务器会把 `/api` 代理到 `http://localhost:8080` 的网关，因此前端只与网关通信。

### 通过网关调用 API

网关是唯一入口，会把不同前缀重写到对应服务：

| 对外前缀        | 目标服务                 |
| --------------- | ------------------------ |
| `/api/core`     | `core-service` :8081     |
| `/api/auth`     | `auth-service` :8082     |
| `/api/document` | `document-service` :8083 |

认证基于 Cookie：`POST /api/auth/login` 会写入 `access_token` 与 `refresh_token`，后续请求携带即可。

```bash
# 1. 注册 —— 响应返回用户信息，会话以 Cookie 形式写入
curl -c cookies.txt -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"volunteer@example.com","password":"Str0ng!Passw0rd"}'

# 2. 读取网关为该会话解析出的身份
curl -b cookies.txt http://localhost:8080/api/auth/me

# 3. 上报一条救援案例（需认证）
curl -b cookies.txt -X POST http://localhost:8080/api/core/rescues \
  -H 'Content-Type: application/json' \
  -d '{
        "animalType": "cat",
        "age": "baby",
        "locationObj": { "address": "Green Park, north entrance", "latitude": 31.2304, "longitude": 121.4737 },
        "description": "Injured stray kitten, cannot walk",
        "size": "small",
        "animalCount": 1,
        "appearance": { "color": "orange" },
        "reporterPhotos": []
      }'

# 4. 查询案例列表 —— 公开接口，可选过滤条件
curl 'http://localhost:8080/api/core/rescues?status=PENDING&limit=10'

# 5. 刷新会话，然后登出
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/auth/refresh
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/auth/logout
```

同样的调用方式还可用于：

| 方法   | 路径                                 | 说明                         |
| ------ | ------------------------------------ | ---------------------------- |
| `POST` | `/api/auth/login`                    | 请求体：`email`、`password`  |
| `GET`  | `/api/auth/volunteer-count`          | 公开                         |
| `POST` | `/api/auth/volunteer/opt-in`         | 需认证                       |
| `POST` | `/api/core/report-animal`            | 请求体：`AnimalReportSchema` |
| `GET`  | `/api/core/rescues/:id`              | 案例详情                     |
| `GET`  | `/api/core/rescues/:id/photo/:index` | 流式返回上报照片             |
| `POST` | `/api/document/pdf/download`         | 生成 PDF（依赖 Chromium）    |
| `POST` | `/api/document/email/send`           | 发送模板邮件                 |

### 跑一遍校验

```bash
pnpm typecheck      # 对所有工作区执行 tsc --noEmit
pnpm lint           # eslint —— 请先与既有基线对比，再判定是否为新增回归
pnpm test           # vitest 单元 / 集成测试
pnpm test:e2e       # Playwright，会自动拉起 http://localhost:3001 的 portal
```

提 PR 前还建议执行：`pnpm token-check`、`pnpm architecture-check`、`pnpm quality-check`、`pnpm harness:verify`。

---

# 🤖 AI Driver

**`harness-core/`** 是 PawHaven 背后的 **AI 驱动开发引擎** —— 一个 Agent harness，将每个开发请求转化为结构化流水线：`分类 → 规划 → 分发执行通道 → 验证 → 对照架构与模式审查 → 更新文档`。

👉 [进入 harness](./harness-core/README.md) —— 9 个 capability、16 个 skill、12 个 workflow、4 条 rule 与 9 个 agent。由 `pnpm harness:verify` 校验。

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

文档在 [`docs/`](./docs/README.md)，按每份文档的**用途**分类：`architecture/`（某个技术点或某个问题
在本项目里的设计）、`features/`（单个 feature 的前后端细节）、`product/`（`features/` 引用的蓝图）。

> `docs/features/` 是**现状**记录 —— 每个 portal feature 目录一份文档，均已对照代码核实。设计缺口
> 就地记在各 feature 文档中，「实现了但与自身契约矛盾」的
> [已知缺陷](./docs/features/README.md#known-defects-in-the-code) 汇总在索引表里。
> feature 文档只准确到「上一次把它和代码对齐的那个 commit」为止，所以流程先读架构文档和代码，
> 最后才回写它。

### 产品与架构

| 文档                                                                     | 说明                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------- |
| [产品策略](./docs/product/PawHaven-Product-Strategy-EN.md) (英文)        | 完整产品全景设计 — 7 个模块、用户画像、价值闭环、路线图 |
| [系统架构](./docs/architecture/PawHaven-System-Architecture-Overview.md) | 4 服务架构、模块化单体、C4、网关、安全、设计决策        |
| [设计系统](./packages/design-system/README.md)                           | Design tokens、Tailwind v4 主题、CSS 工具类             |

### 认证一览

浏览器 JWT / Cookie 只由 **网关** 持有。网关按请求解析调用者身份（F1–F4）、必要时刷新，并针对目标服务签发一个短时效的 **ES256 内部 JWT**，写入 `x-gateway-jwt` 头。下游服务永远看不到浏览器 token —— 由全局 `InternalJwtGuard` 校验内部 JWT（fail-closed），handler 通过 `@InternalJwt()` 读取身份，端点策略用 `@Public()` / `@OptionalAuth()` / 默认需认证表达。

→ 完整细节见 [身份认证与授权架构](./docs/architecture/authentication-architecture.md)。

### 工程

| 文档                                                                     | 说明                                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [AGENTS.md](./AGENTS.md) · [Harness](./harness-core/README.md)           | 每个 agent 必须遵守的硬约束，以及强制它们的 agent harness                   |
| [身份认证与授权架构](./docs/architecture/authentication-architecture.md) | 网关持有的 Cookie JWT + 内部 ES256 JWT（InternalJwt）服务认证,`roles` claim |
| [路由级认证](./docs/architecture/route_authentication.md)                | 前端路由守卫实现                                                            |

---

# 🧑‍💻 本地开发

本地开发请见 [docs/development.cn.md](./docs/development.cn.md)。

---

# 🌟 贡献指南

欢迎任何形式的贡献 —— 缺陷报告、功能开发、文档改进与架构讨论。

### 1. 先从 issue 开始

非琐碎改动请先开 issue 对齐方案。涉及架构的改动，请先读 [`docs/architecture/`](./docs/architecture/) —— 那里定义了代码需要守住的边界。

### 2. Fork、建分支、提交

```bash
git checkout -b feat/rescue-case-filters
```

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`<type>(<scope>): <description>`

- **类型**：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`
- **常用 scope**：`auth`、`rescue`、`pdf`、`email`、`home`、`stats`、`docs`、`chore`

Husky 在 `commit-msg` 阶段执行 commitlint，不合规的提交会被拒绝。一个 commit 只描述一处逻辑改动。`harness-core/`、`adapters/`、`validation/` 的改动使用 `docs(harness): …` 或 `chore(harness): …`，且必须单独提交，不混在功能改动里。

### 3. 提 PR 前先过质量门禁

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI（`.github/workflows/test.yml`）同样跑这四步，再跑 Playwright。注意 `pnpm lint` 在干净分支上也会因**既有基线**而返回非 0 —— 请先与基线对比，不要顺手"修"一个并非你引入的历史问题。

如果改动涉及共享包，另外执行 `pnpm token-check`、`pnpm architecture-check` 和 `pnpm build:local`，让下游应用拿到新产物。

### 4. 遵守项目约束

完整约束见 [`AGENTS.md`](./AGENTS.md)，以下是最容易踩的几条：

- 类型与 Zod schema 放在 `packages/shared`，面向用户的文案放在 `packages/i18n`（`en-US`、`zh-CN`、`de-DE` 三者同步更新）。
- 样式一律走 `@pawhaven/design-system` 的 token —— 不写死颜色、不用 `style={{}}`、不出现魔法数字；`pnpm token-check` 会校验 token。
- 业务数值（上限、配额、分页大小）来自配置并通过 `getOrThrow` 读取 —— 启动时快速失败，禁止在源码里写带默认值的字面量。
- 测试用 Vitest，与源码同目录放置为 `foo.test.ts`。React 19 不再需要 `forwardRef`，直接在 props 声明 `ref?: Ref<T>`。
- **文档最后写，且以代码为准。** 若改动了某个 portal feature，请在同一个改动里同步更新 `docs/features/*.md`。

### 5. 提交 Pull Request

请说明改动内容，以及你用来验证它的具体命令 —— "应该能跑"不算验证。所有改动在合并前都会经过独立评审。

💬 有疑问欢迎来 [Discord](https://discord.gg/znnG258E) 讨论。

---
