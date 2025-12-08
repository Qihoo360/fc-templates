import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

export function useChatModel() {
  const settingsStore = useSettingsStore()
  const showModelSelector = ref(false)
  const chatProvider = ref<string>('')
  const chatModel = ref<string>('')
  const isStreamMode = ref(true)

  const availableChatProviders = computed(() => {
    return settingsStore.getAvailableProviders()
  })

  const availableChatModels = computed(() => {
    if (!chatProvider.value) return []
    return settingsStore.getAvailableModels(chatProvider.value)
  })

  const onChatProviderChange = () => {
    chatModel.value = ''
    const models = availableChatModels.value
    if (models.length > 0) {
      chatModel.value = models[0].id
    }
    saveChatModelSettings()
  }

  const saveChatModelSettings = () => {
    localStorage.setItem('yprompt_chat_provider', chatProvider.value)
    localStorage.setItem('yprompt_chat_model', chatModel.value)
  }

  const resetChatModel = () => {
    chatProvider.value = ''
    chatModel.value = ''
    saveChatModelSettings()
    showModelSelector.value = false
  }

  const getChatModelDisplay = () => {
    if (!chatProvider.value || !chatModel.value) return '全局模型'
    const provider = availableChatProviders.value.find(p => p.id === chatProvider.value)
    const model = availableChatModels.value.find(m => m.id === chatModel.value)
    return `${provider?.name} - ${model?.name}`
  }

  const getCurrentChatModel = () => {
    if (chatProvider.value && chatModel.value) {
      const provider = availableChatProviders.value.find(p => p.id === chatProvider.value)
      const model = availableChatModels.value.find(m => m.id === chatModel.value)
      return { provider, model }
    }
    const globalProvider = settingsStore.getCurrentProvider()
    const globalModel = settingsStore.getCurrentModel()
    return { provider: globalProvider, model: globalModel }
  }

  const toggleStreamMode = () => {
    isStreamMode.value = !isStreamMode.value
    localStorage.setItem('yprompt_stream_mode', JSON.stringify(isStreamMode.value))
  }

  const loadSettings = () => {
    const savedProvider = localStorage.getItem('yprompt_chat_provider')
    const savedModel = localStorage.getItem('yprompt_chat_model')
    if (savedProvider) {
      chatProvider.value = savedProvider
    }
    if (savedModel) {
      chatModel.value = savedModel
    }

    const savedStreamMode = localStorage.getItem('yprompt_stream_mode')
    if (savedStreamMode !== null) {
      try {
        isStreamMode.value = JSON.parse(savedStreamMode)
      } catch (e) {
        isStreamMode.value = true
      }
    }
  }

  onMounted(() => {
    loadSettings()
  })

  return {
    showModelSelector,
    chatProvider,
    chatModel,
    isStreamMode,
    availableChatProviders,
    availableChatModels,
    onChatProviderChange,
    saveChatModelSettings,
    resetChatModel,
    getChatModelDisplay,
    getCurrentChatModel,
    toggleStreamMode,
    loadSettings
  }
}
