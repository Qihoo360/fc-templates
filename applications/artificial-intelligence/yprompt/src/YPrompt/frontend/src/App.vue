<template>
  <div id="app">
    <!-- 根据屏幕尺寸选择布局 -->
    <DesktopLayout v-if="!navigationStore.isMobile" />
    <MobileLayout v-else />
    
    <!-- 全局通知容器 -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavigationStore } from '@/stores/navigationStore'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import DesktopLayout from '@/components/layout/DesktopLayout.vue'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'

const router = useRouter()
const navigationStore = useNavigationStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// 检测移动端设备
const checkMobile = () => {
  navigationStore.setMobile(window.innerWidth < 1024) // lg断点
}

// 监听路由变化，更新当前模块
const updateCurrentModule = () => {
  const currentPath = router.currentRoute.value.path
  const module = navigationStore.getModuleByPath(currentPath)
  if (module) {
    navigationStore.setCurrentModule(module.id)
  }
}

onMounted(async () => {
  // 初始化移动端检测
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 初始化认证状态
  await authStore.initialize()
  
  // 初始化AI配置（从云端或localStorage加载）
  await settingsStore.loadSettings()
  
  // 初始化当前模块
  updateCurrentModule()
  
  // 监听路由变化
  router.afterEach(updateCurrentModule)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
}
</style>