import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePromptStore } from '@/stores/promptStore'

export function useChatQuickReplies(inputContainer: { value: HTMLElement | undefined }) {
  const promptStore = usePromptStore()
  const showQuickReplies = ref(false)
  const quickRepliesContainer = ref<HTMLElement>()

  const quickReplies = computed(() => {
    const messageCount = promptStore.chatMessages.length
    const baseReplies = ['请使用相关最佳实践的推荐建议']
    
    if (messageCount >= 6) {
      const hasReport = !!promptStore.promptData.requirementReport
      const actionText = hasReport ? '重新生成需求报告' : '强制生成需求报告'
      return [...baseReplies, actionText]
    }
    
    return baseReplies
  })

  const shouldShowQuickReplies = computed(() => {
    return promptStore.chatMessages.length >= 2 && showQuickReplies.value
  })

  const checkForceGenerate = (userInput: string): boolean => {
    const forceKeywords = ['强制生成需求报告', '重新生成需求报告']
    return forceKeywords.some(keyword => userInput.includes(keyword))
  }

  const selectQuickReply = (reply: string, onSelect: (reply: string) => void) => {
    onSelect(reply)
    showQuickReplies.value = false
  }

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node
    
    // 检查是否点击在输入区域内
    if (inputContainer.value?.contains(target)) {
      return
    }
    
    // 检查是否点击在快捷回复区域内
    if (quickRepliesContainer.value?.contains(target)) {
      return
    }
    
    // 点击在外部，隐藏快捷回复
    showQuickReplies.value = false
  }

  onMounted(() => {
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
  })

  onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })

  return {
    showQuickReplies,
    quickReplies,
    quickRepliesContainer,
    shouldShowQuickReplies,
    checkForceGenerate,
    selectQuickReply
  }
}
