<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- 优化结果标题 -->
    <div>
      <h3 class="text-base font-semibold text-gray-800">优化结果</h3>
      <p class="text-sm text-gray-600">对比原始版本和优化版本</p>
    </div>

    <!-- 对比显示 -->
    <div class="flex-1 overflow-y-auto space-y-4">
      <!-- 原始版本 -->
      <div class="border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-gray-700">原始版本</h4>
          <button
            @click="copyPrompt(originalPrompt)"
            class="text-xs text-blue-600 hover:text-blue-700"
          >
            复制
          </button>
        </div>
        <div class="p-3 bg-gray-50 rounded text-sm text-gray-800 max-h-40 overflow-y-auto">
          <pre class="whitespace-pre-wrap font-mono">{{ originalPrompt || '暂无内容' }}</pre>
        </div>
      </div>

      <!-- 优化版本 -->
      <div class="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-blue-700">优化版本</h4>
          <div class="flex items-center space-x-2">
            <button
              @click="copyPrompt(optimizedPrompt)"
              class="text-xs text-blue-600 hover:text-blue-700"
              :disabled="!optimizedPrompt"
            >
              复制
            </button>
            <button
              @click="$emit('apply-optimization')"
              class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              :disabled="!optimizedPrompt"
            >
              应用
            </button>
          </div>
        </div>
        <div class="p-3 bg-white rounded text-sm text-gray-800 max-h-40 overflow-y-auto border border-blue-200">
          <pre class="whitespace-pre-wrap font-mono">{{ optimizedPrompt || '正在生成优化版本...' }}</pre>
        </div>
      </div>

      <!-- 建议列表 -->
      <div v-if="suggestions.length > 0" class="border border-gray-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-700 mb-3">优化建议</h4>
        <div class="space-y-3">
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            class="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span
                    :class="[
                      'px-2 py-1 text-xs rounded',
                      getSuggestionTypeClass(suggestion.type)
                    ]"
                  >
                    {{ getSuggestionTypeLabel(suggestion.type) }}
                  </span>
                  <span class="text-xs text-gray-500">
                    优先级: {{ suggestion.priority || 'medium' }}
                  </span>
                </div>
                <p class="text-sm text-gray-800 mb-2">{{ suggestion.description }}</p>
                <p v-if="suggestion.content" class="text-xs text-gray-600 mb-2">
                  示例: {{ suggestion.content }}
                </p>
              </div>
              <div class="flex items-center space-x-1">
                <button
                  @click="applySuggestion(suggestion)"
                  class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  应用
                </button>
                <button
                  @click="ignoreSuggestion(index)"
                  class="px-2 py-1 text-xs text-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  忽略
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 质量对比 -->
      <div v-if="qualityComparison" class="border border-gray-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-700 mb-3">质量对比</h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">原始版本评分</span>
            <span :class="getScoreClass(qualityComparison.originalScore)" class="font-medium">
              {{ qualityComparison.originalScore }}/100
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              :class="getScoreBarClass(qualityComparison.originalScore)"
              :style="{ width: `${qualityComparison.originalScore}%` }"
              class="h-2 rounded-full transition-all duration-300"
            ></div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">优化版本评分</span>
            <span :class="getScoreClass(qualityComparison.optimizedScore)" class="font-medium">
              {{ qualityComparison.optimizedScore }}/100
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              :class="getScoreBarClass(qualityComparison.optimizedScore)"
              :style="{ width: `${qualityComparison.optimizedScore}%` }"
              class="h-2 rounded-full transition-all duration-300"
            ></div>
          </div>
          
          <div class="flex items-center justify-between pt-2 border-t border-gray-200">
            <span class="text-sm font-medium text-gray-700">改进程度</span>
            <span :class="getImprovementClass(qualityComparison.improvement)" class="font-medium">
              {{ qualityComparison.improvement > 0 ? '+' : '' }}{{ qualityComparison.improvement }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!isGenerating && !optimizedPrompt && suggestions.length === 0" class="text-center py-8">
        <div class="text-gray-400">
          <p class="mb-2">暂无优化结果</p>
          <p class="text-xs">开始优化后这里将显示结果</p>
        </div>
      </div>

      <!-- 生成中状态 -->
      <div v-if="isGenerating" class="text-center py-8">
        <div class="flex flex-col items-center space-y-3">
          <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <div class="text-gray-600">
            <p class="mb-1">正在分析提示词...</p>
            <p class="text-xs">这可能需要几秒钟</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200">
      <div class="text-xs text-gray-500">
        {{ suggestions.length }} 条建议
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('test-prompt', optimizedPrompt || originalPrompt)"
          :disabled="!originalPrompt || isGenerating"
          class="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          测试效果
        </button>
        <button
          @click="$emit('save-optimization')"
          :disabled="!optimizedPrompt"
          class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          保存优化
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
// import { computed } from 'vue'
import type { Suggestion } from '@/stores/optimizeStore'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'

interface Props {
  originalPrompt: string
  optimizedPrompt: string
  suggestions: Suggestion[]
  isGenerating: boolean
  qualityComparison?: {
    originalScore: number
    optimizedScore: number
    improvement: number
  } | null
}

interface Emits {
  'apply-suggestion': [suggestion: Suggestion]
  'apply-optimization': []
  'test-prompt': [prompt: string]
  'save-optimization': []
}

withDefaults(defineProps<Props>(), {
  suggestions: () => [],
  isGenerating: false,
  qualityComparison: null
})

const emit = defineEmits<Emits>()

// 事件处理
const copyPrompt = (prompt: string) => {
  copyUtil(prompt).then(() => {
    console.log('Prompt copied to clipboard')
  })
}

const applySuggestion = (suggestion: Suggestion) => {
  emit('apply-suggestion', suggestion)
}

const ignoreSuggestion = (index: number) => {
  // 实现忽略建议逻辑
  console.log('Ignore suggestion:', index)
}

// 工具函数
const getSuggestionTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    clarity: 'bg-blue-100 text-blue-700',
    completeness: 'bg-green-100 text-green-700',
    specificity: 'bg-purple-100 text-purple-700',
    structure: 'bg-orange-100 text-orange-700',
    example: 'bg-pink-100 text-pink-700'
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

const getSuggestionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    clarity: '清晰度',
    completeness: '完整性',
    specificity: '具体性',
    structure: '结构',
    example: '示例'
  }
  return labels[type] || type
}

const getScoreClass = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const getScoreBarClass = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getImprovementClass = (improvement: number) => {
  if (improvement > 10) return 'text-green-600'
  if (improvement > 0) return 'text-blue-600'
  if (improvement < -10) return 'text-red-600'
  return 'text-gray-600'
}
</script>