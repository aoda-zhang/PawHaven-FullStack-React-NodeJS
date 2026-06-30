# PawHaven — 系统架构设计（修订版）

> **版本**: v2.0 | **日期**: 2025-07-01 | **架构师**: 软件架构师  
> **基于**: [PawHaven-Product-Strategy.md](./PawHaven-Product-Strategy.md)  
> **设计哲学**: 务实的服务拆分。core-service 内部采用模块化单体。仅在必要时提取。

---

## 目录

1. [架构哲学](#1-架构哲学)
2. [服务拆分 — 仅 5 个服务](#2-服务拆分--仅-5-个服务)
3. [Core-Service：模块化单体](#3-core-service模块化单体)
4. [限界上下文作为 NestJS 模块](#4-限界上下文作为-nestjs-模块)
5. [C4 模型 — 系统全景](#5-c4-模型--系统全景)
6. [数据架构](#6-数据架构)
7. [API 网关设计](#7-api-网关设计)
8. [事件驱动通信（进程内）](#8-事件驱动通信进程内)
9. [共享内核与包策略](#9-共享内核与��策略)
10. [前端架构](#10-前端架构)
11. [安全架构](#11-安全架构)
12. [可观测性与运维](#12-可观测性与运维)
13. [部署架构](#13-部署架构)
14. [架构决策记录](#14-架构决策记录)
15. [模块边界强制执行](#15-模块边界强制执行)
16. [为什么这个设计可行](#16-为什么这个设计可行)

---

## 1. 架构哲学

> **"微服务是手段，不是目的。目标是可维护、可扩展的软件——而非特定数量的服务。"**

### 核心原则

| # | 原则 | 含义 |
|---|------|------|
| P1 | **按运维需求拆分，而非按领域数量拆分** | 仅当需要独立扩缩、不同技术栈、独立团队或不同部署节奏时才提取服务 |
| P2 | **单体优先，模块始终** | core-service 是单个可部署单元。内部每个限界上下文都是严格的 NestJS 模块 |
| P3 | **内部模块 = 未来的服务** | 模块边界由 lint 规则强制执行。提取只是部署变更，不是代码重写 |
| P4 | **网关作为唯一对外入口** | 所有外部流量经过网关。内部服务绝不暴露到公网 |
| P5 | **内部事件驱动，之间 REST** | core-service 内部模块间用进程内 EventEmitter。服务间通过网关代理的 HTTP 通信 |
| P6 | **一个数据库，逻辑分区** | MongoDB 采用按模块命名的集合。仅当法律或运维要求时才分离数据库 |

### 提取触发规则

> **不满足以下至少两个条件，不从 core-service 提取模块：**
> 1. 需要**独立扩缩**（不同的流量/负载模式）
> 2. 需要**不同技术栈**（如用 Python 做 ML 匹配）
> 3. **不同团队**负责
> 4. 有**不同的部署节奏**（按不同时间表发布）

---

## 2. 服务拆分 — 仅 5 个服务

### 2.1 架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Service 1: gateway                             │  │
│  │  无状态 — JWT 校验 · 限流 · 请求代理 · CORS · Trace ID     │  │
│  └──────────┬──────────┬──────────┬──────────┬────────────────┘  │
│             │          │          │          │                   │
│             ▼          ▼          ▼          ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Service 2:   │ │ Service 3:   │ │ Service 4:   │            │
│  │ auth-service │ │ core-service │ │ document-    │            │
│  │              │ │              │ │ service      │            │
│  │ 注册/登录    │ │ ┌──────────┐ │ │              │            │
│  │ JWT 签发     │ │ │ Rescue   │ │ │ 文件上传     │            │
│  │ Token 刷新   │ │ │ 救助案例  │ │ │ PDF 生成     │            │
│  │ 角色/权限    │ │ │ 时间线   │ │ │ 邮件发送     │            │
│  │              │ │ ├──────────┤ │ │ 图片处理     │            │
│  └──────────────┘ │ │Reporting │ │ └──────────────┘            │
│                    │ │ 流浪上报  │ │                             │
│  ┌──────────────┐  │ │ 紧急评估  │ │                             │
│  │ Service 5:   │  │ ├──────────┤ │                             │
│  │ config-      │  │ │ Adoption │ │                             │
│  │ service      │  │ │ 领养匹配  │ │                             │
│  │              │  │ │ 申请审核  │ │                             │
│  │ 菜单配置     │  │ ├──────────┤ │                             │
│  │ 路由配置     │  │ │ Content  │ │                             │
│  │ 功能开关     │  │ │ 爱心故事  │ │                             │
│  │ (未来)       │  │ │ 知识库   │ │                             │
│  └──────────────┘  │ ├──────────┤ │                             │
│                    │ │Volunteer │ │                             │
│                    │ │ 志愿者   │ │                             │
│                    │ │ 资料/匹配│ │                             │
│                    │ ├──────────┤ │                             │
│                    │ │Notificat.│ │                             │
│                    │ │ 通知推送 │ │                             │
│                    │ ├──────────┤ │                             │
│                    │ │Achieve-  │ │                             │
│                    │ │ ment 成就│ │                             │
│                    │ ├──────────┤ │                             │
│                    │ │ Profile  │ │                             │
│                    │ │ 个人中心 │ │                             │
│                    │ └──────────┘ │                             │
│                    └──────────────┘                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 为什么每个服务独立存在

| # | 服务 | 为什么独立？ | 如果合并会怎样？ |
|---|------|-------------|----------------|
| 1 | **gateway** | 无状态。处理所有流量。需要独立水平扩缩。TLS 终止、限流、CORS——基础设施关注点，非业务逻辑。 | 合并进 core-service 会将基础设施扩缩与业务逻辑扩缩耦合。网关可能需要 5 个 pod，而 core 只需 2 个。 |
| 2 | **auth-service** | 不同安全姿态。持有 bcrypt 哈希 + JWT 密钥。独立安全审计。认证挂了全站不可用——需要熔断。 | 合并进 core-service 意味着任何 core 部署都可能影响认证可用性。安全审计范围扩大到所有业务代码。 |
| 3 | **core-service** | 模块化单体。7 个业务模块作为严格 NestJS 模块存在于此。单部署、单数据库。内部模块边界由 lint 规则强制。 | 这就是合并目标。所有不需要运维隔离的东西都在这。 |
| 4 | **document-service** | 重量级依赖（Puppeteer ~300MB）。不同资源画像——PDF 生成时 CPU/内存激增。不同扩缩模型。 | 合并进 core-service 意味着每个 core pod 都携带 Puppeteer。PDF 生成激增影响救助 API 延迟。 |
| 5 | **config-service** | 目前提供静态菜单/路由配置。未来：集中化功能开关、动态配置。独立部署使得配置变更无需 core-service 重新部署。 | 今天可以合并进 core-service。保留独立是为了未来的集中化配置策略。三个月后重新评估。 |

### 2.3 服务间通信

```
gateway ──HTTP 代理──► auth-service       (认证端点)
gateway ──HTTP 代理──► core-service       (所有业务端点)
gateway ──HTTP 代理──► document-service   (文件/PDF 端点)
gateway ──HTTP 代理──► config-service     (菜单/路由端点)

core-service ──HTTP──► document-service   (生成 PDF、发送邮件)
core-service ──HTTP──► auth-service       (校验 Token、获取用户)

// core-service 内部所有模块间通信：
// 进程内 NestJS EventEmitter2（零网络开销）
```

---

## 3. Core-Service：模块化单体

### 3.1 为什么是模块化单体？

> **core-service 是一个可部署单元，但它不是一个巨大的泥球。**

它是**模块化单体**：一个单进程，每个业务能力存在于严格的 NestJS 模块中，具有强制边界。模块通过定义的接口（服务类 + 事件）通信，绝不通过导入彼此的内部文件。

### 3.2 内部模块结构

```
apps/backend/core-service/src/modules/
│
├── rescue/                    # 🐾 救助案例管理
│   ├── rescue.module.ts       #   模块定义
│   ├── rescue.service.ts      #   公开 API（其他模块可调用）
│   ├── rescue.controller.ts   #   HTTP 端点
│   ├── entities/              #   领域实体（非 Prisma 模型）
│   │   ├── rescue-case.entity.ts
│   │   ├── status-transition.entity.ts
│   │   └── rescue-timeline.entity.ts
│   ├── use-cases/             #   应用用例
│   │   ├── create-rescue-case.usecase.ts
│   │   ├── transition-status.usecase.ts
│   │   └── get-rescue-timeline.usecase.ts
│   ├── events/                #   本模块发布的事件
│   │   └── rescue.events.ts
│   └── DTO/                   #   请求/响应 DTO
│
├── reporting/                 # 📋 流浪动物上报
│   ├── reporting.module.ts
│   ├── reporting.service.ts
│   ├── reporting.controller.ts
│   ├── use-cases/
│   │   ├── submit-report.usecase.ts
│   │   └── assess-urgency.usecase.ts
│   ├── events/
│   │   └── reporting.events.ts
│   └── DTO/
│
├── adoption/                  # 🏠 领养匹配
│   ├── adoption.module.ts
│   ├── adoption.service.ts
│   ├── adoption.controller.ts
│   ├── use-cases/
│   │   ├── create-listing.usecase.ts
│   │   ├── submit-application.usecase.ts
│   │   └── match-adoptions.usecase.ts
│   ├── events/
│   │   └── adoption.events.ts
│   └── DTO/
│
├── content/                   # 💝 故事与知识库
│   ├── content.module.ts
│   ├── content.service.ts
│   ├── content.controller.ts
│   ├── use-cases/
│   ├── events/
│   └── DTO/
│
├── volunteer/                 # 🤝 志愿者协作
│   ├── volunteer.module.ts
│   ├── volunteer.service.ts
│   ├── volunteer.controller.ts
│   ├── use-cases/
│   ├── events/
│   └── DTO/
│
├── notification/              # 🔔 通知
│   ├── notification.module.ts
│   ├── notification.service.ts
│   ├── notification.controller.ts
│   └── events/                #   仅订阅，不发布领域事件
│       └── notification.handlers.ts
│
├── achievement/               # 🏅 成就与徽章
│   ├── achievement.module.ts
│   ├── achievement.service.ts
│   ├── achievement.controller.ts
│   └── events/
│       └── achievement.handlers.ts
│
├── profile/                   # 👤 个人中心（聚合视图）
│   ├── profile.module.ts
│   ├── profile.service.ts
│   └── profile.controller.ts
│
└── bootstrap/                 # 🔧 系统引导（已有）
    ├── bootstrap.module.ts
    ├── bootstrap.service.ts
    └── bootstrap.controller.ts
```

### 3.3 模块通信规则

```
✅ 允许:
  模块 A → 模块 B 的公开 service 类（通过 NestJS DI）
  模块 A → EventBus（发布事件，模块 B 订阅）
  模块 A → 共享内核（@pawhaven/shared 类型/常量）

❌ 禁止（由 ESLint 强制执行）:
  模块 A → 模块 B 的内部文件（entities、use-cases、DTOs）
  模块 A → 模块 B 的 Prisma 模型（直接访问）
  模块 A → 模块 B 的 controller

强制执行: eslint-plugin-import 配合自定义规则
  "modules/*/entities/**" → 仅允许同模块导入
  "modules/*/use-cases/**" → 仅允许同模块导入
```

### 3.4 示例：Reporting → Rescue 如何工作

```typescript
// ============================================================
// 模块: reporting
// 文件: reporting/use-cases/submit-report.usecase.ts
// ============================================================

@Injectable()
export class SubmitReportUseCase {
  constructor(
    private readonly eventBus: EventEmitter2,  // NestJS 事件总线
    private readonly prisma: PrismaClient,       // 本模块的数据库访问
  ) {}

  async execute(dto: SubmitReportDto): Promise<StrayReport> {
    // 1. 将上报持久化到 reporting 自己的集合
    const report = await this.prisma.strayReport.create({ data: dto });

    // 2. 自动评估紧急程度
    const urgency = this.assessUrgency(dto.urgencyIndicators);

    // 3. 发布领域事件 — Rescue 模块订阅此事件
    await this.eventBus.emitAsync('stray.animal.reported', {
      type: 'stray.animal.reported',
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        reportId: report.id,
        animalType: dto.animalType,
        location: dto.location,
        urgency,
        photos: dto.photos,
        reporterId: dto.reporterId,
      },
    });

    return report;
  }
}

// ============================================================
// 模块: rescue
// 文件: rescue/events/rescue.handlers.ts
// ============================================================

@Injectable()
export class RescueEventHandlers {
  constructor(
    private readonly createRescueCase: CreateRescueCaseUseCase,
  ) {}

  @OnEvent('stray.animal.reported')
  async handleStrayReported(event: StrayAnimalReportedEvent) {
    // 防腐层：将外部事件翻译为内部命令
    await this.createRescueCase.execute({
      animalId: this.generateAnimalId(),
      source: 'report',
      sourceId: event.payload.reportId,
      status: 'pending',
      urgency: event.payload.urgency,
      location: event.payload.location,
      animalType: event.payload.animalType,
      photos: event.payload.photos,
    });
  }
}
```

**关键点：**
- Reporting 模块**不导入** Rescue 模块的任何东西
- Reporting 模块**不知道** RescueCase 是如何创建的
- 通过类型化事件（定义在 `@pawhaven/shared` 中）通信
- Rescue 模块的事件处理器应用防腐层将外部事件翻译为内部命令
- 如果将来提取 Rescue 为独立服务，将 `EventEmitter2` 替换为消息代理即可。模块代码**零改动**。

---

## 4. 限界上下文作为 NestJS 模块

### 4.1 上下文映射图（同样的 DDD 严谨性，更少的可部署单元）

```
┌──────────────────────────────────────────────────────────────────┐
│                     PawHaven 领域 (DDD)                           │
│                                                                  │
│  所有模块作为 NestJS 模块存在于 core-service 内部：               │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Reporting   │    │   Rescue     │    │  Adoption    │       │
│  │  上报模块    │◄──►│   救助模块    │◄──►│  领养模块    │       │
│  │              │    │   (核心域)   │    │              │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │               │
│         │    ┌──────────────┼──────────────┐    │               │
│         │    │              │              │    │               │
│         ▼    ▼              ▼              ▼    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Content    │    │  Volunteer   │    │   Profile    │       │
│  │   内容模块    │    │  志愿者模块   │    │  个人中心模块 │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │ Notification │    │ Achievement  │   （仅订阅模块）            │
│  │   通知模块    │    │   成就模块    │                           │
│  └──────────────┘    └──────────────┘                           │
│                                                                  │
│  独立服务（拥有自己的可部署单元）：                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Auth       │    │  Document    │    │   Config     │       │
│  │   认证服务    │    │  文档服务     │    │  配置服务     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 模块详情（核心域）

#### 救助模块（系统心脏）

| 维度 | 详情 |
|------|------|
| **职责** | 救助案例全生命周期：创建 → 7 阶段状态机 → 时间线 → 结局 |
| **核心聚合** | `RescueCase`（救助案例）、`StatusTransition`（状态转换/时间线条目） |
| **不变性约束** | 状态只能沿定义路径转换；每次转换记录时间戳 + 操作人 |
| **拥有的集合** | `rescue_cases`、`rescue_transitions` |
| **发布事件** | `RescueCaseReported`、`RescueStatusChanged`、`RescueCaseCompleted` |
| **订阅事件** | `StrayAnimalReported`、`VolunteerClaimed`、`AdoptionFinalized` |

#### 上报模块

| 维度 | 详情 |
|------|------|
| **职责** | 流浪动物上报录入：照片、GPS、状态评估、紧急程度自动判定 |
| **核心聚合** | `StrayReport`（流浪上报）、`UrgencyAssessment`（紧急评估） |
| **不变性约束** | 上报必须有照片 + 位置 + 动物类型；紧急程度自动计算 |
| **拥有的集合** | `stray_reports`、`urgency_assessments` |
| **发布事件** | `StrayAnimalReported` |
| **订阅事件** | 无（仅上游） |

#### 领养模块

| 维度 | 详情 |
|------|------|
| **职责** | 领养列表、申请、匹配、审批、领养后回访 |
| **核心聚合** | `AdoptionListing`（领养列表）、`AdoptionApplication`（领养申请）、`AdoptionAgreement`（领养协议） |
| **不变性约束** | 只有"待领养"状态的动物可被发布；一个动物 = 一个活跃列表 |
| **拥有的集合** | `adoption_listings`、`adoption_applications`、`adoption_agreements` |
| **发布事件** | `AdoptionFinalized`、`AdoptionApplicationSubmitted` |
| **订阅事件** | `RescueStatusChanged`（转为"awaitingAdoption"时） |

#### 内容模块（故事 + 知识库）

| 维度 | 详情 |
|------|------|
| **职责** | 爱心故事、知识库文章、内容审核 |
| **核心聚合** | `Story`（故事）、`KnowledgeArticle`（知识文章）、`ContentReview`（内容审核） |
| **不变性约束** | 故事必须引用已完成的救助案例；医疗文章需专家审核 |
| **拥有的集合** | `stories`、`knowledge_articles`、`content_reviews`、`tags` |
| **发布事件** | `StoryPublished`、`ArticlePublished` |
| **订阅事件** | `RescueCaseCompleted`（触发故事撰写邀请） |

#### 志愿者模块

| 维度 | 详情 |
|------|------|
| **职责** | 志愿者资料、能力匹配、案例认领、可用性管理 |
| **核心聚合** | `VolunteerProfile`（志愿者资料）、`CaseClaim`（案例认领）、`VolunteerStats`（志愿者统计） |
| **不变性约束** | 每志愿者每案例一个活跃认领；能力必须匹配案例需求 |
| **拥有的集合** | `volunteer_profiles`、`case_claims`、`volunteer_stats` |
| **发布事件** | `VolunteerClaimed`、`VolunteerUnavailable` |
| **订阅事件** | `RescueCaseReported`（触发匹配 + 通知） |

### 4.3 模块详情（支撑/通用域）

| 模块 | 类型 | 职责 | 拥有的集合 |
|------|------|------|-----------|
| **Notification** | 仅订阅 | 消费领域事件 → 推送/邮件/站内通知 | `notifications`、`notification_preferences` |
| **Achievement** | 仅订阅 | 消费领域事件 → 徽章/里程碑计算 | `achievements`、`milestones` |
| **Profile** | 只读聚合 | 跨模块聚合用户数据（上报、救助、领养、故事） | 无（读取其他模块的 service） |
| **Bootstrap** | 系统 | 菜单/路由配置、应用初始化（已有） | `menus`、`routes`、`roles`、`permissions` |

---

## 5. C4 模型 — 系统全景

### 5.1 Level 1: 系统上下文

```
                    ┌─────────────────────┐
                    │      发现者          │
                    │  (手机浏览器)        │
                    └──────────┬──────────┘
                               │
                               ▼
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│    救助者    │────►│                 │◄────│   领养者     │
│  (Web/手机)  │     │   PawHaven      │     │  (Web/手机)  │
└──────────────┘     │   平台          │     └──────────────┘
                     │                 │
┌──────────────┐     └────────┬────────┘     ┌──────────────┐
│  知识贡献者  │────►         │         ◄────│  救助站管理员 │
│   (Web)      │              │              │   (Web)      │
└──────────────┘              │              └──────────────┘
                              │
                     ┌────────┴────────┐
                     │   外部服务       │
                     │  · 邮件 (SMTP)  │
                     │  · 存储 (S3)    │
                     │  · 地图 API     │
                     │  · 推送 (FCM)   │
                     └─────────────────┘
```

### 5.2 Level 2: 容器图

```
┌─────────────────────────────────────────────────────────────────┐
│                        PawHaven 平台                             │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  门户 SPA       │  │  管理后台 SPA   │  │  移动端 PWA     │  │
│  │  (React 19)     │  │  (React 19)     │  │  (React 19)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              gateway (NestJS) — 端口 3000                │   │
│  │  JWT 校验 · 限流 · 代理 · CORS · Trace ID               │   │
│  └───┬──────────┬────────────┬────────────┬────────────────┘   │
│      │          │            │            │                     │
│      ▼          ▼            ▼            ▼                     │
│  ┌────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐          │
│  │ auth-  │ │ core-      │ │document│ │ config-    │          │
│  │ service│ │ service    │ │service │ │ service    │          │
│  │ :3001  │ │ :3002      │ │ :3003  │ │ :3004      │          │
│  │        │ │            │ │        │ │            │          │
│  │ MongoDB│ │ ┌────────┐ │ │MongoDB │ │ (静态 YAML) │          │
│  │ (auth) │ │ │rescue  │ │ │(docs)  │ │            │          │
│  └────────┘ │ │report  │ │ └────────┘ └────────────┘          │
│             │ │adopt   │ │                                      │
│             │ │content │ │                                      │
│             │ │voluntr │ │                                      │
│             │ │notify  │ │                                      │
│             │ │achieve │ │                                      │
│             │ │profile │ │                                      │
│             │ │bootstrap│ │                                      │
│             │ └────────┘ │                                      │
│             │ MongoDB     │                                      │
│             │ (core)      │                                      │
│             └────────────┘                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   内部通信：                                              │   │
│  │   · gateway → 服务：HTTP 代理                            │   │
│  │   · core → document/auth：HTTP (NestJS HttpService)      │   │
│  │   · 模块 → 模块（core 内部）：EventEmitter2               │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. 数据架构

### 6.1 数据库策略

```
┌─────────────────────────────────────────────────────────┐
│              MongoDB（单集群）                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  数据库: pawhaven-auth                            │   │
│  │  · users, roles, permissions, refreshTokens       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  数据库: pawhaven-core                            │   │
│  │                                                    │   │
│  │  集合（按模块前缀命名）：                            │   │
│  │  · rescue_cases          (救助模块)               │   │
│  │  · rescue_transitions    (救助模块)               │   │
│  │  · stray_reports         (上报模块)               │   │
│  │  · urgency_assessments   (上报模块)               │   │
│  │  · adoption_listings     (领养模块)               │   │
│  │  · adoption_applications (领养模块)               │   │
│  │  · adoption_agreements   (领养模块)               │   │
│  │  · stories               (内容模块)               │   │
│  │  · knowledge_articles    (内容模块)               │   │
│  │  · content_reviews       (内容模块)               │   │
│  │  · volunteer_profiles    (志愿者模块)             │   │
│  │  · case_claims           (志愿者模块)             │   │
│  │  · notifications         (通知模块)               │   │
│  │  · notification_prefs    (通知模块)               │   │
│  │  · achievements          (成就模块)               │   │
│  │  · milestones            (成就模块)               │   │
│  │  · menus, routes, roles  (引导模块)               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  数据库: pawhaven-docs                            │   │
│  │  · fileReferences                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  外部: S3 兼容对象存储                             │   │
│  │  · 动物照片、故事图片、PDF 文件                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 6.2 数据访问规则

| 规则 | 执行方式 |
|------|---------|
| 每个模块拥有自己的集合 | 仅拥有模块的 Prisma service 访问其集合 |
| 跨模块数据访问 | 通过拥有模块的公开 service 类，绝不直接访问数据库 |
| 集合命名 | `{module}_{entity}` — 明确所有权，便于未来数据库拆分 |
| 共享 Prisma 扩展 | 软删除 + 版本控制通过 `@pawhaven/backend-core` — 应用于所有模块 |
| 地理查询 | MongoDB `$near` 通过 Prisma 原始查询（志愿者模块） |
| 全文搜索 | MongoDB Atlas Search 在 `knowledge_articles` 集合上（内容模块） |

---

## 7. API 网关设计

### 7.1 架构（与现有设计一致，增强版）

```
客户端请求
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    gateway (NestJS)                       │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ 公开路由     │  │ JWT 守卫    │  │  限流器          │  │
│  │ @Public()   │  │ (校验)      │  │  (按 IP/用户)    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                  │           │
│         └────────────────┼──────────────────┘           │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              代理路由器                            │  │
│  │  /api/auth/*       → auth-service:3001           │  │
│  │  /api/rescues/*    → core-service:3002           │  │
│  │  /api/reports/*    → core-service:3002           │  │
│  │  /api/adoptions/*  → core-service:3002           │  │
│  │  /api/stories/*    → core-service:3002           │  │
│  │  /api/knowledge/*  → core-service:3002           │  │
│  │  /api/volunteers/* → core-service:3002           │  │
│  │  /api/notifications/* → core-service:3002        │  │
│  │  /api/profile/*    → core-service:3002           │  │
│  │  /api/files/*      → document-service:3003       │  │
│  │  /api/config/*     → config-service:3004         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              横切关注点                            │  │
│  │  · X-Trace-Id 注入 + 传播                         │  │
│  │  · 用户上下文头 (X-Auth-User-Id, Roles)           │  │
│  │  · 结构化请求/响应日志                             │  │
│  │  · 响应头清理                                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 事件驱动通信（进程内）

### 8.1 事件目录

```
core-service 内部（NestJS EventEmitter2）：

上报模块发布:
  StrayAnimalReported → 救助模块（创建案例）
                       → 志愿者模块（匹配志愿者）
                       → 通知模块（通知附近志愿者）
                       → 内容模块（推荐相关文章）

救助模块发布:
  RescueCaseReported → 志愿者模块（匹配）
                      → 通知模块（通知附近）

  RescueStatusChanged → 领养模块（若 awaitingAdoption → 创建领养列表）
                       → 通知模块（通知发现者/关注者）
                       → 成就模块（检查里程碑）

  RescueCaseCompleted → 内容模块（邀请撰写故事）
                       → 成就模块（颁发徽章）
                       → 志愿者模块（更新统计）

志愿者模块发布:
  VolunteerClaimed → 救助模块（更新状态为 inProgress）
                    → 通知模块（通知发现者）

领养模块发布:
  AdoptionFinalized → 救助模块（更新状态为 adopted）
                     → 内容模块（邀请领养故事）
                     → 成就模块（颁发徽章）
```

### 8.2 实现

```typescript
// Phase 1 (MVP): 进程内
// @nestjs/event-emitter (EventEmitter2) — NestJS 已内置
// 零基础设施。零延迟。单进程内运行。

// Phase 3+ (若 core-service 拆分):
// 将 EventEmitter2 替换为 RabbitMQ / Redis Streams
// 模块代码不变 — 仅传输层变化
```

---

## 9. 共享内核与包策略

### 9.1 各包职责边界

| 包 | 包含内容 | 不得包含 |
|----|---------|---------|
| `@pawhaven/shared` | Zod Schema、TypeScript 类型、常量、事件定义、纯工具函数 | React 代码、NestJS 代码、数据库逻辑 |
| `@pawhaven/backend-core` | SharedModule、PrismaModule、HttpClientModule、装饰器、守卫、拦截器、Prisma 扩展 | 业务逻辑、领域实体 |
| `@pawhaven/frontend-core` | React hooks、API 客户端、存储工具、懒加载辅助 | 业务相关组件 |
| `@pawhaven/design-system` | CSS Token、Tailwind 主题、MUI 主题、CSS 工具类 | React 组件 |
| `@pawhaven/ui` | 可复用 React 组件（Form*、Loading、Toast 等） | 业务逻辑、API 调用 |
| `@pawhaven/i18n` | 翻译 Provider、语言文件、语言检测 | 业务内容 |

---

## 10. 前端架构

### 10.1 基于功能的模块结构

```
apps/frontend/portal/src/
├── features/                    # 功能模块（与限界上下文对齐）
│   ├── reporting/               # 流浪动物上报流程
│   ├── rescues/                 # 救助案例浏览 + 详情
│   ├── adoption/                # 领养列表 + 申请
│   ├── stories/                 # 爱心故事
│   ├── knowledge/               # 知识库
│   ├── volunteer/               # 志愿者面板
│   ├── profile/                 # 个人中心 + 成就
│   └── auth/                    # 登录 + 注册
│
├── layout/                      # 根布局组件
├── providers/                   # 应用级 Provider
├── router/                      # 路由配置
└── store/                       # 全局状态 (Redux)
```

### 10.2 状态管理策略

| 状态类型 | 工具 | 理由 |
|---------|------|------|
| **服务端状态** | **TanStack Query** | 内置缓存、后台刷新、乐观更新、分页 |
| **客户端状态** | **Redux Toolkit**（已有） | 认证状态、UI 开关 |
| **表单状态** | **React Hook Form + Zod** | 已有模式，类型安全校验 |
| **URL 状态** | **React Router search params** | 可分享、可收藏、支持浏览器后退 |
| **持久化状态** | **Redux Persist + localStorage** | 认证 Token、偏好设置 |

---

## 11. 安全架构

### 11.1 认证流程

```
客户端 → gateway → auth-service
                     │
                     │ POST /auth/login (邮箱 + 密码)
                     │ ← JWT 对 (access 15分钟, refresh 7天)
                     │
客户端 → gateway (Authorization: Bearer <access_token>)
           │
           │ JWT 守卫校验签名
           │ 注入头: X-Auth-User-Id, X-Auth-User-Roles
           │
           ▼
         core-service (信任头 — 仅内部网络)
```

### 11.2 安全分层

| 层次 | 机制 |
|------|------|
| 传输层 | HTTPS (TLS 1.3) |
| 认证 | JWT (RS256)，网关层校验 |
| 授权 | RBAC — 角色 + 权限，网关 + 服务双重检查 |
| 输入校验 | Zod Schema，通过 nestjs-zod 全局管道 |
| 限流 | 每 IP + 每用户令牌桶，网关层 |
| 数据隐私 | GPS 模糊化（displayArea，救助完成后不显示精确坐标） |
| CSRF | SameSite Cookie + Token Header |
| CORS | 按环境白名单域名 |

---

## 12. 可观测性与运维

### 12.1 三大支柱

```
日志               指标                追踪
· 结构化 JSON      · 请求数            · X-Trace-Id 跨所有
· service 标签     · p50/p95/p99      · 服务传播
· 每条日志含       · 错误率            · OpenTelemetry
  traceId          · 状态码分布        · 兼容
· 级别: info/      · 数据库查询耗时
  warn/error
```

### 12.2 健康检查

```
GET /health       → { status, db, uptime, version }
GET /health/live  → 存活探针 (k8s)
GET /health/ready → 就绪探针 (k8s)
```

---

## 13. 部署架构

### 13.1 MVP（当前 → 第 3 个月）

```
┌─────────────────────────────────────────────────────────┐
│  单台 VPS / 容器                                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Docker Compose                                   │   │
│  │                                                    │   │
│  │  gateway:1    auth-service:1    core-service:2    │   │
│  │  document:1   config-service:1                    │   │
│  │                                                    │   │
│  │  MongoDB:1（含 3 个数据库）                        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 13.2 生产环境（Phase 3+）

```
┌─────────────────────────────────────────────────────────┐
│  K8s 集群                                               │
│                                                          │
│  gateway:     2-5 pods (HPA 基于 CPU)                   │
│  auth:        2 pods                                    │
│  core:        2-5 pods (HPA 基于 CPU)                   │
│  document:    1-2 pods (HPA 基于 CPU)                   │
│  config:      1 pod                                     │
│                                                          │
│  MongoDB Atlas（托管）                                  │
│  S3 兼容存储                                            │
│  Redis（限流、可选缓存）                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 14. 架构决策记录 (ADR)

### ADR-001: core-service 内部采用模块化单体

| 字段 | 内容 |
|------|------|
| **状态** | 已接受 |
| **背景** | 产品策略定义了 7 个业务模块。过早的微服务拆分增加了分布式复杂度，却未被证明有价值。所有模块共享 NestJS + MongoDB 技术栈、同一团队、同一部署节奏。 |
| **决策** | 所有 7 个业务模块作为严格 NestJS 模块存在于 core-service 内部。模块边界由 ESLint 规则强制执行。通过进程内 EventEmitter2 通信。 |
| **后果** | **更容易**: 快速迭代、简单部署、模块间零网络开销、容易调试。**更困难**: 必须保持模块边界纪律；存在意外耦合风险。通过 lint 规则 + CI 架构适应度函数缓解。 |

### ADR-002: 5 服务拆分理由

| 字段 | 内容 |
|------|------|
| **状态** | 已接受 |
| **背景** | 需要确定哪些能力值得拥有自己的可部署单元，哪些留在 core-service 中。 |
| **决策** | 5 个服务：gateway（无状态、扩缩）、auth（安全隔离）、core（模块化单体）、document（重量依赖、不同资源画像）、config（独立部署以支持配置变更）。 |
| **后果** | **更容易**: 每个服务独立扩缩，auth 可隔离安全审计，PDF 生成不影响 API 延迟。**更困难**: 5 个可部署单元需要管理。可接受——每个都有明确独立存在的运维理由。 |

### ADR-003: MongoDB 按模块命名集合

| 字段 | 内容 |
|------|------|
| **状态** | 已接受 |
| **背景** | 所有 core-service 模块共享一个 MongoDB 数据库。需要防止意外的跨模块数据访问，同时保持运维简单。 |
| **决策** | 单数据库 `pawhaven-core`，集合命名约定 `{module}_{entity}`。每个模块的 Prisma service 仅访问自己的集合。跨模块数据访问仅通过公开 service 类。 |
| **后果** | **更容易**: 单个数据库运维、备份、监控。**更困难**: 模块间无数据库级访问控制（通过代码级强制执行缓解）。未来：若模块需要数据隔离，将其集合拆分为独立数据库——代码零改动。 |

### ADR-004: Zod 用于共享 Schema 校验

| 字段 | 内容 |
|------|------|
| **状态** | 已接受 |
| **背景** | 需要类型安全的校验，在前端（表单校验）和后端（请求校验）中工作方式一致。 |
| **决策** | 所有 DTO、事件 Schema 和领域类型在 `@pawhaven/shared` 中以 Zod Schema 定义。前端通过 `@hookform/resolvers/zod` 使用。后端使用 `nestjs-zod` 校验管道。 |
| **后果** | 校验的单一真相来源。自动 TypeScript 类型推断。前端 Zod ~12KB gzipped——可接受。 |

### ADR-005: 进程内事件 → 未来消息代理

| 字段 | 内容 |
|------|------|
| **状态** | 已接受 |
| **背景** | 模块需要响应其他模块的变更，但不希望紧耦合。 |
| **决策** | Phase 1: NestJS EventEmitter2（进程内）。Phase 3+: 仅当模块从 core-service 提取时才迁移到消息代理。 |
| **后果** | **更容易**: 零基础设施、零延迟、简单调试。**更困难**: 进程重启时事件丢失（Phase 1 可接受——事件不是记录系统，数据库才是）。 |

### ADR-006: 基于功能的前端模块

| 字段 | 内容 |
|------|------|
| **状态** | 已接受 |
| **背景** | 7 个产品模块需要清晰的前端组织。 |
| **决策** | `features/{module}/`，每个功能含 apis/、components/、hooks/、types.ts、index.tsx。禁止跨功能导入。 |
| **后果** | 清晰所有权、独立开发、更容易代码分割。Lint 规则强制执行功能隔离。 |

---

## 15. 模块边界强制执行

### 15.1 ESLint 规则

```javascript
// .eslintrc.cjs — core-service 自定义规则
{
  rules: {
    // 禁止跨模块导入内部文件
    'import/no-restricted-paths': ['error', {
      zones: [
        {
          target: './src/modules/rescue',
          from: './src/modules/reporting',
          except: [], // 无例外 — 使用 service 类或事件
        },
        // ... 每对模块同理
      ],
    }],
  },
}
```

### 15.2 CI 架构适应度函数

```bash
#!/bin/bash
# scripts/check-module-boundaries.sh
# 在 CI 中运行 — 若任何模块导入其他模块的内部文件则失败

FORBIDDEN_IMPORTS=$(grep -r "from.*modules/\(rescue\|reporting\|adoption\|content\|volunteer\)" \
  apps/backend/core-service/src/modules/ \
  --include="*.ts" \
  | grep -v "modules/\1" \
  | grep -v "events/" \
  | grep -v "\.service" )

if [ -n "$FORBIDDEN_IMPORTS" ]; then
  echo "❌ 检测到跨模块导入。请使用 service 类或事件。"
  echo "$FORBIDDEN_IMPORTS"
  exit 1
fi
echo "✅ 模块边界干净"
```

---

## 16. 为什么这个设计可行

### 16.1 务实的平衡

| 关注点 | 如何解决 |
|--------|---------|
| **可扩展性** | Gateway + core 独立扩缩。Document 独立扩缩（重量级 PDF）。 |
| **可维护性** | 7 个模块，强制边界。每个模块独立可理解。 |
| **可扩展性** | 新产品模块 = `modules/` 中的新文件夹。无需新服务。 |
| **可部署性** | 5 个服务。每个都有明确的存在理由。没有"为了微服务而微服务"。 |
| **可观测性** | 结构化日志带 module 标签。Trace ID 跨所有服务。 |
| **面向未来** | 模块可提取为独立服务而无需代码改动——仅部署配置变更。 |

### 16.2 何时添加第 6 个服务

> **仅当某个模块满足以下至少两个条件时：**
> 1. 需要独立扩缩（如通知模块流量增长 10 倍）
> 2. 需要不同技术栈（如用 Python ML 做领养匹配）
> 3. 不同团队接管
> 4. 有不同的发布节奏

### 16.3 三个月后重新评估

- **config-service**: 如果仍只是静态 YAML 服务，合并进 core-service
- **通知模块**: 如果推送/邮件量显著增长，考虑提取
- **内容模块（知识库）**: 如果搜索成为核心功能，考虑独立搜索服务

---

> **下一步**: API 契约设计（OpenAPI 规范）、新模块的数据库迁移计划、每个功能的前端组件树。
