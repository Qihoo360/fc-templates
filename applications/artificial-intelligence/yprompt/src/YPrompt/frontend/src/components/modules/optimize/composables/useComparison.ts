// src/components/modules/optimize/composables/useComparison.ts

import { reactive, computed } from 'vue'
import { AIService } from '@/services/aiService'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * 对比模式类型
 * system: 系统提示词对比 - 共用输入框，两个独立系统提示词
 * user: 用户提示词对比 - 共用系统提示词，两个独立输入框
 */
export type ComparisonMode = 'system' | 'user'

/**
 * 对话消息
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

/**
 * 系统提示词对比配置
 */
export interface SystemComparisonConfig {
  leftSystemPrompt: string   // 左侧（优化前）
  rightSystemPrompt: string  // 右侧（优化后）
  sharedUserInput: string    // 共用的用户输入
}

/**
 * 用户提示词对比配置
 */
export interface UserComparisonConfig {
  sharedSystemPrompt: string  // 共用的系统提示词
  leftUserPrompt: string      // 左侧（优化前）用户提示词
  rightUserPrompt: string     // 右侧（优化后）用户提示词
}

/**
 * 对比状态
 */
interface ComparisonState {
  mode: ComparisonMode
  
  // 系统提示词对比
  systemConfig: SystemComparisonConfig
  leftMessages: ChatMessage[]   // 左侧对话历史（系统模式）
  rightMessages: ChatMessage[]  // 右侧对话历史（系统模式）
  
  // 用户提示词对比
  userConfig: UserComparisonConfig
  leftUserMessages: ChatMessage[]   // 左侧对话历史（用户模式）
  rightUserMessages: ChatMessage[]  // 右侧对话历史（用户模式）
  
  // 加载状态
  isLeftGenerating: boolean
  isRightGenerating: boolean
}

