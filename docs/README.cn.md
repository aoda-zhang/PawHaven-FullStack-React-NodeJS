# PawHaven 文档索引

> 所有项目文档的统一入口。

`docs/` 按文档的**用途**分类，因此从路径就能判断它是权威依据、设计意图，还是背景材料。

| 目录            | 内容                                      | 何时读                                |
| --------------- | ----------------------------------------- | ------------------------------------- |
| `architecture/` | 某个技术点、或某个问题在本项目里的设计    | 你要在该领域做设计或改动时            |
| `features/`     | 单个 feature 的前端**与**后端细节（现状） | 改动落地后，从代码回写记录            |
| `product/`      | `features/` 所引用的上游产品蓝图          | 你需要某个 feature 的由来，或查路线图 |

设计 token **刻意不写进文档**。它们位于
[`packages/design-system/src/tokens/`](../packages/design-system/src/tokens)，并由 `pnpm token-check`
强制校验。请读 token 源码，不要读它的散文副本。

---

## `features/` 描述的是系统现状 —— 但它在代码之后写

`features/` 下每份文档都是**现状**描述 —— 章节标题、端点、字段都以仓库里真实存在的东西为准。
设计意图不混在里面：缺口就地记在每篇的 _What Does Not Exist_，而「实现了但与自身契约矛盾」的
地方集中记在 [索引的 Known defects 表](./features/README.md#known-defects-in-the-code)。

一份文档对应一个 **portal feature 目录**，也就是用户真正会走动的轴：一个路由、一个页面、组成它的
组件，以及背后的后端。没有独立 feature 目录的后端模块，作为消费它的页面的一节来记。

产品意图在 [`product/`](./product/PawHaven-Product-Strategy-EN.md)，`features/` 引用它。

**先读代码，再读它。** feature 文档只准确到「上一次把它和代码对齐的那个 commit」为止，所以它是
**待更新的记录**，不是设计的输入。文档和代码冲突时以代码为准，并顺手把文档修掉。

---

## 1. 架构

某个技术点或某个问题在本项目里的设计。要做设计前读这些。

| 文档                                                                                                | 覆盖内容                                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [PawHaven-System-Architecture-Overview.md](./architecture/PawHaven-System-Architecture-Overview.md) | 枢纽文档。服务拆分、C4 模型、数据架构、API 网关、安全、部署、设计决策                 |
| [PawHaven-Backend-Architecture.md](./architecture/PawHaven-Backend-Architecture.md)                 | `core-service` 模块化单体、以 NestJS 模块表达的限界上下文、服务间通信                 |
| [PawHaven-Frontend-Architecture.md](./architecture/PawHaven-Frontend-Architecture.md)               | 按 feature 划分的模块结构、状态、路由、token、i18n                                    |
| [authentication-architecture.md](./architecture/authentication-architecture.md)                     | **认证信任模型。** 网关独占浏览器 cookie、内部 ES256 JWT、下游服务校验、`roles` claim |
| [route_authentication.md](./architecture/route_authentication.md)                                   | 前端路由守卫 —— 需认证父路由、`requireUser`、`/auth/me` 预取                          |
| [PawHaven-PDF-Generation.md](./architecture/PawHaven-PDF-Generation.md)                             | 为什么 PDF 走 React + Puppeteer 而非模板库，以及改动模板时会踩的约束                  |
| [PawHaven-System-Architecture.md](./architecture/PawHaven-System-Architecture.md)                   | 拆分前旧文档到上面三份的重定向映射。自身无内容                                        |

动认证相关代码前，`authentication-architecture.md` 与 `route_authentication.md` 是一对要一起读的文档
—— 一个覆盖服务端信任边界，一个覆盖客户端路由守卫。

## 2. Feature

每个 **portal feature 目录**（`apps/frontend/portal/src/features/*`）一份文档，覆盖该 feature 的前后端两侧。
文档第 1 章按 `1.1`、`1.2`、`1.3` 编号拆解页面区块，后续章节讲底下的数据链路。

没有独立 feature 目录的后端模块，作为消费它那个页面的一节来记 —— `adoption` 在
[Home §4](./features/02-home.md#4-adoptable-pets-read-only)，`animal-follow` 在
[Rescue Detail §1.4](./features/05-rescue-detail.md#14-follow)。

| 文档                                                              | Portal feature           | 路由                            |
| ----------------------------------------------------------------- | ------------------------ | ------------------------------- |
| [README.md](./features/README.md)                                 | 索引、服务边界、已知缺陷 | —                               |
| [01-auth.md](./features/01-auth.md)                               | `auth`                   | `/auth/login`、`/auth/register` |
| [02-home.md](./features/02-home.md)                               | `home`                   | `/`                             |
| [03-report-animal.md](./features/03-report-animal.md)             | `report-animal`          | `/report-animal`                |
| [04-rescue-cases.md](./features/04-rescue-cases.md)               | `rescue-cases`           | `/rescue-cases`                 |
| [05-rescue-detail.md](./features/05-rescue-detail.md)             | `rescue-detail`          | `/rescue/detail/:animalID`      |
| [06-rescue-guide.md](./features/06-rescue-guide.md)               | `rescue-guide`           | `/rescue/guides`                |
| [07-app-shell-bootstrap.md](./features/07-app-shell-bootstrap.md) | _(无 —— `layout/`)_      | 包裹所有路由                    |

所有文档都对着代码逐条核实过，并且各自记录两类「不存在」：**What Does Not Exist** 记设计层面的缺口，
索引里的 _Known defects_ 表记实现与自身契约矛盾的地方 —— 必填却从不落库的字段、把单个字段投影成
「时间线」的渲染、13 个死链共同落到的 `NotFound`。

## 3. 产品

| 文档                                                                         | 覆盖内容                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [PawHaven-Product-Strategy-EN.md](./product/PawHaven-Product-Strategy-EN.md) | 产品蓝图 v2.0 —— 动物生命周期、用户画像、功能地图、MVP 路线图 |

## 4. 设计系统 —— 源码，不是文档

| 路径                                                                           | 类型 | 说明                         |
| ------------------------------------------------------------------------------ | ---- | ---------------------------- |
| [src/tokens/](../packages/design-system/src/tokens)                            | CSS  | 12 个设计 token CSS 变量文件 |
| [src/theme.css](../packages/design-system/src/theme.css)                       | CSS  | 全局主题定义                 |
| [src/utilities.css](../packages/design-system/src/utilities.css)               | CSS  | 工具类                       |
| [scripts/build-tokens.mjs](../packages/design-system/scripts/build-tokens.mjs) | JS   | token 构建脚本               |

由 `pnpm token-check` 强制校验。项目使用基于这些 token 的 Tailwind 语义 utility；不要引入原始颜色值或
魔法数字。

## 5. 开发

本地跑起来所需的运维文档。不是设计材料 —— 它是搭建参考。

| 文档                                     | 覆盖内容                                      |
| ---------------------------------------- | --------------------------------------------- |
| [development.md](./development.md)       | 前置条件、构建顺序、dev 服务与端口、pnpm 脚本 |
| [development.cn.md](./development.cn.md) | 同一份指南的中文版，与英文版保持同步          |

## 6. Agent 控制层

Agent 控制层在 `.pi/`，不在这里。

| 路径                                                              | 覆盖内容                           |
| ----------------------------------------------------------------- | ---------------------------------- |
| [.pi/README.md](../.pi/README.md)                                 | skill、prompt、10 个 subagent 索引 |
| [.pi/prompts/](../.pi/prompts)                                    | 斜杠命令工作流                     |
| [.pi/skills/project-rules/](../.pi/skills/project-rules/SKILL.md) | 工程规范，以 skill 形式强制        |

harness 由 `pnpm pi-check` 校验。已退役的 `.opencode/` 与 `.codebuddy/` 目录均已删除，指向它们的
链接都是死链。

---

## 建议阅读顺序

三份架构文档，然后是代码，最后 —— 改动验证通过之后 —— 才回写 feature 文档。

```
PawHaven-System-Architecture-Overview.md
  → PawHaven-Frontend-Architecture.md  |  PawHaven-Backend-Architecture.md
    （涉及认证时再加 authentication-architecture.md / route_authentication.md）
  → apps/ 与 packages/ 里的代码
  → 按落地的代码更新 docs/features/<feature>.md
```

**先核实，再信任。** 架构文档带有 `v3.11 / 2026-09-25` 标注，并在当时对照过代码；feature 文档则
准确到「上一次把它和代码对齐的那个 commit」为止。
