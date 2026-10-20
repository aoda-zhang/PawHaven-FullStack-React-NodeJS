# PawHaven React 架构专项审查 Prompt 手册

## 使用说明

本手册将架构评审拆成八个专项 Prompt 和一个综合 Prompt。建议逐项执行，先建立事实，再形成结论，最后用综合 Prompt 去重并生成高 ROI 改造 Backlog。

### 推荐执行顺序

1. Feature 组织与目录结构
2. Client State 与状态归属
3. TanStack Query / Server State
4. UI Library
5. Design Token
6. 测试体系
7. React 技术选型
8. 长期可维护性与 ARB
9. 最终综合审查

### 建议保存的输出文件

```
docs/architecture-reviews/
├─ 01-feature-organization.md
├─ 02-state-ownership.md
├─ 03-server-state.md
├─ 04-ui-library.md
├─ 05-design-token.md
├─ 06-testing-strategy.md
├─ 07-technology-stack.md
├─ 08-maintainability.md
└─ 09-final-architecture-backlog.md
```

### 使用原则

- 不要一次执行全部专项，范围过大会让分析变浅。
- 要求工具先读取真实代码；如果缺文件，先列缺失项。
- 每次审查都应生成代码证据、迁移步骤、验收标准与测试方案。
- 最终综合审查只负责去重、排序和形成 Backlog，不替代专项审查。

---

# 1. React 技术选型专项审查

用于判断现有技术栈是否合理、哪些能力重叠，以及未来扩展时的成本。

## 可直接复制执行的 Prompt

你是负责大型 React 平台架构的首席前端架构师。

请对下面的 PawHaven React Monorepo 执行 “React 技术选型与技术栈合理性专项审查”。

【审查范围】

- React 19、TypeScript、Vite、React Router、TanStack Query、Redux Toolkit
- React Hook Form、Zod、Material UI、Tailwind CSS
- pnpm workspace、Playwright、共享 packages 与构建配置

【重点检查】

1. 识别 Redux、Query、Context、local state、表单状态之间的职责重叠
2. 识别 MUI、Tailwind、Design System 与 UI package 的重复职责
3. 检查 dependencies、devDependencies、peerDependencies、重复版本和未使用依赖
4. 检查 React 19 兼容性、过时模式、副作用滥用、derived state 和不必要 memoization
5. 检查 Query、表单、schema、HTTP client、错误处理、路由和配置加载是否重复实现
6. 评估运行时开销、bundle、tree-shaking、构建速度和部署成本
7. 分别评估 1、5、20、50 人团队的学习成本和维护风险
8. 判断哪些技术应保留、限制、替换、删除，以及重新评估条件

【必须输出】

1. 执行摘要：当前评分、成熟度、复杂度、最大风险、最值得保留和最应简化部分
2. 技术选型清单：保留、限制、替换、删除、暂无法判断，并附证据
3. Top 10 问题：严重度、证据、影响、建议、例外场景和工作量
4. 关键决策的简化 ADR：背景、决策、备选、理由、负面影响、重评条件
5. 本周、1 个月、3 个月和暂不建议改的路线图
6. 不应再引入的技术、满足条件后才能引入的技术、目标技术栈

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 2. Feature 组织与目录结构专项审查

用于检查业务垂直切片、目录 ownership、依赖方向和 Feature 可删除性。

## 可直接复制执行的 Prompt

你是擅长大型 React Monorepo、垂直切片架构和模块边界治理的 Staff Frontend Engineer。

请对下面的 PawHaven React Monorepo 执行 “Feature 组织与目录结构专项审查”。

【审查范围】

- apps/frontend/portal/src/，若目录不同先定位真实 Portal
- 路由、Feature、shared、components、hooks、store、providers、layout
- workspace packages 的 public API 和依赖方向

【重点检查】

