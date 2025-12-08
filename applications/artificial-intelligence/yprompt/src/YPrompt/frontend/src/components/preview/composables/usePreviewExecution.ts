import { ref } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { PromptGeneratorService } from '@/services/promptGeneratorService'
import { AIGuideService } from '@/services/aiGuideService'
import { cleanConvertedResponse } from '@/utils/aiResponseUtils'

export function usePreviewExecution(switchToTabWithScroll: (tab: string) => void, scrollToBottomOfContent: () => void) {
  const promptStore = usePromptStore()
  const settingsStore = useSettingsStore()
  const notificationStore = useNotificationStore()
  const isExecuting = ref(false)
  const abortController = ref<AbortController | null>(null)

  // 执行完整工作流（自动模式）
  const executeFullWorkflow = async () => {
    if (!promptStore.promptData.requirementReport.trim()) {
      notificationStore.warning('请先输入需求描述')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()
      const requirementReport = promptStore.promptData.requirementReport

      // 步骤1: 生成关键指令
      promptStore.currentExecutionStep = 'thinking'
      let step1Content = ''
      let step1Initialized = false
      const onStep1Update = (chunk: string) => {
        step1Content += chunk

        // 首次收到数据时立即切换标签页
        if (!step1Initialized && chunk.trim()) {
          step1Initialized = true
          promptStore.promptData.thinkingPoints = ['正在生成...']
          switchToTabWithScroll('thinking')
        }

        const points = step1Content.split('\n').map(s => s.replace(/^[*-]\s*/, '').trim()).filter(Boolean)
        if (points.length > 0) {
          promptStore.promptData.thinkingPoints = points
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const thinkingPoints = await promptGeneratorService.getSystemPromptThinkingPoints(
        requirementReport,
        model.id,
        'zh',
        [],
        provider,
        onStep1Update
      )
      promptStore.promptData.thinkingPoints = thinkingPoints

      // 步骤2: 生成初始提示词
      promptStore.currentExecutionStep = 'initial'
      let step2Initialized = false
      const onStep2Update = (chunk: string) => {
        // 首次收到数据时立即切换标签页
        if (!step2Initialized && chunk.trim()) {
          step2Initialized = true
          promptStore.promptData.initialPrompt = '正在生成...'
          switchToTabWithScroll('initial')
        }

        // 如果已经初始化，追加内容；否则设置内容
        if (step2Initialized) {
          if (promptStore.promptData.initialPrompt === '正在生成...') {
            promptStore.promptData.initialPrompt = chunk
          } else {
            promptStore.promptData.initialPrompt += chunk
          }
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const initialPrompt = await promptGeneratorService.generateSystemPrompt(
        requirementReport,
        model.id,
        'zh',
        [],
        thinkingPoints,
        provider,
        onStep2Update
      )
      promptStore.promptData.initialPrompt = initialPrompt

      // 步骤3: 获取优化建议
      promptStore.currentExecutionStep = 'advice'
      let step3Content = ''
      let step3Initialized = false
      const onStep3Update = (chunk: string) => {
        step3Content += chunk

        // 首次收到数据时立即切换标签页
        if (!step3Initialized && chunk.trim()) {
          step3Initialized = true
          promptStore.promptData.advice = ['正在生成...']
          switchToTabWithScroll('advice')
        }

        const adviceList = step3Content.split('\n').map(s => s.replace(/^[*-]\s*/, '').trim()).filter(Boolean)
        if (adviceList.length > 0) {
          promptStore.promptData.advice = adviceList
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const advice = await promptGeneratorService.getOptimizationAdvice(
        initialPrompt,
        'system',
        model.id,
        'zh',
        [],
        provider,
        onStep3Update
      )
      promptStore.promptData.advice = advice

      // 步骤4: 生成最终提示词
      promptStore.currentExecutionStep = 'final'
      let step4Initialized = false
      const onStep4Update = (chunk: string) => {
        // 首次收到数据时立即切换标签页
        if (!step4Initialized && chunk.trim()) {
          step4Initialized = true
          promptStore.promptData.generatedPrompt = '正在生成...'
          switchToTabWithScroll('zh')
        }

        // 如果已经初始化，追加内容；否则设置内容
        if (step4Initialized) {
          if (promptStore.promptData.generatedPrompt === '正在生成...') {
            promptStore.promptData.generatedPrompt = chunk
          } else {
            promptStore.promptData.generatedPrompt += chunk
          }
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const finalPrompt = await promptGeneratorService.applyOptimizationAdvice(
        initialPrompt,
        advice,
        'system',
        model.id,
        'zh',
        [],
        provider,
        onStep4Update
      )
      // 清理代码块标记和多余文字
      promptStore.promptData.generatedPrompt = cleanConvertedResponse(finalPrompt)

      // 自动切换到最终提示词标签页
      switchToTabWithScroll('zh')

    } catch (error) {
      notificationStore.error('自动生成提示词失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 执行步骤1：生成关键指令
  const executeThinkingPoints = async () => {
    if (!promptStore.promptData.requirementReport.trim()) {
      notificationStore.warning('请先输入需求报告')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'thinking'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let streamContent = ''
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        streamContent += chunk

        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.thinkingPoints = ['正在生成...']
          switchToTabWithScroll('thinking')
        }

        // 实时解析并更新关键指令
        const points = streamContent
          .split('\n')
          .map(s => s.replace(/^[*-]\s*/, '').trim())
          .filter(Boolean)

        if (points.length > 0) {
          promptStore.promptData.thinkingPoints = points
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const thinkingPoints = await promptGeneratorService.getSystemPromptThinkingPoints(
        promptStore.promptData.requirementReport,
        model.id,
        'zh',
        [],
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性
      promptStore.promptData.thinkingPoints = thinkingPoints

    } catch (error) {
      notificationStore.error('生成关键指令失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 执行步骤2：生成初始提示词
  const executeInitialPrompt = async () => {
    if (!promptStore.promptData.thinkingPoints || promptStore.promptData.thinkingPoints.length === 0) {
      notificationStore.warning('请先生成关键指令')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'initial'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.initialPrompt = '正在生成...'
          switchToTabWithScroll('initial')
        }

        // 如果已经初始化，追加内容；否则设置内容
        if (hasInitialized) {
          if (promptStore.promptData.initialPrompt === '正在生成...') {
            promptStore.promptData.initialPrompt = chunk
          } else {
            promptStore.promptData.initialPrompt += chunk
          }
        }
      }

      const initialPrompt = await promptGeneratorService.generateSystemPrompt(
        promptStore.promptData.requirementReport,
        model.id,
        'zh',
        [],
        promptStore.promptData.thinkingPoints,
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性 - 清理代码块标记
      promptStore.promptData.initialPrompt = cleanConvertedResponse(initialPrompt)

    } catch (error) {
      notificationStore.error('生成初始提示词失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 执行步骤3：生成优化建议
  const executeAdvice = async () => {
    if (!promptStore.promptData.initialPrompt) {
      notificationStore.error('请先生成初始提示词')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'advice'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let streamContent = ''
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        streamContent += chunk

        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.advice = ['正在生成...']
          switchToTabWithScroll('advice')
        }

        // 实时解析并更新优化建议
        const adviceList = streamContent
          .split('\n')
          .map(s => s.replace(/^[*-]\s*/, '').trim())
          .filter(Boolean)

        if (adviceList.length > 0) {
          promptStore.promptData.advice = adviceList
        }
      }

      const advice = await promptGeneratorService.getOptimizationAdvice(
        promptStore.promptData.initialPrompt,
        'system',
        model.id,
        'zh',
        [],
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性
      promptStore.promptData.advice = advice

    } catch (error) {
      notificationStore.error('生成优化建议失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 执行步骤4：生成最终提示词
  const executeFinalPrompt = async () => {
    if (!promptStore.promptData.initialPrompt || !promptStore.promptData.advice) {
      notificationStore.error('请先完成前面的步骤')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'final'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.generatedPrompt = '正在生成...'
          switchToTabWithScroll('zh')
        }

        // 如果已经初始化，追加内容；否则设置内容
        if (hasInitialized) {
          if (promptStore.promptData.generatedPrompt === '正在生成...') {
            promptStore.promptData.generatedPrompt = chunk
          } else {
            promptStore.promptData.generatedPrompt += chunk
          }
        }
      }

      const finalPrompt = await promptGeneratorService.applyOptimizationAdvice(
        promptStore.promptData.initialPrompt,
        promptStore.promptData.advice,
        'system',
        model.id,
        'zh',
        [],
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性 - 清理代码块标记
      promptStore.promptData.generatedPrompt = cleanConvertedResponse(finalPrompt)

    } catch (error) {
      notificationStore.error('生成最终提示词失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 重新生成需求报告
  const regenerateRequirementReport = async () => {
    const hasConversationData = promptStore.chatMessages && promptStore.chatMessages.length > 0
    if (!hasConversationData) {
      notificationStore.warning('需要先与AI助手对话才能重新生成需求描述')
      return
    }

    try {
      isExecuting.value = true
      promptStore.currentExecutionStep = 'report'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const aiGuideService = AIGuideService.getInstance()

      // 获取对话历史
      const validMessages = promptStore.getValidMessages()
      const conversationHistory = validMessages.map(msg => ({
        type: msg.type,
        content: msg.content
      }))

      // 设置流式更新
      let streamContent = ''
      const onStreamUpdate = (chunk: string) => {
        streamContent += chunk
        promptStore.promptData.requirementReport = streamContent
        // 流式更新时自动滚动到底部
        scrollToBottomOfContent()
      }

      // 重新生成需求报告
      const requirementReport = await aiGuideService.generateRequirementReportFromConversation(
        conversationHistory,
        provider,
        model.id,
        onStreamUpdate
      )

      // 确保最终数据正确
      promptStore.promptData.requirementReport = requirementReport
      notificationStore.success('需求描述已重新生成')

    } catch (error) {
      notificationStore.error('重新生成需求描述失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 重新生成关键指令
  const regenerateThinkingPoints = async () => {
    if (!promptStore.promptData.requirementReport.trim()) {
      notificationStore.warning('请先输入需求描述')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'thinking'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let streamContent = ''
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        streamContent += chunk

        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.thinkingPoints = ['正在生成...']
          switchToTabWithScroll('thinking')
        }

        // 实时解析并更新关键指令
        const points = streamContent
          .split('\n')
          .map(s => s.replace(/^[*-]\s*/, '').trim())
          .filter(Boolean)

        if (points.length > 0) {
          promptStore.promptData.thinkingPoints = points
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const thinkingPoints = await promptGeneratorService.getSystemPromptThinkingPoints(
        promptStore.promptData.requirementReport,
        model.id,
        'zh',
        [],
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性
      promptStore.promptData.thinkingPoints = thinkingPoints
      notificationStore.success('关键指令已重新生成')

    } catch (error) {
      notificationStore.error('重新生成关键指令失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 重新生成初始提示词
  const regenerateInitialPrompt = async () => {
    if (!promptStore.promptData.thinkingPoints || promptStore.promptData.thinkingPoints.length === 0) {
      notificationStore.warning('请先生成关键指令')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'initial'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.initialPrompt = '正在生成...'
          switchToTabWithScroll('initial')
        }

        // 如果已经初始化，追加内容；否则设置内容
        if (hasInitialized) {
          if (promptStore.promptData.initialPrompt === '正在生成...') {
            promptStore.promptData.initialPrompt = chunk
          } else {
            promptStore.promptData.initialPrompt += chunk
          }
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const initialPrompt = await promptGeneratorService.generateSystemPrompt(
        promptStore.promptData.requirementReport,
        model.id,
        'zh',
        [],
        promptStore.promptData.thinkingPoints,
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性 - 清理代码块标记
      promptStore.promptData.initialPrompt = cleanConvertedResponse(initialPrompt)
      notificationStore.success('初始提示词已重新生成')

    } catch (error) {
      notificationStore.error('重新生成初始提示词失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 重新生成优化建议
  const regenerateAdvice = async () => {
    if (!promptStore.promptData.initialPrompt) {
      notificationStore.error('请先生成初始提示词')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'advice'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let streamContent = ''
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        streamContent += chunk

        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.advice = ['正在生成...']
          switchToTabWithScroll('advice')
        }

        // 实时解析并更新优化建议
        const adviceList = streamContent
          .split('\n')
          .map(s => s.replace(/^[*-]\s*/, '').trim())
          .filter(Boolean)

        if (adviceList.length > 0) {
          promptStore.promptData.advice = adviceList
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const advice = await promptGeneratorService.getOptimizationAdvice(
        promptStore.promptData.initialPrompt,
        'system',
        model.id,
        'zh',
        [],
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性
      promptStore.promptData.advice = advice
      notificationStore.success('优化建议已重新生成')

    } catch (error) {
      notificationStore.error('重新生成优化建议失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  // 重新生成最终提示词
  const regenerateFinalPrompt = async () => {
    if (!promptStore.promptData.initialPrompt || !promptStore.promptData.advice) {
      notificationStore.error('请先完成前面的步骤')
      return
    }

    try {
      isExecuting.value = true
      abortController.value = new AbortController()
      promptStore.currentExecutionStep = 'final'

      const provider = settingsStore.getCurrentProvider()
      const model = settingsStore.getCurrentModel()

      if (!provider || !model) {
        notificationStore.error('请先配置AI模型')
        return
      }

      const promptGeneratorService = PromptGeneratorService.getInstance()

      // 初始化流式更新状态
      let hasInitialized = false

      // 设置流式回调函数
      const onStreamUpdate = (chunk: string) => {
        // 首次收到有效数据时，立即切换到该标签页并初始化
        if (!hasInitialized && chunk.trim()) {
          hasInitialized = true
          promptStore.promptData.generatedPrompt = '正在生成...'
          switchToTabWithScroll('zh')
        }

        // 如果已经初始化，追加内容；否则设置内容
        if (hasInitialized) {
          if (promptStore.promptData.generatedPrompt === '正在生成...') {
            promptStore.promptData.generatedPrompt = chunk
          } else {
            promptStore.promptData.generatedPrompt += chunk
          }
          // 流式更新时自动滚动到底部
          scrollToBottomOfContent()
        }
      }

      const finalPrompt = await promptGeneratorService.applyOptimizationAdvice(
        promptStore.promptData.initialPrompt,
        promptStore.promptData.advice,
        'system',
        model.id,
        'zh',
        [],
        provider,
        onStreamUpdate
      )

      // 最终确保数据正确性 - 清理代码块标记
      promptStore.promptData.generatedPrompt = cleanConvertedResponse(finalPrompt)
      notificationStore.success('最终提示词已重新生成')

    } catch (error) {
      notificationStore.error('重新生成最终提示词失败，请重试')
    } finally {
      isExecuting.value = false
      promptStore.currentExecutionStep = null
      abortController.value = null
    }
  }

  return {
    isExecuting,
    executeFullWorkflow,
    executeThinkingPoints,
    executeInitialPrompt,
    executeAdvice,
    executeFinalPrompt,
    regenerateRequirementReport,
    regenerateThinkingPoints,
    regenerateInitialPrompt,
    regenerateAdvice,
    regenerateFinalPrompt
  }
}
