// @ts-nocheck
import { AIService } from './aiService'
import { useSettingsStore } from '@/stores/settingsStore'
import PROMPT_OPTIMIZATION_CONFIG from '@/config/prompts/promptOptimization'
import type { Suggestion, PromptAnalysis, ModelTestConfig, TestResult } from '@/stores/optimizeStore'

/**
 * 提示词优化服务类
 * 集成AI服务，提供提示词分析和优化功能
 */
export class PromptOptimizationService {
  private static instance: PromptOptimizationService
  private aiService: AIService

  private constructor() {
    this.aiService = AIService.getInstance()
  }

  public static getInstance(): PromptOptimizationService {
    if (!PromptOptimizationService.instance) {
      PromptOptimizationService.instance = new PromptOptimizationService()
    }
    return PromptOptimizationService.instance
  }

  /**
   * 分析提示词质量
   */
  async analyzePrompt(prompt: string, type: 'system' | 'user'): Promise<PromptAnalysis> {
    const settingsStore = useSettingsStore()
    const currentProvider = settingsStore.getCurrentProvider()
    const currentModel = settingsStore.getCurrentModel()

    const messages = [
      {
        role: 'system' as const,
        content: PROMPT_OPTIMIZATION_CONFIG.PROMPT_ANALYSIS_PROMPT
      },
      {
        role: 'user' as const,
        content: `${PROMPT_OPTIMIZATION_CONFIG.PROMPT_ANALYSIS_PROMPT}\n\n${prompt}`
      }
    ]

    try {
      const response = await this.aiService.callAI(
        messages,
        currentProvider,
        currentModel?.id || ''
      )

      // 尝试解析JSON响应
      let analysisData: PromptAnalysis
      try {
        analysisData = JSON.parse(response)
      } catch (error) {
        console.warn('Failed to parse AI analysis response, using fallback:', error)
        // 创建默认分析结果
        analysisData = this.createFallbackAnalysis(prompt, type)
      }

      return analysisData
    } catch (error) {
      console.error('Prompt analysis failed:', error)
      throw new Error('分析失败，请检查网络连接和API配置')
    }
  }

  /**
   * 生成优化建议
   */
  async generateSuggestions(
    systemPrompt: string,
    userPrompt: string
  ): Promise<Suggestion[]> {
    const settingsStore = useSettingsStore()
    const currentProvider = settingsStore.getCurrentProvider()
    const currentModel = settingsStore.getCurrentModel()
    const allSuggestions: Suggestion[] = []

    // 并行生成系统和用户提示词的建议
    const promises = []

    if (systemPrompt.trim()) {
      promises.push(this.generateSuggestionsForPrompt(
        systemPrompt,
        'system',
        PROMPT_OPTIMIZATION_CONFIG.SYSTEM_OPTIMIZATION_PROMPT,
        currentProvider,
        currentModel?.id || ''
      ))
    }

    if (userPrompt.trim()) {
      promises.push(this.generateSuggestionsForPrompt(
        userPrompt,
        'user',
        PROMPT_OPTIMIZATION_CONFIG.USER_OPTIMIZATION_PROMPT,
        currentProvider,
        currentModel?.id || ''
      ))
    }

    try {
      const results = await Promise.all(promises)
      results.forEach(suggestions => {
        allSuggestions.push(...suggestions)
      })

      return allSuggestions
    } catch (error) {
      console.error('Generate suggestions failed:', error)
      throw new Error('生成建议失败，请检查网络连接和API配置')
    }
  }

  /**
   * 为特定提示词生成建议
   */
  private async generateSuggestionsForPrompt(
    prompt: string,
    type: 'system' | 'user',
    systemPrompt: string,
    provider: any,
    modelId: string
  ): Promise<Suggestion[]> {
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    const response = await this.aiService.callAI(messages, provider, modelId)

    try {
      const data = JSON.parse(response)
      return (data.suggestions || []).map((s: any, index: number) => ({
        id: `${type}_sug_${Date.now()}_${index}`,
        type: s.type || 'modify',
        category: s.category || 'general',
        title: s.title || '优化建议',
        description: s.description || '',
        reason: s.reason || '',
        expectedEffect: s.expectedEffect || '',
        priority: s.priority || 'medium',
        content: s.content || '',
        applied: false
      }))
    } catch (error) {
      console.warn('Failed to parse suggestions response:', error)
      return []
    }
  }

  /**
   * 应用优化建议
   */
  async applySuggestions(
    originalPrompt: string,
    suggestions: Suggestion[],
    _promptType: 'system' | 'user'
  ): Promise<string> {
    const settingsStore = useSettingsStore()
    const currentProvider = settingsStore.getCurrentProvider()
    const currentModel = settingsStore.getCurrentModel()

    const messages = [
      {
        role: 'system' as const,
        content: PROMPT_OPTIMIZATION_CONFIG.APPLY_SUGGESTIONS_PROMPT
      },
      {
        role: 'user' as const,
        content: PROMPT_OPTIMIZATION_CONFIG.APPLY_SUGGESTIONS_PROMPT
          .replace('{originalPrompt}', originalPrompt)
          .replace('{suggestions}', JSON.stringify(suggestions, null, 2))
      }
    ]

    try {
      return await this.aiService.callAI(messages, currentProvider, currentModel?.id || '')
    } catch (error) {
      console.error('Apply suggestions failed:', error)
      throw new Error('应用建议失败，请检查网络连接和API配置')
    }
  }