1. 检查一个 Feature 是否散落在多个全局技术目录
2. 检查 Feature 是否拥有自己的 API、组件、schema、类型、测试和路由
3. 识别 shared/common/utils/components 杂物目录和过早抽象
4. 识别 Feature 间直接访问内部实现、双向依赖和循环依赖
5. 判断 Landing、Auth、Layout、Router、Store、Providers 的命名和职责是否准确
6. 检查 Page 是否承担请求、转换、状态、权限和 UI 等过多责任
7. 检查 Route、Layout、Error Boundary、Loading Boundary 和权限控制的归属
8. 识别深层导入、barrel 循环、shared 依赖 feature、design-system 反向依赖 app
9. 评估 Feature 可删除性、可发现性、内聚性和多人 ownership
10. 不要机械套用 Feature-Sliced Design，先判断当前规模是否需要

【必须输出】

1. 当前目录图与每个主要目录的实际职责
2. Feature 内聚性、模块边界、依赖方向、可删除性、可发现性和团队扩展性评分
3. 问题清单：证据、严重度、是否必须修、推荐位置和迁移成本
4. 目标目录结构，并说明哪些是允许、禁止的内容和依赖方向
5. 选择一个真实 Feature 演示当前结构到目标结构的迁移
6. 给出 ESLint boundaries、restricted imports、循环依赖和 CI 规则示例

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 3. TanStack Query / Server State 专项审查

用于逐项审查 Query、Mutation、缓存生命周期、失效策略和数据一致性。

## 可直接复制执行的 Prompt

你是精通 TanStack Query、HTTP 缓存、异步状态和数据一致性的高级架构师。

请对下面的 PawHaven React Monorepo 执行 “TanStack Query 与 Server State 专项审查”。

【审查范围】

- QueryClient 配置、useQuery、useInfiniteQuery、useSuspenseQuery、queryOptions
- useMutation、prefetchQuery、invalidateQueries、setQueryData、removeQueries
- API request 封装、Router 集成、登录登出与 token 变化后的缓存处理

【重点检查】

1. 建立所有 Query 与 Mutation 的资产清单：Feature、路径、key、queryFn、参数和策略
2. 检查 queryFn 使用的动态参数是否全部进入稳定且分层的 query key
3. 检查 staleTime、gcTime、refetchOnWindowFocus、reconnect、polling 和 enabled
4. 检查 400、401、403、404、429、5xx 的 retry 与错误转换策略
5. 检查 mutation 后 list/detail 更新、精确 invalidation、optimistic rollback 和并发 mutation
6. 检查删除、登录、登出、用户切换后的缓存清理
7. 识别 Query 数据被复制到 Redux、Context 或 local state 的双 source of truth
8. 检查 URL search params 与 query key 的一致性
9. 检查 route prefetch、waterfall、Loader 增量请求和 loading/error boundary
10. 按照仓库实际 TanStack Query 版本审查，不使用过时 API

【必须输出】

1. Query 与 Mutation 资产清单，未配置项标记全局默认或框架默认
2. Query key、缓存、mutation、一致性、错误处理、路由集成和状态边界评分
3. 每个问题的可复现场景、根因、TypeScript 修复和测试
4. 推荐 api 目录：api、query-keys、queries、mutations、schemas
5. P0 到 P3 的可实施改造计划
6. 可直接写入 docs 的 TanStack Query 项目规范

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 4. Client State 与 State Ownership 专项审查

用于建立 Local、Context、Redux、Query、URL、Form 与持久化状态的清晰边界。

## 可直接复制执行的 Prompt

你是负责大型 React 应用状态架构的 Staff Engineer。

请对下面的 PawHaven React Monorepo 执行 “Client State 与 State Ownership 专项审查”。

【审查范围】

- useState、useReducer、React Context、Redux Toolkit
- TanStack Query、Router search params、React Hook Form
- localStorage、sessionStorage 和其他持久化状态

【重点检查】

