/**
 * Server-Sent Events (SSE) 解析器
 */
export class SSEParser {
  /**
   * 判断是否为有效的SSE数据行
   */
  isValidSSELine(line: string): boolean {
    if (!line || typeof line !== 'string') {
      return false
    }

    const trimmedLine = line.trim()

    // 必须以 "data: " 开头
    if (!trimmedLine.startsWith('data: ')) {
      return false
    }

    // 获取数据部分
    const data = trimmedLine.slice(6).trim()

    // 空数据或[DONE]都是有效的
    if (!data || data === '[DONE]') {
      return true
    }

    // 专门过滤OPENROUTER的处理状态信息
    if (data === ': OPENROUTER PROCESSING') {
      return false
    }

    // 过滤其他明显的状态信息
    if (data.startsWith(': ') && data.toUpperCase().includes('PROCESSING')) {
      return false
    }

    return true
  }

  /**
   * 解析SSE行，提取data部分
   */
  parseDataFromLine(line: string): string | null {
    if (!this.isValidSSELine(line)) {
      return null
    }

    const data = line.slice(6).trim()
    if (!data || data === '[DONE]') {
      return null
    }

    return data
  }
}
