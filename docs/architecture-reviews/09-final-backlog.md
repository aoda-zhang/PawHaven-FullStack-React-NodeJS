# 9. 最终综合审查与 Backlog (review/09-final-backlog)

**分支基底:** `develop` → `review/09-final-backlog`

## 前提：必须先读前 8 份专项报告
- [ ] 01 技术选型评分 + 02 Feature 组织 + 03 Server State + 04 State Ownership
- [ ] 05 UI Library + 06 Design Token + 07 测试体系 + 08 可维护性/ARB

## 执行命令（去重 + 排序）
```bash
git checkout review/09-final-backlog
# 合并前 8 测中重复根因，生成 Backlog
# 例：theme.css 重命名导致 PDF prebuild + UI class 打断 → 根因统一为 Token Migration
```

## 标准输出
- Executive Summary + Scorecard
- Top 20 高 ROI 修改 + P0/P1/P2/P3 Backlog
- 3 个月路线图 + 5 项 ADR + 10 个 GitHub Issues（标题 / 背景 / 范围 / 验收 / 测试 / 风险 / 标签）
- 禁止默认删除 Redux / 默认共享组件进 UI Library / 一次性重写
