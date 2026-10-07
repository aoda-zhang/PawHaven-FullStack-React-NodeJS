# PawHaven 文档索引

> 全部项目文档的统一入口。英文版见 [README.md](./README.md)。

`docs/` 按文档的**用途**划分，因此从路径就能判断一份文档是权威依据、意图说明，还是背景材料。

| 目录            | 内容                                           | 何时阅读                       |
| --------------- | ---------------------------------------------- | ------------------------------ |
| `architecture/` | **本项目**的一个技术要点，或某个具体问题的设计 | 准备设计或改动该领域之前       |
| `features/`     | 一个门户功能的**前端 + 后端**实现现状          | 改动落地后，据代码回填记录     |
| `product/`      | `features/` 引用的产品蓝图                     | 需要功能背后的"为什么"或路线图 |

设计 token **不在此处文档化**。它们在
[`packages/design-system/src/tokens/`](../packages/design-system/src/tokens)，并由
`pnpm token-check` 强制。请直接读 token 源文件，不要读它的散文副本。

---

## `features/` 描述运行中的系统，且在代码之后编写

`features/` 的每份文档描述**已存在的东西**。产品蓝图承诺得更多时，差距写在文档的 **What Does
Not Exist** 一节里，而不是留给读者自行发现。[`product/`](./product/PawHaven-Product-Strategy-EN.md)
保存完整愿景，每份功能文档回链到它所在的章节。

每份文档对应 `apps/frontend/portal/src/features/*` 下的一个目录，第 1 章即为该页面的编号小节。
没有独立功能目录的后端模块，写在使用它的页面文档中。

**先读代码，再读它们。** 功能文档的准确度截至上一次与代码对齐的改动，所以它是待更新的记录，
而不是据以设计的来源。文档与代码冲突时，以代码为准，文档才是过时的那个。

阅读任何一份之前先了解一个结构性事实：**`animalReports` 既是上报也是案件。** 不存在
`rescue_cases` 表，也不存在创建它的事件。

---

## 1. 架构

本项目的一个技术要点，或某个问题的设计。这些是设计任何东西之前应当先读的文档。

| 文件                                                                                                | 覆盖内容                                                                         |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [PawHaven-System-Architecture-Overview.md](./architecture/PawHaven-System-Architecture-Overview.md) | 总纲。服务拆分、C4 模型、数据架构、API 网关、安全、部署、设计决策                |
| [PawHaven-Backend-Architecture.md](./architecture/PawHaven-Backend-Architecture.md)                 | `core-service` 模块化单体、以 NestJS 模块表达的限界上下文、服务间通信            |
| [PawHaven-Frontend-Architecture.md](./architecture/PawHaven-Frontend-Architecture.md)               | 基于功能的模块结构、状态、路由、token、i18n                                      |
| [authentication-architecture.md](./architecture/authentication-architecture.md)                     | **鉴权信任模型。** 网关持有浏览器 cookie、内部 ES256 JWT、下游校验、`roles` 声明 |
| [route_authentication.md](./architecture/route_authentication.md)                                   | 前端路由守卫：受保护的父路由、`requireUser`、`/auth/me` 预热                     |
| [PawHaven-PDF-Generation.md](./architecture/PawHaven-PDF-Generation.md)                             | 为什么 PDF 走 React + Puppeteer 而不是模板库,以及由此产生的约束                  |
| [PawHaven-System-Architecture.md](./architecture/PawHaven-System-Architecture.md)                   | 拆分前文档的旧链接重定向表,本身无内容                                            |
| [service-boundaries.md](./architecture/service-boundaries.md)                                       | 后端服务边界:四个服务、鉴权边界、请求/响应形状                                   |

涉及鉴权时,`authentication-architecture.md` 与 `route_authentication.md` 是一对:前者讲服务端信任
边界,后者讲客户端路由守卫。

## 2. 功能

每个**门户功能目录**(`apps/frontend/portal/src/features/*`)一份文档,覆盖该功能的前后端两侧。
文档内部,第 1 章把页面拆成编号小节(1.1、1.2、1.3 ……),后续章节讲其下的数据通路。

