# Design Token 专项审查与重构记录

> 审查基线：`main`，工作分支：`refactor/design-token-audit`
> 范围：`packages/design-system`、Tailwind v4 token mapping、`@pawhaven/ui`、Portal 的样式入口、token-check 与 token build pipeline。
> 证据状态：本报告只把已读取源码能证明的内容列为“已确认”；未能完整扫描整个仓库运行时结果的项目标为“待验证”。

## 1. 执行摘要

当前成熟度：**已有 token 基础设施，但尚未形成完整、可验证的 Design Token 平台**。

已有优点：
- Primitive tokens 按颜色、间距、边框、圆角、阴影、动效、断点、透明度、尺寸、z-index、字体拆分，入口集中在 `packages/design-system/src/tokens/index.css`。
- `src/theme.css` 建立了语义别名；`src/utilities.css` 以 Tailwind v4 `@utility` 暴露复合 utility。
- Portal、UI 与 frontend-core 的 CSS 入口均导入 design-system；Portal 的 `src/app/index.css` 声明了自身 `@source`，UI 的 `index.css` 声明了 UI 源码扫描范围。
- 根目录和 pre-commit 已配置 token 检查入口。

主要风险：
1. **组件级 token 定义了却未被组件 utility 使用**：`theme.css` 定义 `--radius-card`、`--radius-input`、`--shadow-card`，但 `card` 和 `input-field` 仍直接引用 primitive。
2. **token-check 已补充基础 Token Contract 检查，但仍非完整 schema validator**：现已检查 Design System CSS 中未定义的 `var(--...)` 引用和循环 alias，并输出重复定义警告；尚未提供 JSON schema、TypeScript token 类型生成或 unused token 的可靠静态分析。
3. **历史违规曾被文件路径/行号白名单跳过**：已将 suppression 改为带原因、owner、到期日期的 JSON manifest；本分支同时修复了原有 9 项 suppression 对应的静态 inline style、palette utility、arbitrary px 和 unknown classname，因此当前 manifest 已清空。
4. **没有发现显式 dark theme 映射**：已读取的 `src/theme.css` 只有默认 `@theme` 映射；在本次检查的文件中未发现 dark theme override。需全仓验证主题切换是否在其他入口实现。
5. **token build 脚本耦合 pnpm 内部目录结构**：`scripts/build-tokens.mjs` 直接遍历 `node_modules/.pnpm` 并拼接 CLI 内部路径，且 package manifest 未声明 `@tailwindcss/cli` 为直接依赖；干净安装和 pnpm 布局变化可能导致构建失败。
6. **文档与实际 token API 存在漂移风险**：README 示例使用 `rounded-xl`、`text-3xl` 等 primitive utility，同时声明颜色/字体/阴影使用 semantic tokens；规则需要明确区分“语义决策 token”和允许使用的结构尺度。

## 2. 实际 Token Inventory（源码确认）

| 层级 | 位置 | 已确认内容 | 观察 |
|---|---|---|---|
| Primitive | `src/tokens/color.css` | gray/orange/green/red/yellow/blue/brown 颜色阶梯 | primitive 颜色直接在 CSS 定义 |
| Primitive | `src/tokens/typography.css` | font family、font size、line-height、tracking、weight | 字体角色和尺寸尺度同时存在 |
| Primitive | `src/tokens/spacing.css` | spacing scale、container widths | 数值并非标准 Tailwind spacing 对照表；不应在未确认设计意图前批量重映射 |
| Primitive | `src/tokens/sizing.css` | size scale、`--size-95`、`--size-130` | 后两项是 Figma 特定尺寸，需要确认是否应改为语义尺寸 |
| Primitive | `src/tokens/radius.css` | xs 到 full radius | 有完整基础尺度 |
| Primitive | `src/tokens/shadow.css` | shadow colors 与 xs 到 xl | shadow color 作为 color namespace token 暴露 |
| Primitive | `src/tokens/motion.css` | duration、easing、paw-bounce animation | 已有 motion scale 与 mascot 动画 |
| Primitive | `src/tokens/breakpoint.css` | xs 到 2xl | Tailwind breakpoint token 已定义 |
| Primitive | `src/tokens/opacity.css` | opacity scale | 已定义 |
| Primitive | `src/tokens/border.css` | border widths | 已定义 |
| Primitive | `src/tokens/z-index.css` | z-index 0/10/20/30/40/50/auto | primitive 层级与 semantic 层级并存 |
| Semantic | `src/theme.css` | brand、surface、text、border、status、rescue status、spacing、z-index、radius、shadow、typography aliases | 部分业务语义 token 与通用语义 token 混在同一文件 |
| Component / utility | `src/utilities.css` | button、card、input、focus、link、composite typography utilities | 存在定义但未消费组件级 alias 的情况 |
| Theme output | `index.css` | Tailwind、tokens、theme、utilities 的导入顺序 | 主题层级顺序明确 |
| Consumer | Portal/UI CSS entry | 导入 design-system 并声明 `@source` | consumer 负责内容扫描的设计已写入注释 |

