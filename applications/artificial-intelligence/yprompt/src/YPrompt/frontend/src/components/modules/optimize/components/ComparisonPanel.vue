<template>
  <div class="h-full min-h-0 overflow-hidden flex flex-col">
    <!-- 上部：两个对话窗口 -->
    <div class="flex-1 min-h-0 grid grid-cols-2 gap-4 mb-4">
    <!-- 左侧：优化前 -->
    <div class="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-200 flex-shrink-0">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
                <h2 class="font-semibold text-gray-800">优化前</h2>
                <button
                  @click="showLeftSystemPromptModal = true"
                  class="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded transition-colors text-sm"
                  :class="comparison.state.systemConfig.leftSystemPrompt.trim() || comparison.state.userConfig.sharedSystemPrompt.trim() ? 'text-green-600' : 'text-gray-400'"
                  :title="'设置系统提示词'"
                >
                  <FileText class="w-4 h-4" />
                </button>
                <button
                  @click="showLeftModelSelector = !showLeftModelSelector"
                  class="p-1 hover:bg-gray-100 rounded transition-colors"
                  :class="leftModel ? 'text-green-600' : 'text-gray-600'"
                  :title="leftModelDisplay"
                >
                  <svg class="w-4 h-4 hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4 4m4-4l-4-4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="handleReset"
                  class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="重置所有数据"
                >
                  <RefreshCw class="w-4 h-4" />
                  <span>重置</span>
                </button>
                <button
                  v-if="leftMessages.length > 0 || leftUserMessages.length > 0"
                  @click="handleClearLeft"
                  class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="清空对话"
                >
                  <RefreshCw class="w-4 h-4" />
                  <span>清空</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 模型选择器 - 左侧 -->
          <div v-if="showLeftModelSelector" class="px-4 pb-2 border-b border-gray-200 bg-gray-50">
            <div class="py-2 space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700">选择AI模型</label>
                <button 
                  v-if="leftProvider"
                  @click="resetLeftModel"
                  class="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="重置为全局模型"
                >
                  重置
                </button>
              </div>
              
              <div class="flex flex-col gap-2">
                <select 
                  v-model="leftProvider" 
                  @change="onLeftProviderChange" 
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">使用全局模型</option>
                  <option v-for="provider in availableProviders" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
                
                <select 
                  v-model="leftModel" 
                  :disabled="!leftProvider"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                >
                  <option value="">选择模型</option>
                  <option v-for="model in leftAvailableModels" :key="model.id" :value="model.id">
                    {{ model.name }}
                  </option>
                </select>
              </div>
              
              <div class="text-xs text-gray-500">
                <span v-if="!leftProvider">当前: 跟随全局模型设置</span>
                <span v-else-if="!leftModel">请选择模型</span>
                <span v-else>当前: {{ leftModelDisplay }}</span>
              </div>
            </div>
          </div>
          
          <div class="flex-1 flex flex-col min-h-0">
            <!-- 对话历史 -->
            <div ref="leftChatContainer" class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              <div v-if="(comparisonMode === 'system' ? leftMessages : leftUserMessages).length === 0" class="flex items-center justify-center h-full text-gray-400">
                <div class="text-center">
                  <MessageSquare class="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p class="text-sm">暂无对话</p>
                </div>
              </div>
              <div
                v-for="msg in (comparisonMode === 'system' ? leftMessages : leftUserMessages)"
                :key="msg.id"
                class="flex group"
                :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
              >
                <div class="flex flex-col w-full max-w-xs lg:max-w-md">
                  <div
                    :class="[
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white px-4 py-3 rounded-lg ml-auto' 
                        : 'bg-gray-100 text-gray-800 px-4 py-3 rounded-lg mr-auto',
                      'transition-all duration-300 relative'
                    ]"
                  >
                    <div
                      v-if="msg.role === 'assistant'"
                      v-html="renderMarkdown(msg.content)"
                      class="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-800"
                    ></div>
                    <div 
                      v-else 
                      class="whitespace-pre-wrap"
                    >{{ msg.content }}<span v-if="msg.isStreaming" class="animate-pulse">▋</span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 用户模式：独立输入框 -->
            <div v-if="comparisonMode === 'user'" class="p-3 border-t border-gray-200">
              <div 
                class="relative border border-gray-300 rounded-2xl focus-within:outline-none focus-within:border-gray-300 overflow-hidden" 
                style="height: 120px;"
              >
                <div class="absolute top-0 left-0 right-0" style="bottom: 48px;">
                  <textarea
                    v-model="leftInput"
                    @keydown="handleLeftKeydown"
                    :placeholder="'Shift+Enter换行'"
                    class="w-full h-full px-2 pt-3 pb-1 border-0 outline-none resize-none disabled:opacity-50 text-base overflow-y-auto bg-transparent"
                    :disabled="isLeftGenerating"
                    rows="1"
                  ></textarea>
                </div>
                
                <div class="absolute bottom-0 left-0 right-0 h-12 flex justify-between items-center px-2 bg-transparent pointer-events-none">
                  <div class="w-8 h-8"></div>
                  
                  <button
                    @click="handleSendLeftMessage"
                    :disabled="!leftInput.trim() || isLeftGenerating"
                    class="w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center pointer-events-auto"
                  >
                    <ArrowUp class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

    <!-- 右侧：优化后 -->
    <div class="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- 头部 -->
          <div class="p-4 border-b border-gray-200 flex-shrink-0">
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-2">
                <h2 class="font-semibold text-gray-800">优化后</h2>
                <button
                  @click="showRightSystemPromptModal = true"
                  class="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded transition-colors text-sm"
                  :class="comparison.state.systemConfig.rightSystemPrompt.trim() || comparison.state.userConfig.sharedSystemPrompt.trim() ? 'text-green-600' : 'text-gray-400'"
                  :title="'设置系统提示词'"
                >
                  <FileText class="w-4 h-4" />
                </button>
                <button
                  @click="showRightModelSelector = !showRightModelSelector"
                  class="p-1 hover:bg-gray-100 rounded transition-colors"
                  :class="rightModel ? 'text-green-600' : 'text-gray-600'"
                  :title="rightModelDisplay"
                >
                  <svg class="w-4 h-4 hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4 4m4-4l-4-4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="rightMessages.length > 0 || rightUserMessages.length > 0"
                  @click="handleClearRight"
                  class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="清空对话"
                >
                  <RefreshCw class="w-4 h-4" />
                  <span>清空</span>
                </button>
                <button
                  v-if="isFromOptimize"
                  @click="handleBack"
                  class="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
                  title="返回优化页面"
                >
                  <ArrowLeft class="w-4 h-4" />
                  <span>返回</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 模型选择器 - 右侧 -->
          <div v-if="showRightModelSelector" class="px-4 pb-2 border-b border-gray-200 bg-gray-50">
            <div class="py-2 space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700">选择AI模型</label>
                <button 
                  v-if="rightProvider"
                  @click="resetRightModel"
                  class="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="重置为全局模型"
                >
                  重置
                </button>
              </div>
              
              <div class="flex flex-col gap-2">
                <select 
                  v-model="rightProvider" 
                  @change="onRightProviderChange" 
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">使用全局模型</option>
                  <option v-for="provider in availableProviders" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
                
                <select 
                  v-model="rightModel" 
                  :disabled="!rightProvider"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                >
                  <option value="">选择模型</option>
                  <option v-for="model in rightAvailableModels" :key="model.id" :value="model.id">
                    {{ model.name }}
                  </option>
                </select>
              </div>
              
              <div class="text-xs text-gray-500">
                <span v-if="!rightProvider">当前: 跟随全局模型设置</span>
                <span v-else-if="!rightModel">请选择模型</span>
                <span v-else>当前: {{ rightModelDisplay }}</span>
              </div>
            </div>
          </div>
          
      <div class="flex-1 flex flex-col min-h-0">
        <!-- 对话历史 -->
        <div ref="rightChatContainer" class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          <div v-if="(comparisonMode === 'system' ? rightMessages : rightUserMessages).length === 0" class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
              <MessageSquare class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p class="text-sm">暂无对话</p>
            </div>
          </div>
          <div
            v-for="msg in (comparisonMode === 'system' ? rightMessages : rightUserMessages)"
            :key="msg.id"
            class="flex group"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
                <div class="flex flex-col w-full max-w-xs lg:max-w-md">
                  <div
                    :class="[
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white px-4 py-3 rounded-lg ml-auto' 
                        : 'bg-gray-100 text-gray-800 px-4 py-3 rounded-lg mr-auto',
                      'transition-all duration-300 relative'
                    ]"
                  >
                    <div
                      v-if="msg.role === 'assistant'"
                      v-html="renderMarkdown(msg.content)"
                      class="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-800"
                    ></div>
                    <div 
                      v-else 
                      class="whitespace-pre-wrap"
                    >{{ msg.content }}<span v-if="msg.isStreaming" class="animate-pulse">▋</span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 用户模式：独立输入框 -->
            <div v-if="comparisonMode === 'user'" class="p-3 border-t border-gray-200">
              <div 
                class="relative border border-gray-300 rounded-2xl focus-within:outline-none focus-within:border-gray-300 overflow-hidden" 
                style="height: 120px;"
              >
                <div class="absolute top-0 left-0 right-0" style="bottom: 48px;">
                  <textarea
                    v-model="rightInput"
                    @keydown="handleRightKeydown"
                    :placeholder="'Shift+Enter换行'"
                    class="w-full h-full px-2 pt-3 pb-1 border-0 outline-none resize-none disabled:opacity-50 text-base overflow-y-auto bg-transparent"
                    :disabled="isRightGenerating"
                    rows="1"
                  ></textarea>
                </div>
                
                <div class="absolute bottom-0 left-0 right-0 h-12 flex justify-between items-center px-2 bg-transparent pointer-events-none">
                  <div class="w-8 h-8"></div>
                  
                  <button
                    @click="handleSendRightMessage"
                    :disabled="!rightInput.trim() || isRightGenerating"
                    class="w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center pointer-events-auto"
                  >
                    <ArrowUp class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
    </div>
    </div>
    
    <!-- 下部：输入框区域 -->
    <div class="flex-shrink-0">
      <!-- 用户模式：左右各自的输入框已经在上面的对话窗口内 -->
      <!-- 系统模式：底部共用输入框 -->
      <div v-if="comparisonMode === 'system'" class="bg-white rounded-lg shadow-md border border-gray-200 p-3">
      <div 
        class="relative border border-gray-300 rounded-2xl focus-within:outline-none focus-within:border-gray-300 overflow-hidden" 
        style="height: 120px;"
      >
        <div class="absolute top-0 left-0 right-0" style="bottom: 48px;">
          <textarea
            v-model="sharedInput"
            @keydown="handleSharedKeydown"
            :placeholder="'Shift+Enter换行'"
            class="w-full h-full px-2 pt-3 pb-1 border-0 outline-none resize-none disabled:opacity-50 text-base overflow-y-auto bg-transparent"
            :disabled="isGenerating"
            rows="1"
          ></textarea>
        </div>
        
        <div class="absolute bottom-0 left-0 right-0 h-12 flex justify-between items-center px-2 bg-transparent pointer-events-none">
          <div class="w-8 h-8"></div>
          
          <button
            @click="handleSendSystemMessage"
            :disabled="!sharedInput.trim() || isGenerating"
            class="w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center pointer-events-auto"
            title="同时发送到两侧"
          >
            <ArrowUp class="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
    </div>
    
    <!-- 系统提示词模态框 - 左侧 -->
    <SystemPromptModal
      :is-open="showLeftSystemPromptModal"
      v-model="leftSystemPromptValue"
      @close="showLeftSystemPromptModal = false"
      @save="handleSaveLeftSystemPrompt"
      :title="comparisonMode === 'system' ? '系统提示词（左 - 优化前）' : '共用系统提示词'"
    />
    
    <!-- 系统提示词模态框 - 右侧 -->
    <SystemPromptModal
      :is-open="showRightSystemPromptModal"
      v-model="rightSystemPromptValue"
      @close="showRightSystemPromptModal = false"
      @save="handleSaveRightSystemPrompt"
      :title="comparisonMode === 'system' ? '系统提示词（右 - 优化后）' : '共用系统提示词'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { MessageSquare, ArrowLeft, RefreshCw, ArrowUp, FileText } from 'lucide-vue-next'
