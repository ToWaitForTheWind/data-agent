/*
 * @Author: Andrew q
 * @Date: 2026-04-29 17:43:30
 * @LastEditors: Andrew q
 * @LastEditTime: 2026-04-30 10:01:25
 * @Description: server
 */
import { serve } from '@hono/node-server'
import app from './index'

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API 已启动: http://localhost:${info.port}`)
})