## 3. 已确认问题与建议

### DT-01 — Component token 未用于对应 utility
- 严重度：中；工作量：XS；状态：已在本分支修复
- 证据：`src/theme.css` 定义 `--radius-card`、`--radius-input`、`--shadow-card`；`src/utilities.css` 的 `card` 仍使用 `--radius-lg` / `--shadow-sm`，`input-field` 仍使用 `--radius-md`。
- 根因：语义别名已建立，但 utility 仍绑定 primitive。
- 修复：card 使用 `--radius-card` 和 `--shadow-card`；input-field 使用 `--radius-input`。
- 收益：未来调整组件视觉只需改 component token，减少隐式耦合。
- 风险：当前 alias 指向相同 primitive，预期无视觉变化。
- 验收：CSS 构建成功；组件视觉回归无差异。

### DT-02 — Token 检查器依赖行号白名单
- 严重度：高；工作量：M；状态：已实施第一阶段
- 证据：`scripts/token-check.cjs` 的 `KNOWN_VIOLATIONS` 以 `path:line:rule` 为 key，匹配后直接跳过；注释称它是 combined token/style gate。
- 已实施：新增 `packages/design-system/scripts/token-suppressions.json`，每项要求 `key`、`reason`、`owner`、`expiresOn`；检查器统计 suppression 数量，并让过期 suppression 重新成为失败项。本分支清理了已知 9 项违规并将 manifest 清空。
- 验证要求：重新运行 `pnpm token-check`，确认 `legacy violations suppressed` 为 0，并处理新扫描发现的其他违规。

### DT-03 — 检查器未验证 token 系统自身
- 严重度：高；工作量：M；状态：已实施基础检查
- 证据：检查器的 `TARGETS` 仅为 `apps/frontend` 与 `packages/ui`；它从 token 文件收集自定义属性名，但不验证 `var(--x)` 引用是否存在，也不检查主题 alias 的引用图。
- 已实施：检查器现在扫描 Design System 的 token、theme、utilities 和 CSS 入口，失败于未定义的 CSS variable 引用及循环 alias，并报告重复定义。重复定义目前只警告；token namespace 分类、unused token 分析和 schema validation 仍待补齐。
- 验收待执行：注入不存在的 token 引用和循环 alias 的 fixture 时检查失败；有效 token fixture 通过。当前尚未在实际工作区执行脚本。

### DT-04 — Theme coverage 不足以证明支持 light/dark
- 严重度：中；工作量：M/L；状态：待全仓验证
- 证据：`src/theme.css` 只有默认 `@theme` 映射；全仓代码搜索未发现 `[data-theme="dark"]`、`.dark`、`prefers-color-scheme` 或运行时代码中的 theme persistence。搜索到的 `localStorage theme` 命中仅在架构 Prompt 文档中。
- 结论：当前证据不支持“已实现 dark mode”的说法；是否需要 dark mode 仍取决于产品需求。
- 建议：不要在本次 token 修复中擅自引入主题切换。若产品要求 dark mode，应新增 semantic token override，并验证初始化、持久化、hydration 和首屏闪烁。
- 验收：如果支持 dark mode，覆盖 system/light/dark、刷新后持久化和首屏闪烁；如果不支持，在设计系统文档明确当前仅提供默认主题。