import { useComparison } from '../composables/useComparison'
import { marked } from 'marked'
import SystemPromptModal from './SystemPromptModal.vue'
import { useSettingsStore } from '@/stores/settingsStore'

const comparison = useComparison()
const settingsStore = useSettingsStore()

// 对话容器引用
const leftChatContainer = ref<HTMLElement | null>(null)
const rightChatContainer = ref<HTMLElement | null>(null)

// 本地状态
const comparisonMode = ref<'system' | 'user'>('user')
const sharedInput = ref('')
const leftInput = ref('')
const rightInput = ref('')
const originalUserPrompt = ref('')
const optimizedUserPrompt = ref('')
const isFromOptimize = ref(false) // 是否从优化结果页面加载

// 模态框和选择器状态
const showLeftSystemPromptModal = ref(false)
const showRightSystemPromptModal = ref(false)
const showLeftModelSelector = ref(false)
const showRightModelSelector = ref(false)

// 系统提示词值
const leftSystemPromptValue = ref('')
const rightSystemPromptValue = ref('')

// 模型选择
const leftProvider = ref('')
const leftModel = ref('')
const rightProvider = ref('')
const rightModel = ref('')

// 计算属性
const leftMessages = computed(() => comparison.state.leftMessages)
const rightMessages = computed(() => comparison.state.rightMessages)

