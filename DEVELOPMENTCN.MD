# 🧑‍💻 PawHaven — 本地开发

本文介绍如何在本地构建并运行 PawHaven。

## 环境准备

- **Node.js**: `24.x`
- **pnpm**: `12.x`

详见 [`READMECN.MD`](./READMECN.MD)。先安装依赖：

```bash
pnpm install
```

## 先构建全部

启动开发服务器前，先构建所有共享包与应用。`build:local` 会先编译 `packages/*` 共享库，再通过 Turborepo 构建所有应用，保证工作区内各包一致：

```bash
pnpm build:local
```

`build:local` 等价于先执行 `build:libs`（所有 `packages/*`）再执行 `build`（所有应用）。

## 启动开发服务器

```bash
pnpm dev:local
```

`dev:local`（`scripts/restart-dev.sh`）会先结束仍占用本地开发端口的 PawHaven 进程，再以文件监听模式（`turbo run dev`）启动所有服务与前端应用。需要干净重启时直接运行它即可。

## 开发端口

| 服务             | 端口 |
| ---------------- | ---- |
| gateway          | 8080 |
| core-service     | 8081 |
| auth-service     | 8082 |
| document-service | 8083 |
| portal (Vite)    | 3001 |

## 其他常用脚本

| 脚本             | 作用                                                |
| ---------------- | --------------------------------------------------- |
| `pnpm build`     | 构建所有应用（Turborepo）                           |
| `pnpm build:libs`| 仅构建 `packages/*` 共享库                          |
| `pnpm typecheck` | 对所有工作区做类型检查                              |
| `pnpm lint`      | 对所有工作区做代码检查                              |
| `pnpm test`      | 运行单元测试 / 集成测试                             |
| `pnpm test:e2e`  | 运行 Playwright 端到端测试                          |
| `pnpm dev:all`   | 构建库并启动所有开发服务器（无端口清理前置步骤）    |

## 注意事项

- `document-service` 在运行时启动无头 Chromium（Puppeteer）来渲染 PDF，请确保运行环境中存在可用的 Chromium 二进制文件。
- 当你新增或修改某个共享包后，请重新运行 `pnpm build:local`，以便下游应用拿到最新的构建产物。
