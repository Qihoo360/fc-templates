import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ModelParams } from '@/stores/settingsStore'

export function useModelParams() {
  const settingsStore = useSettingsStore()

  // 获取当前选中的模型
  const currentModel = computed(() => settingsStore.getCurrentModel())
  const currentProvider = computed(() => settingsStore.getCurrentProvider())

  // 当前模型的 API 类型
  const currentApiType = computed(() => {
    if (!currentModel.value) return null
    return currentModel.value.apiType || currentProvider.value?.type || null
  })

  // 获取默认参数值（基于最佳实践）
  const getDefaultParams = (apiType: 'openai' | 'anthropic' | 'google' | 'custom' | null): ModelParams => {
    const defaults: ModelParams = {
      temperature: 1.0,      // 平衡创造性和稳定性（AI 对话/生成场景最佳实践）
      maxTokens: 8192,       // 足够长的输出，适合提示词生成场景
      topP: 0.95,            // 核采样，保留 95% 概率质量（避免极端词汇）
    }

    if (apiType === 'openai' || apiType === 'custom') {
      defaults.frequencyPenalty = 0    // 不惩罚词频（提示词生成需要重复关键词）
      defaults.presencePenalty = 0     // 不强制多样性
    } else if (apiType === 'anthropic' || apiType === 'google') {
      defaults.topK = 0      // 0 表示不限制（Claude/Gemini 推荐）
    }

    return defaults
  }

  // 获取当前模型的参数（如果没有则返回默认值）
  const getCurrentParams = (): ModelParams => {
    if (!currentModel.value) {
      return getDefaultParams(null)
    }
    
    const modelParams = currentModel.value.params
    const defaultParams = getDefaultParams(currentApiType.value)
    
    return {
      ...defaultParams,
      ...modelParams
    }
  }

  // 更新当前模型的参数
  const updateCurrentModelParams = (params: Partial<ModelParams>) => {
    const provider = currentProvider.value
    const model = currentModel.value
    
    if (!provider || !model) {
      console.warn('[useModelParams] 没有选中的模型')
      return
    }

    const providerInStore = settingsStore.providers.find(p => p.id === provider.id)
    if (!providerInStore) return

    const modelInStore = providerInStore.models.find(m => m.id === model.id)
    if (!modelInStore) return

    // 合并参数
    modelInStore.params = {
      ...modelInStore.params,
      ...params
    }

    // 保存到 localStorage
    settingsStore.saveSettings()
  }

  // 重置为默认参数
  const resetToDefaults = () => {
    const defaultParams = getDefaultParams(currentApiType.value)
    updateCurrentModelParams(defaultParams)
  }

  // 检查参数是否支持（根据 API 类型）
  const isParamSupported = (paramName: keyof ModelParams): boolean => {
    const apiType = currentApiType.value

    switch (paramName) {
      case 'temperature':
      case 'maxTokens':
      case 'topP':
        return true // 所有类型都支持
      
      case 'frequencyPenalty':
      case 'presencePenalty':
        return apiType === 'openai'
      
      case 'topK':
        return apiType === 'anthropic' || apiType === 'google'
      
      default:
        return false
    }
  }

  // 获取参数的取值范围
  const getParamRange = (paramName: keyof ModelParams) => {
    switch (paramName) {
      case 'temperature':
        return { min: 0, max: 2, step: 0.1 }
      case 'maxTokens':
        return { min: 1, max: 8000, step: 1 }
      case 'topP':
        return { min: 0, max: 1, step: 0.01 }
      case 'frequencyPenalty':
      case 'presencePenalty':
        return { min: -2, max: 2, step: 0.1 }
      case 'topK':
        return { min: 1, max: 100, step: 1 }
      default:
        return { min: 0, max: 1, step: 0.1 }
    }
  }

  // 获取参数的显示名称
  const getParamLabel = (paramName: keyof ModelParams): string => {
    const labels: Record<string, string> = {
      temperature: 'Temperature',
      maxTokens: 'Max Tokens',
      topP: 'Top P',
      frequencyPenalty: 'Frequency Penalty',
      presencePenalty: 'Presence Penalty',
      topK: 'Top K'
    }
    return labels[paramName] || paramName
  }

  // 获取参数的描述
  const getParamDescription = (paramName: keyof ModelParams): string => {
    const descriptions: Record<string, string> = {
      temperature: '控制输出的随机性。值越高，输出越随机；值越低，输出越确定',
      maxTokens: '生成的最大 token 数量',
      topP: '核采样参数，控制考虑的词汇范围',
      frequencyPenalty: '降低重复词汇的频率（OpenAI 专用）',
      presencePenalty: '鼓励模型谈论新话题（OpenAI 专用）',
      topK: '只考虑概率最高的 K 个词汇（Claude/Gemini）'
    }
    return descriptions[paramName] || ''
  }

  return {
    currentModel,
    currentProvider,
    currentApiType,
    getCurrentParams,
    updateCurrentModelParams,
    resetToDefaults,
    isParamSupported,
    getParamRange,
    getParamLabel,
    getParamDescription
  }
}