### DT-05 — Token build 脚本依赖 pnpm 内部实现
- 严重度：中；工作量：S；状态：已实施，待运行验证
- 证据：`scripts/build-tokens.mjs` 扫描 `node_modules/.pnpm` 并拼接 `@tailwindcss/cli/dist/index.mjs`；`packages/design-system/package.json` 未声明 `@tailwindcss/cli` 直接依赖。
- 已实施：声明 `@tailwindcss/cli: ^4.1.14`，将 `pnpm-lock.yaml` 中 `packages/design-system` importer 同步到已锁定的 4.3.3，并改用 `pnpm exec tailwindcss`。
- 验收待执行：干净安装后运行 token build，确认不依赖本地已有的间接依赖或特定 store 布局。

### DT-06 — Primitive/semantic/component 边界需要正式化
- 严重度：中；工作量：S；状态：待实施
- 证据：`theme.css` 同时包含通用语义（text/surface/border）、业务状态（rescue status）、布局语义（gutter/section）、组件 token（radius-card/input）和排版角色。
- 建议：先稳定公开名称，按 `tokens/primitives`、`tokens/semantic`、`tokens/components` 组织源文件；通过现有入口保持兼容，不要一次性重命名所有 CSS variables。
- 风险：文件搬迁会影响 token build、检查器路径和消费者；应先调整工具支持，再迁移文件。

### DT-07 — Tailwind / MUI 双主题源尚未得到证据闭环
- 严重度：待确认；工作量：M；状态：源码不足
- 证据：GitHub 代码搜索对 `@mui/material` 与 `createTheme` 均为 0 命中；Portal 与 `packages/ui` 的 package manifest 均未声明 MUI 依赖；源码树中未发现独立 MUI theme 文件。
- 结论：当前可见证据表明 Portal/UI 没有活跃的 MUI theme 消费链；不应仅为满足模板而新增第二套 MUI theme。
- 建议：如果后续引入 MUI 组件，必须先确定其实际消费者，再将 palette/typography/shape 映射到稳定 semantic tokens，并增加 parity test。

## 4. 当前分层建议

- **Primitive**：原始调色板、spacing/size、radius、border width、shadow、font metrics、breakpoint、z-index、motion、opacity。只供主题映射和低层设计系统实现消费。
- **Semantic**：`color.background`、`color.surface`、`color.text.primary`、`color.border.default`、`color.action.primary`、`color.status.*`、`typography.body` 等表达用途，不表达具体色阶。
- **Component**：`button.*`、`input.*`、`card.*`、`dialog.*` 等组件决策 token。仅在多个状态/变体确实需要独立治理时引入，避免把每个 CSS 属性都 token 化。
- **Theme**：主题仅负责把 semantic token 映射到 primitive；组件不直接选择 palette 色阶。
- **Compatibility**：保留当前 CSS variable 名称作为兼容层；迁移完成后再评估 deprecated aliases，不在第一步做 breaking rename。

## 5. Migration Map

| 当前 | 推荐 | 迁移策略 |
|---|---|---|
| `--color-orange-6` 等 palette primitives 被产品组件直接使用 | semantic color token | 禁止新增；逐项迁移旧用法 |
| `card` utility 直接引用 `--radius-lg` / `--shadow-sm` | `--radius-card` / `--shadow-card` | 已修复 |
| `input-field` utility 直接引用 `--radius-md` | `--radius-input` | 已修复 |
| 行号白名单 `KNOWN_VIOLATIONS` | 带原因/owner/到期条件的 suppression manifest | 先报告，再分批清零 |
| pnpm 内部路径拼接 | 声明的 CLI package / bin | 独立修复并用 clean install 验证 |
| 单文件混合 semantic 与 component aliases | 拆分源文件并保持旧变量 alias | 工具先行，最后迁移 |

## 6. 实施顺序

