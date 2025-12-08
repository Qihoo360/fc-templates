/**
 * 流式内容过滤器
 * 用于过滤AI响应中的特殊标签（如<think>标签）
 */
export class StreamFilter {
  private buffer: string = ''
  private inThinkTag: boolean = false
  private thinkTagContent: string = ''

  /**
   * 重置过滤器状态
   */
  reset(): void {
    this.buffer = ''
    this.inThinkTag = false
    this.thinkTagContent = ''
  }

  /**
   * 处理流式文本块，过滤<think>标签
   */
  filterChunk(chunk: string): string {
    this.buffer += chunk
    let output = ''

    while (this.buffer.length > 0) {
      if (!this.inThinkTag) {
        const thinkStart = this.buffer.indexOf('<think>')
        
        if (thinkStart === -1) {
          // 保留最后7个字符以防止标签被分割
          if (this.buffer.length > 7) {
            output += this.buffer.slice(0, -7)
            this.buffer = this.buffer.slice(-7)
          }
          break
        } else {
          // 找到<think>标签开始
          output += this.buffer.slice(0, thinkStart)
          this.buffer = this.buffer.slice(thinkStart + 7)
          this.inThinkTag = true
          this.thinkTagContent = ''
        }
      } else {
        // 在think标签内
        const thinkEnd = this.buffer.indexOf('</think>')
        
        if (thinkEnd === -1) {
          // 还没找到结束标签，保留最后8个字符
          if (this.buffer.length > 8) {
            this.thinkTagContent += this.buffer.slice(0, -8)
            this.buffer = this.buffer.slice(-8)
          }
          break
        } else {
          // 找到</think>标签结束
          this.thinkTagContent += this.buffer.slice(0, thinkEnd)
          this.buffer = this.buffer.slice(thinkEnd + 8)
          this.inThinkTag = false
          this.thinkTagContent = ''
        }
      }
    }

    return output
  }

  /**
   * 完成过滤，返回缓冲区剩余内容
   */
  finalize(): string {
    const remaining = this.buffer
    this.reset()
    return remaining
  }

  /**
   * 从完整文本中移除<think>标签（用于非流式响应）
   */
  static removeThinkTags(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/g, '')
  }
}
