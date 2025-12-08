import { usePromptStore } from '@/stores/promptStore'

export function usePreviewListOperations() {
  const promptStore = usePromptStore()

  // 关键指令操作
  const addThinkingPoint = () => {
    if (!promptStore.promptData.thinkingPoints) {
      promptStore.promptData.thinkingPoints = []
    }
    promptStore.promptData.thinkingPoints.push('')
  }

  const removeThinkingPoint = (index: number) => {
    if (promptStore.promptData.thinkingPoints && index >= 0 && index < promptStore.promptData.thinkingPoints.length) {
      promptStore.promptData.thinkingPoints.splice(index, 1)
    }
  }

  // 优化建议操作
  const addAdviceItem = () => {
    if (!promptStore.promptData.advice) {
      promptStore.promptData.advice = []
    }
    promptStore.promptData.advice.push('')
  }

  const removeAdviceItem = (index: number) => {
    if (promptStore.promptData.advice && index >= 0 && index < promptStore.promptData.advice.length) {
      promptStore.promptData.advice.splice(index, 1)
    }
  }

  return {
    addThinkingPoint,
    removeThinkingPoint,
    addAdviceItem,
    removeAdviceItem
  }
}