1. **本次低风险修改**：让现有 component utility 消费已定义的 component tokens。
2. **下一步 M 级修改**：重构 token-check，先以 report-only 模式提供新规则的基线，再按新违规阻断。
3. **独立修复 token build pipeline**：声明 CLI 依赖并验证 clean install。
4. **主题能力盘点**：确认 dark mode 是需求还是未实现能力，避免无依据地引入主题切换。
5. **文件分层迁移**：只有在检查器、构建和兼容策略就绪后，才拆分 primitive/semantic/component 源文件。
6. **消费侧迁移**：清理 Portal/UI 的 palette 色阶、硬编码色值、静态 inline style 和 arbitrary px；逐项更新测试与视觉基线。

## 7. 验收标准与测试计划

- [ ] `pnpm --filter @pawhaven/design-system token-check` 通过，并记录扫描文件数和 suppressions。
- [ ] `pnpm --filter @pawhaven/design-system build:tokens` 在干净安装后通过。
- [ ] CSS 产物中无未解析的 design token variable。
- [ ] semantic token 不循环引用 primitive/semantic alias。
- [ ] component utilities 消费 component tokens，而非绕过它们直接依赖 primitive。
- [ ] light/dark 结论与真实产品需求一致；若支持 dark mode，验证 system preference、切换、刷新和首屏。
- [ ] 对主要组件执行 light/dark、响应式和 focus state 视觉回归。
- [ ] 新增 token 的命名、用途、owner、弃用策略可被审查；旧变量迁移具备 alias 与回滚路径。

## 8. 限制

本轮基于 GitHub 文件读取与代码搜索开展；没有在实际工作区执行 pnpm build、token-check、typecheck 或浏览器视觉回归。因此不把任何检查标记为“已通过”。报告中的未发现项是“当前证据不足”，不是断言仓库中不存在。


## 9. 本分支实际实施记录

以下修改已提交到 `refactor/design-token-audit`：

- `packages/design-system/src/utilities.css`：`card` 使用 `--radius-card` / `--shadow-card`；`input-field` 使用 `--radius-input`。
- `packages/design-system/scripts/token-check.cjs`：增加 CSS variable 引用完整性和 alias cycle 检查；输出重复定义提示；读取带 metadata 与到期日期的 suppression manifest。
- `packages/design-system/scripts/token-suppressions.json`：新增后已清空。原有 9 项对应违规已在组件样式中迁移。
- `packages/design-system/package.json` 与 `pnpm-lock.yaml`：显式声明并锁定 Tailwind CLI。
- `packages/design-system/scripts/build-tokens.mjs`：移除直接扫描 `node_modules/.pnpm` 的逻辑，改用 package-local `pnpm exec tailwindcss`。
- `packages/design-system/src/theme.css`：新增 `--color-footer-secondary` 语义 token。
- `AdoptablePetsSection.tsx`：将水平滚动吸附从静态 inline style 迁移到 `snap-x snap-mandatory`。
- `PetCard.tsx`：将卡片吸附、领养状态、图标背景/文本和 hover 状态迁移到 utility 与 semantic tokens。
- `RootLayoutFooter.tsx`：将原始 `text-brown-7` palette class 迁移为 `text-footer-secondary`。
- `Button.tsx`：将 `focus-visible:ring-[3px]` 改为 Tailwind 的 `focus-visible:ring-3` utility。

## 10. 本次尚未完成 / 未验证的事项

- 未在真实工作区执行 `pnpm token-check`、`pnpm --filter @pawhaven/design-system build:tokens`、TypeScript 检查、React Doctor 或浏览器视觉回归。
- 已新增 `scripts/token-contract.test.cjs`：覆盖有效 alias、undefined variable 失败和循环 alias 失败；由独立 token validation workflow 执行。
- MUI/theme 证据盘点已补充：`@mui/material` / `createTheme` 搜索均无命中，Portal/UI manifest 无 MUI 依赖；未发现运行时 dark mode 状态流。high contrast 与 reduced-motion 的实际行为仍需浏览器/a11y 验证。
- 尚未生成 JSON token source、schema validation 或 TypeScript token types；当前 CSS 仍是 source of truth。
- 原始 token scale 的重复、不规则性与所有消费点尚未形成完整机器可读 inventory。

因此，本分支的静态改动已落地，但合并前仍必须通过实际 CI 与视觉验证；不得将未运行的验证视为通过。


