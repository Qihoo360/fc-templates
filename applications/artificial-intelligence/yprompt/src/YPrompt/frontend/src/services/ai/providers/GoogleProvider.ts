import { BaseProvider } from './BaseProvider'
import type { ChatMessage, AIResponse, StreamChunk, APICallParams } from '../types'
import { GoogleAttachmentHandler } from '../multimodal/GoogleAttachmentHandler'
import { ResponseCleaner } from '../utils/ResponseCleaner'

/**
 * Google Gemini API 提供商实现
 * 支持 Gemini 系列模型和多模态内容
 */
export class GoogleProvider extends BaseProvider {
  /**
   * 调用 Google Gemini API
   * @param messages 聊天消息列表
   * @param stream 是否使用流式响应
   * @param params API 调用参数
   * @returns Promise<AIResponse | ReadableStream<Uint8Array>>
   */
  async callAPI(messages: ChatMessage[], stream: boolean, params?: APICallParams): Promise<AIResponse | ReadableStream<Uint8Array>> {
    
    // Google Gemini API格式转换
    const systemMessage = this.extractSystemMessageText(messages)
    
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const contents = conversationMessages.map(msg => {
      const role = msg.role === 'assistant' ? 'model' : 'user'
      
      if (this.hasMultimodalContent(msg)) {
        const parts = this.convertToMultimodalContent(msg)
        return { role, parts }
      } else {
        const text = typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || ''
        return { role, parts: [{ text }] }
      }
    })

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: params?.temperature ?? 1.0,
        maxOutputTokens: params?.maxTokens ?? 8192,
        topP: params?.topP ?? 0.95,
        ...(params?.topK !== undefined && params.topK > 0 && { topK: params.topK })
      }
    }

    // 使用正确的system_instruction字段（顶级）
    if (systemMessage) {
      requestBody.system_instruction = {
        parts: [
          {
            text: systemMessage
          }
        ]
      }
    } else {
    }
    


    // 构建Google Gemini API URL
    if (!this.config.baseUrl) {
      throw new Error('API URL 未配置')
    }
    let apiUrl = this.config.baseUrl.trim()
    // 确保以/v1beta结尾，然后拼接模型路径
    if (!apiUrl.endsWith('/v1beta')) {
      // 如果是完整的generateContent URL，提取baseURL部分
      if (apiUrl.includes('/models/')) {
        apiUrl = apiUrl.split('/models/')[0]
      }
      // 确保以/v1beta结尾
      if (!apiUrl.endsWith('/v1beta')) {
        apiUrl = apiUrl.replace(/\/+$/, '') + '/v1beta'
      }
    }
    
    // 使用传入的模型ID
    const modelId = this.modelId
    
    // 拼接模型特定路径
    if (stream) {
      apiUrl = `${apiUrl}/models/${modelId}:streamGenerateContent`
      // 添加SSE参数（根据官方文档）
      const url = new URL(apiUrl)
      url.searchParams.set('alt', 'sse')
      apiUrl = url.toString()
    } else {
      apiUrl = `${apiUrl}/models/${modelId}:generateContent`
    }
    
    // 对于Google模型使用较长的超时时间
    const timeoutMs = 300000 // 5分钟
    
    const response = await this.fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.config.apiKey  // 使用官方文档推荐的header
      },
      body: JSON.stringify(requestBody)
    }, timeoutMs)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(`Google Gemini API error: ${response.status} ${response.statusText}`)
      ;(error as any).error = errorData
      ;(error as any).status = response.status
      throw error
    }

    if (stream) {
      return response.body as ReadableStream<Uint8Array>
    } else {
      const data = await response.json()
      
      // 在parts数组中找到非思考内容的文本
      const candidate = data.candidates?.[0]
      if (!candidate?.content?.parts) {
        throw new Error('API返回数据结构异常')
      }
      
      // 查找实际的回答文本（排除thought内容）
      let result = ''
      for (const part of candidate.content.parts) {
        if (part.text && !part.thought) {
          result = part.text
          break
        }
      }
      
      if (!result || result.trim() === '') {
        throw new Error('API返回空内容')
      }
      
      // 清理think标签内容
      const cleanedResult = ResponseCleaner.cleanThinkTags(result)
      
      return {
        content: cleanedResult,
        finishReason: candidate.finishReason
      }
    }
  }

  /**
   * 解析 Google Gemini 流式响应块
   * @param data SSE 数据字符串
   * @returns 解析后的流式块或 null
   */
  parseStreamChunk(data: string): StreamChunk | null {
    try {
      const parsed = JSON.parse(data)
      const candidate = parsed.candidates?.[0]
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text && !part.thought) {
            return {
              content: part.text,
              done: false
            }
          }
        }
      }
      
      // 检查是否结束
      if (candidate?.finishReason) {
        return {
          content: '',
          done: true
        }
      }
      
      return null
    } catch (parseError) {
      // JSON解析错误，返回null
      return null
    }
  }

  /**
   * 提取系统消息文本的辅助方法
   * @param messages 消息列表
   * @returns 系统消息文本
   */
  private extractSystemMessageText(messages: ChatMessage[]): string {
    const systemMsg = messages.find(m => m.role === 'system')
    if (!systemMsg) return ''
    if (typeof systemMsg.content === 'string') return systemMsg.content
    if (Array.isArray(systemMsg.content)) {
      return systemMsg.content.map(c => c.text || '').join(' ')
    }
    return ''
  }

  /**
   * 检查消息是否包含多模态内容
   * @param message 聊天消息
   * @returns 是否包含附件
   */
  private hasMultimodalContent(message: ChatMessage): boolean {
    return !!(message.attachments && message.attachments.length > 0)
  }

  /**
   * 将消息转换为多模态内容格式
   * @param message 聊天消息
   * @returns 多模态内容数组
   */
  private convertToMultimodalContent(message: ChatMessage): any[] {
    const parts: any[] = []
    
    // 添加文本内容
    if (typeof message.content === 'string' && message.content.trim()) {
      parts.push({ text: message.content })
    }
    
    // 添加附件内容
    if (message.attachments && message.attachments.length > 0) {
      const geminiAttachments = GoogleAttachmentHandler.convertAttachments(message.attachments)
      parts.push(...geminiAttachments)
      
      // 对于Gemini，检查是否有被过滤的附件
      const originalCount = message.attachments.length
      const processedCount = geminiAttachments.length
      if (processedCount < originalCount) {
        // 有附件被过滤，添加描述文本
        const unsupportedAttachments = message.attachments.filter((att) => {
          // 重新运行转换检查哪些被过滤了
          return !GoogleAttachmentHandler.isSupported(att)
        })
        
        if (unsupportedAttachments.length > 0) {
          const attachmentDescriptions = unsupportedAttachments.map(att => 
            `${att.name} (${att.type}, ${(att.size / 1024).toFixed(1)}KB)`
          ).join(', ')
          
          const attachmentInfoText = `[用户上传了以下附件，但当前无法直接处理: ${attachmentDescriptions}。用户询问关于这些附件的问题。]`
          
          parts.push({ text: attachmentInfoText })
        }
      }
    }
    
    return parts
  }
}
