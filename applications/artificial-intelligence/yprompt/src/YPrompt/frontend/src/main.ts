import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('./views/AuthCallback.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      redirect: '/generate'
    },
    {
      path: '/generate',
      name: 'generate',
      component: () => import('./components/modules/GenerateModule.vue')
    },
    {
      path: '/optimize',
      name: 'optimize',
      component: () => import('./components/modules/OptimizeModule.vue')
    },
    {
      path: '/optimize/:id?',
      name: 'optimize-prompt',
      component: () => import('./components/modules/OptimizeModule.vue')
    },
    {
      path: '/playground',
      name: 'playground',
      component: () => import('./components/modules/PlaygroundModule.vue')
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('./components/modules/LibraryModule.vue')
    }
  ]
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

// 路由守卫：未登录跳转到登录页
router.beforeEach(async (to, _from, next) => {
  // 动态导入 authStore（需要在 pinia 初始化后）
  const { useAuthStore } = await import('./stores/authStore')
  const authStore = useAuthStore()
  
  // 公开页面（登录页、回调页）直接放行
  if (to.meta.public) {
    next()
    return
  }
  
  // 检查是否已登录
  if (!authStore.isLoggedIn) {
    // 未登录，跳转到登录页
    next('/login')
    return
  }
  
  // 已登录，正常跳转
  next()
})

app.mount('#app')