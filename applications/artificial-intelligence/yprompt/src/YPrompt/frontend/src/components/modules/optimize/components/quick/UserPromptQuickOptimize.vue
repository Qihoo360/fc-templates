<template>
  <div class="h-full min-h-0 overflow-hidden" :class="navigationStore.isMobile ? 'flex flex-col' : 'grid grid-cols-2 gap-4'">
    <!-- 移动端折叠标题栏：输入区 -->
    <div 
      v-if="navigationStore.isMobile && !inputExpanded"
      @click="toggleInput"
      class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0 mb-2"
    >
      <h3 class="font-semibold text-gray-800">构建对话上下文</h3>
      <ChevronDown class="w-5 h-5 text-gray-500" />
    </div>

    <!-- PC端左侧/移动端展开内容：输入区 -->
    <div v-if="!navigationStore.isMobile || inputExpanded" class="flex flex-col min-h-0" :class="navigationStore.isMobile ? 'flex-1 mb-2' : ''">
      <QuickOptimizeInput
        v-model="optimizeState.state.draftPrompt"
        v-model:system-prompt="optimizeState.state.systemPrompt"
        v-model:conversation-history="optimizeState.state.conversationHistory"
        :is-optimizing="optimizeState.state.isOptimizing"
        @optimize="handleOptimize"
        @restart="handleRestart"
      />
    </div>

    <!-- 移动端折叠标题栏：优化结果 -->
    <div 
      v-if="navigationStore.isMobile && !previewExpanded"
      @click="togglePreview"
      class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0"
    >
      <h3 class="font-semibold text-gray-800">优化结果</h3>
      <ChevronDown class="w-5 h-5 text-gray-500" />
    </div>

    <!-- PC端右侧/移动端展开内容：结果区 -->
    <div v-if="!navigationStore.isMobile || previewExpanded" class="flex flex-col min-h-0" :class="navigationStore.isMobile ? 'flex-1' : ''">
      <div class="bg-white rounded-lg shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
        <!-- 预览头部 -->
        <div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 class="font-semibold text-gray-800">优化预览</h2>
          <div class="flex items-center space-x-2">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="optimizeState.state.enableQualityAnalysis"
                :disabled="optimizeState.state.isOptimizing"
                type="checkbox"
                class="sr-only peer"
              />
              <span class="text-sm text-gray-600 mr-2">质量分析：</span>
              <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="optimizationStage === 0" class="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center text-gray-400">
              <Sparkles class="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p class="text-sm">输入草稿提示词后点击"开始优化"</p>
            </div>
          </div>
        </div>

        <!-- 有结果或正在优化 -->
        <div v-if="optimizationStage >= 1" class="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
          <!-- Tab Container（仅在启用质量分析时显示） -->
          <div v-if="optimizeState.state.enableQualityAnalysis" class="flex space-x-2 mb-4 flex-shrink-0">
            <button
              @click="activeTab = 'analysis'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
                activeTab === 'analysis' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              质量分析
            </button>
            <button
              v-if="optimizationStage >= 2"
              @click="activeTab = 'result'"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
                activeTab === 'result' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              优化结果
            </button>
          </div>

          <!-- 质量分析Tab（仅在启用时显示） -->
          <div v-if="optimizeState.state.enableQualityAnalysis && activeTab === 'analysis'" class="flex-1 flex flex-col min-h-0">
            <!-- 流式输出中 -->
            <div v-if="optimizeState.state.isAnalyzing" class="flex-1 flex flex-col overflow-hidden">
              <div class="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono">{{ optimizeState.state.analysisText || 'AI正在分析中...' }}</pre>
              </div>
            </div>
            <!-- 分析完成 -->
            <div v-else-if="optimizeState.hasResult.value" class="flex-1 flex flex-col min-h-0">
              <div class="flex-1 overflow-y-auto space-y-4 pr-2">
                <!-- 整体评分 -->
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-medium text-gray-700">整体评分</h4>
                    <span :class="getScoreClass(optimizeState.state.result!.qualityAnalysis.overall_score)" class="text-2xl font-bold">
                      {{ optimizeState.state.result!.qualityAnalysis.overall_score }}/100
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      :class="getScoreBarClass(optimizeState.state.result!.qualityAnalysis.overall_score)"
                      :style="{ width: `${optimizeState.state.result!.qualityAnalysis.overall_score}%` }"
                      class="h-3 rounded-full transition-all duration-500"
                    ></div>
                  </div>
                </div>
                
                <!-- 详细分析维度 -->
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    v-for="(item, key) in optimizeState.state.result!.qualityAnalysis.analysis" 
                    :key="String(key)"
                    class="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-gray-700">{{ getAnalysisLabel(String(key)) }}</span>
                      <span class="text-lg font-bold" :class="getScoreClass(item?.score ?? 0)">{{ item?.score ?? 0 }}</span>
                    </div>
                    <p class="text-xs text-gray-600">{{ item?.feedback ?? '' }}</p>
                  </div>
                </div>
                
                <!-- 具体问题分析 -->
                <div v-if="optimizeState.state.result!.qualityAnalysis.issues && optimizeState.state.result!.qualityAnalysis.issues.length > 0" 
                  class="border border-orange-200 bg-orange-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-orange-900 mb-3 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    发现的具体问题
                  </h4>
                  <ul class="space-y-2">
                    <li 
                      v-for="(issue, idx) in optimizeState.state.result!.qualityAnalysis.issues" 
                      :key="idx"
                      class="text-sm text-orange-800 flex items-start"
                    >
                      <span class="text-orange-600 mr-2 flex-shrink-0">{{ idx + 1 }}.</span>
                      <span class="flex-1">{{ issue }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 优化结果Tab（禁用质量分析时直接显示，启用时通过tab切换） -->
          <div v-if="!optimizeState.state.enableQualityAnalysis || activeTab === 'result'" class="flex-1 flex flex-col min-h-0">
            <!-- 流式输出中 -->
            <div v-if="optimizeState.state.isOptimizingPrompt" class="flex-1 flex flex-col overflow-hidden">
              <div class="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono">{{ optimizeState.state.optimizedText || 'AI正在优化中...' }}</pre>
              </div>
            </div>
            <!-- 优化完成 - 使用与系统优化完全一致的样式 -->
            <div v-else-if="optimizeState.hasResult.value" class="border rounded-lg overflow-hidden flex flex-col flex-1">
              <!-- 蓝色头部 -->
              <div class="bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 flex items-center justify-between flex-shrink-0">
                <span>最终提示词</span>
                <div class="flex items-center space-x-2">
                  <button
                    @click="handleRegenerate"
                    :disabled="optimizeState.state.isOptimizing"
                    class="text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="重新生成"
                  >
                    <RefreshCw :class="['w-4 h-4', optimizeState.state.isOptimizing && 'animate-spin']" />
                  </button>
                  <button
                    @click="handleCopy(currentOptimizedPrompt)"
                    class="text-blue-500 hover:text-blue-600"
                    title="复制到剪贴板"
                  >
                    <Check v-if="copied" class="w-4 h-4" />
                    <Copy v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <!-- 内容区 -->
              <div class="p-3 bg-white flex-1 flex flex-col overflow-hidden">
                <textarea
                  v-model="editablePrompt"
                  class="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none"
                ></textarea>
                
                <!-- 底部按钮 -->
                <div v-if="currentOptimizedPrompt" class="space-y-2 pt-4 flex-shrink-0">
                  <!-- 第一行：语言转换、保存 -->
                  <div class="flex space-x-2">
                    <button 
                      @click="handleToggleLanguage"
                      :disabled="optimizeState.state.isConvertingLanguage"
                      class="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw v-if="optimizeState.state.isConvertingLanguage" class="w-4 h-4 animate-spin" />
                      <span>{{ optimizeState.state.isConvertingLanguage ? '转换中...' : (optimizeState.state.languageState === 'zh' ? '转为英文' : '转为中文') }}</span>
                    </button>
                    <button 
                      @click="handleSave"
                      :disabled="saving"
                      class="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw v-if="saving" class="w-4 h-4 animate-spin" />
                      <span>{{ saving ? '保存中...' : '保存到数据库' }}</span>
                    </button>
                  </div>
                  <!-- 第二行：对比按钮 -->
                  <div class="flex">
                    <button 
                      @click="handleCompare"
                      class="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeftRight class="w-4 h-4" />
                      <span>对比优化效果</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 保存用户提示词弹窗 -->
  <SaveUserPromptDialog
    :is-open="showSaveDialog"
    :prompt-content="currentOptimizedPrompt"
    :system-prompt="optimizeState.state.systemPrompt"
    :conversation-history="optimizeState.state.conversationHistory"
    :is-saving="saving"
    @save="handleConfirmSave"
    @cancel="handleCancelSave"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Sparkles, ChevronDown, Copy, Check, RefreshCw, ArrowLeftRight } from 'lucide-vue-next'
