import { ref, type Ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useNotificationStore } from '@/stores/notificationStore'
import type { ProviderConfig } from '@/stores/settingsStore'

export function useProviderManagement() {
  const settingsStore = useSettingsStore()
  const notificationStore = useNotificationStore()
  
  const showAddProviderTypeDialog = ref(false)
  const showAddProvider = ref(false)
  const editingProvider: Ref<ProviderConfig | null> = ref(null)
  const selectedProviderType = ref<'openai' | 'anthropic' | 'google' | 'custom'>('custom')
  
  const newProvider = ref({
    name: '',
    baseUrl: '',
    apiKey: ''
  })

  const getProviderTemplate = (type: 'openai' | 'anthropic' | 'google' | 'custom') => {
    return settingsStore.getProviderTemplate(type)
  }

  const getDefaultBaseUrl = (type: string) => {
    switch (type) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions'
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages'
      case 'google':
        return 'https://generativelanguage.googleapis.com/v1beta'
      case 'custom':
        return 'https://api.example.com/v1'
      default:
        return ''
    }
  }

  const openAddProviderTypeDialog = () => {
    showAddProviderTypeDialog.value = true
  }

  const selectProviderType = (type: 'openai' | 'anthropic' | 'google' | 'custom') => {
    showAddProviderTypeDialog.value = false
    selectedProviderType.value = type
    
    if (!editingProvider.value) {
      if (type === 'custom') {
        newProvider.value = { name: '', baseUrl: '', apiKey: '' }
      } else {
        const template = settingsStore.getProviderTemplate(type)
        newProvider.value = { 
          name: template.name, 
          baseUrl: template.baseUrl || '', 
          apiKey: '' 
        }
      }
    }
    
    showAddProvider.value = true
  }

  const editProvider = (provider: ProviderConfig) => {
    editingProvider.value = provider
    selectedProviderType.value = provider.type
    newProvider.value = {
      name: provider.name,
      baseUrl: provider.baseUrl || '',
      apiKey: provider.apiKey || ''
    }
    showAddProvider.value = true
  }

  const closeProviderDialog = () => {
    showAddProvider.value = false
    editingProvider.value = null
    newProvider.value = { name: '', baseUrl: '', apiKey: '' }
  }

  const saveProvider = () => {
    try {
      if (editingProvider.value) {
        const provider = settingsStore.providers.find(p => p.id === editingProvider.value!.id)
        if (provider) {
          provider.name = newProvider.value.name
          provider.apiKey = newProvider.value.apiKey
          if (provider.allowCustomUrl || provider.type === 'custom') {
            provider.baseUrl = newProvider.value.baseUrl
          }
        }
        editingProvider.value = null
      } else {
        settingsStore.addProvider(selectedProviderType.value, {
          name: newProvider.value.name,
          baseUrl: newProvider.value.baseUrl,
          apiKey: newProvider.value.apiKey
        })
      }
      
      newProvider.value = { name: '', baseUrl: '', apiKey: '' }
      showAddProvider.value = false
      settingsStore.saveSettings()
      notificationStore.success(editingProvider.value ? '提供商已更新' : '提供商已添加')
    } catch (error) {
      notificationStore.error(`保存失败: ${error}`)
    }
  }

  const deleteProvider = (providerId: string) => {
    if (confirm('确定要删除这个提供商吗？这将同时删除其所有模型配置。')) {
      settingsStore.deleteProvider(providerId)
      settingsStore.saveSettings()
      notificationStore.success('提供商已删除')
    }
  }

  return {
    showAddProviderTypeDialog,
    showAddProvider,
    editingProvider,
    selectedProviderType,
    newProvider,
    getProviderTemplate,
    getDefaultBaseUrl,
    openAddProviderTypeDialog,
    selectProviderType,
    editProvider,
    closeProviderDialog,
    saveProvider,
    deleteProvider
  }
}
