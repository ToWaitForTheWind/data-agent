## 智能数据分析 agent

data-agent/

├── packages/
│ ├── shared/ # Zod schema 与共享类型
│ │ ├── src/
│ │ └── package.json
│ ├── client/ # Hono 后端
│ │ ├── src/
│ │ │ ├── index.ts # 入口（默认导出 Hono app，供 Vite dev）
│ │ │ ├── server.ts # Node 生产启动（pnpm start）
│ │ │ ├── agents/ # Agent 逻辑 (Tool Calling)
│ │ │ └── db/ # db 配置
│ │ ├── vite.config.ts # Hono + @hono/vite-dev-server（Node 适配器）
│ │ └── package.json
│ └── web/ # Vue3 前端
│     ├── src/
│     ├── vite.config.ts # Vue + 开发代理 /api → client
│     └── package.json
├── package.json
└── pnpm-workspace.yaml

### 脚本（根目录）

- `pnpm dev`：并行启动 client（:3001）与 web（:5173）
- `pnpm dev:client` / `pnpm dev:web`：单独启动
- `pnpm build`：构建 client（tsc）与 web（vue-tsc + vite build）
- `pnpm check-types`：全仓类型检查

### 端口

- API：`http://localhost:3001`（`pnpm --filter @data-agent/client dev`）
- 前端：`http://localhost:5173`，`/api` 代理到 3001
