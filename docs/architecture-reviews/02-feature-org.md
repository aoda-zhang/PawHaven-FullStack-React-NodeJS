# 2. Feature 组织 (review/02-feature-org) — 实现证据

- `portal/src/features/` 存在（Feature 垂直切片迹象）
- `packages/ui/src/components/` 11 个组件，barrel `index.ts` 导出
- 需继续：检查 Feature 是否散落在 global routes/hooks/store；是否有深层导入
