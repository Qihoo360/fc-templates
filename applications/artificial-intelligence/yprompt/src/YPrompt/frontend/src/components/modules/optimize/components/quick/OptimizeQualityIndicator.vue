<template>
  <div class="space-y-3">
    <!-- 质量总览 -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">质量检测</h3>
      <div class="flex items-center gap-2">
        <component :is="getStatusIcon(quality.lengthStatus)" :class="['w-4 h-4', getStatusColor(quality.lengthStatus)]" />
        <span :class="['text-sm font-medium', getStatusColor(quality.lengthStatus)]">
          {{ getStatusText(quality.lengthStatus) }}
        </span>
      </div>
    </div>

    <!-- 详细指标 -->
    <div class="grid grid-cols-2 gap-3">
      <!-- 长度指标 -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div class="flex items-center gap-2 mb-2">
          <FileText class="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">长度</span>
        </div>
        <div class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ quality.length }} 字
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          比例: {{ quality.lengthRatio.toFixed(1) }}x
        </div>
      </div>

      <!-- 结构检测 -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div class="flex items-center gap-2 mb-2">
          <component :is="quality.hasStructureMarkers ? AlertTriangle : CheckCircle2" 
            :class="['w-4 h-4', quality.hasStructureMarkers ? 'text-yellow-600' : 'text-green-600']" 
          />
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">结构</span>
        </div>
        <div :class="['text-sm font-medium', quality.hasStructureMarkers ? 'text-yellow-600' : 'text-green-600']">
          {{ quality.hasStructureMarkers ? '检测到标记' : '自然对话' }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ quality.hasStructureMarkers ? '包含结构标记' : '无结构化标记' }}
        </div>
      </div>
    </div>

    <!-- 警告信息 -->
    <div v-if="quality.warnings && quality.warnings.length > 0" class="space-y-2">
      <div 
        v-for="(warning, index) in quality.warnings" 
        :key="index"
        class="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
      >
        <AlertTriangle class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <p class="text-xs text-yellow-800 dark:text-yellow-200">{{ warning }}</p>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-else class="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <CheckCircle2 class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-green-800 dark:text-green-200">
        优化质量良好，符合相对长度控制策略，保持了自然对话风格
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-vue-next'
import type { QualityCheckResult } from '../../composables/useOptimizeQualityCheck'

defineProps<{
  quality: QualityCheckResult
}>()

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'good': return CheckCircle2
    case 'warning': return AlertTriangle
    case 'error': return XCircle
    default: return AlertTriangle
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'good': return 'text-green-600 dark:text-green-400'
    case 'warning': return 'text-yellow-600 dark:text-yellow-400'
    case 'error': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'good': return '质量良好'
    case 'warning': return '需要注意'
    case 'error': return '存在问题'
    default: return '未知'
  }
}
</script>
