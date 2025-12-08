// @ts-nocheck
// import { ref } from 'vue'
import { useOptimizeStore } from '@/stores/optimizeStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { AIService } from '@/services/aiService'
import PROMPT_OPTIMIZATION_CONFIG from '@/config/prompts/promptOptimization'
import type { Suggestion, PromptAnalysis, TestResult, ModelTestConfig } from '@/stores/optimizeStore'

export function useOptimizeModule() {
  const optimizeStore = useOptimizeStore()
  const settingsStore = useSettingsStore()
  const aiService = AIService.getInstance()

  const {
    systemPrompt,
    userPrompt,
    isAnalyzing,
    isGeneratingSuggestions,
    isApplyingSuggestions,
    analysis,
    suggestions,
    selectedSuggestions,
    optimizedPrompts,
    setAnalysis,
    setSuggestions,
    setOptimizedPrompts,
    toggleSuggestion,
    selectAllSuggestions,
    deselectAllSuggestions
  } = optimizeStore

  // 分析提示词质量
  const analyzePrompt = async (): Promise<void> => {
    if (!systemPrompt.value.trim() && !userPrompt.value.trim()) {
      throw new Error('请输入提示词内容')
    }

    isAnalyzing.value = true
    
    try {
      // 构建分析提示词
      const promptToAnalyze = systemPrompt.value.trim() || userPrompt.value.trim()
      const promptType = systemPrompt.value.trim() ? 'system prompt' : 'user prompt'
      
      const messages = [
        {
          role: 'system',
          content: PROMPT_OPTIMIZATION_CONFIG.PROMPT_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: `${PROMPT_OPTIMIZATION_CONFIG.PROMPT_ANALYSIS_PROMPT}\n\n${promptToAnalyze}`
        }
      ]

      // 调用AI进行分析
      const response = await aiService.callAI(
        messages,
        currentProvider,
        currentModel
      )

      // 解析响应
      let analysisData: PromptAnalysis
      try {
        analysisData = JSON.parse(response)
      } catch (error) {
        console.error('Failed to parse analysis response:', error)
        // 创建默认分析结果
        analysisData = {
          overall_score: 70,
          analysis: {
            role: { score: 70, status: 'good', feedback: '角色定义基本完善' },
            task: { score: 70, status: 'good', feedback: '任务描述较为清晰' },
            format: { score: 60, status: 'needs_improvement', feedback: '输出格式需要更详细的说明' },
            constraints: { score: 65, status: 'needs_improvement', feedback: '约束条件可以更明确' },
            example: { score: 50, status: 'needs_improvement', feedback: '缺少示例说明' },
            language: { score: 75, status: 'good', feedback: '语言表达清晰' }
          },
          suggestions: [
            { area: 'format', suggestion: '添加详细的输出格式说明' },
            { area: 'example', suggestion: '提供输入输出示例' }
          ],
          language: 'zh',
          word_count: promptToAnalyze.length,
          estimated_tokens: Math.ceil(promptToAnalyze.length / 4)
        }
      }

      setAnalysis(analysisData)
    } catch (error) {
      console.error('Analysis failed:', error)
      throw new Error('分析失败，请重试')
    } finally {
      isAnalyzing.value = false
    }
  }

  // 生成优化建议
  const generateSuggestions = async (): Promise<void> => {
    if (!systemPrompt.value.trim() && !userPrompt.value.trim()) {
      throw new Error('请输入提示词内容')
    }

    isGeneratingSuggestions.value = true
    
    try {
      const allSuggestions: Suggestion[] = []

      // 生成系统提示词建议
      if (systemPrompt.value.trim()) {
        const systemSuggestions = await generateSuggestionsForPrompt(
          systemPrompt.value,
          'system',
          PROMPT_OPTIMIZATION_CONFIG.SYSTEM_OPTIMIZATION_PROMPT
        )
        allSuggestions.push(...systemSuggestions)
      }

      // 生成用户提示词建议
      if (userPrompt.value.trim()) {
        const userSuggestions = await generateSuggestionsForPrompt(
          userPrompt.value,
          'user',
          PROMPT_OPTIMIZATION_CONFIG.USER_OPTIMIZATION_PROMPT
        )
        allSuggestions.push(...userSuggestions)
      }

      setSuggestions(allSuggestions)
    } catch (error) {
      console.error('Generate suggestions failed:', error)
      throw new Error('生成建议失败，请重试')
    } finally {
      isGeneratingSuggestions.value = false
    }
  }

  // 为特定提示词生成建议
  const generateSuggestionsForPrompt = async (
    prompt: string,
    type: 'system' | 'user',
    systemPrompt: string
  ): Promise<Suggestion[]> => {
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await aiService.callAI(
      messages,
      currentProvider,
      currentModel
    )

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
      console.error('Failed to parse suggestions:', error)
      return []
    }
  }

  // 应用选中的优化建议
  const applySuggestions = async (): Promise<void> => {
    if (selectedSuggestions.value.length === 0) {
      throw new Error('请选择要应用的建议')
    }

    isApplyingSuggestions.value = true
    
    try {
      // 获取选中的建议
      const selectedSuggestionObjects = suggestions.value.filter(s => 
        selectedSuggestions.value.includes(s.id)
      )

      // 分别处理系统和用户提示词
      let optimizedSystem = systemPrompt.value
      let optimizedUser = userPrompt.value

      // 应用系统提示词建议
      const systemSuggestions = selectedSuggestionObjects.filter(s => 
        ['role', 'profile', 'skills', 'goal', 'rules', 'workflow', 'format', 'example', 'initialization'].includes(s.category)
      )
      if (systemSuggestions.length > 0 && systemPrompt.value.trim()) {
        optimizedSystem = await applySuggestionsToPrompt(
          systemPrompt.value,
          systemSuggestions,
          'system'
        )
      }

      // 应用用户提示词建议
      const userSuggestions = selectedSuggestionObjects.filter(s => 
        ['task', 'context', 'output', 'constraints', 'example', 'language'].includes(s.category)
      )
      if (userSuggestions.length > 0 && userPrompt.value.trim()) {
        optimizedUser = await applySuggestionsToPrompt(
          userPrompt.value,
          userSuggestions,
          'user'
        )
      }

      // 更新优化结果
      setOptimizedPrompts(optimizedSystem, optimizedUser)
    } catch (error) {
      console.error('Apply suggestions failed:', error)
      throw new Error('应用建议失败，请重试')
    } finally {
      isApplyingSuggestions.value = false
    }
  }

  // 将建议应用到提示词
  const applySuggestionsToPrompt = async (
    originalPrompt: string,
    suggestions: Suggestion[],
    promptType: 'system' | 'user'
  ): Promise<string> => {
    const messages = [
      {
        role: 'system',
        content: PROMPT_OPTIMIZATION_CONFIG.APPLY_SUGGESTIONS_PROMPT
      },
      {
        role: 'user',
        content: PROMPT_OPTIMIZATION_CONFIG.APPLY_SUGGESTIONS_PROMPT
          .replace('{originalPrompt}', originalPrompt)
          .replace('{suggestions}', JSON.stringify(suggestions, null, 2))
      }
    ]

    return await aiService.callAI(
      messages,
      currentProvider,
      currentModel
    )
  }

  // 运行模型测试
  const runModelTest = async (
    config: ModelTestConfig,
    testCase: string
  ): Promise<TestResult> => {
    try {
      // 获取要测试的提示词版本
      let systemPromptToUse = systemPrompt.value
      let userPromptToUse = userPrompt.value

      if (config.promptVersion === 'optimized') {
        systemPromptToUse = optimizedPrompts.value.system || systemPrompt.value
        userPromptToUse = optimizedPrompts.value.user || userPrompt.value
      }

      // 构建测试消息
      const messages = []
      
      if (systemPromptToUse.trim()) {
        messages.push({
          role: 'system',
          content: systemPromptToUse
        })
      }

      if (userPromptToUse.trim()) {
        messages.push({
          role: 'user',
          content: userPromptToUse
        })
      }

      messages.push({
        role: 'user',
        content: testCase
      })

      // 调用AI服务
      const startTime = Date.now()
      const response = await aiService.callAI(
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
        modelConfig: config,
        status: 'success',
        data: {
          response,
          responseTime: endTime - startTime,
          tokenCount,
          model: config.modelId
        },
        error: null
      }
    } catch (error) {
      console.error('Model test failed:', error)
      return {
        id: `test_${Date.now()}_${Math.random()}`,
        modelConfig: config,
        status: 'error',
        data: null,
        error: error as Error
      }
    }
  }

  return {
    // 分析功能
    analyzePrompt,
    
    // 建议功能
    generateSuggestions,
    applySuggestions,
    toggleSuggestion,
    selectAllSuggestions,
    deselectAllSuggestions,
    
    // 测试功能
    runModelTest,
    
    // 状态
    isAnalyzing,
    isGeneratingSuggestions,
    isApplyingSuggestions,
    analysis,
    suggestions,
    selectedSuggestions,
    optimizedPrompts
  }
}