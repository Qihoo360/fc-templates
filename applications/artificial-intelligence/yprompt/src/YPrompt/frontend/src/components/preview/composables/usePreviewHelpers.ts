import { computed } from 'vue'
import { usePromptStore } from '@/stores/promptStore'

export function usePreviewHelpers() {
  const promptStore = usePromptStore()

  // 检查是否有任何内容可以显示
  const hasAnyContent = computed(() => {
    return true // 始终显示，以便用户可以输入需求描述
  })

  // 检查是否有对话数据
  const hasConversationData = computed(() => {
    return promptStore.chatMessages && promptStore.chatMessages.length > 0
  })

  // 步骤显示名称映射
  const getStepDisplayName = (step: string): string => {
    const stepNames: { [key: string]: string } = {
      'report': '生成需求报告',
      'thinking': '提取关键指令', 
      'initial': '生成初始提示词',
      'advice': '分析优化建议',
      'final': '合成最终提示词'
    }
    return stepNames[step] || '生成'
  }

  return {
    hasAnyContent,
    hasConversationData,
    getStepDisplayName
  }
}
