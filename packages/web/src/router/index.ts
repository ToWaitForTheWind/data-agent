import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/chat2',
  },
  {
    path: '/chat',
    component: () => import('../views/chat/index.vue'),
    name: 'Chat',
  },
  {
    path: '/chat2',
    component: () => import('../views/chat2/index.vue'),
    name: 'Chat2',
  },
  {
    path: '/custom-res',
    component: () => import('../views/CustomRes/index.vue'),
    name: 'CustomRes',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
