/**
 * 跨浏览器复制到剪贴板工具函数
 * 支持现代 Clipboard API 和传统 execCommand 降级方案
 */

/**
 * 复制文本到剪贴板（支持 HTTP 环境）
 * @param text 要复制的文本
 * @returns Promise<void>
 */
export async function copyToClipboard(text: string): Promise<void> {
  // 方案1: 尝试使用现代 Clipboard API (仅在 HTTPS 或 localhost 可用)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (err) {
      console.warn('Clipboard API 失败，尝试降级方案:', err)
      // 如果失败，继续尝试降级方案
    }
  }

  // 方案2: 使用传统的 execCommand (兼容 HTTP 环境)
  return fallbackCopyToClipboard(text)
}

/**
 * 降级复制方案 - 使用 document.execCommand
 * 兼容不支持 Clipboard API 或非安全上下文的环境
 */
function fallbackCopyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 创建临时 textarea 元素
    const textarea = document.createElement('textarea')
    textarea.value = text
    
    // 设置样式，使其不可见
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.width = '2em'
    textarea.style.height = '2em'
    textarea.style.padding = '0'
    textarea.style.border = 'none'
    textarea.style.outline = 'none'
    textarea.style.boxShadow = 'none'
    textarea.style.background = 'transparent'
    textarea.style.opacity = '0'
    
    // 添加到 DOM
    document.body.appendChild(textarea)
    
    // 聚焦并选中文本
    textarea.focus()
    textarea.select()
    
    // iOS 兼容
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
      const range = document.createRange()
      range.selectNodeContents(textarea)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      textarea.setSelectionRange(0, 999999)
    }
    
    try {
      // 执行复制命令
      const successful = document.execCommand('copy')
      
      // 移除临时元素
      document.body.removeChild(textarea)
      
      if (successful) {
        resolve()
      } else {
        reject(new Error('execCommand("copy") 返回 false'))
      }
    } catch (err) {
      // 移除临时元素
      document.body.removeChild(textarea)
      reject(err)
    }
  })
}

/**
 * 检查当前环境是否支持 Clipboard API
 */
export function isClipboardAPISupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext)
}

/**
 * 获取剪贴板支持信息（用于调试）
 */
export function getClipboardSupportInfo(): {
  hasClipboardAPI: boolean
  isSecureContext: boolean
  protocol: string
  fallbackOnly: boolean
} {
  return {
    hasClipboardAPI: !!navigator.clipboard,
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    fallbackOnly: !navigator.clipboard || !window.isSecureContext
  }
}
