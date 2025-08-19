import { ref } from 'vue'
import type { Ref } from 'vue'
import type { AppServices } from '../types/services'

export interface ModelSelectorsHooks {
  optimizeModelSelect: Ref<any>
  testModelSelect: Ref<any>
}

/**
 * 模型选择器引用Hook
 * @param services 服务实例引用
 * @returns ModelSelectorsHooks
 */
export function useModelSelectors(services: Ref<AppServices | null>): ModelSelectorsHooks {
  const optimizeModelSelect = ref(null)
  const testModelSelect = ref(null)

  return {
    optimizeModelSelect,
    testModelSelect
  }
} 