1. 为每种重要状态判断 owner：Local、Reducer、Context、Redux、Query、URL、Form、Storage 或 Derived
2. 查找 Query 数据复制到 Redux、Context、local state 的情况
3. 查找 props 复制进 state、表单字段双存、URL 和 store 双存
4. 查找 selected object 和 selectedId、filtered list、sorted list 等冗余 derived state
5. 检查 Context value 稳定性、Provider 粒度、高频更新和全局 store 滥用
6. 检查 Redux slice 是否保存 server state 或只服务单页面 UI
7. 判断 dynamic reducer 是否必要、selector 是否稳定、持久化状态是否过期
8. 识别 page、sort、filters、keyword、tab、category、date range 等 URL state
9. 明确每个状态的生命周期、读写位置和唯一 source of truth
10. 不要为了减少 Redux 而强行删除 Redux

【必须输出】

1. 状态资产清单：名称、当前 owner、读写位置、生命周期、推荐 owner 和严重度
2. 完整 State Ownership Matrix
3. 每个重要状态的当前流、故障场景、推荐流和迁移代码
4. 可直接加入 docs/frontend/state-ownership.md 的状态决策树
5. P0 数据泄漏或错误、P1 双 source、P2 不必要全局状态、P3 性能与 DX 的迁移计划

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 5. UI Library 专项审查

用于判断 @pawhaven/ui 的组件成熟度、API、一致性、可访问性和发布治理。

## 可直接复制执行的 Prompt

你是负责企业级 Design System 和 React UI Component Library 的技术负责人。

请对下面的 PawHaven React Monorepo 执行 “@pawhaven/ui 企业级组件库专项审查”。

【审查范围】

- packages/ui、packages/design-system，以及 Portal 的消费方式
- package exports、types、sideEffects、peerDependencies、构建和测试
- Portal 是否绕过 @pawhaven/ui 直接导入 Material UI

【重点检查】

1. 建立所有公开组件资产清单：入口、底层依赖、业务规则、token、ref、原生属性、测试和文档
2. 检查 controlled/uncontrolled、value/defaultValue/onChange、size/variant/loading/error 等 API 一致性
3. 识别暴露 MUI 细节、boolean props 爆炸、过长 props 和业务实体进入基础组件
4. 将组件分类为 Primitive、Headless、Foundation、Composite、Pattern、Feature-specific
5. 检查 ARIA、label、键盘、focus、Dialog、screen reader、contrast、reduced motion
6. 检查硬编码颜色、primitive 混写、inline style、任意 Tailwind 值、sx/Tailwind/CSS 混用
7. 检查 tree-shaking、subpath exports、barrel 循环、CSS sideEffects 和依赖重复打包
8. 检查 Storybook、交互测试、a11y、视觉回归、主题和响应式组件
9. 检查 SemVer、Changesets、changelog、deprecation、migration 和 codemod
10. 判断它是共享组件目录、UI Kit、可治理组件库，还是完整 Design System 实现

【必须输出】

1. 总体成熟度级别和评分
2. 逐组件成熟度：复用、API、一致性、a11y、测试、主题、维护性
3. 问题清单：证据、推荐 API、breaking change、兼容迁移和测试
4. 目标组件目录与 public exports 策略
5. UI Library Governance Plan：准入、review、owner、版本、发布和质量门禁
6. 按 P0 到 P3 排序的高收益低 breaking risk 路线图

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 6. Design Token 专项审查

用于建立 primitive、semantic、component 与 theme token 的分层和生成管道。

## 可直接复制执行的 Prompt

你是负责单一主题和跨平台 Design Token 架构的 Design System Engineer。

请对下面的 PawHaven React Monorepo 执行 “@pawhaven/design-system 与 Design Token 专项审查”。

【审查范围】

