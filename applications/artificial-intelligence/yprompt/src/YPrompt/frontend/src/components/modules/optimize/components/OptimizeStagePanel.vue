<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 阶段指示器 -->
    <div class="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center space-x-2">
        <div 
          v-for="stage in stages" 
          :key="stage.id"
          class="flex items-center"
        >
          <div 
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
              currentStage >= stage.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
            ]"
          >
            <svg v-if="currentStage > stage.id" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span v-else>{{ stage.id }}</span>
          </div>
          <span 
            :class="[
              'ml-2 text-sm font-medium',
              currentStage >= stage.id ? 'text-gray-900' : 'text-gray-500'
            ]"
          >
            {{ stage.label }}
          </span>
          <svg 
            v-if="stage.id < stages.length" 
            class="w-5 h-5 mx-3 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 阶段1: 质量分析 -->
      <div v-if="currentStage >= 1" class="border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold text-gray-800">阶段 1: 质量分析</h3>
          <span v-if="currentStage > 1" class="text-xs text-green-600 font-medium">✓ 已完成</span>
        </div>
        
        <div v-if="analysisResult">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">整体评分</span>
            <span :class="getScoreClass(analysisResult.overall_score)" class="text-lg font-bold">
              {{ analysisResult.overall_score }}/100
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              :class="getScoreBarClass(analysisResult.overall_score)"
              :style="{ width: `${analysisResult.overall_score}%` }"
              class="h-3 rounded-full transition-all duration-500"
            ></div>
          </div>
          
          <!-- 详细分析维度 -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div 
              v-for="(item, key) in analysisResult.analysis" 
              :key="key"
              class="p-2 bg-gray-50 rounded"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-gray-700">{{ getAnalysisLabel(key) }}</span>
                <span class="text-sm font-semibold" :class="getScoreClass(item.score)">{{ item.score }}</span>
              </div>
              <p class="text-xs text-gray-600">{{ item.feedback }}</p>
            </div>
          </div>
        </div>
        
        <div v-else-if="isAnalyzing" class="flex items-center justify-center py-8">
          <div class="flex flex-col items-center space-y-3">
            <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p class="text-sm text-gray-600">正在分析提示词质量...</p>
          </div>
        </div>
      </div>

      <!-- 阶段2: 优化建议 -->
      <div v-if="currentStage >= 2" class="border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold text-gray-800">阶段 2: 优化建议</h3>
          <span v-if="currentStage > 2" class="text-xs text-green-600 font-medium">✓ 已完成</span>
        </div>
        
        <div v-if="suggestions.length > 0" class="space-y-2">
          <div 
            v-for="(suggestion, index) in suggestions"
            :key="suggestion.id"
            class="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
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
                    {{ suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低' }}
                  </span>
                </div>
                <p class="text-sm text-gray-800 mb-2">{{ suggestion.description }}</p>
                <p v-if="suggestion.example" class="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  示例: {{ suggestion.example }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="isGenerating" class="flex items-center justify-center py-8">
          <div class="flex flex-col items-center space-y-3">
            <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p class="text-sm text-gray-600">正在生成优化建议...</p>
          </div>
        </div>
      </div>

      <!-- 阶段3: 优化结果 -->
      <div v-if="currentStage >= 3" class="border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold text-gray-800">阶段 3: 优化结果</h3>
          <div class="flex items-center space-x-2">
            <button
              @click="$emit('copy-optimized')"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              复制
            </button>
            <button
              @click="$emit('apply-optimized')"
              class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              应用
            </button>
          </div>
        </div>
        
        <!-- 对比显示 -->
        <div class="space-y-3">
          <div class="border border-gray-200 rounded p-3">
            <h4 class="text-xs font-medium text-gray-600 mb-2">原始版本</h4>
            <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">{{ originalPrompt }}</pre>
          </div>
          
          <div class="border-2 border-blue-200 rounded p-3 bg-blue-50">
            <h4 class="text-xs font-medium text-blue-700 mb-2">优化版本</h4>
            <pre v-if="optimizedPrompt" class="text-sm text-gray-900 whitespace-pre-wrap font-mono">{{ optimizedPrompt }}</pre>
            <div v-else-if="isGenerating" class="flex items-center justify-center py-4">
              <div class="flex flex-col items-center space-y-2">
                <div class="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                <p class="text-xs text-gray-600">正在生成优化后的提示词...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 改进说明 -->
        <div v-if="optimizedPrompt" class="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <h4 class="text-xs font-medium text-green-800 mb-2">✨ 优化改进</h4>
          <div class="text-xs text-green-700 space-y-1">
            <p>• 增强了角色定义的清晰度和专业性</p>
            <p>• 添加了更具体的任务说明和行动指南</p>
            <p>• 优化了结构使其更易于理解和执行</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
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
  'copy-optimized': []
  'apply-optimized': []
}

const props = withDefaults(defineProps<Props>(), {
  currentStage: 0,
  isAnalyzing: false,
  isGenerating: false,
  suggestions: () => []
})

const emit = defineEmits<Emits>()

const stages = [
  { id: 1, label: '质量分析' },
  { id: 2, label: '优化建议' },
  { id: 3, label: '优化结果' }
]

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
