<template>
  <div 
    class="bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ease-in-out"
    :style="{ width: navigationStore.sidebarWidth }"
  >
    <!-- 模块导航 -->
    <nav class="flex-1 px-2 py-4 space-y-1">
      <router-link
        v-for="module in navigationStore.modules"
        :key="module.id"
        :to="module.path"
        class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out group"
        :class="[
          navigationStore.currentModule === module.id
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        ]"
        @click="navigationStore.setCurrentModule(module.id)"
      >
        <ModuleIcon :name="getIconName(module.icon)" class="mr-3 flex-shrink-0" />
        <span 
          v-if="!navigationStore.sidebarCollapsed"
          class="truncate"
        >
          {{ module.name }}
        </span>
      </router-link>
    </nav>

    <!-- 分隔线 -->
    <div class="border-t border-gray-200 mx-2"></div>

    <!-- 底部工具 -->
    <div class="px-2 py-4 space-y-1">
      <!-- 设置按钮 -->
      <button
        @click="settingsStore.showSettings = true"
        class="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 ease-in-out"
      >
        <ModuleIcon name="cog" class="mr-3 flex-shrink-0" />
        <span v-if="!navigationStore.sidebarCollapsed">设置</span>
      </button>

      <!-- 折叠按钮 -->
      <button
        @click="navigationStore.toggleSidebar"
        class="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 ease-in-out"
      >
        <svg v-if="navigationStore.sidebarCollapsed" class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        <svg v-else class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span v-if="!navigationStore.sidebarCollapsed">折叠</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavigationStore } from '@/stores/navigationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import ModuleIcon from '@/components/common/ModuleIcon.vue'

const navigationStore = useNavigationStore()
const settingsStore = useSettingsStore()

// 图标名称映射
const iconMap: Record<string, string> = {
  '🏠': 'home',
  '⚡': 'sparkles',
  '🎯': 'beaker',
  '📚': 'collection'
}

const getIconName = (emoji: string): string => {
  return iconMap[emoji] || 'home'
}
</script>