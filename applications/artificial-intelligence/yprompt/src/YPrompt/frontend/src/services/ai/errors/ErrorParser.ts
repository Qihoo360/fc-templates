/**
 * AI API错误解析器
 */
export class ErrorParser {
  /**
   * 解析API错误并提供友好的用户反馈
   */
  parseAPIError(error: any, apiType: string): string {
    try {
      let errorMessage = ''
      let errorCode = ''

      // 尝试解析不同格式的错误响应
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message
        errorCode = error.error.code || error.error.type || ''
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = JSON.stringify(error)
      }

      // 检查是否是MIME类型不支持的错误
      const mimeTypePattern = /Unsupported MIME type: ([^(]+)/i
      const mimeMatch = errorMessage.match(mimeTypePattern)

      if (mimeMatch) {
        return this.parseMimeTypeError(mimeMatch[1].trim(), apiType)
      }

      // 检查是否是其他常见的附件相关错误
      if (this.isAttachmentError(errorMessage)) {
        return `当前模型不支持附件功能。请移除附件或切换到支持多模态的模型（如GPT-4 Vision、Claude 3.5+或Gemini）。`
      }

      // 检查是否是模型不支持的错误
      if (this.isModelError(errorMessage)) {
        return `模型不可用或配置错误。请检查模型名称和API配置。`
      }

      // 检查是否是API密钥相关错误
      if (this.isAuthError(errorMessage, errorCode)) {
        return `API密钥无效或未授权。请检查您的API密钥配置。`
      }

      // 检查是否是配额或限制错误
      if (this.isRateLimitError(errorMessage, errorCode)) {
        return `API调用频率过高或配额已用完。请稍后重试或检查您的API账户状态。`
      }

      // 如果是网络相关错误
      if (this.isNetworkError(errorMessage)) {
        return `网络连接错误。请检查网络连接后重试。`
      }

      // 返回清理后的原始错误信息
      return `API请求失败：${errorMessage}`

    } catch (parseError) {
      // 解析错误时返回通用错误信息
      return `API请求失败，请检查网络连接和配置后重试。`
    }
  }

  private parseMimeTypeError(mimeType: string, apiType: string): string {
    const fileTypeHint = this.getFileTypeHint(mimeType)
    const modelSuggestion = this.getModelSuggestion(apiType)
    return `${fileTypeHint}格式不受当前模型支持。\n\n${modelSuggestion}，或移除附件后重新发送。`
  }

  private getFileTypeHint(mimeType: string): string {
    if (mimeType.startsWith('application/vnd.openxmlformats-officedocument')) {
      if (mimeType.includes('wordprocessingml')) return 'Word文档(.docx)'
      if (mimeType.includes('spreadsheetml')) return 'Excel表格(.xlsx)'
      if (mimeType.includes('presentationml')) return 'PowerPoint演示文稿(.pptx)'
      return 'Office文档'
    }
    if (mimeType.startsWith('application/msword')) return 'Word文档(.doc)'
    if (mimeType.startsWith('application/vnd.ms-excel')) return 'Excel表格(.xls)'
    if (mimeType.startsWith('application/vnd.ms-powerpoint')) return 'PowerPoint演示文稿(.ppt)'
    if (mimeType.startsWith('application/pdf')) return 'PDF文档'
    if (mimeType.startsWith('text/')) return '文本文件'
    if (mimeType.startsWith('image/')) return '图片文件'
    if (mimeType.startsWith('audio/')) return '音频文件'
    if (mimeType.startsWith('video/')) return '视频文件'
    return '该文件'
  }

  private getModelSuggestion(apiType: string): string {
    switch (apiType) {
      case 'openai':
        return '当前OpenAI模型主要支持图片格式。建议切换到支持更多文件类型的模型（如Gemini）'
      case 'anthropic':
        return '当前Claude模型支持图片和PDF文档格式。建议切换到支持更多文件类型的模型（如Gemini），或使用支持的格式'
      case 'google':
        return '当前Gemini模型不支持此文件格式。建议使用支持的格式（图片、PDF、Office文档等）'
      default:
        return '当前模型不支持此文件格式。建议切换到支持多模态的模型'
    }
  }

  private isAttachmentError(message: string): boolean {
    const lowerMessage = message.toLowerCase()
    return lowerMessage.includes('multimodal') ||
           lowerMessage.includes('attachment') ||
           lowerMessage.includes('file') ||
           lowerMessage.includes('image')
  }

  private isModelError(message: string): boolean {
    const lowerMessage = message.toLowerCase()
    return lowerMessage.includes('model') &&
           (lowerMessage.includes('not found') || lowerMessage.includes('invalid'))
  }

  private isAuthError(message: string, code: string): boolean {
    const lowerMessage = message.toLowerCase()
    return lowerMessage.includes('api key') ||
           lowerMessage.includes('unauthorized') ||
           lowerMessage.includes('authentication') ||
           code === '401'
  }

  private isRateLimitError(message: string, code: string): boolean {
    const lowerMessage = message.toLowerCase()
    return lowerMessage.includes('quota') ||
           lowerMessage.includes('limit') ||
           lowerMessage.includes('rate') ||
           code === '429'
  }

  private isNetworkError(message: string): boolean {
    const lowerMessage = message.toLowerCase()
    return lowerMessage.includes('network') ||
           lowerMessage.includes('timeout') ||
           lowerMessage.includes('connection')
  }
}
