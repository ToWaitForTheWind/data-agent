/*
 * @Author: Andrew q
 * @Date: 2026-04-29 17:43:28
 * @LastEditors: Andrew q
 * @LastEditTime: 2026-04-29 20:56:56
 * @Description: vite config
 */
import devServer from '@hono/vite-dev-server'
import nodeAdapter from '@hono/vite-dev-server/node'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.ts',
      adapter: nodeAdapter,
    }),
  ],
  server: {
    port: 3001,
    strictPort: true,
  },
})
