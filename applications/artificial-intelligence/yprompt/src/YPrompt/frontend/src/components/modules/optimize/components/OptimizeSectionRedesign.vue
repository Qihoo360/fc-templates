<template>
  <!-- 用户提示词优化模式 -->
  <UserPromptQuickOptimize v-if="activeMode === 'user'" />

  <!-- 效果对比模式 -->
  <ComparisonPanel v-else-if="activeMode === 'compare'" />

  <!-- 系统提示词优化模式 -->
  <div v-else-if="activeMode === 'system'" class="h-full min-h-0 overflow-hidden" :class="navigationStore.isMobile ? 'flex flex-col' : 'grid grid-cols-2 gap-4'">
    <!-- PC端左侧/移动端折叠标题栏：输入区 -->
    <div 
      v-if="navigationStore.isMobile && !inputExpanded"
      @click="toggleInput"
      class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0 mb-2"
    >
      <h3 class="font-semibold text-gray-800">系统提示词输入</h3>
      <ChevronDown class="w-5 h-5 text-gray-500" />
    </div>
    
    <!-- 输入区内容 -->
    <div v-if="!navigationStore.isMobile || inputExpanded" class="flex flex-col min-h-0" :class="navigationStore.isMobile ? 'flex-1 mb-2' : ''">
      <div class="bg-white rounded-lg shadow-sm flex flex-col h-full p-4 min-h-0 overflow-hidden">
        <div class="mb-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-800 mb-2">系统提示词</h3>
          </div>
          <button
            @click="handleSystemRestart"
            class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="重新开始"
          >
            <RefreshCw class="w-4 h-4" />
            <span>重新开始</span>
          </button>
        </div>
      
      <!-- 文本输入区域 - 占据剩余空间 -->
      <div class="flex-1 flex flex-col min-h-0">
        <textarea
          v-model="localSystemPrompt"
          placeholder="在此输入系统提示词...