export function useComparison() {
  const settingsStore = useSettingsStore()
  const aiService = AIService.getInstance()
  
  const state = reactive<ComparisonState>({
    mode: 'system',
    
    systemConfig: {
      leftSystemPrompt: '',
      rightSystemPrompt: '',
      sharedUserInput: ''
    },
    leftMessages: [],
    rightMessages: [],
    
    userConfig: {
      sharedSystemPrompt: '',
      leftUserPrompt: '',
      rightUserPrompt: ''
    },
    leftUserMessages: [],
    rightUserMessages: [],
    
    isLeftGenerating: false,
    isRightGenerating: false
  })
  
  // 计算属性
  const isGenerating = computed(() => state.isLeftGenerating || state.isRightGenerating)
  
  /**
   * 初始化系统提示词对比
   */
  const initSystemComparison = (originalPrompt: string, optimizedPrompt: string) => {
    state.mode = 'system'
    state.systemConfig.leftSystemPrompt = originalPrompt
    state.systemConfig.rightSystemPrompt = optimizedPrompt
    state.systemConfig.sharedUserInput = ''
    state.leftMessages = []
    state.rightMessages = []
    
    console.log('🔵 初始化系统提示词对比:', {
      leftLength: originalPrompt.length,
      rightLength: optimizedPrompt.length
    })
  }
  
  /**
   * 初始化用户提示词对比
   */
  const initUserComparison = (
    systemPrompt: string,
    originalUserPrompt: string,
    optimizedUserPrompt: string
  ) => {
    state.mode = 'user'
    state.userConfig.sharedSystemPrompt = systemPrompt
    state.userConfig.leftUserPrompt = originalUserPrompt
    state.userConfig.rightUserPrompt = optimizedUserPrompt
    state.leftUserMessages = []
    state.rightUserMessages = []
    
    console.log('🔵 初始化用户提示词对比:', {
      systemPromptLength: systemPrompt.length,
      leftLength: originalUserPrompt.length,
      rightLength: optimizedUserPrompt.length
    })
  }
  
  /**
   * 发送消息（系统提示词对比模式）
   */
  const sendSystemMessage = async () => {
    if (!state.systemConfig.sharedUserInput.trim()) return
    if (isGenerating.value) return
    
    const currentProvider = settingsStore.getAvailableProviders().find(
      p => p.id === settingsStore.selectedProvider
    )
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    const userMessage = state.systemConfig.sharedUserInput.trim()
    const userMessageId = `user-${Date.now()}`
    
    // 添加用户消息到两侧
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    state.leftMessages.push({ ...userMsg, id: `left-${userMessageId}` })
    state.rightMessages.push({ ...userMsg, id: `right-${userMessageId}` })
    
    // 清空输入
    state.systemConfig.sharedUserInput = ''
    
    // 并发调用两侧 AI
    const leftPromise = callAI(
      'left',
      state.systemConfig.leftSystemPrompt,
      state.leftMessages
    )
    const rightPromise = callAI(
      'right',
      state.systemConfig.rightSystemPrompt,
      state.rightMessages
    )
    
    await Promise.all([leftPromise, rightPromise])
  }
  
  /**
   * 发送消息到左侧（用户提示词对比模式）
   */
  const sendLeftUserMessage = async () => {
    if (!state.userConfig.leftUserPrompt.trim()) return
    if (state.isLeftGenerating) return
    
    const currentProvider = settingsStore.getAvailableProviders().find(
      p => p.id === settingsStore.selectedProvider
    )
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    const userMessage = state.userConfig.leftUserPrompt.trim()
    const userMessageId = `left-user-${Date.now()}`
    
    // 添加用户消息
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    state.leftUserMessages.push(userMsg)
    
    // 清空输入
    state.userConfig.leftUserPrompt = ''
    
    // 调用 AI
    await callAI(
      'left',
      state.userConfig.sharedSystemPrompt,
      state.leftUserMessages
    )
  }
  
  /**
   * 发送消息到右侧（用户提示词对比模式）
   */
  const sendRightUserMessage = async () => {
    if (!state.userConfig.rightUserPrompt.trim()) return
    if (state.isRightGenerating) return
    
    const currentProvider = settingsStore.getAvailableProviders().find(
      p => p.id === settingsStore.selectedProvider
    )
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    const userMessage = state.userConfig.rightUserPrompt.trim()
    const userMessageId = `right-user-${Date.now()}`
    
    // 添加用户消息
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    state.rightUserMessages.push(userMsg)
    
    // 清空输入
    state.userConfig.rightUserPrompt = ''
    
    // 调用 AI
    await callAI(
      'right',
      state.userConfig.sharedSystemPrompt,
      state.rightUserMessages
    )
  }
  
  /**
   * 调用 AI 获取响应
   */
  const callAI = async (
    side: 'left' | 'right',
    systemPrompt: string,
    messages: ChatMessage[]
  ) => {
    const currentProvider = settingsStore.getAvailableProviders().find(
      p => p.id === settingsStore.selectedProvider
    )
    const currentModel = settingsStore.selectedModel
    
    if (!currentProvider || !currentModel) {
      throw new Error('请先选择AI提供商和模型')
    }
    
    // 设置生成状态
    if (side === 'left') {
      state.isLeftGenerating = true
    } else {
      state.isRightGenerating = true
    }
    
    // 创建 AI 响应消息
    const aiMessageId = `${side}-ai-${Date.now()}`
    const aiMsg: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    messages.push(aiMsg)
    
    try {
      // 构建消息历史
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
          .filter(m => m.id !== aiMessageId)
          .map(m => ({ role: m.role, content: m.content }))
      ]
      
      // 为这个特定调用创建独立的流式回调
      // 使用闭包捕获当前的 aiMessageId，避免并发时互相干扰
      const streamCallback = (chunk: string) => {
        const msg = messages.find(m => m.id === aiMessageId)
        if (msg) {
          msg.content += chunk
        }
      }
      
      // 调用 AI，传入独立的回调函数（支持并发调用）
      const response = await aiService.callAI(
        apiMessages,
        currentProvider,
        currentModel,
        true, // 流式输出
        streamCallback // 传入回调参数，而不是全局设置
      )
      
      // 更新最终响应
      const msg = messages.find(m => m.id === aiMessageId)
      if (msg) {
        msg.content = response
        msg.isStreaming = false
      }
    } catch (error: any) {
      console.error(`${side} AI call failed:`, error)
      const msg = messages.find(m => m.id === aiMessageId)
      if (msg) {
        msg.content = `❌ 错误: ${error.message}`
        msg.isStreaming = false
      }
    } finally {
      if (side === 'left') {
        state.isLeftGenerating = false
      } else {
        state.isRightGenerating = false
      }
    }
  }
  
  /**
   * 清空对话历史
   */
  const clearHistory = (side?: 'left' | 'right') => {
    if (state.mode === 'system') {
      if (!side || side === 'left') {
        state.leftMessages = []
      }
      if (!side || side === 'right') {
        state.rightMessages = []
      }
    } else {
      if (!side || side === 'left') {
        state.leftUserMessages = []
      }
      if (!side || side === 'right') {
        state.rightUserMessages = []
      }
    }
  }
  
  /**
   * 重置所有状态
   */
  const reset = () => {
    state.systemConfig = {
      leftSystemPrompt: '',
      rightSystemPrompt: '',
      sharedUserInput: ''
    }
    state.userConfig = {
      sharedSystemPrompt: '',
      leftUserPrompt: '',
      rightUserPrompt: ''
    }
    state.leftMessages = []
    state.rightMessages = []
    state.leftUserMessages = []
    state.rightUserMessages = []
    state.isLeftGenerating = false
    state.isRightGenerating = false
  }
  
  return {
    state,
    isGenerating,
    initSystemComparison,
    initUserComparison,
    sendSystemMessage,
    sendLeftUserMessage,
    sendRightUserMessage,
    clearHistory,
    reset
  }
}
