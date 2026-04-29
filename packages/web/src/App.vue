<!--
 * @Author: Andrew q
 * @Date: 2026-04-29 17:43:53
 * @LastEditors: Andrew q
 * @LastEditTime: 2026-04-29 18:07:14
 * @Description: app
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const health = ref<string>('加载中…')
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/health')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { ok: boolean; agentsVersion: string }
    health.value = data.ok ? `后端正常，agents 版本：${data.agentsVersion}` : '响应异常'
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    health.value = '请求失败'
  }
})
</script>

<template>
  <main class="page">
    <h1>智能数据分析 agent</h1>
    <p class="muted">Vue 前端通过 dev 代理访问 Hono <code>/api</code></p>
    <p class="status">{{ health }}</p>
    <p v-if="error" class="err">{{ error }}</p>
  </main>
</template>

<style scoped>
.page {
  max-width: 640px;
  margin: 3rem auto;
  padding: 0 1rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}
h1 {
  font-size: 1.5rem;
}
.muted {
  color: #64748b;
  font-size: 0.9rem;
}
.status {
  margin-top: 1rem;
}
.err {
  color: #b91c1c;
  margin-top: 0.5rem;
}
code {
  font-size: 0.85em;
  background: #f1f5f9;
  padding: 0.1em 0.35em;
  border-radius: 4px;
}
</style>
