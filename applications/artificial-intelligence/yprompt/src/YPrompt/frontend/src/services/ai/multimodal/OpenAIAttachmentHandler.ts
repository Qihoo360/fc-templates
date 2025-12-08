import type { MessageAttachment } from '@/stores/promptStore'
import type { MessageContent } from '../types'

/**
 * OpenAI 附件处理器
 * 负责将附件转换为 OpenAI API 格式
 */
export class OpenAIAttachmentHandler {
  /**
   * 将附件转换为 OpenAI 格式的内容
   * OpenAI API 支持的图片格式：PNG, JPEG, WEBP, GIF (非动画)
   * 注意：ChatGPT网页版支持PDF、Word等，但API不支持
   * @param attachments 附件列表
   * @returns 转换后的消息内容数组
   */
  static convertAttachments(attachments: MessageAttachment[]): MessageContent[] {
    return attachments
      .map(att => {
        if (att.type === 'image') {
          // OpenAI API 支持的图片格式：PNG, JPEG, WEBP, GIF (非动画)
          const supportedImageTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp',
            'image/gif'
          ]
          
          if (supportedImageTypes.includes(att.mimeType)) {
            return {
              type: 'image_url' as const,
              image_url: {
                url: `data:${att.mimeType};base64,${att.data}`
              }
            } as MessageContent
          } else {
            return null
          }
        }
        
        // OpenAI API 当前仅支持图片格式，不支持文档、音频、视频
        // 注意：ChatGPT网页版支持PDF、Word等，但API不支持
        return null
      })
      .filter((item): item is MessageContent => item !== null)
  }

  /**
   * 检查附件是否被 OpenAI 支持
   * @param attachment 附件对象
   * @returns 是否支持
   */
  static isSupported(attachment: MessageAttachment): boolean {
    if (attachment.type !== 'image') {
      return false
    }

    const supportedImageTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif'
    ]

    return supportedImageTypes.includes(attachment.mimeType)
  }

  /**
   * 获取支持的文件类型列表
   * @returns 支持的 MIME 类型数组
   */
  static getSupportedTypes(): string[] {
    return [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif'
    ]
  }
}