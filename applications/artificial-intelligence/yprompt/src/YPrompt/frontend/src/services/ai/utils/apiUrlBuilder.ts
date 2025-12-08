/**
 * API URL构建工具
 */

/**
 * 构建OpenAI聊天API URL
 */
export function buildOpenAIChatUrl(baseUrl: string): string {
  if (!baseUrl) {
    throw new Error('API URL 未配置')
  }

  let apiUrl = baseUrl.trim()

  if (apiUrl.includes('/chat/completions')) {
    return apiUrl
  } else if (apiUrl.includes('/v1')) {
    return apiUrl.replace(/\/+$/, '') + '/chat/completions'
  } else {
    return apiUrl.replace(/\/+$/, '') + '/v1/chat/completions'
  }
}

/**
 * 构建OpenAI模型列表URL
 */
export function buildOpenAIModelsUrl(baseUrl: string): string {
  if (!baseUrl) {
    throw new Error('API URL 未配置')
  }

  let apiUrl = baseUrl.trim()

  if (apiUrl.endsWith('/models') || apiUrl.includes('/models?') || apiUrl.includes('/models/')) {
    return apiUrl
  } else if (apiUrl.includes('/v1')) {
    return apiUrl.replace(/\/+$/, '') + '/models'
  } else {
    return apiUrl.replace(/\/+$/, '') + '/v1/models'
  }
}

/**
 * 构建Anthropic消息API URL
 */
export function buildAnthropicMessagesUrl(baseUrl: string): string {
  if (!baseUrl) {
    throw new Error('API URL 未配置')
  }

  let apiUrl = baseUrl.trim()
  if (!apiUrl.includes('/v1/messages')) {
    apiUrl = apiUrl.replace(/\/+$/, '') + '/v1/messages'
  }
  return apiUrl
}

/**
 * 构建Gemini API URL
 */
export function buildGeminiUrl(baseUrl: string, modelId: string, action: 'generateContent' | 'streamGenerateContent'): string {
  if (!baseUrl) {
    throw new Error('API URL 未配置')
  }

  let apiUrl = baseUrl.trim()

  // 确保以/v1beta结尾
  if (!apiUrl.endsWith('/v1beta')) {
    if (apiUrl.includes('/models/')) {
      apiUrl = apiUrl.split('/models/')[0]
    }
    if (!apiUrl.endsWith('/v1beta')) {
      apiUrl = apiUrl.replace(/\/+$/, '') + '/v1beta'
    }
  }

  return `${apiUrl}/models/${modelId}:${action}`
}

/**
 * 构建Gemini模型列表URL
 */
export function buildGeminiModelsUrl(baseUrl: string): string {
  if (!baseUrl) {
    throw new Error('API URL 未配置')
  }

  let apiUrl = baseUrl.trim()

  if (apiUrl.includes('/models')) {
    return apiUrl
  } else if (apiUrl.includes('/v1beta')) {
    return apiUrl.replace(/\/+$/, '') + '/models'
  } else {
    return apiUrl.replace(/\/+$/, '') + '/v1beta/models'
  }
}
