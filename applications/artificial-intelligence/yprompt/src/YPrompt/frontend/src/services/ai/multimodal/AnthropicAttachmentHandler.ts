import type { MessageAttachment } from '@/stores/promptStore'
import type { MessageContent } from '../types'

/**
 * Anthropic Claude 附件处理器
 * 负责将附件转换为 Anthropic API 格式
 */
export class AnthropicAttachmentHandler {
  /**
   * 将附件转换为 Anthropic 格式的内容
   * Claude 3.5+ 支持图片格式和PDF文档（最多100页）
   * @param attachments 附件列表
   * @returns 转换后的消息内容数组
   */
  static convertAttachments(attachments: MessageAttachment[]): MessageContent[] {
    return attachments
      .map(att => {
        if (att.type === 'image') {
          // Claude 3.5+支持图片格式
          return {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: att.mimeType,
              data: att.data
            }
          } as MessageContent
        } else if (att.type === 'document') {
          // Claude 3.5 Sonnet及以上版本支持PDF文档（最多100页）
          const supportedDocumentTypes = [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'application/json',
            'text/html',
            'text/csv'
          ]
          
          if (supportedDocumentTypes.includes(att.mimeType)) {
            // 对于支持的文档类型，使用document格式传递
            return {
              type: 'image' as const,  // Claude API使用相同的格式结构
              source: {
                type: 'base64' as const,
                media_type: att.mimeType,
                data: att.data
              }
            } as MessageContent
          }
          
          return null
        }
        
        // Claude 3.5+主要支持图片和PDF文档，其他类型暂不支持
        return null
      })
      .filter((item): item is MessageContent => item !== null)
  }

  /**
   * 检查附件是否被 Anthropic 支持
   * @param attachment 附件对象
   * @returns 是否支持
   */
  static isSupported(attachment: MessageAttachment): boolean {
    if (attachment.type === 'image') {
      return true
    }

    if (attachment.type === 'document') {
      const supportedDocumentTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'application/json',
        'text/html',
        'text/csv'
      ]
      return supportedDocumentTypes.includes(attachment.mimeType)
    }

    return false
  }

  /**
   * 获取支持的文件类型列表
   * @returns 支持的 MIME 类型数组
   */
  static getSupportedTypes(): string[] {
    return [
      // 图片格式
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      // 文档格式
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json',
      'text/html',
      'text/csv'
    ]
  }
}