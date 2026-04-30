/*
 * @Author: Andrew q
 * @Date: 2026-04-29 17:43:49
 * @LastEditors: Andrew q
 * @LastEditTime: 2026-04-30 16:29:27
 * @Description: main
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import VueElementPlusX from 'vue-element-plus-x'
import 'vue-element-plus-x/styles/index.css'
import 'element-plus/dist/index.css'

import TDesignChat from '@tdesign-vue-next/chat' // 引入 Chat 组件
import '@tdesign-vue-next/chat/es/style/index.css'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)
app.use(ElementPlus)
app.use(VueElementPlusX)
app.use(TDesignChat)
app.use(router)
app.mount('#app')
