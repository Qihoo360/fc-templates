<template>
  <div class="flex flex-col h-full">
    <!-- Tab 导航 -->
    <TabContainer 
      :is-generating="isGenerating"
    >
      <TabButton
        v-if="currentStage >= 1"
        :is-active="activeTab === 'analysis'"
        active-class="bg-orange-500 text-white"
        @click="activeTab = 'analysis'"
      >
        质量分析
      </TabButton>

      <TabButton
        v-if="currentStage >= 2"
        :is-active="activeTab === 'suggestions'"
        active-class="bg-yellow-500 text-white"
        @click="activeTab = 'suggestions'"
      >
        优化建议
      </TabButton>

      <TabButton
        v-if="currentStage >= 3"
        :is-active="activeTab === 'result'"
        active-class="bg-blue-500 text-white"
        @click="activeTab = 'result'"
      >
        优化结果
      </TabButton>
    </TabContainer>

    <!-- Tab 内容区域 -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- 质量分析 Tab -->
      <div v-if="activeTab === 'analysis'" class="space-y-4">
        <div v-if="isAnalyzing" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center space-y-3">
            <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p class="text-sm text-gray-600">正在分析提示词质量...</p>
          </div>
        </div>

        <div v-else-if="analysisResult" class="space-y-4">
          <!-- 整体评分 -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-700">整体评分</h4>
              <span :class="getScoreClass(analysisResult.overall_score)" class="text-2xl font-bold">
                {{ analysisResult.overall_score }}/100
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div 
                :class="getScoreBarClass(analysisResult.overall_score)"
                :style="{ width: `${analysisResult.overall_score}%` }"
                class="h-3 rounded-full transition-all duration-500"
              ></div>
            </div>
          </div>
          
          <!-- 详细分析维度 -->
          <div class="grid grid-cols-2 gap-3">
            <div 
              v-for="(item, key) in analysisResult.analysis" 
              :key="key"
              class="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-gray-700">{{ getAnalysisLabel(key) }}</span>
                <span class="text-lg font-bold" :class="getScoreClass(item.score)">{{ item.score }}</span>
              </div>
              <p class="text-xs text-gray-600">{{ item.feedback }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 优化建议 Tab -->
      <div v-if="activeTab === 'suggestions'" class="space-y-3">
        <div v-if="isGenerating && suggestions.length === 0" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center space-y-3">
            <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p class="text-sm text-gray-600">正在生成优化建议...</p>
          </div>
        </div>

        <div v-else-if="suggestions.length > 0" class="space-y-3">
          <div 
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded font-medium',
                    getSuggestionTypeClass(suggestion.type)
                  ]"
                >
                  {{ getSuggestionTypeLabel(suggestion.type) }}
                </span>
                <span 
                  :class="[
                    'text-xs px-2 py-0.5 rounded',
                    suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                    suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  ]"
                >
                  {{ suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级' }}
                </span>
              </div>
            </div>
            <p class="text-sm text-gray-800 mb-2">{{ suggestion.description }}</p>
            <p v-if="suggestion.content" class="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
              <span class="font-medium">示例：</span>{{ suggestion.content }}
            </p>
          </div>
        </div>
      </div>

      <!-- 优化结果 Tab -->
      <div v-if="activeTab === 'result'" class="space-y-4">
        <div v-if="isGenerating && !optimizedPrompt" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center space-y-3">
            <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p class="text-sm text-gray-600">正在生成优化后的提示词...</p>
          </div>
        </div>

        <div v-else-if="optimizedPrompt" class="space-y-4">
          <!-- 对比显示 -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-600">原始版本</h4>
            </div>
            <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">{{ originalPrompt }}</pre>
          </div>
          
          <div class="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-blue-700">优化版本</h4>
              <div class="flex items-center space-x-2">
                <button
                  @click="emit('copy')"
                  class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  复制
                </button>
                <button
                  @click="emit('apply')"
                  class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                >
                  应用到输入框
                </button>
              </div>
            </div>
            <pre class="text-sm text-gray-900 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-blue-200">{{ optimizedPrompt }}</pre>
          </div>
          
          <!-- 改进说明 -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-green-800 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              主要改进
            </h4>
            <div class="text-xs text-green-700 space-y-1">
              <p>• 增强了角色定义的清晰度和专业性</p>
              <p>• 添加了更具体的任务说明和行动指南</p>
              <p>• 优化了结构使其更易于理解和执行</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="currentStage === 0" class="flex flex-col items-center justify-center h-full text-gray-400">
        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm">输入提示词后点击"分析并优化"</p>
        <p class="text-xs mt-1">这里将显示优化结果</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from 'vue'
import TabContainer from '@/components/preview/components/common/TabContainer.vue'
import TabButton from '@/components/preview/components/common/TabButton.vue'
import type { Suggestion } from '@/stores/optimizeStore'

interface Props {
  currentStage: number
  isAnalyzing: boolean
  isGenerating: boolean
  analysisResult: any
  suggestions: Suggestion[]
  originalPrompt: string
  optimizedPrompt: string
}

interface Emits {
  'copy': []
  'apply': []
}

const props = withDefaults(defineProps<Props>(), {
  currentStage: 0,
  isAnalyzing: false,
  isGenerating: false,
  suggestions: () => []
})

const emit = defineEmits<Emits>()

const activeTab = ref<'analysis' | 'suggestions' | 'result'>('analysis')

// 当阶段变化时自动切换Tab
watch(() => props.currentStage, (newStage) => {
  if (newStage >= 1 && activeTab.value !== 'analysis') {
    activeTab.value = 'analysis'
  }
  if (newStage >= 2) {
    activeTab.value = 'suggestions'
  }
  if (newStage >= 3) {
    activeTab.value = 'result'
  }
})

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
</script>
