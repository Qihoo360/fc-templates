<template>
  <div class="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col overflow-hidden">
    <!-- 设置按钮 -->
    <SettingsModal />

    <div class="w-full flex flex-col flex-1 overflow-hidden">
      <div class="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-xl lg:text-2xl font-bold text-gray-800 mb-1">智能提示词创建</h1>
            <p class="text-sm lg:text-base text-gray-600">AI引导式对话，帮您构建专业的提示词</p>
          </div>
          
          <!-- 模型选择器 -->
          <div class="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
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

      <!-- 主内容区域 - 支持移动端折叠，同时保持PC模式滚动修复 -->
      <div v-if="!isMobile" class="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
        <!-- PC端 - Left Panel -->
        <div class="flex flex-col">
          <ChatInterface />
        </div>
        <!-- PC端 - Right Panel -->
        <div class="flex flex-col">
          <PreviewPanel />
        </div>
      </div>

      <!-- 移动端布局 -->
      <div v-else class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <!-- AI助手对话折叠标题栏 - 固定在顶部 -->
        <div 
          v-if="!chatExpanded"
          @click="toggleChat"
          class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0 mb-2"
        >
          <h3 class="font-semibold text-gray-800">AI助手对话</h3>
          <ChevronDown class="w-5 h-5 text-gray-500" />
        </div>

        <!-- AI助手对话模块 -->
        <div v-if="chatExpanded" class="flex flex-col flex-1 min-h-0 mb-2">
          <ChatInterface 
            :is-mobile="isMobile"
            :is-expanded="chatExpanded"
            @toggle="toggleChat"
          />
        </div>

        <!-- 提示词预览模块 -->
        <div v-if="previewExpanded" class="flex flex-col flex-1 min-h-0 mb-2">
          <PreviewPanel 
            :is-mobile="isMobile"
            :is-expanded="previewExpanded"
            @toggle="togglePreview"
          />
        </div>

        <!-- 提示词预览折叠标题栏 - 固定在底部 -->
        <div 
          v-if="!previewExpanded"
          @click="togglePreview"
          class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <h3 class="font-semibold text-gray-800">生成预览</h3>
          <ChevronDown class="w-5 h-5 text-gray-500" />
        </div>
      </div>
    </div>
    
    <!-- 通知容器 -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import ChatInterface from '@/components/ChatInterface.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { usePromptStore } from '@/stores/promptStore'
import { onMounted, computed, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const promptStore = usePromptStore()

// 移动端折叠状态管理
const isMobile = ref(false)
const chatExpanded = ref(true)  // 默认展开对话
const previewExpanded = ref(false)  // 默认折叠预览

const connectionStatus = ref<'disconnected' | 'connected' | 'error'>('disconnected')

// 可用的提供商
const availableProviders = computed(() => {
  return settingsStore.getAvailableProviders()
})

// 当前提供商的可用模型
const availableModels = computed(() => {
  if (!settingsStore.selectedProvider) return []
  return settingsStore.getAvailableModels(settingsStore.selectedProvider)
})

// 提供商改变时重置模型选择
const onProviderChange = () => {
  settingsStore.selectedModel = ''
  const models = availableModels.value
  if (models.length > 0) {
    settingsStore.selectedModel = models[0].id
  }
  settingsStore.saveSettings()
  checkConnection()
}

// 检查连接状态 - 仅检查配置完整性，不发送实际API请求
const checkConnection = () => {
  const provider = settingsStore.getCurrentProvider()
  const model = settingsStore.getCurrentModel()
  
  if (!provider || !model || !provider.apiKey) {
    connectionStatus.value = 'disconnected'
    return
  }

  // 如果配置完整，标记为已连接，实际连接状态在使用时验证
  connectionStatus.value = 'connected'
}

// 监听模型选择变化
watch(() => [settingsStore.selectedProvider, settingsStore.selectedModel], checkConnection)

// 检测移动端设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024 // lg断点
}

// 切换对话模块
const toggleChat = () => {
  if (isMobile.value) {
    if (chatExpanded.value) {
      // 如果当前展开，折叠它并展开预览
      chatExpanded.value = false
      previewExpanded.value = true
    } else {
      // 如果当前折叠，展开它并折叠预览
      chatExpanded.value = true
      previewExpanded.value = false
    }
  }
}

// 切换预览模块
const togglePreview = () => {
  if (isMobile.value) {
    if (previewExpanded.value) {
      // 如果当前展开，折叠它并展开对话
      previewExpanded.value = false
      chatExpanded.value = true
    } else {
      // 如果当前折叠，展开它并折叠对话
      previewExpanded.value = true
      chatExpanded.value = false
    }
  }
}

// 监听生成状态，自动切换模块
watch(() => promptStore.isGenerating, (isGenerating) => {
  if (isMobile.value && isGenerating) {
    // 开始生成时切换到预览模块
    chatExpanded.value = false
    previewExpanded.value = true
  }
})

// 监听需求报告生成，自动切换
watch(() => promptStore.promptData.requirementReport, (report) => {
  if (isMobile.value && report && report.trim().length > 0) {
    // 生成报告后切换到预览模块
    chatExpanded.value = false
    previewExpanded.value = true
  }
})

// 初始化
onMounted(() => {
  settingsStore.loadSettings()
  
  // 如果没有配置，显示设置界面
  const hasConfiguredProvider = availableProviders.value.length > 0
  if (!hasConfiguredProvider) {
    setTimeout(() => {
      settingsStore.showSettings = true
    }, 1000)
  } else {
    checkConnection()
  }

  // 检查移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 对话初始化交给ChatInterface组件处理
})
</script>