import { useUserPromptQuickOptimize } from '../../composables/useUserPromptQuickOptimize'
import { useNotificationStore } from '@/stores/notificationStore'
import { useNavigationStore } from '@/stores/navigationStore'
import QuickOptimizeInput from './QuickOptimizeInput.vue'
import SaveUserPromptDialog from '../dialogs/SaveUserPromptDialog.vue'

const optimizeState = useUserPromptQuickOptimize()
const notificationStore = useNotificationStore()
const navigationStore = useNavigationStore()

const ACTIVE_TAB_KEY = 'yprompt_user_optimize_active_tab'

const activeTab = ref<'analysis' | 'result'>('analysis')
const inputExpanded = ref(true)
const previewExpanded = ref(false)
const copied = ref(false)
const saving = ref(false)
const editablePrompt = ref('')
const showSaveDialog = ref(false)

// 从localStorage恢复activeTab
try {
  const savedTab = localStorage.getItem(ACTIVE_TAB_KEY)
  if (savedTab && ['analysis', 'result'].includes(savedTab)) {
    activeTab.value = savedTab as 'analysis' | 'result'
  }
} catch (e) {
  console.error('读取activeTab失败:', e)
}

// 优化阶段：0-未开始，1-分析中或分析完成，2-全部完成
const optimizationStage = computed(() => {
  if (!optimizeState.state.isOptimizing && !optimizeState.hasResult.value) return 0
  
  // 如果禁用质量分析，直接进入阶段2
  if (!optimizeState.state.enableQualityAnalysis) {
    return (optimizeState.state.isOptimizingPrompt || optimizeState.hasResult.value) ? 2 : 0
  }
  
  // 启用质量分析的情况
  if (optimizeState.state.isAnalyzing) return 1
  if (!optimizeState.state.isAnalyzing && (optimizeState.state.isOptimizingPrompt || optimizeState.hasResult.value)) return 2
  return 0
})