const leftUserMessages = computed(() => comparison.state.leftUserMessages)
const rightUserMessages = computed(() => comparison.state.rightUserMessages)

const isGenerating = computed(() => comparison.isGenerating.value)
const isLeftGenerating = computed(() => comparison.state.isLeftGenerating)
const isRightGenerating = computed(() => comparison.state.isRightGenerating)

// 可用的提供商和模型
const availableProviders = computed(() => settingsStore.getAvailableProviders())
const leftAvailableModels = computed(() => {
  if (!leftProvider.value) return []
  return settingsStore.getAvailableModels(leftProvider.value)
})
const rightAvailableModels = computed(() => {
  if (!rightProvider.value) return []
  return settingsStore.getAvailableModels(rightProvider.value)
})

// 模型显示文本
const leftModelDisplay = computed(() => {
  if (!leftProvider.value || !leftModel.value) return '使用全局模型'
  const provider = availableProviders.value.find(p => p.id === leftProvider.value)
  const model = leftAvailableModels.value.find(m => m.id === leftModel.value)
  return model ? `${provider?.name} - ${model.name}` : '使用全局模型'
})
const rightModelDisplay = computed(() => {
  if (!rightProvider.value || !rightModel.value) return '使用全局模型'
  const provider = availableProviders.value.find(p => p.id === rightProvider.value)
  const model = rightAvailableModels.value.find(m => m.id === rightModel.value)
  return model ? `${provider?.name} - ${model.name}` : '使用全局模型'
})

