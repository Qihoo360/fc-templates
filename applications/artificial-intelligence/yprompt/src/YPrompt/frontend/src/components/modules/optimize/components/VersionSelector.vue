<template>
  <div class="version-selector">
    <!-- 版本选择器 -->
    <div class="flex items-center space-x-2 mb-3">
      <span class="text-sm font-medium text-gray-700">版本:</span>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="version in displayVersions"
          :key="version.version"
          @click="switchVersion(version.version)"
          :class="[
            'px-2 py-1 text-xs rounded-md border transition-colors',
            currentVersion === version.version
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          ]"
        >
          {{ version.version }}
          <span v-if="version.tag" class="ml-1 text-xs opacity-70">
            {{ getTagLabel(version.tag) }}
          </span>
        </button>
      </div>
    </div>

    <!-- 版本信息 -->
    <div v-if="currentVersionData" class="text-xs text-gray-500 space-y-1">
      <div v-if="currentVersionData.createdAt">
        创建时间: {{ formatDate(currentVersionData.createdAt) }}
      </div>
      <div v-if="currentVersionData.note">
        备注: {{ currentVersionData.note }}
      </div>
      <div v-if="currentVersionData.appliedSuggestions.length > 0">
        应用了 {{ currentVersionData.appliedSuggestions.length }} 条建议
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center space-x-2 mt-3">
      <button
        @click="showVersionHistory = true"
        class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        历史版本
      </button>
      <button
        v-if="currentVersion !== 'original'"
        @click="rollbackToVersion"
        class="text-xs text-gray-600 hover:text-gray-700"
      >
        回滚到此版本
      </button>
    </div>

    <!-- 版本历史模态框 -->
    <div v-if="showVersionHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">版本历史</h3>
          <button
            @click="showVersionHistory = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-3">
          <!-- 原始版本 -->
          <div
            @click="switchVersion('original')"
            :class="[
              'p-3 border rounded-lg cursor-pointer transition-colors',
              currentVersion === 'original' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="font-medium">原始版本</span>
                <span class="text-xs text-gray-500">Initial</span>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(new Date(systemPrompt, userPrompt)) }}
              </div>
            </div>
          </div>

          <!-- 历史版本 -->
          <div
            v-for="version in [...versions].reverse()"
            :key="version.id"
            @click="switchVersion(version.version)"
            :class="[
              'p-3 border rounded-lg cursor-pointer transition-colors',
              currentVersion === version.version ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="font-medium">{{ version.version }}</span>
                <span v-if="version.tag" class="px-2 py-0.5 text-xs rounded-full" :class="getTagClass(version.tag)">
                  {{ getTagLabel(version.tag) }}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(version.createdAt) }}
              </div>
            </div>
            <div v-if="version.note" class="text-sm text-gray-600 mt-1">
              {{ version.note }}
            </div>
            <div v-if="version.changes.length > 0" class="text-xs text-gray-500 mt-1">
              {{ version.changes.length }} 处修改
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { useOptimizeStore } from '@/stores/optimizeStore'
import type { Version } from '@/stores/optimizeStore'

const optimizeStore = useOptimizeStore()

const {
  versions,
  currentVersion,
  currentVersionData,
  systemPrompt,
  userPrompt,
  switchVersion: storeSwitchVersion
} = optimizeStore

const showVersionHistory = ref(false)

// 计算显示的版本（最多显示5个）
const displayVersions = computed(() => {
  const allVersions = [
    { version: 'original', tag: 'initial' as const, createdAt: new Date() },
    ...versions.value
  ]
  return allVersions.slice(-5).reverse()
})

const switchVersion = (version: string) => {
  storeSwitchVersion(version)
  showVersionHistory.value = false
}

const rollbackToVersion = () => {
  // 这里可以添加回滚逻辑，比如创建一个新的回滚版本
  console.log('Rollback to version:', currentVersion.value)
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTagLabel = (tag: string) => {
  const labels: Record<string, string> = {
    'initial': '初始',
    'draft': '草稿',
    'beta': '测试',
    'stable': '稳定',
    'production': '生产',
    'archived': '归档',
    'rollback': '回滚'
  }
  return labels[tag] || tag
}

const getTagClass = (tag: string) => {
  const classes: Record<string, string> = {
    'initial': 'bg-gray-100 text-gray-600',
    'draft': 'bg-yellow-100 text-yellow-600',
    'beta': 'bg-blue-100 text-blue-600',
    'stable': 'bg-green-100 text-green-600',
    'production': 'bg-purple-100 text-purple-600',
    'archived': 'bg-gray-100 text-gray-600',
    'rollback': 'bg-orange-100 text-orange-600'
  }
  return classes[tag] || 'bg-gray-100 text-gray-600'
}
</script>