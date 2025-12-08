import { ref } from 'vue'
import type { MessageAttachment } from '@/stores/promptStore'
import { useNotificationStore } from '@/stores/notificationStore'

export function useChatAttachments() {
  const notificationStore = useNotificationStore()
  const currentAttachments = ref<MessageAttachment[]>([])
  const isGlobalDragging = ref(false)
  const fileInputRef = ref<HTMLInputElement>()

  const triggerFileSelect = () => {
    if (fileInputRef.value) {
      fileInputRef.value.click()
    }
  }

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files || [])
    
    if (files.length > 0) {
      try {
        const { processFiles } = await import('@/utils/fileUtils')
        const result = await processFiles(files)
        
        if (result.attachments.length > 0) {
          currentAttachments.value.push(...result.attachments)
        }
        
        if (result.errors.length > 0) {
          result.errors.forEach(error => notificationStore.error(error))
        }
      } catch (error) {
        notificationStore.error('文件处理失败')
      }
      
      target.value = ''
    }
  }

  const removeAttachment = (attachmentId: string) => {
    const index = currentAttachments.value.findIndex(att => att.id === attachmentId)
    if (index !== -1) {
      currentAttachments.value.splice(index, 1)
    }
  }

  const clearAttachments = () => {
    currentAttachments.value = []
  }

  const handleGlobalDragEnter = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer?.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === 'file') {
          isGlobalDragging.value = true
          break
        }
      }
    }
  }

  const handleGlobalDragOver = (event: DragEvent) => {
    event.preventDefault()
    isGlobalDragging.value = true
  }

  const handleGlobalDragLeave = (event: DragEvent) => {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      isGlobalDragging.value = false
    }
  }

  const handleGlobalDrop = async (event: DragEvent) => {
    event.preventDefault()
    isGlobalDragging.value = false
    
    const files = Array.from(event.dataTransfer?.files || [])
    if (files.length > 0) {
      try {
        const { processFiles } = await import('@/utils/fileUtils')
        const result = await processFiles(files)
        
        if (result.attachments.length > 0) {
          currentAttachments.value.push(...result.attachments)
        }
        
        if (result.errors.length > 0) {
          result.errors.forEach(error => notificationStore.error(error))
        }
      } catch (error) {
        notificationStore.error('文件处理失败')
      }
    }
  }

  return {
    currentAttachments,
    isGlobalDragging,
    fileInputRef,
    triggerFileSelect,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
    handleGlobalDragEnter,
    handleGlobalDragOver,
    handleGlobalDragLeave,
    handleGlobalDrop
  }
}