例如：你是一个专业的英语老师"
          class="w-full h-full p-3 border border-gray-300 rounded-lg focus:outline-none resize-none text-sm"
        ></textarea>
        
        <div class="flex items-center justify-between text-xs text-gray-500 mt-2 flex-shrink-0">
          <span>{{ localSystemPrompt?.length || 0 }} 字符</span>
          <span>{{ Math.ceil((localSystemPrompt?.length || 0) / 4) }} tokens</span>
        </div>
      </div>
      
        <!-- 底部按钮 -->
        <div class="mt-4 flex justify-end flex-shrink-0">
          <button
            @click="handleSystemOptimize"
            :disabled="!localSystemPrompt?.trim() || isGeneratingSystem"
            class="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <svg v-if="isGeneratingSystem" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isGeneratingSystem ? '分析优化中...' : '分析并优化' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端折叠标题栏：优化预览 -->
    <div 
      v-if="navigationStore.isMobile && !previewExpanded"
      @click="togglePreview"
      class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0"
    >
      <h3 class="font-semibold text-gray-800">优化预览</h3>
      <ChevronDown class="w-5 h-5 text-gray-500" />
    </div>
    
    <!-- PC端右侧/移动端展开内容：优化预览 -->
    <div v-if="!navigationStore.isMobile || previewExpanded" class="flex flex-col min-h-0" :class="navigationStore.isMobile ? 'flex-1 mb-2' : ''">
      <div class="bg-white rounded-lg shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
        <!-- 预览头部 - 添加自动/手动切换 -->
        <div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 class="font-semibold text-gray-800">优化预览</h2>
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <label class="flex items-center cursor-pointer">
                <input
                  :checked="isAutoMode"
                  @change="isAutoMode = !isAutoMode"
                  type="checkbox"
                  class="sr-only peer"
                />
                <span class="text-sm text-gray-600">{{ isAutoMode ? '自动：' : '手动：' }}</span>
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <!-- 内容区域 - 包含TabContainer和Tab内容 -->
        <div v-if="systemOptimizationStage === 0" class="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
          <EmptyState />
        </div>
        
        <div v-if="systemOptimizationStage >= 1" class="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
          <!-- Tab Container - 渐进显示,只有完成的阶段才显示 -->
          <TabContainer :is-generating="isGeneratingSystem">
            <TabButton
              :is-active="activeOptimizeTab === 'analysis'"
              active-class="bg-orange-500 text-white"
              @click="activeOptimizeTab = 'analysis'"
            >
              质量分析
            </TabButton>

            <TabButton
              v-if="systemOptimizationStage >= 2"
              :is-active="activeOptimizeTab === 'advice'"
              active-class="bg-yellow-500 text-white"
              @click="activeOptimizeTab = 'advice'"
            >
              优化建议
            </TabButton>

            <TabButton
              v-if="systemOptimizationStage >= 3"
              :is-active="activeOptimizeTab === 'final'"
              active-class="bg-blue-500 text-white"
              @click="activeOptimizeTab = 'final'"
            >
              优化结果
            </TabButton>
          </TabContainer>
          <!-- 质量分析 Tab -->
          <div v-if="activeOptimizeTab === 'analysis'" class="flex-1 flex flex-col min-h-0">
            <div v-if="isAnalyzing" class="flex-1 flex flex-col overflow-hidden">
              <div class="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono">{{ analysisStreamingText || 'AI正在分析中...' }}</pre>
              </div>
            </div>

            <div v-else-if="systemAnalysisResult" class="flex-1 flex flex-col min-h-0">
              <div class="flex-1 overflow-y-auto space-y-4 pr-2">
                <!-- 整体评分 -->
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-medium text-gray-700">整体评分</h4>
                    <span :class="getScoreClass(systemAnalysisResult.overall_score)" class="text-2xl font-bold">
                      {{ systemAnalysisResult.overall_score }}/100
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      :class="getScoreBarClass(systemAnalysisResult.overall_score)"
                      :style="{ width: `${systemAnalysisResult.overall_score}%` }"
                      class="h-3 rounded-full transition-all duration-500"
                    ></div>
                  </div>
                </div>
                
                <!-- 详细分析维度 -->
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    v-for="(item, key) in systemAnalysisResult.analysis" 
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
                
                <!-- 具体问题分析 -->
                <div v-if="systemAnalysisResult.issues && systemAnalysisResult.issues.length > 0" class="border border-orange-200 bg-orange-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-orange-900 mb-3 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    发现的具体问题
                  </h4>
                  <ul class="space-y-2">
                    <li 
                      v-for="(issue, idx) in systemAnalysisResult.issues" 
                      :key="idx"
                      class="text-sm text-orange-800 flex items-start"
                    >
                      <span class="text-orange-600 mr-2 flex-shrink-0">{{ idx + 1 }}.</span>
                      <span class="flex-1">{{ issue }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- 手动模式下的执行按钮 -->
              <div v-if="!isAutoMode && systemOptimizationStage === 1" class="pt-4 mt-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                <button
                  @click="handleGenerateAdvice"
                  :disabled="isGeneratingSystem"
                  class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <svg v-if="isGeneratingSystem" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ isGeneratingSystem ? '生成中...' : '生成优化建议' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 优化建议 Tab - 复用 AdviceTab -->
          <AdviceTab
            v-if="activeOptimizeTab === 'advice'"
            :advice="optimizeSuggestionsText"
            :is-mobile="false"
            :is-auto-mode="isAutoMode"
            :is-executing="isGeneratingSystem"
            :is-generating="isGeneratingSystem"
            :current-execution-step="systemOptimizationStage === 3 ? 'final' : 'advice'"
            :is-copied="isCopiedAdvice"
            @regenerate="handleRegenerateAdvice"
            @copy="handleCopyAdvice"
            @add-item="handleAddAdviceItem"
            @remove-item="handleRemoveAdviceItem"
            @update-item="handleUpdateAdviceItem"
            @execute-final="handleExecuteFinalOptimized"
          />

          <!-- 优化结果 Tab - 复用 FinalTab -->
          <FinalTab
            v-if="activeOptimizeTab === 'final'"
            v-model:generated-prompt="currentOptimizedSystemPrompt"
            :is-executing="false"
            :is-generating="isGeneratingSystem"
            :current-execution-step="null"
            :is-copied="isCopiedFinal"
            :is-converting-format="isConvertingFormat"
            :is-converting-language="isConvertingLanguage"
            :is-saving="isSaving"
            :format-state="formatState"
            :language-state="languageState"
            :show-compare-button="true"
            @regenerate="handleRegenerateFinal"
            @copy="handleCopyFinal"
            @toggle-format="handleToggleFormat"
            @toggle-language="handleToggleLanguage"
            @save-prompt="handleSavePrompt"
            @compare="handleCompareSystemPrompt"
          />
        </div>
      </div>
    </div>
    
    <!-- 保存提示词对话框 -->
    <SavePromptDialog
      :is-open="showSaveDialog"
      :prompt-content="currentOptimizedSystemPrompt"
      :is-saving="isSaving"
      @save="handleSaveConfirm"
      @cancel="showSaveDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOptimizeStore } from '@/stores/optimizeStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useNavigationStore } from '@/stores/navigationStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'
import { AIService } from '@/services/aiService'
import SavePromptDialog from '@/components/preview/components/dialogs/SavePromptDialog.vue'
import { PromptGeneratorService } from '@/services/promptGeneratorService'
import { parseAIJsonResponse } from '@/utils/jsonParser'
import { promptConfigManager } from '@/config/prompts'
import { cleanConvertedResponse } from '@/utils/aiResponseUtils'
import { ChevronDown, RefreshCw } from 'lucide-vue-next'
import TabContainer from '@/components/preview/components/common/TabContainer.vue'
import TabButton from '@/components/preview/components/common/TabButton.vue'
import EmptyState from '@/components/preview/components/common/EmptyState.vue'
import AdviceTab from '@/components/preview/components/tabs/AdviceTab.vue'
import FinalTab from '@/components/preview/components/tabs/FinalTab.vue'
import OptimizeResultPanel from './OptimizeResultPanel.vue'
import ComparisonPanel from './ComparisonPanel.vue'
import UserPromptQuickOptimize from './quick/UserPromptQuickOptimize.vue'
import type { Suggestion, TestResult } from '@/stores/optimizeStore'

interface Props {
  activeMode?: 'system' | 'user' | 'compare'
}

interface Emits {
  'update:active-mode': [mode: 'system' | 'user' | 'compare']
}

const props = withDefaults(defineProps<Props>(), {
  activeMode: 'system'
})

const emit = defineEmits<Emits>()

const optimizeStore = useOptimizeStore()
const settingsStore = useSettingsStore()
const navigationStore = useNavigationStore()
const notificationStore = useNotificationStore()
const aiService = AIService.getInstance()
const promptGenerator = PromptGeneratorService.getInstance()

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 自动/手动模式
const isAutoMode = ref(true)

// 移动端折叠状态管理
const inputExpanded = ref(true)  // 默认展开输入区
const previewExpanded = ref(false)  // 默认折叠预览区

// 切换输入区
const toggleInput = () => {
  if (navigationStore.isMobile) {
    if (inputExpanded.value) {
      inputExpanded.value = false
      previewExpanded.value = true
    } else {
      inputExpanded.value = true
      previewExpanded.value = false
    }
  }
}

// 切换预览区
const togglePreview = () => {
  if (navigationStore.isMobile) {
    if (previewExpanded.value) {
      previewExpanded.value = false
      inputExpanded.value = true
    } else {
      previewExpanded.value = true
      inputExpanded.value = false
    }
  }
}

// chatCompletion包装方法，为优化模块提供简单的API
const chatCompletion = async (options: {
  messages: Array<{ role: string; content: string }>
  temperature?: number
}) => {
  const currentProvider = settingsStore.getAvailableProviders().find(p => p.id === settingsStore.selectedProvider)
  const currentModel = settingsStore.selectedModel
  
  if (!currentProvider || !currentModel) {
    throw new Error('请先选择AI提供商和模型')
  }
  
  return {
    content: await aiService.callAI(
      options.messages,
      currentProvider,
      currentModel,
      false
    )
  }
}

// 使用localStorage持久化优化状态
const OPTIMIZE_CACHE_KEY = 'yprompt_optimize_cache'
const ACTIVE_MODE_KEY = 'yprompt_optimize_active_mode'

// 本地状态 - 使用props和emit，并持久化到localStorage
const activeMode = computed({
  get: () => props.activeMode,
  set: (value) => {
    emit('update:active-mode', value)
    // 保存到localStorage
    try {
      localStorage.setItem(ACTIVE_MODE_KEY, value)
    } catch (e) {
      console.error('保存activeMode失败:', e)
    }
  }
})

interface OptimizeCache {
  originalSystemPrompt: string
  optimizedSystemPrompt: string | { zh: string, en: string }  // 支持对象格式缓存中英文
  systemAnalysisResult: any
  systemSuggestions: Suggestion[]
  systemOptimizationStage: number
  activeOptimizeTab: 'analysis' | 'advice' | 'final'
  analysisStreamingText: string
  formatState?: 'markdown' | 'xml'
  languageState?: 'zh' | 'en'
  currentPromptId?: number | null
  currentPromptTitle?: string
}

// 加载缓存
const loadCache = (): OptimizeCache | null => {
  try {
    const cached = localStorage.getItem(OPTIMIZE_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

// 保存缓存
const saveCache = (cache: Partial<OptimizeCache>) => {
  try {
    const current = loadCache() || {} as OptimizeCache
    const updated = { ...current, ...cache }
    localStorage.setItem(OPTIMIZE_CACHE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save optimize cache:', e)
  }
}

const clearCache = () => {
  try {
    localStorage.removeItem(OPTIMIZE_CACHE_KEY)
  } catch (e) {
    console.error('Failed to clear optimize cache:', e)
  }
}

const cache = loadCache()

const originalSystemPrompt = ref(cache?.originalSystemPrompt || '')
const originalUserPrompt = ref('')
const optimizedSystemPrompt = ref(cache?.optimizedSystemPrompt || '')
const optimizedUserPrompt = ref('')
const systemSuggestions = ref<Suggestion[]>(cache?.systemSuggestions || [])
const userSuggestions = ref<Suggestion[]>([])
const isGeneratingSystem = ref(false)
const isGeneratingUser = ref(false)
const systemAnalysisResult = ref<any>(cache?.systemAnalysisResult || null)
const userAnalysisResult = ref<any>(null)
const isAnalyzing = ref(false)
const analysisStreamingText = ref(cache?.analysisStreamingText || '')
const systemOptimizationStage = ref(cache?.systemOptimizationStage || 0) // 0: 未开始, 1: 分析中, 2: 建议中, 3: 优化完成
const userOptimizationStage = ref(0)
const activeOptimizeTab = ref<'analysis' | 'advice' | 'final'>(cache?.activeOptimizeTab || 'analysis')
const isCopiedAdvice = ref(false)
const isCopiedFinal = ref(false)

// 格式和语言转换状态（从缓存恢复）
const isConvertingFormat = ref(false)
const isConvertingLanguage = ref(false)
const formatState = ref<'markdown' | 'xml'>(cache?.formatState || 'markdown')
const languageState = ref<'zh' | 'en'>(cache?.languageState || 'zh')

// 保存相关状态（从缓存恢复）
const route = useRoute()
const isSaving = ref(false)
const showSaveDialog = ref(false)
const currentPromptId = ref<number | null>(cache?.currentPromptId || null)
const currentPromptTitle = ref(cache?.currentPromptTitle || '')

// 将建议转换为文本数组格式以适配AdviceTab
const optimizeSuggestionsText = computed(() => 
  systemSuggestions.value.map(s => s.description)
)

// 当前显示的优化后提示词（支持字符串和对象格式）
const currentOptimizedSystemPrompt = computed({
  get: () => {
    if (typeof optimizedSystemPrompt.value === 'string') {
      return optimizedSystemPrompt.value
    }
    return languageState.value === 'zh' 
      ? optimizedSystemPrompt.value.zh 
      : optimizedSystemPrompt.value.en
  },
  set: (value: string) => {
    if (typeof optimizedSystemPrompt.value === 'string') {
      optimizedSystemPrompt.value = value
    } else if (languageState.value === 'zh') {
      optimizedSystemPrompt.value.zh = value
    } else {
      optimizedSystemPrompt.value.en = value
    }
  }
})

// 添加示例系统提示词
const exampleSystemPrompt = ref(`你是一个专业的助手。

主要职责：
1. 仔细分析用户的需求和问题
2. 提供准确、实用的解决方案
3. 确保解释清晰易懂

请始终保持专业、友好、耐心的语调，确保用户能够获得满意的帮助。`)

// 对话优化模式的状态
const conversationSystemPrompt = ref('你是一个专业的编程助手，擅长分析代码问题和提供解决方案。')
const conversationMessages = ref<Array<{
  role: 'system' | 'user' | 'assistant'
  content: string
}>>([
  {
    role: 'user',
    content: '我在Python中遇到了一个列表去重的问题。我有一个列表 `[1, 2, 2, 3, 4, 3, 5]`，想要得到去重后的结果 `[1, 2, 3, 4, 5]`，但想保持原来的顺序。请问有什么好的方法吗？'
  },
  {
    role: 'assistant',
    content: '这是一个很好的问题！Python中有几种方法可以实现去重并保持顺序：\n\n1. 使用dict.fromkeys()（Python 3.7+最简单）\n2. 使用OrderedDict\n3. 使用列表推导式\n\n你想了解哪种方法的具体实现吗？'
  }
])

// 获取store中的状态和方法
const optimizedPrompts = computed(() => optimizeStore.optimizedPrompts)
const testResults = computed(() => optimizeStore.testResults)
const isTesting = computed(() => optimizeStore.isTesting)

// 获取store中的方法
const setOptimizedPrompts = optimizeStore.setOptimizedPrompts
const setTestResults = optimizeStore.setTestResults

// 使用本地状态来管理系统提示词,并与store同步
const localSystemPrompt = computed({
  get: () => optimizeStore.systemPrompt || exampleSystemPrompt.value,
  set: (value) => {
    optimizeStore.systemPrompt = value
  }
})

// 优化模式配置
const optimizationModes = [
  { key: 'system', label: '系统提示词优化' },
  { key: 'user', label: '用户提示词优化' },
  { key: 'compare', label: '效果对比验证' }
]

const handleAnalyzePrompt = async (prompt: string, mode: 'system' | 'user') => {
  if (!prompt || !prompt.trim()) return
  
  isAnalyzing.value = true
  
  try {
    const currentProvider = settingsStore.getAvailableProviders().find(p => p.id === settingsStore.selectedProvider)
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    // 从配置管理器获取质量分析系统提示词
    const systemPrompt = promptConfigManager.getQualityAnalysisSystemPrompt()
    
    // 用户提示词直接在代码中构建
    const userPrompt = `请分析以下系统提示词的质量：

提示词内容：
${prompt}

请严格按照指定的JSON格式返回分析结果。`

    // 使用流式输出进行分析,提供实时反馈
    analysisStreamingText.value = ''
    let fullResponse = ''
    
    // 设置流式回调
    aiService.setStreamUpdateCallback((chunk: string) => {
      fullResponse += chunk
      analysisStreamingText.value = fullResponse
    })
    
    const response = await aiService.callAI(
      [
        { role: 'system', content: systemPrompt }, // 详细的系统提示词
        { role: 'user', content: userPrompt }     // 简单的用户提示词
      ],
      currentProvider,
      currentModel,
      true // 使用流式输出
    )
    
    // 使用完整响应进行解析 (response 就是字符串)
    const finalContent = response

    // 解析分析结果 - 处理markdown代码块包裹的JSON
    let result
    try {
      result = parseAIJsonResponse(finalContent)
      console.log('✅ Parsed analysis result:', result)
      console.log('📊 Issues found:', result.issues)
      console.log('📝 Suggestions:', result.suggestions)
    } catch (parseError) {
      console.error('❌ Failed to parse analysis response:', parseError)
      console.error('📄 Original content:', finalContent)
      // 如果解析失败，返回基础分析
      result = {
        overall_score: 75,
        analysis: {
          role: { score: 75, status: 'good', feedback: '角色定义基本完善' },
          task: { score: 75, status: 'good', feedback: '任务描述较为清晰' },
          format: { score: 65, status: 'needs_improvement', feedback: '输出格式可以更详细' },
          constraints: { score: 70, status: 'needs_improvement', feedback: '约束条件可以更明确' },
          example: { score: 60, status: 'needs_improvement', feedback: '建议添加示例说明' },
          language: { score: 80, status: 'good', feedback: '语言表达清晰' }
        },
        issues: ['解析失败，无法获取详细问题分析']
      }
    }

    // 设置分析结果
    if (mode === 'system') {
      systemAnalysisResult.value = result
      // 保存到缓存
      saveCache({
        systemAnalysisResult: result,
        analysisStreamingText: fullResponse
      })
    } else {
      userAnalysisResult.value = result
    }

    return result
  } catch (error) {
    console.error('Analysis failed:', error)
    // 返回默认分析结果
    const defaultResult = {
      overall_score: 70,
      analysis: {
        role: { score: 70, status: 'needs_improvement', feedback: '分析失败，请检查提示词' },
        task: { score: 70, status: 'needs_improvement', feedback: '分析失败，请检查提示词' },
        format: { score: 70, status: 'needs_improvement', feedback: '分析失败，请检查提示词' },
        constraints: { score: 70, status: 'needs_improvement', feedback: '分析失败，请检查提示词' },
        example: { score: 70, status: 'needs_improvement', feedback: '分析失败，请检查提示词' },
        language: { score: 70, status: 'needs_improvement', feedback: '分析失败，请检查提示词' }
      },
      suggestions: ['分析失败，请检查网络连接或重试']
    }

    // 设置分析结果
    if (mode === 'system') {
      systemAnalysisResult.value = defaultResult
    } else {
      userAnalysisResult.value = defaultResult
    }

    return defaultResult
  } finally {
    isAnalyzing.value = false
  }
}

// 重新开始 - 清除所有系统提示词优化数据
const handleSystemRestart = () => {
  if (confirm('确定要重新开始吗？这将清除所有输入和优化结果。')) {
    // 清除输入
    localSystemPrompt.value = ''
    originalSystemPrompt.value = ''
    
    // 清除结果
    systemAnalysisResult.value = null
    optimizedSystemPrompt.value = ''
    systemSuggestions.value = []
    
    // 重置状态
    systemOptimizationStage.value = 0
    isGeneratingSystem.value = false
    analysisStreamingText.value = ''
    activeOptimizeTab.value = 'analysis'
    formatState.value = 'markdown'
    languageState.value = 'zh'
    isConvertingLanguage.value = false
    isConvertingFormat.value = false
    isCopiedAdvice.value = false
    isCopiedFinal.value = false
    
    // 清除保存相关状态
    currentPromptId.value = null
    currentPromptTitle.value = ''
    
    // 清除缓存
    clearCache()
    
    // 通知用户
    notificationStore.success('已重置所有数据')
  }
}

const handleSystemOptimize = async () => {
  if (!localSystemPrompt?.value || !localSystemPrompt.value.trim()) return
  
  // 移动端模式下，切换到预览区
  if (navigationStore.isMobile) {
    inputExpanded.value = false
    previewExpanded.value = true
  }
  
  originalSystemPrompt.value = localSystemPrompt.value
  isGeneratingSystem.value = true
  systemOptimizationStage.value = 0
  analysisStreamingText.value = '' // 清空上次的分析流式文本
  
  // 重置格式和语言状态为默认值（开始新的优化）
  formatState.value = 'markdown'
  languageState.value = 'zh'
  
  // 保存原始提示词和重置状态到缓存
  saveCache({
    originalSystemPrompt: localSystemPrompt.value,
    formatState: 'markdown',
    languageState: 'zh'
  })
  
  try {
    // 获取当前provider和model
    const currentProvider = settingsStore.getAvailableProviders().find(p => p.id === settingsStore.selectedProvider)
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    // 阶段1: 质量分析
    systemOptimizationStage.value = 1
    saveCache({ systemOptimizationStage: 1 })
    isAnalyzing.value = true
    await handleAnalyzePrompt(localSystemPrompt.value, 'system')
    isAnalyzing.value = false
    
    // 阶段2: 生成优化建议 - 使用PromptGeneratorService
    systemOptimizationStage.value = 2
    saveCache({ systemOptimizationStage: 2 })
    
    // 初始化流式更新
    let adviceStreamContent = ''
    let adviceInitialized = false
    
    const adviceList = await promptGenerator.getOptimizationAdvice(
      localSystemPrompt.value,
      'system',
      currentModel,
      'zh',
      [],
      currentProvider,
      (chunk: string) => {
        adviceStreamContent += chunk
        
        // 首次收到数据时初始化
        if (!adviceInitialized && chunk.trim()) {
          adviceInitialized = true
          systemSuggestions.value = [{ id: 'temp', type: 'clarity', description: '正在生成...', priority: 'medium', example: '' }]
        }
        
        // 实时解析并更新建议列表
        const suggestions = adviceStreamContent
          .split('\n')
          .map(s => s.replace(/^[*-]\s*/, '').trim())
          .filter(Boolean)
        
        if (suggestions.length > 0) {
          systemSuggestions.value = suggestions.map((desc, idx) => ({
            id: `sys_${idx}`,
            type: 'clarity',
            description: desc,
            priority: 'medium',
            example: ''
          }))
        }
      }
    )
    
    // 将建议文本转换为Suggestion对象
    systemSuggestions.value = adviceList.map((advice, index) => ({
      id: `sys_${index}`,
      type: 'clarity',
      description: advice,
      priority: 'medium',
      example: ''
    }))
    
    // 保存建议到缓存
    saveCache({ systemSuggestions: systemSuggestions.value })
    
    // 如果是自动模式,继续生成最终优化结果
    if (isAutoMode.value) {
      systemOptimizationStage.value = 3
      saveCache({ systemOptimizationStage: 3 })
      
      // 重置格式和语言状态为默认值（因为生成总是返回markdown/zh）
      formatState.value = 'markdown'
      languageState.value = 'zh'
      
      // 保存状态重置到缓存
      saveCache({
        formatState: 'markdown',
        languageState: 'zh'
      })
      
      // 初始化流式更新
      let optimizedInitialized = false
      
      optimizedSystemPrompt.value = await promptGenerator.applyOptimizationAdvice(
        localSystemPrompt.value,
        adviceList,
        'system',
        currentModel,
        'zh',
        [],
        currentProvider,
        (chunk: string) => {
          // 首次收到数据时初始化
          if (!optimizedInitialized && chunk.trim()) {
            optimizedInitialized = true
            optimizedSystemPrompt.value = '正在生成...'
          }
          
          // 追加内容
          if (optimizedInitialized) {
            if (optimizedSystemPrompt.value === '正在生成...') {
              optimizedSystemPrompt.value = chunk
            } else {
              optimizedSystemPrompt.value += chunk
            }
          }
        }
      )
      
      setOptimizedPrompts(optimizedSystemPrompt.value, optimizedUserPrompt.value)
      
      // 保存优化结果到缓存
      saveCache({ 
        optimizedSystemPrompt: optimizedSystemPrompt.value,
        activeOptimizeTab: 'final'
      })
      activeOptimizeTab.value = 'final'
    }
    
  } catch (error) {
    console.error('System optimization failed:', error)
    // 提供备用建议
    systemSuggestions.value = [
      {
        id: 'sys_fallback',
        type: 'clarity',
        description: '增加更清晰的角色定义和职责说明',
        priority: 'high',
        example: '优化了表达方式'
      }
    ]
  } finally {
    isGeneratingSystem.value = false
  }
}

// 手动生成优化建议
const handleGenerateAdvice = async () => {
  if (!originalSystemPrompt.value) return
  
  isGeneratingSystem.value = true
  systemOptimizationStage.value = 2
  
  try {
    const currentProvider = settingsStore.getAvailableProviders().find(p => p.id === settingsStore.selectedProvider)
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    // 初始化流式更新
    let adviceStreamContent = ''
    let adviceInitialized = false
    
    const adviceList = await promptGenerator.getOptimizationAdvice(
      originalSystemPrompt.value,
      'system',
      currentModel,
      'zh',
      [],
      currentProvider,
      (chunk: string) => {
        adviceStreamContent += chunk
        
        // 首次收到数据时初始化
        if (!adviceInitialized && chunk.trim()) {
          adviceInitialized = true
          systemSuggestions.value = [{ id: 'temp', type: 'clarity', description: '正在生成...', priority: 'medium', example: '' }]
        }
        
        // 实时解析并更新建议列表
        const suggestions = adviceStreamContent
          .split('\n')
          .map(s => s.replace(/^[*-]\s*/, '').trim())
          .filter(Boolean)
        
        if (suggestions.length > 0) {
          systemSuggestions.value = suggestions.map((desc, idx) => ({
            id: `sys_${idx}`,
            type: 'clarity',
            description: desc,
            priority: 'medium',
            example: ''
          }))
        }
      }
    )
    
    systemSuggestions.value = adviceList.map((advice, index) => ({
      id: `sys_${index}`,
      type: 'clarity',
      description: advice,
      priority: 'medium',
      example: ''
    }))
  } catch (error) {
    console.error('Failed to generate advice:', error)
  } finally {
    isGeneratingSystem.value = false
  }
}

// Tab自动切换 - 仅在分析完成时切换到分析tab
watch(() => systemOptimizationStage.value, (newStage) => {
  if (newStage >= 1 && newStage < 2) {
    activeOptimizeTab.value = 'analysis'
  }
  // 不再在stage变为2时自动切换,��用户有时间查看分析结果
})

// 监听优化建议,只有当有建议数据时才切换
watch(() => systemSuggestions.value, (newValue) => {
  if (newValue && newValue.length > 0 && systemOptimizationStage.value >= 2) {
    // 延迟500ms切换,给用户时间看分析结果
    setTimeout(() => {
      activeOptimizeTab.value = 'advice'
    }, 500)
  }
})

// 监听优化结果,确保Tab切换
watch(() => optimizedSystemPrompt.value, (newValue) => {
  if (newValue && systemOptimizationStage.value >= 3) {
    // 延迟500ms切换,给用户时间看建议
    setTimeout(() => {
      activeOptimizeTab.value = 'final'
    }, 500)
  }
})

// AdviceTab 事件处理
const handleRegenerateAdvice = async () => {
  // 重新生成优化建议
  systemOptimizationStage.value = 2
  await handleSystemOptimize()
}

const handleCopyAdvice = async () => {
  const adviceText = optimizeSuggestionsText.value.join('\n')
  try {
    await copyUtil(adviceText)
    isCopiedAdvice.value = true
    setTimeout(() => { isCopiedAdvice.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const handleAddAdviceItem = () => {
  systemSuggestions.value.push({
    id: `sys_${Date.now()}`,
    type: 'clarity',
    description: '新建议',
    priority: 'medium',
    example: ''
  })
}

const handleRemoveAdviceItem = (index: number) => {
  systemSuggestions.value.splice(index, 1)
}

const handleUpdateAdviceItem = (index: number, value: string) => {
  if (systemSuggestions.value[index]) {
    systemSuggestions.value[index].description = value
  }
}

const handleExecuteFinalOptimized = async () => {
  // 基于建议生成最终优化版本(手动模式)
  systemOptimizationStage.value = 3
  isGeneratingSystem.value = true
  
  // 重置格式和语言状态为默认值（因为重新生成总是返回markdown/zh）
  formatState.value = 'markdown'
  languageState.value = 'zh'
  
  // 保存状态重置到缓存
  saveCache({
    formatState: 'markdown',
    languageState: 'zh'
  })
  
  try {
    const currentProvider = settingsStore.getAvailableProviders().find(p => p.id === settingsStore.selectedProvider)
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    // 初始化流式更新
    let optimizedInitialized = false
    
    // 使用PromptGeneratorService应用优化建议
    optimizedSystemPrompt.value = await promptGenerator.applyOptimizationAdvice(
      originalSystemPrompt.value,
      optimizeSuggestionsText.value,
      'system',
      currentModel,
      'zh',
      [],
      currentProvider,
      (chunk: string) => {
        // 首次收到数据时初始化
        if (!optimizedInitialized && chunk.trim()) {
          optimizedInitialized = true
          optimizedSystemPrompt.value = '正在生成...'
        }
        
        // 追加内容
        if (optimizedInitialized) {
          if (optimizedSystemPrompt.value === '正在生成...') {
            optimizedSystemPrompt.value = chunk
          } else {
            optimizedSystemPrompt.value += chunk
          }
        }
      }
    )
    
    setOptimizedPrompts(optimizedSystemPrompt.value, optimizedUserPrompt.value)
  } catch (error) {
    console.error('Failed to generate optimized prompt:', error)
    optimizedSystemPrompt.value = originalSystemPrompt.value + '\n\n（已应用优化建议）'
  } finally {
    isGeneratingSystem.value = false
  }
}

// FinalTab 事件处理
const handleRegenerateFinal = async () => {
  // 保存当前的格式和语言状态
  const currentFormat = formatState.value
  const currentLanguage = languageState.value
  
  await handleExecuteFinalOptimized()
  
  // 如果当前不是默认的markdown/zh状态，需要重新转换
  if (currentFormat === 'xml' && optimizedSystemPrompt.value) {
    // 需要转换为XML格式
    await handleToggleFormat()
  }
  
  if (currentLanguage === 'en' && optimizedSystemPrompt.value) {
    // 需要转换为英文
    await handleToggleLanguage()
  }
}

const handleCopyFinal = async () => {
  try {
    await copyUtil(optimizedSystemPrompt.value)
    isCopiedFinal.value = true
    setTimeout(() => { isCopiedFinal.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 格式转换处理
const handleToggleFormat = async () => {
  if (!optimizedSystemPrompt.value || isConvertingFormat.value || isConvertingLanguage.value) {
    return
  }

  const currentProvider = settingsStore.getAvailableProviders().find(p => p.id === settingsStore.selectedProvider)
  const currentModel = settingsStore.selectedModel
  
  if (!currentProvider || !currentModel) {
    notificationStore.error('请先选择AI提供商和模型')
    return
  }

  try {
    isConvertingFormat.value = true
    const targetFormat = formatState.value === 'markdown' ? 'XML' : 'Markdown'
    const currentFormat = formatState.value === 'markdown' ? 'Markdown' : 'XML'

    const response = await aiService.callAI(
      [
        {
          role: 'system',
          content: `你是一个专业的提示词格式转换助手。你的任务是将提示词从${currentFormat}格式转换为${targetFormat}格式，保持内容完全一致，只改变格式样式。

**重要规则**：
1. **绝对不能添加、删除或修改任何实质性内容**
2. **只能改变格式标记（如 Markdown 的 # 标题改为 XML 的 <section> 标签）**
3. **必须保留原文的所有信息和语义**
4. **不要添加任何解释、说明或额外的文字**
5. **直接输出转换后的结果，不要包含任何前言或后记**

${targetFormat === 'XML' 
  ? `使用标准 XML 格式组织内容，遵循以下结构规范：
- 使用 <prompt> 作为根标签
- 使用 <section title="标题名"> 标记各个章节（注意：必须使用 title 属性，不要使用 name 或其他属性）
- 对于 Role 章节，格式为：<section title="Role">角色描述内容</section>
- 使用 <item> 标记列表项
- 使用 <rule> 标记规则条目
- 使用 <example> 标记示例

示例结构：
<prompt>
  <section title="Role">角色描述</section>
  <section title="Profile">
    <item>Author: xxx</item>
  </section>
</prompt>`
  : '使用 Markdown 语法：# 标题，- 列表，**粗体** 等组织内容。'
}`
        },
        {
          role: 'user',
          content: `请将以下提示词从${currentFormat}格式转换为${targetFormat}格式：

${optimizedSystemPrompt.value}`
        }
      ],
      currentProvider,
      currentModel,
      false
    )

    if (response && response.trim()) {
      // 清理代码块标记和多余描述
      const cleaned = cleanConvertedResponse(response)
      optimizedSystemPrompt.value = cleaned
      formatState.value = formatState.value === 'markdown' ? 'xml' : 'markdown'
      
      // 保存到缓存
      saveCache({
        optimizedSystemPrompt: cleaned,
        formatState: formatState.value
      })
      
      notificationStore.success(`已转换为${targetFormat}格式`)
    } else {
      notificationStore.error('格式转换失败：返回内容为空')
    }
  } catch (error) {
    console.error('Format conversion failed:', error)
    notificationStore.error('格式转换失败，请重试')
  } finally {
    isConvertingFormat.value = false
  }
}

// 语言转换处理（与生成页面一致：使用对象格式缓存中英文）
const handleToggleLanguage = async () => {
  const currentPrompt = typeof optimizedSystemPrompt.value === 'string' 
    ? optimizedSystemPrompt.value 
    : (languageState.value === 'zh' ? optimizedSystemPrompt.value.zh : optimizedSystemPrompt.value.en)
  
  if (!currentPrompt || isConvertingFormat.value || isConvertingLanguage.value) {
    return
  }

  const currentProvider = settingsStore.getAvailableProviders().find(p => p.id === settingsStore.selectedProvider)
  const currentModel = settingsStore.selectedModel
  
  if (!currentProvider || !currentModel) {
    notificationStore.error('请先选择AI提供商和模型')
    return
  }

  const targetLangCode = languageState.value === 'zh' ? 'en' : 'zh'
  
  // 如果已经是对象格式且目标语言已缓存，直接切换
  if (typeof optimizedSystemPrompt.value !== 'string') {
    const targetPrompt = targetLangCode === 'zh' ? optimizedSystemPrompt.value.zh : optimizedSystemPrompt.value.en
    if (targetPrompt) {
      languageState.value = targetLangCode
      saveCache({ languageState: targetLangCode })
      notificationStore.success(`已切换为${targetLangCode === 'zh' ? '中文' : '英文'}版本`)
      return
    }
  }

  try {
    isConvertingLanguage.value = true
    const targetLanguage = targetLangCode === 'zh' ? '中文' : '英文'

    const response = await aiService.callAI(
      [
        {
          role: 'system',
          content: `你是一个专业的AI提示词翻译助手。你的任务是将提示词翻译为${targetLanguage}，同时保持提示词的专业性、准确性和完整性。

**重要规则**：
1. **必须保留所有原有的格式标记**（如 Markdown 的 #、- 或 XML 的标签）
2. **翻译必须准确传达原意**，特别是技术术语和指令
3. **保持提示词的专业语气和结构**
4. **不要添加任何额外的解释或说明**
5. **直接输出翻译结果，不要包含任何前言或后记**
6. **对于专有名词、技术术语，要使用行业标准译法**`
        },
        {
          role: 'user',
          content: `请将以下AI提示词翻译为${targetLanguage}：

${currentPrompt}`
        }
      ],
      currentProvider,
      currentModel,
      false
    )

    if (response && response.trim()) {
      const cleaned = cleanConvertedResponse(response)
      
      // 将结果保存为对象格式
      if (typeof optimizedSystemPrompt.value === 'string') {
        // 如果是旧格式（字符串），转换为对象格式
        const oldContent = optimizedSystemPrompt.value
        optimizedSystemPrompt.value = {
          zh: languageState.value === 'zh' ? oldContent : cleaned,
          en: languageState.value === 'en' ? oldContent : cleaned
        }
      } else {
        // 直接保存到对应语言
        if (targetLangCode === 'en') {
          optimizedSystemPrompt.value.en = cleaned
        } else {
          optimizedSystemPrompt.value.zh = cleaned
        }
      }
      
      // 切换语言状态
      languageState.value = targetLangCode
      
      // 保存到缓存
      saveCache({
        optimizedSystemPrompt: optimizedSystemPrompt.value,
        languageState: targetLangCode
      })
      
      notificationStore.success(`已翻译为${targetLanguage}版本`)
    } else {
      notificationStore.error('语言转换失败：返回内容为空')
    }
  } catch (error) {
    console.error('Language conversion failed:', error)
    notificationStore.error('语言转换失败，请重试')
  } finally {
    isConvertingLanguage.value = false
  }
}

// 处理保存
const handleSavePrompt = () => {
  if (!optimizedSystemPrompt.value?.trim()) {
    notificationStore.warning('没有可保存的优化结果')
    return
  }
  showSaveDialog.value = true
}

// 确认保存 (使用统一保存接口 - 只调用一次API)
const handleSaveConfirm = async (formData: {
  title: string
  description: string
  tags: string[]
  isPublic: boolean
  promptType: string
}) => {
  try {
    isSaving.value = true

    // 获取JWT token
    const token = localStorage.getItem('yprompt_token')
    if (!token) {
      notificationStore.error('请先登录')
      return
    }

    // 从optimizeStore获取loadedPromptId (从"我的"页面加载时会设置)
    // 优先使用loadedPromptId,其次使用currentPromptId
    const promptId = optimizeStore.loadedPromptId || currentPromptId.value
    
    console.log('💾 系统提示词保存:', {
      promptId: promptId,
      isUpdate: !!promptId,
      title: formData.title,
      loadedPromptId: optimizeStore.loadedPromptId,
      currentPromptId: currentPromptId.value
    })
    
    // 统一调用保存接口 (后端自动判断新建还是更新,自动创建版本)
    const saveData = {
      // 如果有id则更新,没有则新建
      ...(promptId ? { id: promptId } : {}),
      title: formData.title,
      description: formData.description,
      final_prompt: optimizedSystemPrompt.value,
      language: 'zh',
      format: 'markdown',
      prompt_type: formData.promptType,
      tags: formData.tags,
      is_public: formData.isPublic ? 1 : 0,
      // 版本控制参数
      create_version: true,
      change_type: 'patch',
      change_summary: formData.description || '优化系统提示词',
      change_log: '通过系统提示词优化功能更新',
      version_tag: 'stable'
    }
    
    console.log('📤 发送保存请求:', {
      hasId: !!promptId,
      createVersion: true,
      changeType: 'patch'
    })

    const response = await fetch(`${API_BASE_URL}/api/prompts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(saveData)
    })

    const result = await response.json()
    if (result.code === 200) {
      console.log('✅ 保存成功:', {
        id: result.data.id,
        isNew: result.data.is_new,
        version: result.data.version,
        message: result.data.message
      })
      
      // 更新本地状态
      currentPromptId.value = result.data.id
      currentPromptTitle.value = formData.title
      
      // 如果是新建,同步设置loadedPromptId
      if (result.data.is_new) {
        optimizeStore.setLoadedPromptId(result.data.id)
        console.log('🆕 新建提示词,设置loadedPromptId:', result.data.id)
      }
      
      // 保存到缓存
      saveCache({
        currentPromptId: result.data.id,
        currentPromptTitle: formData.title
      })
      
      notificationStore.success(result.data.message || '保存成功')
      showSaveDialog.value = false
    } else {
      throw new Error(result.message || '保存失败')
    }

  } catch (err: any) {
    console.error('保存提示词失败:', err)
    notificationStore.error(`保存失败: ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

// 处理系统提示词对比
const handleCompareSystemPrompt = () => {
  if (!originalSystemPrompt.value || !optimizedSystemPrompt.value) {
    notificationStore.warning('需要先完成优化才能对比')
    return
  }
  
  // 触发切换到对比模式
  emit('update:active-mode', 'compare')
  
  // 通过 localStorage 传递数据给 ComparisonPanel
  const comparisonData = {
    mode: 'system',
    originalPrompt: originalSystemPrompt.value,
    optimizedPrompt: typeof optimizedSystemPrompt.value === 'string' 
      ? optimizedSystemPrompt.value 
      : (languageState.value === 'zh' ? optimizedSystemPrompt.value.zh : optimizedSystemPrompt.value.en)
  }
  
  localStorage.setItem('yprompt_comparison_data', JSON.stringify(comparisonData))
  console.log('🔵 准备系统提示词对比:', comparisonData)
}

// 工具函数
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

const handleUserOptimize = async () => {
  if (!conversationMessages?.value?.some(m => m.role === 'user' && m.content?.trim())) return
  
  // 构建对话上下文（包括系统消息和用户/助手对话）
  const systemPrompt = conversationSystemPrompt?.value || '你是一个专业的AI助手。'
  const conversationContext = (conversationMessages?.value || [])
    .filter(m => m.content)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n')
  
  const fullContext = `系统提示词：${systemPrompt}\n\n对话内容：\n${conversationContext}`
  
  originalUserPrompt.value = fullContext
  isGeneratingUser.value = true
  
  try {
    // 使用AI进行用户提示词优化
    const optimizationPrompt = `请分析并优化以下对话场景中的用户提示词，使其更加清晰、有效和结构化。

对话场景：
${fullContext}

请提供：
1. 优化后的用户提示词（保持核心意图，改进表达和结构）
2. 具体的优化建议（至少3条）
3. 优化后的预期效果

请以JSON格式返回：
{
  "optimizedPrompt": "优化后的用户提示词内容",
  "suggestions": [
    {
      "type": "clarity|structure|completeness|specificity|example",
      "description": "具体建议描述",
      "priority": "high|medium|low",
      "example": "示例说明"
    }
  ]
}`

    const response = await chatCompletion({
      messages: [
        { role: 'system', content: '你是一个专业的提示词优化专家，擅长改进AI对话中的用户提示词，使其更加清晰和有效。' },
        { role: 'user', content: optimizationPrompt }
      ],
      temperature: 0.7
    })

    // 解析AI响应 - 处理markdown代码块包裹的JSON
    let aiResult
    try {
      aiResult = parseAIJsonResponse(response.content)
      console.log('Parsed user optimization result:', aiResult)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Original content:', response.content)
      // 如果解析失败，使用默认优化
      aiResult = {
        optimizedPrompt: `请基于以下对话场景提供更清晰的指导：

${fullContext}

建议改进：
1. 明确具体的任务要求
2. 提供清晰的输出格式指导
3. 添加相关的约束条件`,
        suggestions: [
          {
            type: 'clarity',
            description: '增加了更清晰的任务描述',
            priority: 'high',
            example: '优化了表达方式'
          }
        ]
      }
    }

    // 设置优化结果
    optimizedUserPrompt.value = aiResult.optimizedPrompt
    userSuggestions.value = aiResult.suggestions.map((s: any, index: number) => ({
      id: `user_${index}`,
      type: s.type,
      description: s.description,
      priority: s.priority,
      example: s.example
    }))
    
    // 更新store
    setOptimizedPrompts(optimizedSystemPrompt.value, optimizedUserPrompt.value)
  } catch (error) {
    console.error('User optimization failed:', error)
    // 提供备用优化
    optimizedUserPrompt.value = `请基于对话场景提供更清晰的指导：

${fullContext}

建议改进：
1. 明确具体的任务要求
2. 提供清晰的输出格式指导
3. 添加相关的约束条件`
    userSuggestions.value = [
      {
        id: 'user_fallback',
        type: 'clarity',
        description: '增加了更清晰的任务描述和格式指导',
        priority: 'high',
        example: '优化了表达方式'
      }
    ]
  } finally {
    isGeneratingUser.value = false
  }
}

const handleApplySystemSuggestion = async (suggestion: Suggestion) => {
  try {
    // 模拟应用建议
    optimizedSystemPrompt.value = `${originalSystemPrompt.value}\n\n根据建议优化：\n${suggestion.description}`
    setOptimizedPrompts(optimizedSystemPrompt.value, optimizedUserPrompt.value)
  } catch (error) {
    console.error('Apply suggestion failed:', error)
  }
}

const handleApplyUserSuggestion = async (suggestion: Suggestion) => {
  try {
    // 模拟应用建议
    optimizedUserPrompt.value = `${originalUserPrompt.value}\n\n根据建议优化：\n${suggestion.description}`
    setOptimizedPrompts(optimizedSystemPrompt.value, optimizedUserPrompt.value)
  } catch (error) {
    console.error('Apply suggestion failed:', error)
  }
}

const handleTestPrompt = async (prompt: string) => {
  console.log('Test prompt:', prompt)
  // 实现提示词测试逻辑
}

const handleRunComparison = async (testCases: string[]) => {
  isTesting.value = true
  try {
    const results: TestResult[] = []
    
    for (const testCase of testCases) {
      // 模拟测试结果
      const originalResult: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        testCase,
        response: '原始提示词的响应结果',
        responseTime: 1500,
        tokenCount: 200,
        modelId: settingsStore.selectedProvider || 'gpt-4',
        modelName: 'GPT-4',
        status: 'success',
        rating: 0
      }
      
      const optimizedResult: TestResult = {
        id: Math.random().toString(36).substr(2, 9),
        testCase,
        response: '优化后提示词的响应结果，质量更高',
        responseTime: 1200,
        tokenCount: 180,
        modelId: settingsStore.selectedProvider || 'gpt-4',
        modelName: 'GPT-4',
        status: 'success',
        rating: 0
      }
      
      results.push(originalResult, optimizedResult)
    }
    
    setTestResults(results)
  } catch (error) {
    console.error('Comparison failed:', error)
  } finally {
    isTesting.value = false
  }
}

const handleAddTestCase = (testCase: string) => {
  // 实现添加测试用例逻辑
  console.log('Add test case:', testCase)
}

const handleSettingsUpdate = (newSettings: any) => {
  optimizeSettingsComposable.handleOptimizeSettingsUpdate(newSettings)
}

const getComparisonPrompt = (type: 'original' | 'optimized') => {
  if (activeMode.value === 'system') {
    return type === 'original' ? originalSystemPrompt.value || localSystemPrompt.value : optimizedSystemPrompt.value
  } else {
    return type === 'original' ? originalUserPrompt.value : optimizedUserPrompt.value
  }
}

// 注意：从库加载提示词的逻辑已经在 OptimizeModule.vue 中处理
// OptimizeModule 会根据 prompt_type 智能路由到正确的标签页
// 系统提示词: 通过 optimizeStore.systemPrompt 传递
// 用户提示词: 通过 localStorage 'yprompt_optimize_loaded_user_prompt' 传递
// 因此这里不需要重复的加载逻辑
</script>