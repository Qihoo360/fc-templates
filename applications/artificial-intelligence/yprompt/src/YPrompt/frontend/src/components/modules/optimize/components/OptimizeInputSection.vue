<template>
  <div class="h-full flex flex-col">
    <!-- 头部 -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800 mb-1">提示词输入</h2>
      <p class="text-sm text-gray-600">输入需要优化的提示词内容</p>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 p-4 space-y-4 overflow-y-auto">
      <!-- 导入选项 -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">数据来源</span>
        <div class="flex items-center space-x-2">
          <button
            @click="showImportModal = true"
            class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            导入提示词
          </button>
        </div>
      </div>

      <!-- 系统提示词输入 -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">系统提示词</label>
          <span class="text-xs text-gray-500">{{ systemPrompt.length }} 字符</span>
        </div>
        <textarea
          v-model="systemPrompt"
          placeholder="输入系统提示词（可选），设定AI的角色和行为..."
          class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        ></textarea>
      </div>

      <!-- 用户提示词输入 -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">用户提示词</label>
          <span class="text-xs text-gray-500">{{ userPrompt.length }} 字符</span>
        </div>
        <textarea
          v-model="userPrompt"
          placeholder="输入用户提示词，描述具体的任务要求..."
          class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        ></textarea>
      </div>

      <!-- 快速操作 -->
      <div class="flex items-center justify-between pt-2 border-t border-gray-200">
        <button
          @click="clearPrompts"
          class="text-xs text-gray-600 hover:text-gray-700"
        >
          清空内容
        </button>
        <div class="flex items-center space-x-2">
          <button
            @click="analyzePrompt"
            :disabled="!hasPromptContent || isAnalyzing"
            class="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isAnalyzing" class="flex items-center gap-1">
              <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              分析中...
            </span>
            <span v-else>分析质量</span>
          </button>
          <button
            @click="generateOptimization"
            :disabled="!hasPromptContent || isGeneratingSuggestions"
            class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isGeneratingSuggestions" class="flex items-center gap-1">
              <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              生成中...
            </span>
            <span v-else>生成优化建议</span>
          </button>
        </div>
      </div>

      <!-- 分析结果 -->
      <div v-if="analysis" class="p-3 bg-gray-50 rounded-lg">
        <h4 class="text-sm font-medium text-gray-700 mb-2">质量分析</h4>
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span>整体评分</span>
            <span :class="getScoreClass(analysis.overall_score)">{{ analysis.overall_score }}/100</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              :class="getScoreBarClass(analysis.overall_score)"
              :style="{ width: `${analysis.overall_score}%` }"
              class="h-2 rounded-full transition-all duration-300"
            ></div>
          </div>
          <div class="space-y-1 mt-2">
            <div
              v-for="(item, key) in analysis.analysis"
              :key="key"
              class="flex items-center justify-between text-xs"
            >
              <span class="capitalize">{{ getAnalysisLabel(key) }}</span>
              <span>{{ item.score }}/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">导入提示词</h3>
        <div class="space-y-3">
          <button
            @click="importFromGenerate"
            class="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div class="font-medium">从生成模块导入</div>
            <div class="text-sm text-gray-600">导入最近生成的提示词</div>
          </button>
          <button
            @click="importFromLibrary"
            class="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div class="font-medium">从我的提示词导入</div>
            <div class="text-sm text-gray-600">从已保存的提示词中选择</div>
          </button>
          <button
            @click="importFromHistory"
            class="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div class="font-medium">从历史记录导入</div>
            <div class="text-sm text-gray-600">导入之前的优化记录</div>
          </button>
        </div>
        <div class="mt-4 flex justify-end">
          <button
            @click="showImportModal = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue'
import { useOptimizeStore } from '@/stores/optimizeStore'
import { useOptimizeModule } from '../composables/useOptimizeModule'

const emit = defineEmits<{
  optimize: []
}>()

const optimizeStore = useOptimizeStore()
const { analyzePrompt, generateSuggestions } = useOptimizeModule()

const {
  systemPrompt,
  userPrompt,
  analysis,
  isAnalyzing,
  isGeneratingSuggestions,
  hasPromptContent
} = optimizeStore

// 本地状态
const showImportModal = ref(false)

// 事件处理
const clearPrompts = () => {
  optimizeStore.systemPrompt = ''
  optimizeStore.userPrompt = ''
}

const generateOptimization = async () => {
  await generateSuggestions()
  emit('optimize')
}

// 导入功能
const importFromGenerate = () => {
  // 实现从生成模块导入的逻辑
  console.log('Import from generate module')
  showImportModal.value = false
}

const importFromLibrary = () => {
  // 实现从提示词库导入的逻辑
  console.log('Import from library')
  showImportModal.value = false
}

const importFromHistory = () => {
  // 实现从历史记录导入的逻辑
  console.log('Import from history')
  showImportModal.value = false
}

// 工具函数
const getScoreClass = (score: number) => {
  if (score >= 80) return 'text-green-600 font-medium'
  if (score >= 60) return 'text-yellow-600 font-medium'
  return 'text-red-600 font-medium'
}

const getScoreBarClass = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getAnalysisLabel = (key: string) => {
  const labels: Record<string, string> = {
    role: '角色定义',
    task: '任务描述',
    format: '输出格式',
    constraints: '约束条件',
    example: '示例质量',
    language: '语言表达'
  }
  return labels[key] || key
}
</script>