const toggleInput = () => {
  if (navigationStore.isMobile) {
    inputExpanded.value = true
    previewExpanded.value = false
  }
}

const togglePreview = () => {
  if (navigationStore.isMobile) {
    inputExpanded.value = false
    previewExpanded.value = true
  }
}

const handleOptimize = async () => {
  // 根据质量分析开关设置初始tab
  const newTab = optimizeState.state.enableQualityAnalysis ? 'analysis' : 'result'
  activeTab.value = newTab
  localStorage.setItem(ACTIVE_TAB_KEY, newTab)
  if (navigationStore.isMobile) {
    inputExpanded.value = false
    previewExpanded.value = true
  }
  await optimizeState.quickOptimize()
}

const handleRegenerate = async () => {
  // 直接切换到结果Tab（因为不需要重新分析）
  activeTab.value = 'result'
  localStorage.setItem(ACTIVE_TAB_KEY, 'result')
  if (navigationStore.isMobile) {
    inputExpanded.value = false
    previewExpanded.value = true
  }
  await optimizeState.regenerateOptimization()
}

const handleCopy = async (text: string) => {
  const success = await optimizeState.copyToClipboard(text)
  if (success) {
    copied.value = true
    notificationStore.success('已复制到剪贴板')
    setTimeout(() => copied.value = false, 2000)
  } else {
    notificationStore.error('复制失败')
  }
}

// 打开保存弹窗
const handleSave = () => {
  showSaveDialog.value = true
}

// 实际保存操作
const handleConfirmSave = async (saveData: {
  title: string
  description: string
  tags: string[]
  isPublic: boolean
  systemPrompt: string
  conversationHistory: string
}) => {
  saving.value = true
  try {
    const result = await optimizeState.saveToLibrary(saveData)
    
    // 根据返回结果显示不同的提示
    if (typeof result === 'object' && result.version) {
      // 更新现有提示词，显示版本号
      notificationStore.success(`提示词已更新至版本 ${result.version}`)
    } else {
      // 新建提示词
      notificationStore.success('已保存到我的提示词')
    }
    
    showSaveDialog.value = false
  } catch (error: any) {
    notificationStore.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 取消保存
const handleCancelSave = () => {
  showSaveDialog.value = false
}

// 质量分析完成后自动切换到结果Tab
watch(() => optimizeState.state.isAnalyzing, (isAnalyzing, wasAnalyzing) => {
  if (wasAnalyzing && !isAnalyzing && optimizeState.state.isOptimizingPrompt) {
    // 分析刚完成，开始优化，自动切换到结果Tab
    setTimeout(() => {
      activeTab.value = 'result'
      localStorage.setItem(ACTIVE_TAB_KEY, 'result')
    }, 300)
  }
})

// 监听activeTab变化，保存到localStorage
watch(activeTab, (newTab) => {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, newTab)
  } catch (e) {
    console.error('保存activeTab失败:', e)
  }
})

// 当前显示的提示词（支持字符串和对象格式）
const currentOptimizedPrompt = computed(() => {
  if (!optimizeState.state.result?.optimizedPrompt) return ''
  
  if (typeof optimizeState.state.result.optimizedPrompt === 'string') {
    return optimizeState.state.result.optimizedPrompt
  }
  
  return optimizeState.state.languageState === 'zh' 
    ? optimizeState.state.result.optimizedPrompt.zh 
    : optimizeState.state.result.optimizedPrompt.en
})

