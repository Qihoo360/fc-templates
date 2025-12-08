import type { ChatMessage, AIResponse, ProviderConfig, StreamChunk, APICallParams } from '../types'

/**
 * AI 提供商基础抽象类
 * 定义所有 AI 提供商必须实现的核心接口
 */
export abstract class BaseProvider {
  protected config: ProviderConfig
  protected modelId: string

  constructor(config: ProviderConfig, modelId: string) {
    this.config = config
    this.modelId = modelId
  }

  /**
   * 调用 AI API
   * @param messages 聊天消息列表
   * @param stream 是否使用流式响应
   * @param params API 调用参数（temperature, maxTokens 等）
   * @returns Promise<AIResponse | ReadableStream<Uint8Array>>
   */
  abstract callAPI(messages: ChatMessage[], stream: boolean, params?: APICallParams): Promise<AIResponse | ReadableStream<Uint8Array>>

  /**
   * 解析流式响应块
   * @param data SSE 数据字符串
   * @returns 解析后的流式块或 null
   */
  abstract parseStreamChunk(data: string): StreamChunk | null

  /**
   * 创建带超时的 fetch 请求
   * @param url 请求 URL
   * @param options 请求选项
   * @param timeoutMs 超时时间（毫秒）
   * @returns Promise<Response>
   */
  protected async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 300000): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
