import { ErrorParser } from './ErrorParser'

/**
 * AI错误处理器
 * 提供统一的错误处理接口
 */
export class AIErrorHandler {
  private static errorParser = new ErrorParser()

  /**
   * 解析API错误并返回用户友好的错误信息
   */
  static parseError(error: any, apiType: string): string {
    return this.errorParser.parseAPIError(error, apiType)
  }

  /**
   * 处理网络错误
   */
  static handleNetworkError(error: any): string {
    if (error.name === 'AbortError') {
      return '请求已被取消'
    }
    
    if (error.name === 'TimeoutError') {
      return '请求超时，请检查网络连接后重试'
    }

    return '网络连接错误，请检查网络连接后重试'
  }

  /**
   * 判断是否为可重试的错误
   */
  static isRetriableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || ''
    const code = error?.error?.code || error?.code || ''

    // 网络相关错误可重试
    if (message.includes('network') || 
        message.includes('timeout') || 
        message.includes('connection')) {
      return true
    }

    // 429 限流错误可重试
    if (code === '429' || message.includes('rate limit')) {
      return true
    }

    // 5xx 服务器错误可重试
    if (code >= '500' && code < '600') {
      return true
    }

    return false
  }
}
