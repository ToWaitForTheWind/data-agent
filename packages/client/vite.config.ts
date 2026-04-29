import devServer from "@hono/vite-dev-server";
import nodeAdapter from "@hono/vite-dev-server/node";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    devServer({
      entry: "src/index.ts",
      adapter: nodeAdapter,
    }),
  ],
  server: {
    port: 3001,
    strictPort: true,
  },
});