- packages/design-system、apps/frontend/portal/src/shared/utils/rescueStatus/*.css、CSS custom properties
- Tailwind theme、@pawhaven/ui 和 Portal 的 token 消费
- color、breakpoint、spacing、typography、elevation、motion、z-index

【重点检查】

1. 提取 Color、Typography、Spacing、Size、Border、Radius、Shadow、Elevation、Breakpoint、Z-index、Motion、Opacity、Icon 和组件 token
2. 为每个 token 记录名称、值、定义、消费组件、层级、主题映射、重复和硬编码
3. 检查 primitive 是否泄漏到产品代码、scale 是否重复或不规则
4. 检查 semantic token 是否被用途命名、在每一种用途下语义是否仍成立
5. 判断 Button、Input、Dialog、Card 等同时需要 component token，避免过少或过度 token 化
6. 检查首屏闪烁和 reduced motion
7. 检查 Tailwind arbitrary values、CSS variable 绕过、breakpoint 不一致和反向扫描 app
8. 检查 palette、spacing、typography、shape 是否来自统一 source
9. 检查 TypeScript 类型提示、schema validation、unused/deprecated/breaking 检测
10. 检查命名、deprecation、changelog、owner、设计到代码工作流和生成管道

【必须输出】

1. 分层、命名、主题、Tailwind、MUI、类型安全和治理评分
2. 真实 Token Inventory
3. 每个问题的旧 token、推荐 token、影响组件和现营 breaking risk
4. 目标 tokens/primitive、semantic、component、themes 架构
5. JSON source、CSS 输出、Tailwind mapping、MUI mapping 和 TypeScript 类型示例
6. old token 到新 token 的 Migration Map
7. 允许 alias 共存、可独立合并和回滚的分阶段迁移方案

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 7. 测试体系专项审查

用于基于业务风险设计 Unit、Component、Integration、E2E、A11y 与 Visual 测试体系。

## 可直接复制执行的 Prompt

你是负责大型 Web 平台质量工程、测试架构和 CI 质量门禁的 QA Architect。

请对下面的 PawHaven React Monorepo 执行 “前端测试体系与 CI 质量门禁专项审查”。

【审查范围】

- Portal、@pawhaven/ui 和 @pawhaven/design-system
- Vitest/Jest、React Testing Library、Playwright、MSW、axe、Storybook
- CI workflow、coverage、visual regression、contract testing

【重点检查】

1. 建立测试资产清单：路径、类型、对应生产代码、场景、mock、CI 和 flaky 风险
2. 检查函数、schema、转换和权限规则的 Unit Test 价值
3. 检查 Component Test 是否基于用户行为，覆盖 loading/empty/error/success、键盘和 focus
4. 检查 Feature Integration 是否一般验证 Query、Form、Router、UI 和缓存更新
5. 检查 E2E 是否覆盖关键旅程、稳定 selector、数据隔离、并行、trace、video 和 screenshot
6. 检查 axe、键盘、focus order、form error、Dialog、reduced motion 和人工 a11y 项
7. 检查响应式、交互状态的 Visual Regression 和 baseline 审查
8. 检查 Zod/OpenAPI、mock response 和前后端 schema 漂移的 Contract Test
9. 划分 PR、main、nightly、release 各自执行的门禁
10. 避免只追求覆盖率或在多个层重复测试同一行为

【必须输出】

1. Unit、Component、Integration、E2E、A11y、Visual、Contract、CI 和总体评分
2. 真实测试资产地图
3. 每个模块的业务风险、推荐层级、TypeScript 示例和是否阻断 PR
4. 围绕真实 Feature 的测试矩阵
5. 适合当前项目的测试金字塔与 “不应该测试什么”
6. PR/main/nightly/release pipeline 和 flaky 隔离策略
7. P0 到 P3 的改造路线图

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 8. 长期可维护性与 ARB 专项审查

用于从团队扩张、依赖方向、变化失败风险和治理能力审查长期维护性。

## 可直接复制执行的 Prompt

你是企业架构评审委员会的 Principal Engineer。

请对下面的 PawHaven React Monorepo 执行 “长期可维护性与 Architecture Review Board 审查”。

【审查范围】

- Portal、共享 packages、frontend-core、ui、design-system
- 状态流、数据流、路由流、构建依赖和测试
- ADR、CODEOWNERS、package boundaries、CI fitness functions

【重点检查】

1. 评估修改一个功能触碰的目录和 package 数量，识别强耦合修改和隐式约定
2. 分析 Feature 内聚、包间耦合、UI 与业务 API 与组件、design-system 与 app 的耦合
3. 绘制 app、feature、frontend-core、ui、design-system、shared 的真实依赖方向
4. 识别反向依赖、横向耦合、深层导入、barrel 和 public API 违规
5. 分析缓存、主题、视觉、路由、权限、用户状态、构建和版本的变化失败风险
6. 评估本地自动、环境变量、runtime config、构建版本、HMR、typecheck、测试和 onboarding
7. 检查 ADR、owner、CODEOWNERS、版本、changelog、deprecation 和 quality gates
8. 模拟 1、5、20、50 名工程师时的冲突、扩展和治理问题
9. 判断是否需要平台团队、Design System 团队、独立发布或裁剪前端，并说明条件
10. 设计可加入 CI 的架构 fitness functions

【必须输出】

1. ARB 执行摘要：总体评分、三大风险、三项优点和附条件批准结论
2. 真实架构地图：package、data、state、UI、build
3. Architecture Risk Register：概率、影响、可探测性、owner、缓解和剩余风险
4. 1、5、20、50 人团队规模风险
5. 按收益 / 实施成本排序的 Top 20 高 ROI 修改
6. 3、6、12 个月路线图和各阶段不应做的事项
7. 可直接实施的 CI Architecture Fitness Functions

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。

---

# 9. 最终综合审查与 Backlog 生成

用于综合专项报告、合并根因、排序高 ROI 修改并生成 GitHub Backlog。

## 可直接复制执行的 Prompt

你是覆盖 React、TanStack Query、Redux、Router、Design System、UI Library、Accessibility、Testing、CI/CD 和 Monorepo 的企业级前端架构评审小组。

请对下面的 PawHaven React Monorepo 执行 “完整前端架构综合审查与改造 Backlog 生成”。

【审查范围】

- 仓库真实代码和前八份专项审查报告
- workspace、Portal、Providers、Routes、Slices、Contexts、Queries、UI、Tokens、Tests、CI
- 不只是根据 README 或依赖清单得出结论

【重点检查】

1. 第一阶段只建立事实：workspace、依赖、Provider、路由、状态、Query、组件、token、测试和 CI
2. 第二阶段绘制 package、state、data、routing、UI、token 和 test coverage 地图
3. 第三阶段对 React、Feature、Server State、Client State、Routing、UI、Token、A11y、Testing、Performance、DX、CI 和维护性评分
4. 第四阶段将特别重复问题合并为根因，不重复计数
5. 第五阶段按用户影响、数据正确性、安全、维护成本、团队扩展、成本、breaking risk 和可回滚性排序
6. 每个改进包含证据、文件、步骤、验收、测试、工作量、风险、依赖和是否可独立提交
7. 禁止默认依赖前端、默认删除 Redux、默认共享组件都进入 UI Library
8. 禁止一次性重写或把风格偏好描述成架构缺陷

【必须输出】

1. Executive Summary
2. Architecture Scorecard
3. Top 20 高 ROI 修改
4. P0/P1/P2/P3 Backlog
5. 3 个月实施路线图
6. 目标架构图
7. 最重要五项决策的 ADR
8. 前 10 项改进对应的 GitHub Issues：标题、背景、范围、非目标、建议、验收、测试、风险和标签

【统一执行要求】

1. 必须先读取真实代码、配置和测试，再得出结论。
2. 每个问题必须给出文件路径、相关 symbol，以及可以定位的代码证据或行号。
3. 不得仅根据 package.json 出现某个依赖，就判断该技术已被正确使用。
4. 明确区分「已确认问题」「高概率风险」「源码不足无法确认」。
5. 不给与当前仓库无关的通用建议，不机械套用大型公司的架构。
6. 每项建议都说明：为什么改、改哪些文件、如何改、预期收益、副作用、迁移成本。
7. 代码示例使用 TypeScript，并适配仓库当前技术栈和版本。
8. 优先提供可独立合并、可测试、可回滚的小步改造，不建议一次性重写。
9. 工作量统一标记为 XS、S、M、L、XL；严重度统一标记为阻断、高、中、低。
10. 最终给出验收标准和需要新增或调整的测试。
