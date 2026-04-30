<!--
 * @Author: Andrew q
 * @Date: 2026-04-30 14:16:57
 * @LastEditors: Andrew q
 * @LastEditTime: 2026-04-30 17:24:54
 * @Description: chat
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BubbleListItemProps } from 'vue-element-plus-x/types/BubbleList'
import { Paperclip, Promotion } from '@element-plus/icons-vue'
import type { UploadRequestOptions } from 'element-plus'

const list = ref<BubbleListItemProps[]>([])

const isEmpty = computed(() => list.value.length === 0)

const senderValue = ref('111')

const activeFileId = ref<string | null>(null)
const activeFileName = ref<string>('')
const ingestPhase = ref<'idle' | 'ingesting' | 'ready' | 'failed'>('idle')

const FILES_UPLOAD_URL = '/api/files'

const isExcelFile = (name: string) => /\.xlsx?$/i.test(name)

async function handleFileUploadRequest(options: UploadRequestOptions) {
  const raw = options.file
  const fileName = raw.name || '未命名文件'
  const form = new FormData()
  form.append('file', raw as File)

  ingestPhase.value = 'ingesting'
  activeFileId.value = null

  try {
    const res = await fetch(FILES_UPLOAD_URL, {
      method: 'POST',
      body: form,
    })

    const payload = (await res.json().catch(() => ({}))) as {
      fileId?: string
      status?: string
      error?: string
    }

    if (!res.ok) {
      throw new Error(payload.error || `处理失败（${res.status}）`)
    }

    const fileId = payload.fileId?.trim()
    if (!fileId) {
      throw new Error('服务端未返回 fileId')
    }

    activeFileId.value = fileId
    activeFileName.value = fileName
    ingestPhase.value = 'ready'
    options.onSuccess?.(payload)
  } catch (e) {
    ingestPhase.value = 'failed'
    activeFileId.value = null
    activeFileName.value = ''
    const message = e instanceof Error ? e.message : '上传或处理失败'
  }
}

const handleSubmit = () => {
  console.log('submit', senderValue.value)
}
</script>

<template>
  <div class="chat-page">
    <div class="chat-shell">
      <section class="chat-card" aria-label="对话">
        <header class="chat-header">
          <h1 class="chat-title">Data Agent</h1>
          <p class="chat-subtitle">基于文档与表格的问答助手</p>
        </header>

        <div class="chat-body">
          <div v-if="isEmpty" class="chat-empty" role="status">
            <p class="chat-empty-title">开始对话</p>
            <p class="chat-empty-desc">在下方输入问题，或上传数据文件后提问。</p>
          </div>
          <div v-else class="chat-list-wrap">
            <BubbleList :list="list" :smooth-scroll="true" />
          </div>
        </div>

        <footer style="margin: 8px">
          <EditorSender
            v-model:value="senderValue"
            variant="updown"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            clearable
            allow-speech
            placeholder="请输入问题..."
            @submit="handleSubmit"
          >
            <template #prefix>
              <div
                style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap"
              >
                <el-upload
                  :show-file-list="false"
                  :http-request="handleFileUploadRequest"
                  accept=".xlsx,.xls"
                >
                  <el-button
                    round
                    plain
                    color="#626aef"
                    :loading="ingestPhase === 'ingesting'"
                  >
                    <el-icon><Paperclip /></el-icon>
                  </el-button>
                </el-upload>
              </div>
            </template>

            <template #action-list>
              <div style="display: flex; align-items: center; gap: 8px">
                <el-button round color="#626aef" @click="handleSubmit">
                  <el-icon><Promotion /></el-icon>
                </el-button>
              </div>
            </template>
          </EditorSender>
        </footer>
      </section>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  box-sizing: border-box;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  background-color: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.chat-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  max-width: 42rem;
  margin-inline: auto;
}

.chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid hsl(var(--border) / 0.85);
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  box-shadow:
    0 1px 2px hsl(240 5% 10% / 0.04),
    0 1px 3px hsl(240 5% 10% / 0.06);
}

.chat-header {
  flex-shrink: 0;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid hsl(var(--border));
  background-color: hsl(var(--card));
}

.chat-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: hsl(var(--foreground));
}

.chat-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
}

.chat-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1.5rem;
  gap: 0.35rem;
}

.chat-empty-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.chat-empty-desc {
  margin: 0;
  max-width: 18rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

.chat-list-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1rem 0.5rem;
  --elx-bubble-list-max-height: 100%;
}

.chat-list-wrap :deep(.elx-bubble-list) {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.chat-list-wrap :deep(.elx-bubble-list__list::-webkit-scrollbar-thumb) {
  background-color: hsl(var(--border));
}
.chat-list-wrap :deep(.elx-bubble-list__list:hover::-webkit-scrollbar-thumb) {
  background-color: hsl(var(--muted-foreground) / 0.35);
}

.chat-footer {
  flex-shrink: 0;
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid hsl(var(--border));
  background-color: hsl(var(--muted) / 0.35);
}

.chat-sender {
  width: 100%;
}
</style>
