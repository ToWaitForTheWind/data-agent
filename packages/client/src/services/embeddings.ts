import {
  getSiliconflowApiKey,
  SILICONFLOW_BASE_URL,
  SILICONFLOW_EMBEDDING_MODEL,
  SILICONFLOW_EMBED_BATCH_SIZE,
  SILICONFLOW_EMBED_MAX_CHARS_PER_TEXT,
} from '../config'

type EmbeddingApiRow = { embedding: number[]; index: number }

type EmbeddingsResponse = {
  data?: EmbeddingApiRow[]
  error?: { message?: string }
}

function isPayloadTooLarge(res: Response, message: string): boolean {
  if (res.status === 413) return true
  const m = message.toLowerCase()
  return m.includes('too large') || m.includes('entity too large') || m.includes('request entity')
}

/** 单条文本截断到嵌入安全长度（保留表头前缀略难，这里直接截断尾部） */
function clampTextForEmbed(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars)
}

async function postEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const apiKey = getSiliconflowApiKey()
  const res = await fetch(`${SILICONFLOW_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SILICONFLOW_EMBEDDING_MODEL,
      input: texts,
    }),
  })

  let json: EmbeddingsResponse = {}
  try {
    json = (await res.json()) as EmbeddingsResponse
  } catch {
    json = {}
  }

  if (!res.ok) {
    const msg = json.error?.message || res.statusText || '嵌入请求失败'
    const err = new Error(msg) as Error & { status?: number; tooLarge?: boolean }
    err.status = res.status
    err.tooLarge = isPayloadTooLarge(res, msg)
    throw err
  }

  const rows = json.data
  if (!rows?.length) {
    throw new Error('向量化失败：接口未返回 embedding 数据')
  }

  const sorted = [...rows].sort((a, b) => a.index - b.index)
  return sorted.map((row) => {
    if (!Array.isArray(row.embedding)) {
      throw new Error('向量化失败：embedding 格式异常')
    }
    return row.embedding
  })
}

/**
 * 对一批文本做嵌入；遇 413 则拆半重试，单条仍过大则逐步截断。
 */
async function embedTextsWithSplit(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const normalized = texts.map((t) => clampTextForEmbed(t, SILICONFLOW_EMBED_MAX_CHARS_PER_TEXT))

  try {
    return await postEmbeddingsBatch(normalized)
  } catch (e) {
    const err = e as Error & { tooLarge?: boolean }
    if (!err.tooLarge) {
      throw new Error(`向量化失败：${err.message || '嵌入请求失败'}`)
    }

    if (normalized.length > 1) {
      const mid = Math.ceil(normalized.length / 2)
      const left = await embedTextsWithSplit(normalized.slice(0, mid))
      const right = await embedTextsWithSplit(normalized.slice(mid))
      return [...left, ...right]
    }

    // 单条仍 413：逐步缩短再试（网关/模型对单 body 仍可能有限制）
    const one = normalized[0]
    let len = one.length
    const floor = 256
    let lastMsg = err.message
    while (len > floor) {
      len = Math.max(floor, Math.floor(len * 0.65))
      try {
        return await postEmbeddingsBatch([one.slice(0, len)])
      } catch (e2) {
        const err2 = e2 as Error & { tooLarge?: boolean }
        lastMsg = err2.message
        if (!err2.tooLarge) {
          throw new Error(`向量化失败：${lastMsg}`)
        }
      }
    }
    throw new Error(`向量化失败：单段文本仍超出接口限制（${lastMsg}）`)
  }
}

/**
 * 调用 SiliconFlow /v1/embeddings；小批量 + 遇 413 自动拆分/截断。
 */
export async function embedTexts(
  texts: string[],
  batchSize = SILICONFLOW_EMBED_BATCH_SIZE,
): Promise<number[][]> {
  if (texts.length === 0) return []

  const safeBatch = Math.max(1, Math.min(batchSize, SILICONFLOW_EMBED_BATCH_SIZE))
  const out: number[][] = []

  for (let i = 0; i < texts.length; i += safeBatch) {
    const batch = texts.slice(i, i + safeBatch)
    const vectors = await embedTextsWithSplit(batch)
    out.push(...vectors)
  }

  return out
}
