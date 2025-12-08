import type { MessageAttachment } from '@/stores/promptStore'
import type { MessageContent } from '../types'

export class AttachmentConverter {
  static convertToOpenAI(attachments: MessageAttachment[]): MessageContent[] {
    return attachments
      .map(att => {
        if (att.type === 'image') {
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
        
        return null
      })
      .filter((item): item is MessageContent => item !== null)
  }

  static convertToAnthropic(attachments: MessageAttachment[]): MessageContent[] {
    return attachments
      .map(att => {
        if (att.type === 'image') {
          return {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: att.mimeType,
              data: att.data
            }
          } as MessageContent
        } else if (att.type === 'document') {
          const supportedDocumentTypes = [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'application/json',
            'text/html',
            'text/csv'
          ]
          
          if (supportedDocumentTypes.includes(att.mimeType)) {
            return {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: att.mimeType,
                data: att.data
              }
            } as MessageContent
          }
          
          return null
        }
        
        return null
      })
      .filter((item): item is MessageContent => item !== null)
  }

  static convertToGemini(attachments: MessageAttachment[]): any[] {
    return attachments.map(att => {
      if (att.type === 'image') {
        return {
          inline_data: {
            mime_type: att.mimeType,
            data: att.data
          }
        }
      } else if (att.type === 'document') {
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
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/msword',
          'application/vnd.ms-excel',
          'application/vnd.ms-powerpoint',
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
      
      return null
    }).filter(Boolean)
  }

  static isGeminiSupported(att: MessageAttachment): boolean {
    const supported = [
      'image/',
      'text/',
      'application/pdf',
      'application/json',
      'application/xml',
      'application/vnd.openxmlformats',
      'application/msword',
      'application/vnd.ms-',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
      'video/mp4',
      'video/mpeg',
      'video/mov',
      'video/avi',
      'video/webm'
    ]
    
    return supported.some(prefix => att.mimeType.startsWith(prefix))
  }
}
