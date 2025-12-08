<template>
  <div class="space-y-6">
    <!-- 生成规则区域 -->
    <div class="border border-gray-300 rounded-lg overflow-hidden">
      <button
        @click="showGenerateRules = !showGenerateRules"
        class="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 flex items-center justify-between transition-colors"
      >
        <div class="flex items-center gap-2">
          <ChevronDown :class="['w-5 h-5 text-blue-600 transition-transform', showGenerateRules && 'transform rotate-180']" />
          <h2 class="text-lg font-semibold text-blue-900">生成规则</h2>
        </div>
        <span class="text-xs text-blue-600">用于提示词生成功能</span>
      </button>
      
      <div v-show="showGenerateRules" class="p-4 space-y-6 bg-white">
        <!-- 系统提示词规则 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-medium">系统提示词规则</h3>
        <div class="flex items-center space-x-3">
          <label class="flex items-center space-x-2 cursor-pointer">
            <span class="text-sm text-gray-600">精简版</span>
            <div class="relative">
              <input 
                type="checkbox" 
                v-model="settingsStore.useSlimRules"
                @change="$emit('toggle-slim-rules')"
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
          <button
            @click="$emit('reset-system')"
            class="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded"
          >
            重置为默认
          </button>
        </div>
      </div>
      <textarea
        v-model="settingsStore.editingSystemRules"
        placeholder="输入系统提示词规则..."
        class="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
      ></textarea>
      <p class="text-xs text-gray-500 mt-1">系统提示词包含AI提示词工程的完整指南，用于生成高质量的提示词。</p>
    </div>

    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-medium">用户引导规则</h3>
        <button
          @click="$emit('reset-user')"
          class="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded"
        >
          重置为默认
        </button>
      </div>
      <textarea
        v-model="settingsStore.editingUserRules"
        placeholder="输入用户引导规则..."
        class="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
      ></textarea>
      <p class="text-xs text-gray-500 mt-1">用户引导规则定义AI助手在对话中的行为方式，包括智能判断和对话终止机制。</p>
    </div>

    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-medium">需求报告规则</h3>
        <button
          @click="$emit('reset-requirement')"
          class="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded"
        >
          重置为默认
        </button>
      </div>
      <textarea
        v-model="settingsStore.editingRequirementReportRules"
        placeholder="输入需求报告生成规则..."
        class="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
      ></textarea>
      <p class="text-xs text-gray-500 mt-1">需求报告规则用于基于用户对话历史生成完整的需求总结报告。</p>
    </div>

    <!-- 最终提示词生成规则 -->
    <div>
      <div class="mb-3">
        <h3 class="text-lg font-medium">最终提示词生成规则</h3>
      </div>
      <div class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium text-gray-700">关键指令提取</h4>
            <button
              @click="$emit('reset-thinking')"
              class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
            >
              重置为默认
            </button>
          </div>
          <textarea
            v-model="settingsStore.editingFinalPromptRules.THINKING_POINTS_EXTRACTION"
            placeholder="输入关键指令提取规则..."
            class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
          ></textarea>
        </div>
        
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium text-gray-700">系统提示词生成</h4>
            <button
              @click="$emit('reset-generation')"
              class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
            >
              重置为默认
            </button>
          </div>
          <textarea
            v-model="settingsStore.editingFinalPromptRules.SYSTEM_PROMPT_GENERATION"
            placeholder="输入系统提示词生成规则..."
            class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
          ></textarea>
        </div>
        
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium text-gray-700">优化建议生成</h4>
            <button
              @click="$emit('reset-advice')"
              class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
            >
              重置为默认
            </button>
          </div>
          <textarea
            v-model="settingsStore.editingFinalPromptRules.OPTIMIZATION_ADVICE_GENERATION"
            placeholder="输入优化建议生成规则..."
            class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
          ></textarea>
        </div>
        
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium text-gray-700">优化应用</h4>
            <button
              @click="$emit('reset-application')"
              class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
            >
              重置为默认
            </button>
          </div>
          <textarea
            v-model="settingsStore.editingFinalPromptRules.OPTIMIZATION_APPLICATION"
            placeholder="输入优化应用规则..."
            class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
          ></textarea>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-1">最终提示词生成规则用于控制提示词生成器的各个步骤的系统提示词。</p>
    </div>
      </div>
    </div>

    <!-- 优化规则区域 -->
    <div class="border border-gray-300 rounded-lg overflow-hidden">
      <button
        @click="showOptimizeRules = !showOptimizeRules"
        class="w-full px-4 py-3 bg-green-50 hover:bg-green-100 flex items-center justify-between transition-colors"
      >
        <div class="flex items-center gap-2">
          <ChevronDown :class="['w-5 h-5 text-green-600 transition-transform', showOptimizeRules && 'transform rotate-180']" />
          <h2 class="text-lg font-semibold text-green-900">优化规则</h2>
        </div>
        <span class="text-xs text-green-600">用于提示词优化功能</span>
      </button>
      
      <div v-show="showOptimizeRules" class="p-4 space-y-6 bg-white">
        <!-- 系统提示词优化规则 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-medium">系统提示词优化</h3>
          </div>
          <p class="text-sm text-gray-600 mb-3">三段式优化流程：质量分析 → 优化建议 → 应用优化</p>
          
          <div class="space-y-4 pl-4 border-l-2 border-green-200">
            <!-- 1. 质量分析 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">1. 质量分析系统提示词</h4>
                <button
                  @click="$emit('reset-quality-analysis-system')"
                  class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
                >
                  重置
                </button>
              </div>
              <textarea
                v-model="settingsStore.editingQualityAnalysisRules.systemPrompt"
                placeholder="输入质量分析系统提示词..."
                class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-xs"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">分析提示词的结构、清晰度、完整性等质量问题</p>
            </div>

            <!-- 2. 优化建议生成 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">2. 优化建议生成</h4>
                <button
                  @click="$emit('reset-advice')"
                  class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
                >
                  重置
                </button>
              </div>
              <textarea
                v-model="settingsStore.editingFinalPromptRules.OPTIMIZATION_ADVICE_GENERATION"
                placeholder="输入优化建议生成规则..."
                class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-xs"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">基于质量分析结果生成具体的优化建议</p>
            </div>

            <!-- 3. 优化应用 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">3. 优化应用</h4>
                <button
                  @click="$emit('reset-application')"
                  class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
                >
                  重置
                </button>
              </div>
              <textarea
                v-model="settingsStore.editingFinalPromptRules.OPTIMIZATION_APPLICATION"
                placeholder="输入优化应用规则..."
                class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-xs"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">根据优化建议生成优化后的提示词</p>
            </div>
          </div>
        </div>

        <!-- 用户提示词优化规则 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-medium">用户提示词优化</h3>
          </div>
          <p class="text-sm text-gray-600 mb-3">两段式优化流程：质量分析 → 快速优化</p>
          
          <div class="space-y-4 pl-4 border-l-2 border-green-200">
            <!-- 1. 质量分析系统提示词 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">1. 质量分析系统提示词</h4>
                <button
                  @click="$emit('reset-user-prompt-quality-analysis')"
                  class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
                >
                  重置
                </button>
              </div>
              <textarea
                v-model="settingsStore.editingUserPromptOptimizationRules.qualityAnalysis"
                placeholder="输入质量分析系统提示词..."
                class="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-xs"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">分析用户草稿的清晰度、特定性、结构、上下文、完整性等维度，输出JSON格式的分析结果</p>
            </div>

            <!-- 2. 快速优化系统提示词 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">2. 快速优化系统提示词</h4>
                <button
                  @click="$emit('reset-user-prompt-quick-optimization')"
                  class="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 border border-gray-200 rounded"
                >
                  重置
                </button>
              </div>
              <textarea
                v-model="settingsStore.editingUserPromptOptimizationRules.quickOptimization"
                placeholder="输入快速优化系统提示词..."
                class="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-xs"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">根据质量分析结果优化用户草稿，包含角色防混淆、长度控制、自然语言风格等完整规则</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

// 折叠状态
const showGenerateRules = ref(true)
const showOptimizeRules = ref(false)

defineEmits<{
  'reset-system': []
  'reset-user': []
  'reset-requirement': []
  'reset-quality-analysis-system': []
  'reset-thinking': []
  'reset-generation': []
  'reset-advice': []
  'reset-application': []
  'toggle-slim-rules': []
  'reset-user-prompt-quality-analysis': []
  'reset-user-prompt-quick-optimization': []
}>()
</script>