  /**
   * 测试提示词效果
   */
  async testPrompt(
    systemPrompt: string,
    userPrompt: string,
    testCase: string,
    config: ModelTestConfig
  ): Promise<TestResult> {
    try {
      // 构建测试消息
      const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = []
      
      if (systemPrompt.trim()) {
        messages.push({
          role: 'system' as const,
          content: systemPrompt
        })
      }

      if (userPrompt.trim()) {
        messages.push({
          role: 'user' as const,
          content: userPrompt
        })
      }

      messages.push({
        role: 'user' as const,
        content: testCase
      })

      // 调用AI服务
      const startTime = Date.now()
      const response = await this.aiService.callAI(
        messages,
        config.provider,
        config.modelId,
        false // 不使用流式输出
      )
      const endTime = Date.now()

      // 估算token数量（简单实现）
      const tokenCount = Math.ceil(response.length / 4)

      return {
        id: `test_${Date.now()}_${Math.random()}`,
        testCase,
        response,
        responseTime: endTime - startTime,
        tokenCount,
        modelId: config.modelId,
        modelName: config.modelId,
        status: 'success',
        rating: 0
      }
    } catch (error) {
      console.error('Prompt test failed:', error)
      return {
        id: `test_${Date.now()}_${Math.random()}`,
        testCase,
        response: `Error: ${error}`,
        responseTime: 0,
        tokenCount: 0,
        modelId: config.modelId,
        modelName: config.modelId,
        status: 'failed',
        rating: 0
      }
    }
  }

  /**
   * 批量测试
   */
  async batchTest(
    systemPrompt: string,
    userPrompt: string,
    testCases: string[],
    configs: ModelTestConfig[]
  ): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const testCase of testCases) {
      for (const config of configs) {
        const result = await this.testPrompt(systemPrompt, userPrompt, testCase, config)
        results.push(result)
      }
    }

    return results
  }

  /**
   * 快速优化（单步骤优化）
   */
  async quickOptimize(prompt: string, _type: 'system' | 'user'): Promise<string> {
    const settingsStore = useSettingsStore()
    const currentProvider = settingsStore.getCurrentProvider()
    const currentModel = settingsStore.getCurrentModel()

    const messages = [
      {
        role: 'system' as const,
        content: PROMPT_OPTIMIZATION_CONFIG.QUICK_OPTIMIZATION_PROMPT
      },
      {
        role: 'user' as const,
        content: `${PROMPT_OPTIMIZATION_CONFIG.QUICK_OPTIMIZATION_PROMPT}\n\n${prompt}`
      }
    ]

    try {
      return await this.aiService.callAI(messages, currentProvider, currentModel?.id || '')
    } catch (error) {
      console.error('Quick optimization failed:', error)
      throw new Error('快速优化失败，请检查网络连接和API配置')
    }
  }

  /**
   * 创建备用分析结果
   */
  private createFallbackAnalysis(prompt: string, type: 'system' | 'user'): PromptAnalysis {
    const wordCount = prompt.length
    const estimated_tokens = Math.ceil(wordCount / 4)
    
    // 基于简单规则的评分
    let overallScore = 70
    
    if (type === 'system') {
      if (prompt.includes('你是一个') || prompt.includes('You are a')) {
        overallScore += 10
      }
      if (prompt.includes('你的任务是') || prompt.includes('Your task is')) {
        overallScore += 5
      }
      if (prompt.includes('请按照') || prompt.includes('Please follow')) {
        overallScore += 5
      }
    } else {
      if (prompt.length > 50) {
        overallScore += 5
      }
      if (prompt.includes('请') || prompt.includes('Please')) {
        overallScore += 5
      }
    }

    return {
      overall_score: Math.min(overallScore, 100),
      analysis: {
        role: { score: overallScore, status: 'good', feedback: '角色定义基本完善' },
        task: { score: overallScore, status: 'good', feedback: '任务描述较为清晰' },
        format: { score: overallScore - 10, status: 'needs_improvement', feedback: '输出格式需要更详细的说明' },
        constraints: { score: overallScore - 5, status: 'needs_improvement', feedback: '约束条件可以更明确' },
        example: { score: overallScore - 20, status: 'needs_improvement', feedback: '缺少示例说明' },
        language: { score: overallScore, status: 'good', feedback: '语言表达清晰' }
      },
      suggestions: [
        { area: 'format', suggestion: '添加详细的输出格式说明' },
        { area: 'example', suggestion: '提供输入输出示例' }
      ],
      language: 'zh',
      word_count: wordCount,
      estimated_tokens
    }
  }
}

// 导出单例实例
export const promptOptimizationService = PromptOptimizationService.getInstance()