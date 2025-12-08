import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { copyToClipboard as copyUtil } from '@/utils/clipboardUtils'

export function usePreviewClipboard() {
  const notificationStore = useNotificationStore()
  const copyStatus = ref<{ [key: string]: boolean }>({
    report: false,
    thinking: false,
    initial: false,
    advice: false,
    final: false
  })

  const copyToClipboard = async (text: string, key: string) => {
    if (!text || text.trim() === '') {
      notificationStore.warning('内容为空，无法复制')
      return
    }

    try {
      await copyUtil(text)
      copyStatus.value[key] = true
      notificationStore.success('已复制到剪贴板')
      
      // 2秒后恢复图标
      setTimeout(() => {
        copyStatus.value[key] = false
      }, 2000)
    } catch (error) {
      notificationStore.error('复制失败，请重试')
    }
  }

  return {
    copyStatus,
    copyToClipboard
  }
}
