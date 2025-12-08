<template>
  <div class="h-full flex flex-col overflow-hidden p-2">
    <!-- 模块特定顶栏 -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-xl lg:text-2xl font-bold text-gray-800 mb-1">提示词优化</h1>
        </div>
        
        <!-- 模型选择器和设置按钮 -->
        <div class="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <!-- 模型选择器 -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">AI模型:</label>
            <select
              v-model="settingsStore.selectedProvider"
              @change="onProviderChange"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="">选择提供商</option>
              <option
                v-for="provider in availableProviders"
                :key="provider.id"
                :value="provider.id"
              >
                {{ provider.name }}
              </option>
            </select>
            
            <select
              v-model="settingsStore.selectedModel"
              @change="settingsStore.saveSettings"
              :disabled="!settingsStore.selectedProvider"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-0 flex-1 sm:flex-none"
            >
              <option value="">选择模型</option>
              <option
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }}
              </option>
            </select>
          </div>
          
          </div>
      </div>
      
      <!-- 优化模式选择 -->
      <div class="flex space-x-2 mt-4">
        <button
          v-for="mode in optimizationModes"
          :key="mode.key"
          @click="handleModeChange(mode.key)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeMode === mode.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 overflow-hidden">
      <OptimizeSectionRedesign 
        :active-mode="activeMode"
        @update:active-mode="activeMode = $event"
      />
    </div>

    <!-- Diff查看器模态框 -->
    <div v-if="showDiffModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] w-[90vw] overflow-hidden">
        <DiffViewer
          :left-content="systemPrompt"
          :right-content="optimizedPrompts.system"
          left-label="原始版本"
          right-label="优化版本"
          @close="showDiffModal = false"
        />
      </div>
    </div>
  </div>

  <!-- 统一设置弹窗 -->
  <SettingsModal />
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOptimizeStore } from '@/stores/optimizeStore'
import { AIService } from '@/services/aiService'
import OptimizeSectionRedesign from './optimize/components/OptimizeSectionRedesign.vue'
import DiffViewer from './optimize/components/DiffViewer.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'

const route = useRoute()
const settingsStore = useSettingsStore()
const optimizeStore = useOptimizeStore()
const aiService = AIService.getInstance()

const {
  activeTab,
  systemPrompt,
  optimizedPrompts,
  switchTab
} = optimizeStore

// localStorage key
const ACTIVE_MODE_KEY = 'yprompt_optimize_active_mode'

// 响应式状态
const showDiffModal = ref(false)
const activeMode = ref<'system' | 'user' | 'compare'>('system')
const windowWidth = ref(window.innerWidth)
const isLoadingPrompt = ref(false)

// 从localStorage恢复activeMode (仅当URL中没有promptId时)
// 如果URL中有promptId，应该等待API加载完成后根据prompt_type设置activeMode
if (!route.params.id) {
  try {
    const savedMode = localStorage.getItem(ACTIVE_MODE_KEY)
    if (savedMode && ['system', 'user', 'compare'].includes(savedMode)) {
      activeMode.value = savedMode as 'system' | 'user' | 'compare'
    }
  } catch (e) {
    console.error('读取activeMode失败:', e)
  }
}

// 计算属性
const isDesktop = computed(() => windowWidth.value >= 1200)
const availableProviders = computed(() => settingsStore.getAvailableProviders())
const availableModels = computed(() => settingsStore.getAvailableModels(settingsStore.selectedProvider))

const optimizationModes = [
  { key: 'system', label: '系统提示词优化' },
  { key: 'user', label: '用户提示词优化' },
  { key: 'compare', label: '效果对比' }
]

// 事件处理
const handleModeChange = (mode: 'system' | 'user' | 'compare') => {
  activeMode.value = mode
  // 保存到localStorage
  try {
    localStorage.setItem(ACTIVE_MODE_KEY, mode)
  } catch (e) {
    console.error('保存activeMode失败:', e)
  }
}

const handleOptimize = () => {
  switchTab('optimize')
}

