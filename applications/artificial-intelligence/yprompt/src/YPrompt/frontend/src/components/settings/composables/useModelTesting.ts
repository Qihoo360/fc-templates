import { ref } from 'vue'
import { useSettingsStore, type ProviderConfig, type ModelConfig } from '@/stores/settingsStore'
import { useNotificationStore } from '@/stores/notificationStore'

interface BatchTestState {
  isTesting: boolean
  currentModelIndex: number
  totalModels: number
  isAborted: boolean
}

export function useModelTesting() {
  const settingsStore = useSettingsStore()
  const notificationStore = useNotificationStore()
  
  const testingProvider = ref<string | null>(null)
  const batchTestingStates = ref<Record<string, BatchTestState>>({})
  const batchAbortControllers = ref<Record<string, AbortController>>({})
  const activeTestControllers = new Map<string, AbortController>()

  const getTestButtonTitle = (model: ModelConfig) => {
    switch (model.testStatus) {
      case 'testing':
        return '点击停止测试'
      case 'success':
        return '重新测试'
      case 'failed':
        return '重新测试'
      default:
        return '测试模型连接和能力'
    }
  }

  const getBatchTestButtonTitle = (provider: ProviderConfig) => {
    const state = batchTestingStates.value[provider.id]
    if (state?.isTesting && !state.isAborted) {
      return `批量测试中... (${state.currentModelIndex}/${state.totalModels}) 点击中断`
    } else if (state?.isTesting && state.isAborted) {
      return '正在中断测试...'
    } else if (provider.models.length === 0) {
      return '没有可测试的模型'
    }
    return '批量测试模型'
  }

  const stopModelTest = (providerId: string, modelId: string) => {
    const key = `${providerId}:${modelId}`
    const controller = activeTestControllers.get(key)
    
    if (controller) {
      controller.abort()
      activeTestControllers.delete(key)
    }
    
    settingsStore.updateModelTestStatus(providerId, modelId, 'untested')
    notificationStore.warning(`已停止模型 ${modelId} 的测试`)
    settingsStore.saveSettings()
  }

  const testModel = async (providerId: string, modelId: string) => {
    const provider = settingsStore.providers.find(p => p.id === providerId)
    if (!provider) {
      notificationStore.error('未找到提供商配置')
      return
    }
    
    if (!provider.apiKey) {
      notificationStore.warning('请先配置API密钥')
      return
    }

    const abortController = new AbortController()
    const key = `${providerId}:${modelId}`
    activeTestControllers.set(key, abortController)

    const model = provider.models.find(m => m.id === modelId)
    if (model) {
      model.testStatus = 'untested'
      model.capabilities = undefined
      model.lastTested = undefined
    }
    
    settingsStore.updateModelTestStatus(providerId, modelId, 'testing')
    
    try {
      const { CapabilityDetector } = await import('@/services/capabilityDetector')
      const detector = CapabilityDetector.getInstance()
      
      await detector.detectCapabilitiesWithCallback(
        provider, 
        modelId,
        (connected: boolean, responseTime: number, error?: string) => {
          if (abortController.signal.aborted) {
            return
          }
          
          if (connected) {
            settingsStore.updateModelConnectionStatus(providerId, modelId, true)
            settingsStore.updateModelTestStatus(providerId, modelId, 'success')
            notificationStore.success(`模型 ${modelId} 连接成功！(${responseTime}ms) 正在后台检测思考能力...`)
          } else {
            settingsStore.updateModelConnectionStatus(providerId, modelId, false, error)
            settingsStore.updateModelTestStatus(providerId, modelId, 'failed')
            notificationStore.error(`模型 ${modelId} 连接失败：${error || '未知错误'}`)
          }
          settingsStore.saveSettings()
        },
        (capabilities) => {
          if (abortController.signal.aborted) {
            return
          }
          
          settingsStore.updateModelCapabilities(providerId, modelId, capabilities)
          
          if (capabilities.reasoning) {
            const thinkingType = settingsStore.getReasoningTypeDescription(capabilities.reasoningType)
            notificationStore.success(`🧠 模型 ${modelId} 思考能力检测完成：支持${thinkingType}`)
          }
          
          settingsStore.saveSettings()
          activeTestControllers.delete(key)
        },
        true,
        abortController
      )
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      settingsStore.updateModelTestStatus(providerId, modelId, 'failed')
      notificationStore.error(`模型 ${modelId} 测试出错：${(error as Error).message}`)
      settingsStore.saveSettings()
    } finally {
      activeTestControllers.delete(key)
    }
  }

  const handleModelTestClick = async (providerId: string, modelId: string, testStatus: string | undefined) => {
    if (testStatus === 'testing') {
      stopModelTest(providerId, modelId)
    } else {
      testModel(providerId, modelId)
    }
  }

  const batchTestModels = async (provider: ProviderConfig) => {
    const providerId = provider.id
    const state = batchTestingStates.value[providerId]
    
    if (state?.isTesting) {
      abortBatchTest(providerId)
      return
    }
    
    if (!provider.apiKey) {
      notificationStore.warning('请先配置API密钥')
      return
    }

    const enabledModels = provider.models.filter((m: ModelConfig) => m.enabled)
    if (enabledModels.length === 0) {
      notificationStore.warning('请先启用至少一个模型')
      return
    }

    batchTestingStates.value[providerId] = {
      isTesting: true,
      currentModelIndex: 0,
      totalModels: enabledModels.length,
      isAborted: false
    }
    
    batchAbortControllers.value[providerId] = new AbortController()
    testingProvider.value = providerId
    
    let successCount = 0
    let failCount = 0
    
    try {
      notificationStore.success(`开始批量测试 ${enabledModels.length} 个模型...`)
      
      for (let i = 0; i < enabledModels.length; i++) {
        const currentState = batchTestingStates.value[providerId]
        if (currentState?.isAborted) {
          notificationStore.warning('批量测试已中断')
          break
        }
        
        const model = enabledModels[i]
        batchTestingStates.value[providerId].currentModelIndex = i + 1
        
        try {
          if (batchAbortControllers.value[providerId]?.signal.aborted) {
            break
          }
          
          model.testStatus = 'untested'
          model.capabilities = undefined
          model.lastTested = undefined
          
          settingsStore.updateModelTestStatus(providerId, model.id, 'testing')
          
          const { CapabilityDetector } = await import('@/services/capabilityDetector')
          const detector = CapabilityDetector.getInstance()
          
          await detector.detectCapabilitiesWithCallback(
            provider, 
            model.id,
            (connected: boolean, _responseTime: number, error?: string) => {
              if (connected) {
                settingsStore.updateModelConnectionStatus(providerId, model.id, true)
                settingsStore.updateModelTestStatus(providerId, model.id, 'success')
                successCount++
              } else {
                settingsStore.updateModelConnectionStatus(providerId, model.id, false, error)
                settingsStore.updateModelTestStatus(providerId, model.id, 'failed')
                failCount++
              }
              settingsStore.saveSettings()
            },
            (capabilities) => {
              settingsStore.updateModelCapabilities(providerId, model.id, capabilities)
              settingsStore.saveSettings()
            },
            true,
            batchAbortControllers.value[providerId]
          )
          
          if (batchAbortControllers.value[providerId]?.signal.aborted) {
            break
          }
          
        } catch (error) {
          settingsStore.updateModelTestStatus(providerId, model.id, 'failed')
          failCount++
          settingsStore.saveSettings()
        }
      }
      
      const currentState = batchTestingStates.value[providerId]
      if (!currentState?.isAborted) {
        notificationStore.success(`批量测试完成！成功: ${successCount}, 失败: ${failCount}`)
      }
      
    } catch (error) {
      notificationStore.error(`批量测试出错：${(error as Error).message}`)
    } finally {
      const provider = settingsStore.providers.find(p => p.id === providerId)
      if (provider) {
        provider.models.forEach(model => {
          if (model.testStatus === 'testing') {
            if (model.capabilities?.testResult?.connected !== undefined) {
              model.testStatus = model.capabilities.testResult.connected ? 'success' : 'failed'
            } else {
              model.testStatus = 'untested'
            }
          }
        })
        settingsStore.saveSettings()
      }
      
      delete batchTestingStates.value[providerId]
      delete batchAbortControllers.value[providerId]
      if (testingProvider.value === providerId) {
        testingProvider.value = null
      }
    }
  }

  const abortBatchTest = (providerId: string) => {
    const state = batchTestingStates.value[providerId]
    if (state?.isTesting) {
      state.isAborted = true
      batchAbortControllers.value[providerId]?.abort()
      notificationStore.warning('正在中断批量测试...')
      
      setTimeout(() => {
        const provider = settingsStore.providers.find(p => p.id === providerId)
        if (provider) {
          provider.models.forEach(model => {
            if (model.testStatus === 'testing') {
              if (model.capabilities?.testResult?.connected !== undefined) {
                model.testStatus = model.capabilities.testResult.connected ? 'success' : 'failed'
              } else {
                model.testStatus = 'untested'
              }
            }
          })
          settingsStore.saveSettings()
        }
        
        delete batchTestingStates.value[providerId]
        delete batchAbortControllers.value[providerId]
        if (testingProvider.value === providerId) {
          testingProvider.value = null
        }
      }, 2000)
    }
  }

  return {
    testingProvider,
    batchTestingStates,
    getTestButtonTitle,
    getBatchTestButtonTitle,
    handleModelTestClick,
    batchTestModels
  }
}
