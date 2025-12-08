import type { ProviderConfig } from '@/stores/settingsStore'

export class ModelFetcher {
  private static async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
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

  static async getModels(provider: ProviderConfig, apiType?: 'openai' | 'anthropic' | 'google'): Promise<string[]> {
    const type = apiType || provider.type
    
    switch (type) {
      case 'openai':
        return await this.getOpenAIModels(provider)
      case 'anthropic':
        return await this.getAnthropicModels()
      case 'google':
        return await this.getGeminiModels(provider)
      case 'custom':
        return await this.getCustomProviderModels(provider, apiType)
      default:
        return await this.getOpenAIModels(provider)
    }
  }

  private static async getOpenAIModels(provider: ProviderConfig): Promise<string[]> {
    if (!provider.baseUrl) {
      throw new Error('API URL 未配置')
    }
    
    const apiUrl = this.buildOpenAIModelsUrl(provider.baseUrl)
    
    const response = await this.fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`OpenAI Models API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.data && Array.isArray(data.data)) {
      return data.data
        .map((model: any) => model.id)
        .filter((id: string) => id && typeof id === 'string')
        .sort()
    }
    
    throw new Error('OpenAI API返回的模型列表格式不正确')
  }

  private static async getGeminiModels(provider: ProviderConfig): Promise<string[]> {
    if (!provider.baseUrl) {
      throw new Error('API URL 未配置')
    }
    
    const apiUrl = this.buildGeminiModelsUrl(provider.baseUrl)
    const url = new URL(apiUrl)
    url.searchParams.set('key', provider.apiKey)
    
    const response = await this.fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Gemini Models API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.models && Array.isArray(data.models)) {
      return data.models
        .map((model: any) => {
          if (model.name && typeof model.name === 'string') {
            return model.name.replace(/^models\//, '')
          }
          return model.id || model.name
        })
        .filter((name: string) => name && typeof name === 'string')
        .sort()
    }
    
    throw new Error('Gemini API返回的模型列表格式不正确')
  }

  private static async getAnthropicModels(): Promise<string[]> {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ].sort()
  }

  private static async getCustomProviderModels(provider: ProviderConfig, preferredApiType?: 'openai' | 'anthropic' | 'google'): Promise<string[]> {
    if (preferredApiType) {
      switch (preferredApiType) {
        case 'openai':
          return await this.getOpenAIModels(provider)
        case 'anthropic':
          return await this.getAnthropicModels()
        case 'google':
          return await this.getGeminiModels(provider)
      }
    }
    
    const baseUrl = provider.baseUrl?.toLowerCase() || ''
    
    if (baseUrl.includes('googleapis.com') || 
        baseUrl.includes('generativelanguage') ||
        baseUrl.includes('/v1beta') ||
        baseUrl.includes('gemini')) {
      return await this.getGeminiModels(provider)
    }
    
    if (baseUrl.includes('anthropic.com') || baseUrl.includes('claude')) {
      return await this.getAnthropicModels()
    }
    
    try {
      return await this.getOpenAIModels(provider)
    } catch {
      try {
        return await this.getGeminiModels(provider)
      } catch {
        return await this.getGenericModels(provider)
      }
    }
  }

  private static async getGenericModels(provider: ProviderConfig): Promise<string[]> {
    if (!provider.baseUrl) {
      throw new Error('API URL 未配置')
    }
    
    let apiUrl = provider.baseUrl.trim()
    
    if (!apiUrl.includes('/models')) {
      if (apiUrl.includes('/v1')) {
        apiUrl = apiUrl.replace(/\/+$/, '') + '/models'
      } else {
        apiUrl = apiUrl.replace(/\/+$/, '') + '/v1/models'
      }
    }
    
    const response = await this.fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Models API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    let models: string[] = []
    
    if (data.data && Array.isArray(data.data)) {
      models = data.data
        .map((model: any) => model.id)
        .filter((id: string) => id && typeof id === 'string')
    } else if (data.models && Array.isArray(data.models)) {
      models = data.models
        .map((model: any) => {
          if (model.name && typeof model.name === 'string') {
            return model.name.replace(/^models\//, '')
          }
          return model.id || model.name
        })
        .filter((name: string) => name && typeof name === 'string')
    } else if (Array.isArray(data)) {
      models = data
        .map((item: any) => {
          if (typeof item === 'string') return item
          if (item.id) return item.id
          if (item.name) return item.name.replace(/^models\//, '')
          return null
        })
        .filter((name: string | null) => name && typeof name === 'string') as string[]
    }
    
    if (models.length > 0) {
      return models.sort()
    }
    
    throw new Error('无效的模型列表响应格式')
  }

  private static buildOpenAIModelsUrl(baseUrl: string): string {
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

  private static buildGeminiModelsUrl(baseUrl: string): string {
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
}