没有独立功能目录的后端模块,写在使用它的页面文档中——`adoption` 在
[Home](./features/02-home.md#4-adoptable-pets-read-only),`animal-follow` 在
[Rescue Detail](./features/05-rescue-detail.md#14-follow)。

| 文件                                                              | 门户功能               | 路由                            |
| ----------------------------------------------------------------- | ---------------------- | ------------------------------- |
| [README.md](./features/README.md)                                 | 索引、服务映射、缺陷表 | —                               |
| [01-auth.md](./features/01-auth.md)                               | `auth`                 | `/auth/login`、`/auth/register` |
| [02-home.md](./features/02-home.md)                               | `home`                 | `/`                             |
| [03-report-animal.md](./features/03-report-animal.md)             | `report-animal`        | `/report-animal`                |
| [04-rescue-cases.md](./features/04-rescue-cases.md)               | `rescue-cases`         | `/rescue-cases`                 |
| [05-rescue-detail.md](./features/05-rescue-detail.md)             | `rescue-detail`        | `/rescue/detail/:animalID`      |
| [06-rescue-guide.md](./features/06-rescue-guide.md)               | `rescue-guide`         | `/rescue/guides`                |
| [07-app-shell-bootstrap.md](./features/07-app-shell-bootstrap.md) | _(无——`layout/`)_      | 包裹全部路由                    |

每份文档都与代码核对过,并各自记录两类缺失:**What Does Not Exist** 记录设计层面的缺口,索引中的
_Known defects_ 表记录实现与自身约定相矛盾之处——一个从不落库的必填字段、一段只是投影而非历史的
时间线、一个被 13 条死链共同指向的 `NotFound`。

## 3. 产品

| 文件                                                                         | 覆盖内容                                                    |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [PawHaven-Product-Strategy-EN.md](./product/PawHaven-Product-Strategy-EN.md) | 产品蓝图 v2.0——动物生命周期、角色画像、功能地图、MVP 路线图 |

## 4. 设计系统——是源码,不是文档

| 路径                                                                           | 类型 | 说明                         |
| ------------------------------------------------------------------------------ | ---- | ---------------------------- |
| [src/tokens/](../packages/design-system/src/tokens)                            | CSS  | 12 个设计 token CSS 变量文件 |
| [src/theme.css](../packages/design-system/src/theme.css)                       | CSS  | 全局主题定义                 |
| [src/utilities.css](../packages/design-system/src/utilities.css)               | CSS  | 工具类                       |
| [scripts/build-tokens.mjs](../packages/design-system/scripts/build-tokens.mjs) | JS   | token 构建脚本               |

由 `pnpm token-check` 强制。项目在 token 之上使用 Tailwind 语义化工具类,不要引入裸色值或魔数。

## 5. 开发

本地把项目跑起来的操作文档,不是设计材料。

| 文件                                     | 覆盖内容                                      |
| ---------------------------------------- | --------------------------------------------- |
| [development.md](./development.md)       | 前置条件、构建顺序、开发服务与端口、pnpm 脚本 |
| [development.cn.md](./development.cn.md) | 同一指南的中文版,与英文版保持同步             |

## 6. Agent harness

Agent 控制层在 `.pi/`,不在这里。

| 路径                               | 覆盖内容                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| [.pi/README.md](../.pi/README.md)  | 技能、工作流、策略、模型注册表与 9 个 subagent 的索引                          |
| [.pi/workflows/](../.pi/workflows) | 斜杠命令工作流                                                                 |
| [.pi/policies/](../.pi/policies)   | 跨工作流的稳定规则:验证、失败、契约、人工门                                    |
| [AGENTS.md](../AGENTS.md)          | 硬约束——git、代码、派发、汇报;harness 地图见 [.pi/README.md](../.pi/README.md) |

`pnpm pi-check` 校验 harness。`.opencode/` 与 `.codebuddy/` 两层已退役,指向它们的链接是死链。

---

## 7. 文档规范

- **先读代码,最后写文档。** 架构文档与代码是输入,`docs/features/` 是输出,在被改动否决的同一个变更里更新。功能文档永远不是决策的输入。
- **不写 ADR。** 决策改变架构时,直接更新 `docs/architecture/` 下的现存文档。
- **代码注释解释为什么,不解释做了什么。** 默认不写;永远不要给自明的代码加注释。
- **永久文档放在 `docs/`**,与使其过时的代码在同一个变更里发布。进度写在回复里——没有临时笔记文件。
- **每次交接都要给 Doc Impact 分类**,取值为 `none` / `update` / `create`;由主会话把文档改动路由给做出该改动的 lane。
- **根 README(EN ↔ CN)保持同步**,并引用全部知识文件。Agent 控制层是 `.pi/`。

## 8. 仓库质量

仓库的质量记录——哪些是健康的、哪些债务被接受、哪些不变量是机械强制的——在
[`quality/README.md`](./quality/README.md)。`pnpm quality-check` 扫描孤立文档、对已退役资源的引用、
重复规则候选,并汇总 `architecture-check` 与 `check:links`。

## 建议阅读顺序

三份架构文档,然后是代码,最后——在改动被验证之后——才是功能文档。

```
PawHaven-System-Architecture-Overview.md
  → PawHaven-Frontend-Architecture.md  |  PawHaven-Backend-Architecture.md
    (+ authentication-architecture.md / route_authentication.md，鉴权在范围内时)
  → apps/ 与 packages/ 下的代码
  → 按实际落地的内容更新 docs/features/<feature>.md
```

**先验证再相信。** 架构文档带有 `v3.11 / 2026-09-25` 时间戳,是在那个时点与代码核对过的。功能文档
的准确度截至上一次与代码对齐的改动。