## 11. 目标 Token API 示例（设计提案，尚未接入构建）

以下示例满足本专项 Prompt 对 JSON source、CSS output、Tailwind mapping、MUI mapping 和 TypeScript 类型示例的要求。**它们是目标方案，不代表本分支已经将 JSON 改为 source of truth。** 目前项目仍以 CSS 为实际 token 定义来源。

### 11.1 JSON source 示例

建议未来将 token source 拆成 primitive 与 semantic，并保留稳定 ID。不要把每一个 Tailwind spacing 值都重复录入 JSON；只有设计决策需要跨平台共享的 token 才应进入 source。

```json
{
  "primitive": {
    "color": {
      "orange": {
        "600": { "value": "#f7823a", "type": "color" }
      },
      "gray": {
        "100": { "value": "#ffffff", "type": "color" },
        "900": { "value": "#2f2f2f", "type": "color" }
      }
    },
    "radius": {
      "sm": { "value": "4px", "type": "dimension" },
      "lg": { "value": "12px", "type": "dimension" }
    }
  },
  "semantic": {
    "color": {
      "action": {
        "primary": {
          "value": "{primitive.color.orange.600}",
          "type": "color"
        }
      },
      "text": {
        "primary": {
          "value": "{primitive.color.gray.900}",
          "type": "color"
        }
      },
      "surface": {
        "card": {
          "value": "{primitive.color.gray.100}",
          "type": "color"
        }
      }
    },
    "component": {
      "card": {
        "radius": {
          "value": "{primitive.radius.lg}",
          "type": "dimension"
        }
      }
    }
  }
}
```

在引入 JSON source 前，必须先决定 token transformation 工具、引用语法、校验 schema、CSS 变量命名和现有 CSS 的兼容策略；不要在 CSS 与 JSON 两边手工维护同一份 token。

### 11.2 CSS output 示例

```css
:root {
  --primitive-color-orange-600: #f7823a;
  --primitive-color-gray-100: #ffffff;
  --primitive-color-gray-900: #2f2f2f;
  --primitive-radius-sm: 4px;
  --primitive-radius-lg: 12px;

  --color-action-primary: var(--primitive-color-orange-600);
  --color-text-primary: var(--primitive-color-gray-900);
  --color-surface-card: var(--primitive-color-gray-100);
  --card-radius: var(--primitive-radius-lg);
}
```

当前项目已使用 `--color-primary`、`--color-text`、`--radius-card` 等公开名称。若未来采用上述命名，必须通过兼容 alias 和分阶段迁移实现，不能直接替换现有名称。

### 11.3 Tailwind v4 mapping 示例

```css
@theme {
  --color-primary: var(--color-action-primary);
  --color-text: var(--color-text-primary);
  --color-surface: var(--color-surface-card);
  --radius-card: var(--card-radius);
}
```

Tailwind mapping 只应将稳定的语义 token 暴露为 utility namespace；产品组件不应因方便而重新选择 primitive palette。

### 11.4 MUI mapping 示例（仅在确认 MUI 仍是实际消费者后采用）

```ts
import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    primary: { main: 'var(--color-action-primary)' },
    text: { primary: 'var(--color-text-primary)' },
    background: { paper: 'var(--color-surface-card)' },
  },
  shape: {
    borderRadius: 12,
  },
});
```

该示例只说明映射方向，不应直接复制为生产实现：MUI palette 对颜色值的运算、组件状态与 CSS variable 支持需要结合当前 MUI 版本验证。若 Portal 已不再消费 MUI，则不应为它保留第二套 theme 层。

### 11.5 TypeScript API 示例

```ts
export const semanticTokens = {
  color: {
    action: {
      primary: 'var(--color-action-primary)',
    },
    text: {
      primary: 'var(--color-text-primary)',
    },
    surface: {
      card: 'var(--color-surface-card)',
    },
  },
  component: {
    card: {
      radius: 'var(--card-radius)',
    },
  },
} as const;

export type SemanticTokens = typeof semanticTokens;
export type SemanticColorPath =
  | 'color.action.primary'
  | 'color.text.primary'
  | 'color.surface.card';
```

