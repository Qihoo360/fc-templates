import { ref, computed, nextTick } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'

export function useChatMessageOperations(_chatContainer?: any) {
  const promptStore = usePromptStore()
  const notificationStore = useNotificationStore()
  
  const editingContent = ref<Record<string, string>>({})
  const editTextareaRefs = ref<Record<string, HTMLTextAreaElement | null>>({})
  const messageRefs = ref<Record<string, HTMLElement | null>>({})
  const isEditing = computed(() => Object.keys(editingContent.value).length > 0)

  const setEditTextareaRef = (messageId: string, el: HTMLTextAreaElement | null) => {
    if (el) {
      editTextareaRefs.value[messageId] = el
    }
  }

  const setMessageRef = (payload: { messageId: string, el: HTMLElement | null }) => {
    if (payload.el) {
      messageRefs.value[payload.messageId] = payload.el
    }
  }

  const startEdit = (messageId: string) => {
    const message = promptStore.chatMessages.find(msg => msg.id === messageId)
    if (message) {
      editingContent.value[messageId] = message.content
      promptStore.startEditMessage(messageId)
      
      nextTick(() => {
        const textarea = editTextareaRefs.value[messageId]
        if (textarea) {
          textarea.focus()
          const length = textarea.value.length
          textarea.setSelectionRange(length, length)
        }
      })
    }
  }

  const saveEdit = (messageId: string) => {
    const newContent = editingContent.value[messageId]
    if (newContent !== undefined && newContent.trim()) {
      promptStore.saveEditMessage(messageId, newContent)
      delete editingContent.value[messageId]
      delete editTextareaRefs.value[messageId]
    } else {
      notificationStore.warning('消息内容不能为空')
    }
  }

  const cancelEdit = (messageId: string) => {
    promptStore.cancelEditMessage(messageId)
    delete editingContent.value[messageId]
    delete editTextareaRefs.value[messageId]
  }

  const deleteMessage = (messageId: string) => {
    if (confirm('确定要删除这条消息吗？删除后该消息将不会在后续的AI对话中被考虑。')) {
      promptStore.deleteMessage(messageId)
      notificationStore.success('消息已删除')
    }
  }

  const copyMessage = async (content: string) => {
    try {
      await copyUtil(content)
      notificationStore.success('已复制到剪贴板')
    } catch (error) {
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        notificationStore.success('已复制到剪贴板')
      } catch (fallbackError) {
        notificationStore.error('复制失败，请手动选择复制')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleEditKeydown = (event: KeyboardEvent, messageId: string) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      saveEdit(messageId)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit(messageId)
    }
  }

  return {
    editingContent,
    editTextareaRefs,
    messageRefs,
    isEditing,
    setEditTextareaRef,
    setMessageRef,
    startEdit,
    saveEdit,
    cancelEdit,
    deleteMessage,
    copyMessage,
    handleEditKeydown
  }
}