// 从 localStorage 加载数据
onMounted(() => {
  // 加载保存的模型选择
  try {
    const savedModelConfig = localStorage.getItem('yprompt_comparison_model_config')
    if (savedModelConfig) {
      const modelConfig = JSON.parse(savedModelConfig)
      leftProvider.value = modelConfig.leftProvider || ''
      leftModel.value = modelConfig.leftModel || ''
      rightProvider.value = modelConfig.rightProvider || ''
      rightModel.value = modelConfig.rightModel || ''
    }
  } catch (e) {
    console.error('加载模型配置失败:', e)
  }
  
  try {
    const savedData = localStorage.getItem('yprompt_comparison_data')
    if (savedData) {
      const data = JSON.parse(savedData)
      
      // 设置为从优化结果加载
      isFromOptimize.value = true
      
      if (data.mode === 'system') {
        comparisonMode.value = 'system'
        comparison.initSystemComparison(data.originalPrompt, data.optimizedPrompt)
      } else if (data.mode === 'user') {
        comparisonMode.value = 'user'
        comparison.initUserComparison(
          data.systemPrompt || '',
          data.originalPrompt,
          data.optimizedPrompt
        )
        // 预填充输入框
        originalUserPrompt.value = data.originalPrompt
        optimizedUserPrompt.value = data.optimizedPrompt
        leftInput.value = data.originalPrompt
        rightInput.value = data.optimizedPrompt
        
        // 加载对话上下文(如果有)
        if (data.conversationHistory) {
          loadConversationHistory(data.conversationHistory)
        }
      }
    }
  } catch (e) {
    console.error('加载对比数据失败:', e)
  }
  
  // 监听浏览器关闭/刷新事件，清理数据（除了用户信息和模型配置）
  const handleBeforeUnload = () => {
    // 清理comparison相关的数据，但保留模型配置
    const keysToKeep = ['yprompt_token', 'yprompt_user', 'yprompt_settings', 'yprompt_comparison_model_config']
    const allKeys = Object.keys(localStorage)
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    
    // 已清理所有数据（保留用户信息）
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // 组件卸载时移除监听器
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
})

// 系统提示词模式：发送消息
const handleSendSystemMessage = async () => {
  if (!sharedInput.value.trim()) return
  
  comparison.state.systemConfig.sharedUserInput = sharedInput.value
  await comparison.sendSystemMessage()
  sharedInput.value = ''
}

// 用户提示词模式：发送左侧消息
const handleSendLeftMessage = async () => {
  if (!leftInput.value.trim()) return
  
  comparison.state.userConfig.leftUserPrompt = leftInput.value
  await comparison.sendLeftUserMessage()
}

// 用户提示词模式：发送右侧消息
const handleSendRightMessage = async () => {
  if (!rightInput.value.trim()) return
  
  comparison.state.userConfig.rightUserPrompt = rightInput.value
  await comparison.sendRightUserMessage()
}

// 清空左侧对话
const handleClearLeft = () => {
  if (confirm('确定清空左侧对话历史吗？')) {
    comparison.clearHistory('left')
  }
}

// 清空右侧对话
const handleClearRight = () => {
  if (confirm('确定清空右侧对话历史吗？')) {
    comparison.clearHistory('right')
  }
}

// 加载对话上下文
const loadConversationHistory = (conversationHistory: string) => {
  try {
    // 尝试解析JSON格式（新格式）
    const messages = JSON.parse(conversationHistory)
    if (Array.isArray(messages)) {
      messages.forEach(msg => {
        const timestamp = new Date()
        const role = msg.role === 'assistant' ? 'assistant' : 'user'
        
        comparison.state.leftUserMessages.push({
          id: `left-${Date.now()}-${Math.random()}`,
          role,
          content: msg.content,
          timestamp
        })
        
        comparison.state.rightUserMessages.push({
          id: `right-${Date.now()}-${Math.random()}`,
          role,
          content: msg.content,
          timestamp
        })
      })
      // 对话上下文加载完成（JSON格式）
      return
    }
  } catch (e) {
    // 如果JSON解析失败，尝试旧格式
    // JSON解析失败，尝试旧格式
  }
  
  try {
    // 解析对话历史（旧格式：User: xxx\nAssistant: xxx）
    const lines = conversationHistory.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      // 匹配格式: User: ... 或 Assistant: ...
      const userMatch = line.match(/^User:\s*(.+)$/i)
      const assistantMatch = line.match(/^Assistant:\s*(.+)$/i)
      
      if (userMatch) {
        // 添加用户消息到两侧
        const content = userMatch[1].trim()
        const timestamp = new Date()
        
        comparison.state.leftUserMessages.push({
          id: `left-${Date.now()}-${Math.random()}`,
          role: 'user',
          content,
          timestamp
        })
        
        comparison.state.rightUserMessages.push({
          id: `right-${Date.now()}-${Math.random()}`,
          role: 'user',
          content,
          timestamp
        })
      } else if (assistantMatch) {
        // 添加AI消息到两侧
        const content = assistantMatch[1].trim()
        const timestamp = new Date()
        
        comparison.state.leftUserMessages.push({
          id: `left-${Date.now()}-${Math.random()}`,
          role: 'assistant',
          content,
          timestamp
        })
        
        comparison.state.rightUserMessages.push({
          id: `right-${Date.now()}-${Math.random()}`,
          role: 'assistant',
          content,
          timestamp
        })
      }
    }
    
    // 对话上下文加载完成（旧格式）
  } catch (e) {
    console.error('加载对话上下文失败:', e)
  }
}

