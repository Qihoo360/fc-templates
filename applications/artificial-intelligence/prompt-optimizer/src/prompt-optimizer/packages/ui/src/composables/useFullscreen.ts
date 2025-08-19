import { ref, watch } from 'vue'
import type { ComputedRef } from 'vue'

export function useFullscreen(
  modelValue: ComputedRef<string> | { value: string }, 
  emitUpdateValue: (value: string) => void
) {
  // 全屏状态
  const isFullscreen = ref(false)
  
  // 全屏模式下的文本值
  const fullscreenValue = ref(modelValue.value || '')
  
  // 监听外部值变化，同步到全屏值
  watch(() => modelValue.value, (newValue) => {
    fullscreenValue.value = newValue || ''
  })
  
  // 监听全屏值变化，同步到外部
  watch(fullscreenValue, (newValue) => {
    emitUpdateValue(newValue)
  })
  
  // 打开全屏
  const openFullscreen = () => {
    isFullscreen.value = true
  }
  
  // 关闭全屏
  const closeFullscreen = () => {
    isFullscreen.value = false
  }
  
  return {
    isFullscreen,
    fullscreenValue,
    openFullscreen,
    closeFullscreen
  }
} 