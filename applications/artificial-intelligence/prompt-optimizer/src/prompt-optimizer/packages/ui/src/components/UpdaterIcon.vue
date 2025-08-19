<template>
  <!-- 仅在Electron环境中显示 -->
  <div v-if="isElectronEnvironment" class="relative">
    <button
      @click="toggleModal"
      :title="t('updater.checkForUpdates')"
      class="theme-icon-button relative"
      :class="{ 'has-update': state.hasUpdate }"
    >
      <!-- 更新图标 -->
      <span class="text-lg">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </span>

      <!-- 更新提示小红点 -->
      <div
        v-if="state.hasUpdate"
        class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"
      />
    </button>

    <!-- 更新模态框 -->
    <UpdaterModal v-model="showModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isRunningInElectron } from '@prompt-optimizer/core'
import { useUpdater } from '../composables/useUpdater'
import UpdaterModal from './UpdaterModal.vue'

const { t } = useI18n()

// 环境检测
const isElectronEnvironment = isRunningInElectron()

// 只获取状态用于图标显示，不调用任何方法
const { state } = useUpdater()

// 模态框显示状态
const showModal = ref(false)

// 切换模态框显示
const toggleModal = () => {
  showModal.value = !showModal.value
}
</script>

<style scoped>
.theme-icon-button {
  @apply p-2 rounded-lg transition-colors duration-200;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
}

.theme-icon-button.has-update {
  @apply text-blue-600 dark:text-blue-400;
}

.theme-icon-button:hover {
  @apply bg-gray-100 dark:bg-gray-700;
}
</style>
