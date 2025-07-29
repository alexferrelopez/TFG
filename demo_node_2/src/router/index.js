import { createRouter, createWebHistory } from 'vue-router'

import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import MainPage from '@/pages/MainPage.vue'

const routes = [
  { path: '/', component: MainPage },
  { path: '/login', component: Login },
  { path: '/register', component: Register }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
