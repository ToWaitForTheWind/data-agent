/*
 * @Author: Andrew q
 * @Date: 2026-04-29 18:53:35
 * @LastEditors: Andrew q
 * @LastEditTime: 2026-04-29 21:23:04
 * @Description: llm
 */
import { ChatOpenAI } from '@langchain/openai'
import { SILICONFLOW_BASE_URL } from '@data-agent/shared'
import { getSiliconflowApiKey, SILICONFLOW_LLM_MODEL } from '../config'

export function createChatModel() {
  return new ChatOpenAI({
    apiKey: getSiliconflowApiKey(),
    model: SILICONFLOW_LLM_MODEL,
    temperature: 0.2,
    configuration: {
      baseURL: SILICONFLOW_BASE_URL,
    },
  })
}