// 同步系统提示词
watch(() => comparison.state.systemConfig.leftSystemPrompt, (val) => {
  leftSystemPromptValue.value = val
}, { immediate: true })

watch(() => comparison.state.systemConfig.rightSystemPrompt, (val) => {
  rightSystemPromptValue.value = val
}, { immediate: true })

watch(() => comparison.state.userConfig.sharedSystemPrompt, (val) => {
  if (comparisonMode.value === 'user') {
    leftSystemPromptValue.value = val
    rightSystemPromptValue.value = val
  }
}, { immediate: true })

// 监听模型选择变化，保存到localStorage
watch([leftProvider, leftModel, rightProvider, rightModel], () => {
  const modelConfig = {
    leftProvider: leftProvider.value,
    leftModel: leftModel.value,
    rightProvider: rightProvider.value,
    rightModel: rightModel.value
  }
  localStorage.setItem('yprompt_comparison_model_config', JSON.stringify(modelConfig))
  // 保存模型配置
})

// 系统提示词保存处理
const handleSaveLeftSystemPrompt = () => {
  if (comparisonMode.value === 'system') {
    comparison.state.systemConfig.leftSystemPrompt = leftSystemPromptValue.value
  } else {
    comparison.state.userConfig.sharedSystemPrompt = leftSystemPromptValue.value
  }
}

