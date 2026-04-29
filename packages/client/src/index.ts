import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { paginationQuerySchema } from "@data-agent/shared";
import { agentsVersion } from "./agents/index.js";
import { dbConfigPlaceholder } from "./db/index.js";

const app = new Hono();

// 开发时允许 Vue 前端跨域（生产可改为白名单）
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    agentsVersion,
    db: dbConfigPlaceholder(),
  }),
);

// 演示：与 shared 中 Zod schema 联动校验 query
app.get("/api/demo", zValidator("query", paginationQuerySchema), (c) => {
  const query = c.req.valid("query");
  return c.json({ message: "分页参数合法", query });
});

export default app;
