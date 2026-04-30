/*
 * @Author: Andrew q
 * @Date: 2026-04-29 17:43:29
 * @LastEditors: Andrew q
 * @LastEditTime: 2026-04-30 18:23:40
 * @Description:index
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { createChatModel } from './agents/llm'
import {
  createPendingFileRecord,
  getFileRecord,
  retrieveTopChunksByQuery,
  runIngestExcelJob,
} from './services/file-ingest'
import { EXCEL_MAX_FILE_BYTES } from './tools/excel'

import {
  deepChatRequestSchema,
  resolveDeepChatRagFields,
  type DeepChatMessage,
  type DeepChatResponse,
} from '@data-agent/shared'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
)

/** RAG 检索片段条数 */
const RAG_TOP_K = 6
const toLangChainMessages = (messages: DeepChatMessage[]) => {
  const normalized = messages
    .filter((message) => message.text?.trim())
    .map((message) => {
      const role = message.role === 'ai' ? 'assistant' : (message.role ?? 'user')
      return [role, message.text?.trim() ?? ''] as [string, string]
    })

  if (normalized.length > 0) return normalized

  return [['user', '你好']] as [string, string][]
}

const getTextContent = (content: unknown) => {
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'text' in item) {
          const text = (item as { text?: unknown }).text
          return typeof text === 'string' ? text : ''
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  return ''
}

app.get('/api/files/:fileId', (c) => {
  const fileId = c.req.param('fileId')
  const rec = getFileRecord(fileId)
  if (!rec) {
    return c.json({ error: '未找到该 fileId' }, 404)
  }
  return c.json({
    fileId: rec.fileId,
    status: rec.status,
    fileName: rec.fileName,
    error: rec.error,
  })
})

app.post('/api/files', async (c) => {
  let createdFileId: string | undefined
  try {
    const form = await c.req.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return c.json({ error: '请使用 multipart 字段名 file 上传文件' }, 400)
    }

    const fileName = file.name?.trim() || 'upload.xlsx'
    const lower = fileName.toLowerCase()
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      return c.json({ error: '仅支持 .xlsx 或 .xls 文件' }, 400)
    }

    if (file.size > EXCEL_MAX_FILE_BYTES) {
      const mb = Math.floor(EXCEL_MAX_FILE_BYTES / (1024 * 1024))
      return c.json({ error: `文件过大，单文件不超过 ${mb}MB` }, 400)
    }

    const rec = createPendingFileRecord(fileName)
    createdFileId = rec.fileId
    const buffer = Buffer.from(await file.arrayBuffer())

    // 解析 Excel → 分块 → 调用嵌入接口向量化，供 /api/chat 带 fileId RAG 使用
    await runIngestExcelJob(rec.fileId, buffer, fileName)

    const done = getFileRecord(rec.fileId)
    return c.json({
      fileId: rec.fileId,
      status: done?.status ?? 'completed',
      fileName: done?.fileName ?? fileName,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '文件解析或向量化失败'
    const payload: Record<string, string> = { error: message }
    if (createdFileId) {
      payload.fileId = createdFileId
      const failed = getFileRecord(createdFileId)
      if (failed?.status) payload.status = failed.status
    }
    return c.json(payload, 400)
  }
})

app.post('/api/chat', zValidator('json', deepChatRequestSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const { messages } = body
    const rag = resolveDeepChatRagFields(body)

    const model = createChatModel()

    if (rag) {
      const { fileId, message: ragMessage } = rag
      const rec = getFileRecord(fileId)
      if (!rec) {
        return c.json({ error: '未找到该 fileId，请先上传文件' }, 404)
      }
      if (rec.status === 'pending' || rec.status === 'processing') {
        return c.json(
          {
            error:
              '文件仍在解析或向量化中，请稍候通过 GET /api/files/:fileId 查询状态后再试',
          },
          409,
        )
      }
      if (rec.status === 'failed') {
        return c.json({ error: rec.error || '文件处理失败，无法问答' }, 400)
      }

      const snippets = await retrieveTopChunksByQuery(fileId, ragMessage, RAG_TOP_K)
      const context =
        snippets.length > 0 ? snippets.join('\n---\n') : '（暂无匹配片段）'
      const userPrompt = `已知信息：${context}，请回答：${ragMessage}`

      const result = await model.invoke([['user', userPrompt]])
      const response: DeepChatResponse = {
        text: getTextContent(result.content) || '模型没有返回文本内容。',
      }
      return c.json(response)
    }

    const result = await model.invoke(toLangChainMessages(messages))

    const response: DeepChatResponse = {
      text: getTextContent(result.content) || '模型没有返回文本内容。',
    }

    return c.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LLM 调用失败'
    return c.json({ error: message }, 500)
  }
})
export default app
