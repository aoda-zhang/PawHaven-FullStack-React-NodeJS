# 3. TanStack Query / Server State (review/03-server-state)

**分支基底:** `develop` → `review/03-server-state`

## 事实清单
- [ ] 所有 `useQuery` / `useMutation` 资产清单（Feature / 路径 / key / queryFn）
- [ ] `staleTime`, `gcTime`, `refetchOnWindowFocus`, `enabled`, `retry` 配置
- [ ] 400/401/403/404/429/5xx 的 retry / 错误转换策略
- [ ] mutation 后 `invalidateQueries` / `setQueryData` / 乐观更新
- [ ] Query 数据被复制到 Redux/Context/local state 的双源

## 执行命令
```bash
git checkout review/03-server-state
grep -rn 'useQuery\|useMutation' apps/frontend/portal/src --exclude-dir=node_modules | awk '{print $1}' | sort | uniq -c | sort -nr | head -20
```

## 标准输出
- Query / Mutation 资产清单 + 未配置项标记默认
- key 分层 / 缓存 / mutation / 一致性 / 错误 / 路由评分
- P0-P3 改造计划 + 可写入 `docs/frontend/query-conventions.md`