// 同步优化结果到可编辑文本框
watch(currentOptimizedPrompt, (newPrompt) => {
  if (newPrompt) {
    editablePrompt.value = newPrompt
  }
}, { immediate: true })

// 辅助函数：评分颜色
const getScoreClass = (score: number): string => {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

const getScoreBarClass = (score: number): string => {
  if (score >= 90) return 'bg-green-500'
  if (score >= 70) return 'bg-blue-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

// 维度标签映射
const getAnalysisLabel = (key: string): string => {
  const labels: Record<string, string> = {
    clarity: '清晰度',
    specificity: '特定性',
    structure: '结构',
    context: '上下文',
    completeness: '完整性'
  }
  return labels[key] || key
}

// 语言转换
const handleToggleLanguage = async () => {
  try {
    await optimizeState.toggleLanguage()
    notificationStore.success('语言转换成功')
  } catch (error: any) {
    notificationStore.error(error.message || '语言转换失败')
  }
}

// 重新开始 - 清除所有数据
const handleRestart = () => {
  // 清除优化结果
  optimizeState.clearResult()
  
  // 重置UI状态
  activeTab.value = 'analysis'
  localStorage.setItem(ACTIVE_TAB_KEY, 'analysis')
  copied.value = false
  editablePrompt.value = ''
  
  notificationStore.success('已重置所有数据')
}

// 处理用户提示词对比
const handleCompare = () => {
  if (!optimizeState.state.draftPrompt || !optimizeState.hasResult.value || !optimizeState.state.result) {
    notificationStore.warning('需要先完成优化才能对比')
    return
  }
  
  // 获取优化后的提示词
  const optimizedPrompt = typeof optimizeState.state.result.optimizedPrompt === 'string'
    ? optimizeState.state.result.optimizedPrompt
    : (optimizeState.state.languageState === 'zh' 
        ? optimizeState.state.result.optimizedPrompt.zh 
        : optimizeState.state.result.optimizedPrompt.en)
  
  // 通过 localStorage 传递数据给 ComparisonPanel
  const comparisonData = {
    mode: 'user',
    systemPrompt: optimizeState.state.systemPrompt || '',
    originalPrompt: optimizeState.state.draftPrompt,
    optimizedPrompt: optimizedPrompt,
    conversationHistory: optimizeState.state.conversationHistory || ''
  }
  
  localStorage.setItem('yprompt_comparison_data', JSON.stringify(comparisonData))
  localStorage.setItem('yprompt_trigger_compare', 'true')
  console.log('🔵 准备用户提示词对比:', comparisonData)
}

// 从localStorage加载从"我的"页面传递过来的用户提示词
const loadUserPromptFromLibrary = () => {
  try {
    const savedData = localStorage.getItem('yprompt_optimize_loaded_user_prompt')
    if (savedData) {
      const data = JSON.parse(savedData)
      console.log('🟢 UserPromptQuickOptimize: 从库加载数据:', {
        draftPrompt: data.draftPrompt?.substring(0, 50),
        systemPrompt: data.systemPrompt?.substring(0, 50),
        conversationHistory: data.conversationHistory?.substring(0, 50)
      })
      
      optimizeState.setDraftPrompt(data.draftPrompt || '')
      optimizeState.setSystemPrompt(data.systemPrompt || '')
      optimizeState.setConversationHistory(data.conversationHistory || '')
      
      console.log('🟢 已设置到optimizeState:', {
        draftPrompt: optimizeState.state.draftPrompt?.substring(0, 50),
        systemPrompt: optimizeState.state.systemPrompt?.substring(0, 50),
        conversationHistory: optimizeState.state.conversationHistory?.substring(0, 50)
      })
      
      // 清除localStorage，避免重复加载
      localStorage.removeItem('yprompt_optimize_loaded_user_prompt')
      
      // 切换到输入区
      if (navigationStore.isMobile) {
        inputExpanded.value = true
        previewExpanded.value = false
      }
    }
  } catch (e) {
    console.error('加载用户提示词失败:', e)
  }
}

// 组件挂载时检查是否有需要加载的用户提示词
import { onMounted } from 'vue'
onMounted(() => {
  loadUserPromptFromLibrary()
})

// 监听localStorage变化（处理父组件异步加载的情况）
watch(
  () => localStorage.getItem('yprompt_optimize_loaded_user_prompt'),
  (newValue) => {
    if (newValue) {
      // 延迟一帧确保DOM更新
      requestAnimationFrame(() => {
        loadUserPromptFromLibrary()
      })
    }
  },
  { immediate: false }
)
</script>
