# 1. React 技术选型专项审查 — 实现证据

**分支:** review/01-tech-selection (from develop)
**执行状态:** 代码证据已读取，已写入本文件，待继续深读

## 证据 1 — React 19 / TypeScript / 构建

- `packages/ui/package.json`: `peerDependencies` `react: "^19.0.0"`, `react-dom: "^19.0.0"`
- `package.json`: `typescript`, `vite` (via workspace)
- `nest-cli.json` (document-service): builder `rspack` (ESM 要求)

## 证据 2 — Redux / Query / Context 重叠风险（待继续读源码）

- `packages/ui/package.json` 无 `redux` 直接依赖，但 `@tanstack/eslint-plugin-query` 在根
- 需继续读 `apps/frontend/portal/src/store/` 或 `packages/frontend-core/src/`

## 证据 3 — MUI + Tailwind + Design System 重叠

- `packages/ui/` 依赖 `tailwind-merge`; 设计系统 `packages/design-system/src/theme.css` 语义令牌
- 需检验 Portal 是否直接 `import` MUI 却绕过 `@pawhaven/ui`

## 当前结论（可修改）

- 保留：React 19 + TanStack Query + Vite + Tailwind v4 + pnpm workspace
- 限制：避免 Redux 与 Query 同时保存 server state；限制 MUI 直接消费
- 删除/审查：重复依赖版本、未使用的 `doctor:react`
- 工作量：S（验证重叠程度）

## 下一步（本分支待继续）

```bash
grep -rni 'createSlice\|configureStore' apps/frontend/portal/src packages/ --exclude-dir=node_modules | head -10
grep -rni 'import.*@mui\|import.*Material-UI' apps/frontend/portal/src --exclude-dir=node_modules | head -10
```
