import { z } from 'zod'
export const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'

export const envSchema = z.object({
  /** 硅基流动 API Key，见 https://cloud.siliconflow.cn */
  SILICONFLOW_API_KEY: z.string().min(1, '请设置 SILICONFLOW_API_KEY'),
  /** 模型名，如 DeepSeek：deepseek-ai/DeepSeek-V3 */
  LLM_MODEL: z.string().default('deepseek-ai/DeepSeek-V3'),
})

export * from './chat.js'