const onProviderChange = () => {
  settingsStore.selectedModel = ''
  // 模型列表会在computed属性中自动更新
  settingsStore.saveSettings()
}

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// 从"我的"页面加载提示词
const loadPromptFromLibrary = async (promptId: number) => {
  isLoadingPrompt.value = true
  
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
    const token = localStorage.getItem('yprompt_token')
    
    if (!token) {
      throw new Error('请先登录')
    }

    const response = await fetch(`${API_BASE_URL}/api/prompts/${promptId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (result.code === 200) {
      const prompt = result.data
      
      console.log('🟢 加载提示词成功:', { 
        id: prompt.id, 
        title: prompt.title, 
        type: prompt.prompt_type,
        final_prompt_length: prompt.final_prompt?.length,
        system_prompt_length: prompt.system_prompt?.length,
        conversation_history_length: prompt.conversation_history?.length
      })
      
      // 根据prompt_type智能路由
      if (prompt.prompt_type === 'user') {
        // 用户提示词 - 加载到用户提示词优化标签页
        activeMode.value = 'user'
        // 设置loadedPromptId（关键！）
        optimizeStore.setLoadedPromptId(prompt.id)
        console.log('🔵 用户提示词 - 设置loadedPromptId:', prompt.id)
        
        // 这里需要通过store或者事件将数据传递给OptimizeSectionRedesign
        // 暂时使用localStorage作为中转
        const userData = {
          draftPrompt: prompt.final_prompt || '',
          systemPrompt: prompt.system_prompt || '',
          conversationHistory: prompt.conversation_history || ''
        }
        console.log('🔵 保存用户提示词数据到localStorage:', userData)
        localStorage.setItem('yprompt_optimize_loaded_user_prompt', JSON.stringify(userData))
      } else {
        // 系统提示词 - 加载到系统提示词优化标签页
        activeMode.value = 'system'
        optimizeStore.systemPrompt = prompt.final_prompt
        optimizeStore.setLoadedPromptId(prompt.id)
        console.log('🔵 系统提示词 - 设置loadedPromptId:', prompt.id)
        console.log('🔵 设置系统提示词到store:', prompt.final_prompt?.substring(0, 50))
      }
      
      // 保存activeMode到localStorage
      localStorage.setItem(ACTIVE_MODE_KEY, activeMode.value)
    } else {
      throw new Error(result.message || '加载失败')
    }
  } catch (error: any) {
    console.error('加载提示词失败:', error)
    alert(`加载失败: ${error.message}`)
  } finally {
    isLoadingPrompt.value = false
  }
}

// 监听路由变化，加载对应的提示词
watch(() => route.params.id, (promptId) => {
  if (promptId) {
    loadPromptFromLibrary(Number(promptId))
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 初始化设置和模型列表
  settingsStore.loadSettings()
  
  // 监听对比触发标志 - 持续监听
  const checkCompareTrigg = setInterval(() => {
    const trigger = localStorage.getItem('yprompt_trigger_compare')
    if (trigger === 'true') {
      console.log('🟢 检测到对比触发，切换到compare模式')
      activeMode.value = 'compare'
      localStorage.removeItem('yprompt_trigger_compare')
      localStorage.setItem(ACTIVE_MODE_KEY, 'compare')
    }
    
    // 监听返回优化页面标志
    const backTrigger = localStorage.getItem('yprompt_back_to_optimize')
    if (backTrigger === 'true') {
      console.log('🟢 检测到返回触发，切换回优化模式')
      const savedMode = localStorage.getItem(ACTIVE_MODE_KEY)
      if (savedMode && ['system', 'user'].includes(savedMode)) {
        activeMode.value = savedMode as 'system' | 'user'
      }
      localStorage.removeItem('yprompt_back_to_optimize')
    }
  }, 100)
  
  // 组件销毁时清理定时器
  onUnmounted(() => {
    clearInterval(checkCompareTrigg)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 响应式断点 */
@media (min-width: 1200px) {
  .desktop-layout {
    display: flex;
  }
  .mobile-layout {
    display: none;
  }
}

@media (max-width: 1199px) {
  .desktop-layout {
    display: none;
  }
  .mobile-layout {
    display: flex;
  }
}
</style>