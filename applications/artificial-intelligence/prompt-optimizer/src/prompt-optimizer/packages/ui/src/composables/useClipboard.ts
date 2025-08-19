import { useI18n } from 'vue-i18n'
import { useToast } from './useToast'

/**
 * 复制内容到剪贴板的组合式API
 * 
 * @returns 复制相关的方法和状态
 */
export function useClipboard() {
  const { t } = useI18n()
  const toast = useToast()

  /**
   * 复制文本到剪贴板
   * 支持现代API和降级方案
   * 
   * @param text 要复制的文本
   * @param showToast 是否显示提示，默认为true
   * @returns 是否复制成功
   */
  const copyText = async (text: string, showToast = true): Promise<boolean> => {
    if (!text) return false
    
    // 检查是否支持现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        if (showToast) toast.success(t('common.copySuccess'))
        return true
      } catch (e) {
        console.warn('现代剪贴板API失败，尝试备用方法', e)
        // 继续尝试备用方法
      }
    }
    
    // 备用方法：创建临时元素复制
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      
      // 设置样式确保元素不可见
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.left = '-9999px'
      
      document.body.appendChild(textarea)
      textarea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (successful && showToast) {
        toast.success(t('common.copySuccess'))
      } else if (!successful && showToast) {
        toast.error(t('common.copyFailed'))
      }
      
      return successful
    } catch (e) {
      console.error('备用剪贴板方法失败', e)
      if (showToast) toast.error(t('common.copyFailed'))
      return false
    }
  }

  return {
    copyText
  }
} 