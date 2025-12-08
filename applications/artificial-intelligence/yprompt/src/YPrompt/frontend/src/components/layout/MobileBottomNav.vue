<template>
  <div class="bg-white border-t border-gray-200 px-4 py-2">
    <nav class="flex items-center justify-around">
      <router-link
        v-for="module in navigationStore.modules"
        :key="module.id"
        :to="module.path"
        class="flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-1 text-center transition-colors duration-150 ease-in-out"
        :class="[
          navigationStore.currentModule === module.id
            ? 'text-blue-600'
            : 'text-gray-600'
        ]"
        @click="navigationStore.setCurrentModule(module.id)"
      >
        <ModuleIcon :name="getIconName(module.icon)" class="mb-1" />
        <span class="text-xs font-medium truncate">{{ module.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useNavigationStore } from '@/stores/navigationStore'
import ModuleIcon from '@/components/common/ModuleIcon.vue'

const navigationStore = useNavigationStore()

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