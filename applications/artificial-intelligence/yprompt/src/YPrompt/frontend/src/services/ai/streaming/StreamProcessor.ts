import { SSEParser } from './SSEParser'
import { StreamFilter } from './StreamFilter'
import type { StreamChunk } from '../types'

/**
 * 流式响应处理器
 * 负责协调SSE解析和内容过滤
 */
export class StreamProcessor {
  private sseParser: SSEParser
  private streamFilter: StreamFilter

  constructor() {
    this.sseParser = new SSEParser()
    this.streamFilter = new StreamFilter()
  }

  /**
   * 重置处理器状态
   */
  reset(): void {
    this.streamFilter.reset()
  }

  /**
   * 处理流式响应，返回一个异步迭代器
   */
  async* processStream(
    stream: ReadableStream<Uint8Array>,
    parseChunk: (data: string) => StreamChunk | null
  ): AsyncGenerator<string> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          // 流结束，输出缓冲区剩余内容
          const remaining = this.streamFilter.finalize()
          if (remaining) {
            yield remaining
          }
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          // 解析SSE数据
          const data = this.sseParser.parseDataFromLine(line)
          if (!data) continue

          // 使用provider特定的解析器解析chunk
          const parsed = parseChunk(data)
          if (!parsed || !parsed.content) continue

          // 过滤think标签并输出
          const filtered = this.streamFilter.filterChunk(parsed.content)
          if (filtered) {
            yield filtered
          }

          // 如果流结束，输出剩余缓冲内容
          if (parsed.done) {
            const remaining = this.streamFilter.finalize()
            if (remaining) {
              yield remaining
            }
            return
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
