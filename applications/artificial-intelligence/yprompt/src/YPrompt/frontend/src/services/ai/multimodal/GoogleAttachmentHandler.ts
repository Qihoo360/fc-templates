import type { MessageAttachment } from '@/stores/promptStore'

/**
 * Google Gemini 附件处理器
 * 负责将附件转换为 Gemini API 格式
 */
export class GoogleAttachmentHandler {
  /**
   * 将附件转换为 Gemini 格式的内容
   * Gemini 支持多种文件格式：图片、文档、音频、视频
   * @param attachments 附件列表
   * @returns 转换后的消息内容数组
   */
  static convertAttachments(attachments: MessageAttachment[]): any[] {
    return attachments.map(att => {
      if (att.type === 'image') {
        // 图片文件
        return {
          inline_data: {
            mime_type: att.mimeType,
            data: att.data
          }
        }
      } else if (att.type === 'document') {
        // 文档文件 - Gemini支持多种文档格式
        // 支持的文档类型包括：text/plain, application/pdf, text/html, text/css, text/javascript, application/json等
        const supportedDocumentTypes = [
          'text/plain',
          'text/html',
          'text/css',
          'text/javascript',
          'application/json',
          'text/markdown',
          'application/pdf',
          'text/csv',
          'text/xml',
          'application/xml',
          // Microsoft Office 文档
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'application/msword', // .doc
          'application/vnd.ms-excel', // .xls
          'application/vnd.ms-powerpoint', // .ppt
          'application/rtf'
        ]
        
        if (supportedDocumentTypes.includes(att.mimeType)) {
          return {
            inline_data: {
              mime_type: att.mimeType,
              data: att.data
            }
          }
        } else {
          return null
        }
      } else if (att.type === 'audio') {
        // 音频文件 - Gemini支持某些音频格式
        const supportedAudioTypes = [
          'audio/wav',
          'audio/mp3',
          'audio/mpeg',
          'audio/aac',
          'audio/ogg',
          'audio/flac'
        ]
        
        if (supportedAudioTypes.includes(att.mimeType)) {
          return {
            inline_data: {
              mime_type: att.mimeType,
              data: att.data
            }
          }
        } else {
          return null
        }
      } else if (att.type === 'video') {
        // 视频文件 - Gemini支持某些视频格式
        const supportedVideoTypes = [
          'video/mp4',
          'video/mpeg',
          'video/mov',
          'video/avi',
          'video/x-flv',
          'video/mpg',
          'video/webm',
          'video/wmv'
        ]
        
        if (supportedVideoTypes.includes(att.mimeType)) {
          return {
            inline_data: {
              mime_type: att.mimeType,
              data: att.data
            }
          }
        } else {
          return null
        }
      }
      
      // 不支持的文件类型
      return null
    }).filter(Boolean)
  }

  /**
   * 检查附件是否被 Gemini 支持
   * @param attachment 附件对象
   * @returns 是否支持
   */
  static isSupported(attachment: MessageAttachment): boolean {
    if (attachment.type === 'image') {
      return true
    } else if (attachment.type === 'document') {
      const supportedDocumentTypes = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
        'text/markdown',
        'application/pdf',
        'text/csv',
        'text/xml',
        'application/xml',
        // Microsoft Office 文档
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/msword', // .doc
        'application/vnd.ms-excel', // .xls
        'application/vnd.ms-powerpoint', // .ppt
        'application/rtf'
      ]
      return supportedDocumentTypes.includes(attachment.mimeType)
    } else if (attachment.type === 'audio') {
      const supportedAudioTypes = [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/aac',
        'audio/ogg',
        'audio/flac'
      ]
      return supportedAudioTypes.includes(attachment.mimeType)
    } else if (attachment.type === 'video') {
      const supportedVideoTypes = [
        'video/mp4',
        'video/mpeg',
        'video/mov',
        'video/avi',
        'video/x-flv',
        'video/mpg',
        'video/webm',
        'video/wmv'
      ]
      return supportedVideoTypes.includes(attachment.mimeType)
    }
    
    return false
  }

  /**
   * 获取支持的文件类型列表
   * @returns 支持的 MIME 类型数组
   */
  static getSupportedTypes(): string[] {
    return [
      // 图片格式 - Gemini支持广泛的图片格式
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'image/heic',
      // 文档格式
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'text/markdown',
      'application/pdf',
      'text/csv',
      'text/xml',
      'application/xml',
      // Microsoft Office 文档
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
      'application/rtf',
      // 音频格式
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
      // 视频格式
      'video/mp4',
      'video/mpeg',
      'video/mov',
      'video/avi',
      'video/x-flv',
      'video/mpg',
      'video/webm',
      'video/wmv'
    ]
  }
}