const handleSaveRightSystemPrompt = () => {
  if (comparisonMode.value === 'system') {
    comparison.state.systemConfig.rightSystemPrompt = rightSystemPromptValue.value
  } else {
    comparison.state.userConfig.sharedSystemPrompt = rightSystemPromptValue.value
  }
}

// 键盘事件处理
const handleSharedKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (sharedInput.value.trim() && !isGenerating.value) {
      handleSendSystemMessage()
    }
  }
}

const handleLeftKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (leftInput.value.trim() && !isLeftGenerating.value) {
      handleSendLeftMessage()
    }
  }
}

const handleRightKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (rightInput.value.trim() && !isRightGenerating.value) {
      handleSendRightMessage()
    }
  }
}

// 提供商变更处理
const onLeftProviderChange = () => {
  leftModel.value = ''
}

const onRightProviderChange = () => {
  rightModel.value = ''
}

// 重置模型选择
const resetLeftModel = () => {
  leftProvider.value = ''
  leftModel.value = ''
}

const resetRightModel = () => {
  rightProvider.value = ''
  rightModel.value = ''
}

// 重置
const handleReset = () => {
  if (confirm('确定要重置所有数据吗？这将清空所有对话和设置。')) {
    // 清空所有状态
    comparison.clearHistory('left')
    comparison.clearHistory('right')
    comparison.state.systemConfig.leftSystemPrompt = ''
    comparison.state.systemConfig.rightSystemPrompt = ''
    comparison.state.systemConfig.sharedUserInput = ''
    comparison.state.userConfig.sharedSystemPrompt = ''
    comparison.state.userConfig.leftUserPrompt = ''
    comparison.state.userConfig.rightUserPrompt = ''
    
    // 清空输入框
    sharedInput.value = ''
    leftInput.value = ''
    rightInput.value = ''
    leftSystemPromptValue.value = ''
    rightSystemPromptValue.value = ''
    
    // 清空localStorage
    localStorage.removeItem('yprompt_comparison_data')
    localStorage.removeItem('yprompt_trigger_compare')
  }
}

// 返回优化页面
const handleBack = () => {
  // 只移除触发标志，保留对比数据以便再次切换回来
  localStorage.removeItem('yprompt_trigger_compare')
  const mode = comparisonMode.value === 'system' ? 'system' : 'user'
  localStorage.setItem('yprompt_optimize_active_mode', mode)
  // 通过设置标志触发 OptimizeModule 切换回优化模式
  localStorage.setItem('yprompt_back_to_optimize', 'true')
}

// 自动滚动到底部
const scrollToBottom = (container: HTMLElement | null) => {
  nextTick(() => {
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(() => leftMessages.value.length, () => {
  scrollToBottom(leftChatContainer.value)
})

watch(() => rightMessages.value.length, () => {
  scrollToBottom(rightChatContainer.value)
})

watch(() => leftUserMessages.value.length, () => {
  scrollToBottom(leftChatContainer.value)
})

watch(() => rightUserMessages.value.length, () => {
  scrollToBottom(rightChatContainer.value)
})

// 监听生成状态，流式输出时也要滚动
watch(() => comparison.state.isLeftGenerating, () => {
  scrollToBottom(leftChatContainer.value)
})

watch(() => comparison.state.isRightGenerating, () => {
  scrollToBottom(rightChatContainer.value)
})

// 监听消息内容变化（流式输出更新）
watch(() => {
  const msgs = comparisonMode.value === 'system' ? leftMessages.value : leftUserMessages.value
  return msgs.map(m => m.content).join('')
}, () => {
  scrollToBottom(leftChatContainer.value)
}, { deep: true })

watch(() => {
  const msgs = comparisonMode.value === 'system' ? rightMessages.value : rightUserMessages.value
  return msgs.map(m => m.content).join('')
}, () => {
  scrollToBottom(rightChatContainer.value)
}, { deep: true })

// Markdown渲染
const renderMarkdown = (content: string): string => {
  try {
    return marked(content) as string
  } catch (e) {
    console.error('Markdown渲染失败:', e)
    return content
  }
}
</script>
