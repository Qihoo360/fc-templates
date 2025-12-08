import { AIService } from './aiService'
import type { ChatMessage } from './aiService'
import type { ProviderConfig } from '@/stores/settingsStore'
import type { MessageAttachment } from '@/stores/promptStore'
import { promptConfigManager } from '@/config/prompts'

export class AIGuideService {
  private static instance: AIGuideService
  private aiService: AIService

  private constructor() {
    this.aiService = AIService.getInstance()
  }

  // 获取流式模式设置（与ChatInterface保持同步）
  private getStreamMode(): boolean {
    try {
      const savedStreamMode = localStorage.getItem('yprompt_stream_mode')
      return savedStreamMode ? JSON.parse(savedStreamMode) : true // 默认为true
    } catch (error) {
      return true // 默认为流式模式
    }
  }

  public static getInstance(): AIGuideService {
    if (!AIGuideService.instance) {
      AIGuideService.instance = new AIGuideService()
    }
    return AIGuideService.instance
  }

  public async generateSimpleResponse(
    userInput: string,
    conversationHistory: Array<{ type: string; content: string; attachments?: MessageAttachment[] }>,
    provider: ProviderConfig,
    modelId: string,
    stream: boolean = false
  ): Promise<string> {
    
    const messages = this.buildSimpleConversationMessages(userInput, conversationHistory)
    
    // 调用AI API
    const response = await this.aiService.callAI(messages, provider, modelId, stream)
    
    if (!response || response.trim() === '') {
      throw new Error('AI API返回了空响应')
    }
    
    return response
  }

  // 构建简化的对话消息
  private buildSimpleConversationMessages(
    userInput: string,
    conversationHistory: Array<{ type: string; content: string; attachments?: MessageAttachment[] }>
  ): ChatMessage[] {
    
    // 系统消息：使用内置的用户引导规则
    const systemMessage: ChatMessage = {
      role: 'system' as const,
      content: promptConfigManager.getUserGuidedPromptRules()
    }

    // 对话历史
    const conversationMessages: ChatMessage[] = conversationHistory.map(msg => {
      const message: ChatMessage = {
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        attachments: msg.attachments || []
      }
      
      
      return message
    })

    // 构建消息数组
    const messages: ChatMessage[] = [systemMessage, ...conversationMessages]
    
    // 只有当userInput不为空时才添加当前用户消息（避免重复）
    if (userInput.trim()) {
      messages.push({
        role: 'user' as const,
        content: userInput
      })
    }


    return messages
  }

  // 获取步骤信息
  private getStepInfo(stepId: string) {
    const steps = [
      { 
        id: 'taskDefinition', 
        title: '任务定义', 
        description: '明确AI助手的核心任务和主要功能',
        focus: '重点了解用户希望AI完成什么样的工作'
      },
      { 
        id: 'context', 
        title: '使用场景', 
        description: '了解AI的使用环境和目标用户',
        focus: '重点了解在什么情况下使用、面向什么样的用户'
      },
      { 
        id: 'outputFormat', 
        title: '输出格式', 
        description: '定义AI回答的结构、格式和风格',
        focus: '重点了解希望AI如何组织和呈现答案'
      },
      { 
        id: 'qualityCriteria', 
        title: '质量要求', 
        description: '确定成功标准和质量期望',
        focus: '重点了解对准确性、完整性等方面的要求'
      },
      { 
        id: 'executionParams', 
        title: '工作方式', 
        description: '设定AI的思考方式和互动风格',
        focus: '重点了解希望AI采用什么样的工作方式和语调'
      },
      { 
        id: 'optimization', 
        title: '最终确认', 
        description: '确认信息完整性并生成提示词',
        focus: '汇总所有信息并生成最终提示词'
      }
    ]

    return steps.find(step => step.id === stepId) || steps[0]
  }

  // 获取步骤的初始问题 - 使用AI生成
  public async getInitialQuestion(
    stepId: string, 
    provider?: ProviderConfig, 
    modelId?: string,
    stream: boolean = false
  ): Promise<string> {
    if (!provider || !modelId) {
      throw new Error('需要配置AI提供商和模型')
    }
    
    return await this.generateInitialQuestionWithAI(stepId, provider, modelId, stream)
  }

  // 使用AI生成初始问题
  private async generateInitialQuestionWithAI(
    stepId: string,
    provider: ProviderConfig,
    modelId: string,
    stream: boolean = false
  ): Promise<string> {
    const currentStep = this.getStepInfo(stepId)
    
    const systemMessage = {
      role: 'system' as const,
      content: promptConfigManager.getUserGuidedPromptRules()
    }

    const userMessage = {
      role: 'user' as const,
      content: `请为"${currentStep.title}"步骤生成一个合适的开场问题。这个步骤的目标是：${currentStep.description}`
    }

    const response = await this.aiService.callAI([systemMessage, userMessage], provider, modelId, stream)
    return response
  }

  // 基于对话历史生成需求报告
  public async generateRequirementReportFromConversation(
    conversationHistory: Array<{ type: string; content: string; attachments?: MessageAttachment[] }>,
    provider?: ProviderConfig,
    modelId?: string,
    onStreamUpdate?: (content: string) => void
  ): Promise<string> {
    if (!provider || !modelId) {
      throw new Error('需要配置AI提供商和模型')
    }
    
    return await this.generateReportFromConversationWithAI(conversationHistory, provider, modelId, onStreamUpdate)
  }

  // 使用AI基于对话历史生成需求报告
  private async generateReportFromConversationWithAI(
    conversationHistory: Array<{ type: string; content: string; attachments?: MessageAttachment[] }>,
    provider: ProviderConfig,
    modelId: string,
    onStreamUpdate?: (content: string) => void
  ): Promise<string> {
    const systemMessage = {
      role: 'system' as const,
      content: promptConfigManager.getRequirementReportRules()
    }

    const conversationSummary = conversationHistory
      .map(msg => {
        let content = `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`
        
        // 如果有附件，添加附件信息
        if (msg.attachments && msg.attachments.length > 0) {
          const attachmentInfo = msg.attachments.map(att => 
            `[附件: ${att.name} (${att.type}, ${att.size} bytes)]`
          ).join(', ')
          content += `\n附件: ${attachmentInfo}`
        }
        
        return content
      })
      .join('\n\n')

    const userMessage = {
      role: 'user' as const,
      content: `基于以下对话历史生成需求总结报告：

**对话历史：**
${conversationSummary}

请生成完整的需求总结报告，确保所有5个部分都有具体内容。`
    }

    const streamMode = this.getStreamMode()
    
    // 如果有流式回调且启用流式模式，设置流式更新
    if (onStreamUpdate && streamMode) {
      this.aiService.setStreamUpdateCallback((chunk: string) => {
        onStreamUpdate(chunk)
      })
    }
    
    const response = await this.aiService.callAI([systemMessage, userMessage], provider, modelId, streamMode)
    
    // 清理流式回调
    if (onStreamUpdate && streamMode) {
      this.aiService.clearStreamUpdateCallback()
    }
    
    return response
  }

  
}