正式生成类型时应从 JSON schema 或 token source 自动生成，避免手写类型与 CSS 变量再次漂移。生成结果应包含已废弃 token 标记或兼容映射，并在 breaking change 时配套迁移说明。

## 12. 机器可读前的源码 Token 清单（本分支静态盘点）

本节从当前分支的 CSS 定义逐个提取 token 名称；Primitive 源文件共 **203 个定义**（按定义出现次数计数，不代表唯一 token 数）。语义层 `src/theme.css` 提取到 **81 个定义**，utility 层 `src/utilities.css` 提取到 **0 个自定义属性定义**。这些数量是源码盘点结果，不是 schema 验证结果；重复定义、主题覆盖和实际消费关系仍需结合检查器与消费点确认。

| 源文件 | 定义数 | Token 名称 |
|---|---:|---|
| `src/tokens/color.css` | 70 | `--color-gray-1`, `--color-gray-2`, `--color-gray-3`, `--color-gray-4`, `--color-gray-5`, `--color-gray-6`, `--color-gray-7`, `--color-gray-8`, `--color-gray-9`, `--color-gray-10`, `--color-orange-1`, `--color-orange-2`, `--color-orange-3`, `--color-orange-4`, `--color-orange-5`, `--color-orange-6`, `--color-orange-7`, `--color-orange-8`, `--color-orange-9`, `--color-orange-10`, `--color-green-1`, `--color-green-2`, `--color-green-3`, `--color-green-4`, `--color-green-5`, `--color-green-6`, `--color-green-7`, `--color-green-8`, `--color-green-9`, `--color-green-10`, `--color-red-1`, `--color-red-2`, `--color-red-3`, `--color-red-4`, `--color-red-5`, `--color-red-6`, `--color-red-7`, `--color-red-8`, `--color-red-9`, `--color-red-10`, `--color-yellow-1`, `--color-yellow-2`, `--color-yellow-3`, `--color-yellow-4`, `--color-yellow-5`, `--color-yellow-6`, `--color-yellow-7`, `--color-yellow-8`, `--color-yellow-9`, `--color-yellow-10`, `--color-blue-1`, `--color-blue-2`, `--color-blue-3`, `--color-blue-4`, `--color-blue-5`, `--color-blue-6`, `--color-blue-7`, `--color-blue-8`, `--color-blue-9`, `--color-blue-10`, `--color-brown-1`, `--color-brown-2`, `--color-brown-3`, `--color-brown-4`, `--color-brown-5`, `--color-brown-6`, `--color-brown-7`, `--color-brown-8`, `--color-brown-9`, `--color-brown-10` |
| `src/tokens/typography.css` | 32 | `--font-sans`, `--font-heading`, `--font-serif`, `--font-handwriting`, `--font-size-xs`, `--font-size-sm`, `--font-size-base`, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`, `--font-size-3xl`, `--font-size-4xl`, `--font-size-5xl`, `--font-size-6xl`, `--leading-none`, `--leading-tight`, `--leading-snug`, `--leading-normal`, `--leading-relaxed`, `--leading-loose`, `--leading-display`, `--tracking-tighter`, `--tracking-tight`, `--tracking-normal`, `--tracking-wide`, `--tracking-wider`, `--tracking-widest`, `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`, `--font-weight-extrabold` |
| `src/tokens/spacing.css` | 20 | `--spacing-px`, `--spacing-0`, `--spacing-1`, `--spacing-2`, `--spacing-3`, `--spacing-4`, `--spacing-5`, `--spacing-6`, `--spacing-7`, `--spacing-8`, `--spacing-9`, `--spacing-10`, `--spacing-12`, `--spacing-14`, `--spacing-16`, `--container-sm`, `--container-md`, `--container-lg`, `--container-xl`, `--container-2xl` |
| `src/tokens/sizing.css` | 19 | `--size-0`, `--size-px`, `--size-1`, `--size-2`, `--size-3`, `--size-4`, `--size-6`, `--size-8`, `--size-10`, `--size-12`, `--size-16`, `--size-20`, `--size-24`, `--size-full`, `--size-min`, `--size-max`, `--size-fit`, `--size-95`, `--size-130` |
| `src/tokens/border.css` | 5 | `--border-width-0`, `--border-width-1`, `--border-width-2`, `--border-width-4`, `--border-width-8` |
| `src/tokens/radius.css` | 8 | `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl`, `--radius-full` |
| `src/tokens/shadow.css` | 14 | `--color-shadow`, `--color-shadow-light`, `--color-shadow-medium`, `--color-shadow-strong`, `--color-shadow-heavy`, `--color-shadow-dark`, `--color-shadow-inner`, `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-inner`, `--shadow-none` |
| `src/tokens/breakpoint.css` | 6 | `--breakpoint-xs`, `--breakpoint-sm`, `--breakpoint-md`, `--breakpoint-lg`, `--breakpoint-xl`, `--breakpoint-2xl` |
| `src/tokens/motion.css` | 16 | `--duration-75`, `--duration-100`, `--duration-150`, `--duration-200`, `--duration-300`, `--duration-500`, `--duration-700`, `--duration-1000`, `--ease-in`, `--ease-out`, `--ease-in-out`, `--ease-standard`, `--ease-decelerate`, `--ease-accelerate`, `--ease-bounce`, `--animate-paw-bounce` |
| `src/tokens/opacity.css` | 6 | `--opacity-0`, `--opacity-25`, `--opacity-50`, `--opacity-75`, `--opacity-90`, `--opacity-100` |
| `src/tokens/z-index.css` | 7 | `--z-index-0`, `--z-index-10`, `--z-index-20`, `--z-index-30`, `--z-index-40`, `--z-index-50`, `--z-index-auto` |

### Semantic/theme aliases

`--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-light`, `--color-primary-subtle`, `--color-primary-fg`, `--color-secondary`, `--color-secondary-hover`, `--color-secondary-active`, `--color-secondary-light`, `--color-background`, `--color-foreground`, `--color-muted`, `--color-accent`, `--color-accent-foreground`, `--color-card`, `--color-adoptable-bg`, `--color-adoptable-text`, `--color-surface`, `--color-background-subtle`, `--color-muted-strong`, `--color-text`, `--color-text-secondary`, `--color-text-tertiary`, `--color-text-placeholder`, `--color-text-inverse`, `--color-text-link`, `--color-border`, `--color-border-hover`, `--color-border-strong`, `--color-border-focus`, `--color-border-error`, `--color-divider`, `--color-hero-bg`, `--color-nav-bg`, `--color-dark-text`, `--color-body-text`, `--color-stat-labels`, `--color-footer-text`, `--color-footer-muted`, `--color-footer-secondary`, `--color-footer-bg`, `--color-error`, `--color-error-light`, `--color-success`, `--color-success-light`, `--color-warning`, `--color-warning-light`, `--color-warning-hover`, `--color-info`, `--color-info-light`, `--color-rescue-status-pending`, `--color-rescue-status-inProgress`, `--color-rescue-status-treated`, `--color-rescue-status-recovering`, `--color-rescue-status-awaitingAdoption`, `--color-rescue-status-adopted`, `--color-rescue-status-failed`, `--spacing-gutter`, `--spacing-section`, `--spacing-card`, `--spacing-input`, `--z-index-base`, `--z-index-dropdown`, `--z-index-sticky`, `--z-index-overlay`, `--z-index-modal`, `--z-index-notification`, `--z-index-toast`, `--radius-input`, `--radius-button`, `--radius-card`, `--radius-dialog`, `--shadow-card`, `--shadow-dropdown`, `--shadow-modal`, `--shadow-toast`, `--text-display`, `--text-stat`, `--text-body`, `--text-caption`

### Utility/component-level custom properties

未发现自定义属性定义。

### 盘点限制与下一步

- 当前清单记录的是 CSS 定义资产；还未把每个 token 与消费文件、消费组件、主题映射、重复定义、deprecated 状态建立完整关系。
- `--size-95`、`--size-130` 等特殊尺寸应先查实际消费点和设计稿用途，不在缺少证据时批量重命名。
- 目前 CSS 仍是 source of truth。不要在 JSON 和 CSS 两边人工维护相同值；只有在引入 schema、生成器、兼容 alias 与迁移策略后，才切换到 JSON/Design Tokens Format source。
- MUI 目标映射仍是提案；在仓库内确认实际 MUI consumer 与主题入口之前，不创建第二套生产 theme。

## 13. CI 验证记录（2026-10-19）

- 独立工作流：`.github/workflows/design-token-validation.yml`
- 验证提交：`2d66f2096c6f1f41c52aeff9917f088b44a035e7`
- GitHub Actions：Design Token Validation run `39206132558`，结论 **success**。
- `pnpm token-check`：通过；扫描 155 个文件，加载 284 个 CSS variables，检查 133 个 `var()` 引用；重复定义 0，legacy suppressions 0。
- `pnpm --filter @pawhaven/design-system build:tokens`：通过，Tailwind CSS CLI v4.3.3。
- React Doctor：同一提交结论 **success**。
- 这证明当前 token contract 检查器和 token build 在 GitHub Actions 的干净依赖安装中可以执行；**它不等同于完整前端 lint/typecheck/test/build 或浏览器视觉回归通过**。完整 Test workflow 仍单独跟踪，任何失败都需区分本分支变更与仓库已有问题。


### 后续验证（2026-10-19，fixture tests 已加入）

- 验证提交：`86a1278bdbc6facb024e1fecca8495751bc4f620`
- 独立工作流：Design Token Validation run `39206400927`，结论 **success**。
- `pnpm --filter @pawhaven/design-system test:tokens`：3 个 fixture tests 通过（有效 alias、未定义变量、循环 alias）。
- `pnpm token-check`：通过；真实仓库 155 个文件扫描通过，0 个 suppression。
- `pnpm --filter @pawhaven/design-system build:tokens`：通过。
- React Doctor：该提交结论 **success**。
- 完整 Test workflow（lint/typecheck/tests/build）独立执行中；本报告不把 token 专项成功等同于全仓质量门禁成功。


## 14. Backend document-service 集成验证（补充要求）

### 实际消费链路

- `apps/backend/document-service/src/modules/pdf/engine/index.css` 通过 Tailwind CSS v4 编译 PDF 样式。
- `scripts/prebuild-pdf-style.mjs` 先调用 `scripts/sync-design-tokens.mjs`，将 `packages/design-system/src/tokens/*.css` 和 `src/theme.css` 同步到 `pdfRunTime/`，再执行 Tailwind CLI 输出 `pdf.generated.css`。
- `styles.ts` 导入生成的 CSS 字符串；`pdfBuilder.ts` 将其内联到 Chromium 页面，因此 token 变更会影响真实 PDF 输出，不只是 Portal。
- document-service 已声明自己的 `@tailwindcss/cli` 依赖；它不会依赖 Design System package 内部的 CLI 路径。

### 已新增的 CI 验收

- 独立 Token Validation workflow 的触发路径现在包括 `apps/backend/document-service/**`。
- workflow 会通过 Turbo 构建 document-service 及其 workspace 依赖，确保 Nest/Rspack 的 PDF CSS import 链可以构建。
- 新增 `apps/backend/document-service/scripts/verify-pdf-styles.mjs`，检查生成的 PDF CSS 非空，并确认模板实际使用的 `.text-body`、`.text-gray-6`、`.border-brown-3` 与 `--color-gray-6` 存在，同时拒绝未处理的 Tailwind `@import` / `@source` 指令。
- workflow 还会运行 document-service 的 typecheck 和 Vitest 测试。
- 本次变更之后的工作流结果需以最新 commit 对应的 GitHub Actions 为准；在看到最新 run 成功前，不把后端集成标记为已验证通过。

### 验收范围与边界

这条检查覆盖“同步 token 源文件 → Tailwind 编译 PDF CSS → CSS 被打包进 document-service → 检查代表性 token utilities → TypeScript 与服务测试”。它不能完全替代真实 PDF 的浏览器视觉快照。PDF 页面尺寸、分页、中文字体、页眉页脚与多语言版式仍应在发布前做至少一次实际渲染验证。
