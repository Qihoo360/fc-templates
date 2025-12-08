<template>
  <div class="space-y-4">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-green-600 dark:text-green-400" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">优化结果</h3>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Clock class="w-3 h-3" />
        <span>{{ result.metadata.processingTime.toFixed(0) }}ms</span>
      </div>
    </div>

    <!-- 长度变化提示 -->
    <div class="flex items-center gap-2 text-sm">
      <span class="text-gray-600 dark:text-gray-400">
        {{ result.originalPrompt.length }} 字
      </span>
      <ArrowRight class="w-4 h-4 text-gray-400" />
      <span class="font-medium text-green-600 dark:text-green-400">
        {{ result.optimizedPrompt.length }} 字
      </span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
        {{ (result.optimizedPrompt.length / result.originalPrompt.length).toFixed(1) }}x
      </span>
    </div>

    <!-- 两段式结果展示 -->
    <div class="space-y-3">
      <!-- 1. 质量分析 -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span class="text-sm font-medium text-blue-900 dark:text-blue-300">质量分析</span>
        </div>
        <p class="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{{ result.qualityAnalysis }}</p>
      </div>

      <!-- 2. 优化结果 -->
      <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm font-medium text-green-900 dark:text-green-300">优化结果</span>
        </div>
        <div class="prose dark:prose-invert max-w-none">
          <p class="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{{ result.optimizedPrompt }}</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center gap-3">
      <button
        @click="$emit('copy', result.optimizedPrompt)"
        class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Copy class="w-4 h-4" />
        <span>复制结果</span>
      </button>
      <button
        @click="$emit('save')"
        class="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Save class="w-4 h-4" />
        <span>保存</span>
      </button>
      <button
        @click="$emit('retry')"
        class="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <RotateCw class="w-4 h-4" />
        <span>重试</span>
      </button>
    </div>

    <!-- 对比查看 -->
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        @click="showComparison = !showComparison"
        class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 flex items-center justify-between transition-colors"
      >
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <GitCompare class="w-4 h-4" />
          优化前后对比
        </span>
        <ChevronDown 
          :class="['w-4 h-4 text-gray-500 transition-transform', showComparison && 'transform rotate-180']"
        />
      </button>

      <div v-show="showComparison" class="p-4 bg-white dark:bg-gray-700 space-y-4">
        <!-- 原始提示词 -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400">优化前</span>
            <span class="text-xs text-gray-500">{{ result.originalPrompt.length }} 字</span>
          </div>
          <div class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ result.originalPrompt }}</p>
          </div>
        </div>

        <!-- 优化后的提示词 -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400">优化后</span>
            <span class="text-xs text-gray-500">{{ result.optimizedPrompt.length }} 字</span>
          </div>
          <div class="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ result.optimizedPrompt }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Clock, ArrowRight, Copy, Save, RotateCw, GitCompare, ChevronDown } from 'lucide-vue-next'
import type { QuickOptimizeResult } from '../../composables/useUserPromptQuickOptimize'

defineProps<{
  result: QuickOptimizeResult
}>()

defineEmits<{
  'copy': [text: string]
  'save': []
  'retry': []
}>()

const showComparison = ref(false)
</script>
