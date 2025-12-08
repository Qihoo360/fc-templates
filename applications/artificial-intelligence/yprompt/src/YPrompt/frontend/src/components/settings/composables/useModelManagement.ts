import { ref, computed, type Ref } from 'vue'
import { useSettingsStore, type ModelConfig, type ProviderConfig } from '@/stores/settingsStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { AIService } from '@/services/aiService'

export function useModelManagement() {
  const settingsStore = useSettingsStore()
  const notificationStore = useNotificationStore()
  const aiService = AIService.getInstance()
  
  const showAddModelDialog = ref(false)
  const addingModelToProvider = ref<string>('')
  const editingModel: Ref<ModelConfig | null> = ref(null)
  const loadingModels = ref(false)
  const providerModelsCache = ref<Record<string, string[]>>({})
  const modelFetchError = ref('')
  const modelSearchKeyword = ref('')
  
  const newModel = ref({
    name: '',
    id: '',
    apiType: '' as 'openai' | 'anthropic' | 'google' | ''
  })

  const getCurrentProviderModels = computed(() => {
    const allModels = providerModelsCache.value[addingModelToProvider.value] || []
    
    if (!modelSearchKeyword.value.trim()) {
      return allModels
    }
    
    const keywords = modelSearchKeyword.value.toLowerCase().trim().split(/\s+/)
    
    return allModels.filter(modelId => {
      const modelIdLower = modelId.toLowerCase()
      return keywords.every(keyword => modelIdLower.includes(keyword))
    })
  })

  const getProviderForModel = (providerId: string): ProviderConfig | undefined => {
    return settingsStore.providers.find(p => p.id === providerId)
  }

  const getApiTypeColor = (apiType: string) => {
    switch (apiType) {
      case 'openai':
        return 'bg-green-500'
      case 'anthropic':
        return 'bg-purple-500'
      case 'google':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getApiTypeLabel = (apiType: string) => {
    switch (apiType) {
      case 'openai':
        return 'OpenAI'
      case 'anthropic':
        return 'Claude'
      case 'google':
        return 'Gemini'
      default:
        return apiType
    }
  }

  const showAddModel = (providerId: string) => {
    editingModel.value = null
    addingModelToProvider.value = providerId
    
    loadingModels.value = false
    modelFetchError.value = ''
    modelSearchKeyword.value = ''
    
    const provider = getProviderForModel(providerId)
    let defaultApiType = ''
    
    if (provider?.type === 'custom') {
      defaultApiType = 'openai'
    } else if (provider?.type && provider.type in ['openai', 'anthropic', 'google']) {
      defaultApiType = provider.type
    }
    
    newModel.value = { name: '', id: '', apiType: defaultApiType as 'openai' | 'anthropic' | 'google' | '' }
    showAddModelDialog.value = true
  }

  const editModel = (providerId: string, model: ModelConfig) => {
    editingModel.value = model
    addingModelToProvider.value = providerId
    newModel.value = {
      name: model.name,
      id: model.id,
      apiType: model.apiType || ''
    }
    showAddModelDialog.value = true
  }

  const closeAddModelDialog = () => {
    showAddModelDialog.value = false
    modelSearchKeyword.value = ''
    addingModelToProvider.value = ''
    modelFetchError.value = ''
    editingModel.value = null
  }

  const addCustomModel = () => {
    const provider = settingsStore.providers.find(p => p.id === addingModelToProvider.value)
    if (!provider) return
    
    let apiType = newModel.value.apiType
    if (provider.type !== 'custom') {
      apiType = provider.type
    }
    
    if (editingModel.value) {
      if (provider) {
        const modelIndex = provider.models.findIndex(m => m.id === editingModel.value!.id)
        if (modelIndex > -1) {
          provider.models[modelIndex] = {
            ...provider.models[modelIndex],
            name: newModel.value.name,
            id: newModel.value.id,
            apiType: apiType as 'openai' | 'anthropic' | 'google'
          }
        }
      }
      editingModel.value = null
    } else {
      settingsStore.addModel(addingModelToProvider.value, {
        id: newModel.value.id,
        name: newModel.value.name,
        enabled: true,
        apiType: apiType as 'openai' | 'anthropic' | 'google'
      })
    }
    
    newModel.value = { name: '', id: '', apiType: '' }
    showAddModelDialog.value = false
    addingModelToProvider.value = ''
    settingsStore.saveSettings()
  }

  const deleteModel = (providerId: string, modelId: string) => {
    if (confirm('确定要删除这个模型吗？')) {
      settingsStore.deleteModel(providerId, modelId)
      settingsStore.saveSettings()
      notificationStore.success('模型已删除')
    }
  }

  const fetchAvailableModels = async () => {
    try {
      loadingModels.value = true
      modelFetchError.value = ''
      
      const providerId = addingModelToProvider.value
      const provider = getProviderForModel(providerId)
      if (!provider) {
        throw new Error('未找到提供商信息')
      }
      
      if (!provider.apiKey || !provider.baseUrl) {
        throw new Error('请先配置提供商的API密钥和基础URL')
      }
      
      const preferredApiType = newModel.value.apiType as 'openai' | 'anthropic' | 'google' | undefined
      const models = await aiService.getAvailableModels(provider, preferredApiType)
      
      providerModelsCache.value[providerId] = models
      
      if (models.length === 0) {
        modelFetchError.value = '未找到可用模型'
      }
    } catch (error: any) {
      modelFetchError.value = error.message || '获取模型列表失败，请手动输入模型ID'
    } finally {
      loadingModels.value = false
    }
  }

  const selectModel = (modelId: string) => {
    newModel.value.id = modelId
    if (!newModel.value.name) {
      newModel.value.name = modelId
    }
  }

  return {
    showAddModelDialog,
    addingModelToProvider,
    editingModel,
    loadingModels,
    providerModelsCache,
    modelFetchError,
    modelSearchKeyword,
    newModel,
    getCurrentProviderModels,
    getProviderForModel,
    getApiTypeColor,
    getApiTypeLabel,
    showAddModel,
    editModel,
    closeAddModelDialog,
    addCustomModel,
    deleteModel,
    fetchAvailableModels,
    selectModel
  }
}
