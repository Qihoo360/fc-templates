import { computed, watch } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { AIGuideService } from '@/services/aiGuideService'
import { AIService } from '@/services/aiService'
import { PromptGeneratorService } from '@/services/promptGeneratorService'
import { getPromptGeneratorConfig } from '@/config/promptGenerator'
import { cleanAIResponse, checkAIDecision } from '@/utils/aiResponseUtils'

export function useChatLogic(
  chatMessages: { 
    startStreamingMessage: () => number
    updateStreamingMessage: (content: string) => void
    simulateTyping: (message: string, isStreaming: boolean) => Promise<void>
    scrollToBottom: () => void
  },
  chatModel: {
    getCurrentChatModel: () => any
    isStreamMode: { value: boolean }
    showModelSelector: { value: boolean }
  },
  chatInput: {
    clearInput: () => void
  },
  chatAttachments: {
    currentAttachments: { value: any[] }
    clearAttachments: () => void
  },
  chatQuickReplies: {
    checkForceGenerate: (input: string) => boolean
    showQuickReplies: { value: boolean }
  }
) {
  const config = getPromptGeneratorConfig()
  const promptStore = usePromptStore()
  const settingsStore = useSettingsStore()
  const notificationStore = useNotificationStore()
  const aiGuideService = AIGuideService.getInstance()

  const chatContainerMaxHeight = computed(() => {
    // 基础高度：约345px
    let baseCalculation = 345
    
    let modelSelectorExtraHeight = 0
    
    if (chatModel.showModelSelector.value) {
      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
        modelSelectorExtraHeight = 110
      } else {
        modelSelectorExtraHeight = 120
      }
    }
    
    // 计算附件区域额外高度
    // 总计约 115px
    let attachmentExtraHeight = 0
    if (chatAttachments.currentAttachments.value.length > 0) {
      attachmentExtraHeight = 115
    }
    
    const totalReduction = baseCalculation + modelSelectorExtraHeight + attachmentExtraHeight
    return `calc(100vh - ${totalReduction}px)`
  })

  watch(() => promptStore.chatMessages.length, chatMessages.scrollToBottom)
  watch(() => promptStore.isTyping, chatMessages.scrollToBottom)

  const initializeChat = async () => {
    if (promptStore.chatMessages.length === 0 && !promptStore.isInitialized) {
      promptStore.isInitialized = true
      await chatMessages.simulateTyping(config.welcomeMessage, false)
    }
  }

  const clearChat = () => {
    promptStore.clearChat()
    chatQuickReplies.showQuickReplies.value = false
    chatAttachments.clearAttachments()
    
    setTimeout(async () => {
      await chatMessages.simulateTyping(config.welcomeMessage, false)
      promptStore.isInitialized = true
    }, 500)
  }

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim()) {
      if (chatAttachments.currentAttachments.value.length > 0) {
        notificationStore.warning('请输入消息内容，不能只发送附件')
      }
      return
    }
    
    const { provider, model } = chatModel.getCurrentChatModel()
    
    if (!provider || !model) {
      notificationStore.warning('请先在右上角设置中配置AI模型和API密钥')
      return
    }

    promptStore.clearProgressMessages()

    const currentInput = userInput
    const attachments = [...chatAttachments.currentAttachments.value]
    
    const isForceGenerate = chatQuickReplies.checkForceGenerate(currentInput)
    
    promptStore.addMessage('user', currentInput, attachments)
    
    chatInput.clearInput()
    chatAttachments.clearAttachments()
    chatQuickReplies.showQuickReplies.value = false
    
    if (isForceGenerate) {
      await chatMessages.simulateTyping('好的，我将立即为您生成需求报告。', false)
      
      setTimeout(async () => {
        const globalProvider = settingsStore.getCurrentProvider()
        const globalModel = settingsStore.getCurrentModel()
        if (globalProvider && globalModel) {
          await generatePrompt(globalProvider, globalModel.id)
        }
      }, 800)
      return
    }

    promptStore.isTyping = true

    try {
      const useStreamMode = chatModel.isStreamMode.value
      
      if (useStreamMode) {
        const aiService = AIService.getInstance()
        
        let streamingContent = ''
        let messageIndex = -1
        
        aiService.setStreamUpdateCallback((chunk: string) => {
          if (messageIndex === -1) {
            messageIndex = chatMessages.startStreamingMessage()
          }
          streamingContent += chunk
          const cleanContent = cleanAIResponse(streamingContent)
          chatMessages.updateStreamingMessage(cleanContent)
          chatMessages.scrollToBottom()
        })
        
        const validMessages = promptStore.getValidMessages()
        const conversationHistory = validMessages.map(msg => ({
          type: msg.type,
          content: msg.content,
          attachments: msg.attachments || []
        }))
        
        const aiResponse = await aiGuideService.generateSimpleResponse(
          '',
          conversationHistory,
          provider,
          model.id,
          useStreamMode
        )

        aiService.clearStreamUpdateCallback()

        if (useStreamMode && messageIndex === -1) {
          messageIndex = chatMessages.startStreamingMessage()
          const cleanContent = cleanAIResponse(aiResponse)
          chatMessages.updateStreamingMessage(cleanContent)
        } else if (useStreamMode && streamingContent.trim() === '') {
          const cleanContent = cleanAIResponse(aiResponse)
          chatMessages.updateStreamingMessage(cleanContent)
        }

        const shouldEndConversation = checkAIDecision(aiResponse)
        
        if (shouldEndConversation || aiResponse.includes('基于我们的对话，我现在为您生成需求报告：')) {
          setTimeout(async () => {
            const globalProvider = settingsStore.getCurrentProvider()
            const globalModel = settingsStore.getCurrentModel()
            if (globalProvider && globalModel) {
              await generatePrompt(globalProvider, globalModel.id)
            }
          }, 800)
        }
      } else {
        const validMessages = promptStore.getValidMessages()
        const conversationHistory = validMessages.map(msg => ({
          type: msg.type,
          content: msg.content,
          attachments: msg.attachments || []
        }))
        const aiResponse = await aiGuideService.generateSimpleResponse(
          '',
          conversationHistory,
          provider,
          model.id,
          useStreamMode
        )

        const shouldEndConversation = checkAIDecision(aiResponse)
        
        if (shouldEndConversation || aiResponse.includes('基于我们的对话，我现在为您生成需求报告：')) {
          const cleanResponse = cleanAIResponse(aiResponse)
          await chatMessages.simulateTyping(cleanResponse, false)
          
          setTimeout(async () => {
            const globalProvider = settingsStore.getCurrentProvider()
            const globalModel = settingsStore.getCurrentModel()
            if (globalProvider && globalModel) {
              await generatePrompt(globalProvider, globalModel.id)
            }
          }, 800)
        } else {
          const cleanResponse = cleanAIResponse(aiResponse)
          await chatMessages.simulateTyping(cleanResponse, false)
        }
      }
    } catch (error: unknown) {
      promptStore.isTyping = false
      promptStore.isGenerating = false
      const errorMessage = error instanceof Error ? error.message : String(error)
      notificationStore.error(`发生错误: ${errorMessage}`)
      
      if (chatModel.isStreamMode.value) {
        const aiService = AIService.getInstance()
        aiService.clearStreamUpdateCallback()
      }
    }
  }

  const generatePrompt = async (provider: any, modelId: string) => {
    try {
      promptStore.clearProgressMessages()

      const validMessages = promptStore.getValidMessages()
      const conversationHistory = validMessages.map(msg => ({
        type: msg.type,
        content: msg.content,
        attachments: msg.attachments || []
      }))
      
      promptStore.isGenerating = true
      promptStore.currentExecutionStep = 'report'
      promptStore.addOrUpdateProgressMessage('🔄 正在基于对话生成需求报告...', 'progress')
      
      promptStore.promptData.requirementReport = ''
      
      const onReportStreamUpdate = (chunk: string) => {
        promptStore.promptData.requirementReport += chunk
      }
      
      const requirementReport = await aiGuideService.generateRequirementReportFromConversation(
        conversationHistory,
        provider,
        modelId,
        settingsStore.streamMode ? onReportStreamUpdate : undefined
      )
      
      // 只在非流式模式下覆盖内容（流式模式已通过回调更新）
      if (!settingsStore.streamMode) {
        promptStore.promptData.requirementReport = requirementReport
      }
      promptStore.showPreview = true
      
      if (promptStore.isAutoMode) {
        promptStore.addOrUpdateProgressMessage('✅ 需求报告已生成！正在自动执行完整的提示词生成流程...', 'progress')
        
        const promptGeneratorService = PromptGeneratorService.getInstance()
        
        promptStore.currentExecutionStep = 'thinking'
        promptStore.addOrUpdateProgressMessage('🔄 步骤 1/4: 正在分析需求并生成关键指令...', 'progress')
        
        let step1Content = ''
        const onStep1Update = (chunk: string) => {
          step1Content += chunk
          const points = step1Content.split('\n').map(s => s.replace(/^[*-]\s*/, '').trim()).filter(Boolean)
          if (points.length > 0) {
            promptStore.promptData.thinkingPoints = points
          }
        }
        
        const thinkingPoints = await promptGeneratorService.getSystemPromptThinkingPoints(
          promptStore.promptData.requirementReport || requirementReport,
          modelId,
          'zh',
          [],
          provider,
          settingsStore.streamMode ? onStep1Update : undefined
        )
        
        // 只在非流式模式下覆盖内容
        if (!settingsStore.streamMode) {
          promptStore.promptData.thinkingPoints = thinkingPoints
        }
        
        promptStore.currentExecutionStep = 'initial'
        promptStore.addOrUpdateProgressMessage('🔄 步骤 2/4: 正在基于关键指令生成初始提示词...', 'progress')
        
        promptStore.promptData.initialPrompt = ''
        const onStep2Update = (chunk: string) => {
          promptStore.promptData.initialPrompt += chunk
        }
        
        const initialPrompt = await promptGeneratorService.generateSystemPrompt(
          promptStore.promptData.requirementReport || requirementReport,
          modelId,
          'zh',
          [],
          promptStore.promptData.thinkingPoints || thinkingPoints,
          provider,
          settingsStore.streamMode ? onStep2Update : undefined
        )
        
        // 只在非流式模式下覆盖内容
        if (!settingsStore.streamMode) {
          promptStore.promptData.initialPrompt = initialPrompt
        }
        
        promptStore.currentExecutionStep = 'advice'
        promptStore.addOrUpdateProgressMessage('🔄 步骤 3/4: 正在分析提示词并生成优化建议...', 'progress')
        
        let step3Content = ''
        const onStep3Update = (chunk: string) => {
          step3Content += chunk
          const adviceList = step3Content.split('\n').map(s => s.replace(/^[*-]\s*/, '').trim()).filter(Boolean)
          if (adviceList.length > 0) {
            promptStore.promptData.advice = adviceList
          }
        }
        
        const advice = await promptGeneratorService.getOptimizationAdvice(
          promptStore.promptData.initialPrompt || initialPrompt,
          'system',
          modelId,
          'zh',
          [],
          provider,
          settingsStore.streamMode ? onStep3Update : undefined
        )
        
        // 只在非流式模式下覆盖内容
        if (!settingsStore.streamMode) {
          promptStore.promptData.advice = advice
        }
        
        promptStore.currentExecutionStep = 'final'
        promptStore.addOrUpdateProgressMessage('🔄 步骤 4/4: 正在应用优化建议，生成最终提示词...', 'progress')
        
        promptStore.promptData.generatedPrompt = ''
        const onStep4Update = (chunk: string) => {
          promptStore.promptData.generatedPrompt += chunk
        }
        
        const finalPrompt = await promptGeneratorService.applyOptimizationAdvice(
          promptStore.promptData.initialPrompt || initialPrompt,
          promptStore.promptData.advice || advice,
          'system',
          modelId,
          'zh',
          [],
          provider,
          settingsStore.streamMode ? onStep4Update : undefined
        )
        
        // 只在非流式模式下覆盖内容
        if (!settingsStore.streamMode) {
          promptStore.promptData.generatedPrompt = finalPrompt
        }
        promptStore.addOrUpdateProgressMessage('✅ 已为您生成高质量的AI提示词！右侧可查看完整的生成过程和最终结果。', 'progress')
        
      } else {
        promptStore.addOrUpdateProgressMessage('✅ 需求报告已生成！请在右侧预览面板中查看，您可以手动执行每个步骤。', 'progress')
      }
      
      promptStore.isGenerating = false
      promptStore.currentExecutionStep = null
      
    } catch (error: unknown) {
      promptStore.isGenerating = false
      promptStore.currentExecutionStep = null
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      notificationStore.error(`提示词生成失败: ${errorMessage}。请检查网络连接和API配置后重试`)
    }
  }

  const regenerateMessage = async (messageId: string, messageIndex: number, provider: any, model: any) => {
    const message = promptStore.chatMessages.find(msg => msg.id === messageId)
    if (!message || message.type !== 'ai') {
      return
    }

    if (!provider || !model) {
      notificationStore.warning('请先在右上角设置中配置AI模型和API密钥')
      return
    }

    try {
      promptStore.clearProgressMessages()
      
      const contextMessages = promptStore.getValidMessages().slice(0, messageIndex)
      const conversationHistory = contextMessages.map(msg => ({
        type: msg.type,
        content: msg.content,
        attachments: msg.attachments || []
      }))
      
      promptStore.isTyping = true
      
      if (chatModel.isStreamMode.value) {
        const aiService = AIService.getInstance()
        
        let streamingContent = ''
        
        aiService.setStreamUpdateCallback((chunk: string) => {
          streamingContent += chunk
          const cleanContent = cleanAIResponse(streamingContent)
          promptStore.updateMessage(messageId, cleanContent)
          chatMessages.scrollToBottom()
        })
        
        const aiResponse = await aiGuideService.generateSimpleResponse(
          '',
          conversationHistory,
          provider,
          model.id,
          true
        )

        aiService.clearStreamUpdateCallback()
        
        const finalContent = cleanAIResponse(aiResponse)
        promptStore.updateMessage(messageId, finalContent)
        
      } else {
        const aiResponse = await aiGuideService.generateSimpleResponse(
          '',
          conversationHistory,
          provider,
          model.id,
          false
        )
        
        const cleanResponse = cleanAIResponse(aiResponse)
        promptStore.updateMessage(messageId, cleanResponse)
      }
      
      promptStore.isTyping = false
      notificationStore.success('消息已重新生成')
      
    } catch (error: unknown) {
      promptStore.isTyping = false
      const errorMessage = error instanceof Error ? error.message : String(error)
      notificationStore.error(`重新生成失败: ${errorMessage}`)
      
      if (chatModel.isStreamMode.value) {
        const aiService = AIService.getInstance()
        aiService.clearStreamUpdateCallback()
      }
    }
  }

  const resendUserMessage = async (messageId: string, messageIndex: number, provider: any, model: any) => {
    const message = promptStore.chatMessages.find(msg => msg.id === messageId)
    if (!message || message.type !== 'user') {
      return
    }

    if (!provider || !model) {
      notificationStore.warning('请先在右上角设置中配置AI模型和API密钥')
      return
    }

    try {
      promptStore.clearProgressMessages()
      
      if (messageIndex !== -1) {
        for (let i = messageIndex + 1; i < promptStore.chatMessages.length; i++) {
          const msg = promptStore.chatMessages[i]
          if (msg && !msg.isProgress) {
            promptStore.deleteMessage(msg.id!)
          }
        }
      }

      promptStore.isTyping = true

      const useStreamMode = chatModel.isStreamMode.value
      
      if (useStreamMode) {
        const aiService = AIService.getInstance()
        
        let streamingContent = ''
        let msgIndex = -1
        
        aiService.setStreamUpdateCallback((chunk: string) => {
          if (msgIndex === -1) {
            msgIndex = chatMessages.startStreamingMessage()
          }
          streamingContent += chunk
          const cleanContent = cleanAIResponse(streamingContent)
          chatMessages.updateStreamingMessage(cleanContent)
          chatMessages.scrollToBottom()
        })
        
        const validMessages = promptStore.getValidMessages()
        const conversationHistory = validMessages.map(msg => ({
          type: msg.type,
          content: msg.content,
          attachments: msg.attachments || []
        }))
        const aiResponse = await aiGuideService.generateSimpleResponse(
          '',
          conversationHistory,
          provider,
          model.id,
          useStreamMode
        )

        aiService.clearStreamUpdateCallback()

        const shouldEndConversation = checkAIDecision(aiResponse)
        
        if (shouldEndConversation || aiResponse.includes('基于我们的对话，我现在为您生成需求报告：')) {
          setTimeout(async () => {
            const globalProvider = settingsStore.getCurrentProvider()
            const globalModel = settingsStore.getCurrentModel()
            if (globalProvider && globalModel) {
              await generatePrompt(globalProvider, globalModel.id)
            }
          }, 800)
        }
      } else {
        const validMessages = promptStore.getValidMessages()
        const conversationHistory = validMessages.map(msg => ({
          type: msg.type,
          content: msg.content,
          attachments: msg.attachments || []
        }))
        const aiResponse = await aiGuideService.generateSimpleResponse(
          '',
          conversationHistory,
          provider,
          model.id,
          useStreamMode
        )

        const shouldEndConversation = checkAIDecision(aiResponse)
        
        if (shouldEndConversation || aiResponse.includes('基于我们的对话，我现在为您生成需求报告：')) {
          const cleanResponse = cleanAIResponse(aiResponse)
          await chatMessages.simulateTyping(cleanResponse, false)
          
          setTimeout(async () => {
            const globalProvider = settingsStore.getCurrentProvider()
            const globalModel = settingsStore.getCurrentModel()
            if (globalProvider && globalModel) {
              await generatePrompt(globalProvider, globalModel.id)
            }
          }, 800)
        } else {
          const cleanResponse = cleanAIResponse(aiResponse)
          await chatMessages.simulateTyping(cleanResponse, false)
        }
      }
    } catch (error: unknown) {
      promptStore.isTyping = false
      promptStore.isGenerating = false
      const errorMessage = error instanceof Error ? error.message : String(error)
      notificationStore.error(`重新发送失败: ${errorMessage}`)
      
      if (chatModel.isStreamMode.value) {
        const aiService = AIService.getInstance()
        aiService.clearStreamUpdateCallback()
      }
    }
  }

  return {
    chatContainerMaxHeight,
    initializeChat,
    clearChat,
    sendMessage,
    generatePrompt,
    regenerateMessage,
    resendUserMessage
  }
}
