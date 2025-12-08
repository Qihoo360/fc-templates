import { ref, nextTick } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { marked } from 'marked'

export function useChatMessages() {
  const promptStore = usePromptStore()
  const chatContainer = ref<HTMLElement>()

  const renderMarkdown = (content: string): string => {
    try {
      const result = marked(content, {
        breaks: true,
        gfm: true
      })
      return typeof result === 'string' ? result : String(result)
    } catch (error) {
      return content
    }
  }

  const renderUserMessage = (content: string): string => {
    try {
      const hasMarkdown = /^#|^\*\*|^##|^\*|^-|\*\*.*\*\*|^1\.|```/.test(content) || 
                         content.includes('**') || content.includes('##') || content.includes('# ')
      
      if (hasMarkdown || content.length > 50) {
        const result = marked(content, {
          breaks: true,
          gfm: true
        })
        return typeof result === 'string' ? result : String(result)
      } else {
        return content.replace(/\n/g, '<br>')
      }
    } catch (error) {
      try {
        const result = marked(content, { breaks: true, gfm: true })
        return typeof result === 'string' ? result : String(result)
      } catch {
        return content.replace(/\n/g, '<br>')
      }
    }
  }

  const scrollToBottom = () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }

  let currentStreamingMessageIndex = -1

  const startStreamingMessage = () => {
    promptStore.isTyping = false
    promptStore.addMessage('ai', '', undefined)
    currentStreamingMessageIndex = promptStore.chatMessages.length - 1
    return currentStreamingMessageIndex
  }

  const updateStreamingMessage = (content: string) => {
    if (currentStreamingMessageIndex >= 0 && currentStreamingMessageIndex < promptStore.chatMessages.length) {
      promptStore.chatMessages[currentStreamingMessageIndex].content = content
    }
  }

  const simulateTyping = async (message: string, isStreaming: boolean = false) => {
    if (isStreaming) {
      const messageIndex = promptStore.chatMessages.length
      promptStore.addMessage('ai', '', undefined)
      
      for (let i = 0; i <= message.length; i++) {
        promptStore.chatMessages[messageIndex].content = message.substring(0, i)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10))
      }
    } else {
      promptStore.isTyping = true
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100))
      promptStore.isTyping = false
      promptStore.addMessage('ai', message, undefined)
    }
  }

  return {
    chatContainer,
    renderMarkdown,
    renderUserMessage,
    scrollToBottom,
    startStreamingMessage,
    updateStreamingMessage,
    simulateTyping
  }
}
