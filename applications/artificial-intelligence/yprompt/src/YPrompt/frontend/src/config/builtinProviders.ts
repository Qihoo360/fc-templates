import type { ProviderConfig } from '@/stores/settingsStore'

// 内置提供商配置接口
export interface BuiltinProviderConfig {
  type: 'openai' | 'anthropic' | 'google' | 'custom'
  name: string
  apiKey: string
  baseUrl?: string
  models?: Array<{
    id: string
    name: string
    enabled?: boolean
    apiType?: 'openai' | 'anthropic' | 'google' // 模型级别的API类型
  }>
  enabled?: boolean
}

// 获取编译时内置的提供商配置
export function getBuiltinProviders(): BuiltinProviderConfig[] {
  try {
    // 这个值在编译时被 vite.config.ts 中的 define 替换
    const builtinProvidersConfig = __BUILTIN_PROVIDERS__
    
    if (Array.isArray(builtinProvidersConfig)) {
      return builtinProvidersConfig
    }
    return []
  } catch (error) {
    return []
  }
}

// 将内置提供商配置转换为完整的提供商配置
export function convertBuiltinToProviderConfig(builtin: BuiltinProviderConfig): ProviderConfig {
  // 使用固定的ID生成策略，基于类型和名称的hash
  const nameHash = builtin.name.replace(/\s+/g, '_').toLowerCase()
  const id = `builtin_${builtin.type}_${nameHash}`
  

  const defaultBaseUrls = {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    google: 'https://generativelanguage.googleapis.com/v1beta'
  }

  // 要求配置文件中必须明确指定models，不提供默认值
  const models = (builtin.models || []).map(model => ({
    ...model,
    provider: id,
    enabled: model.enabled ?? true,
    // 如果模型指定了apiType，使用模型的；否则使用提供商的type
    apiType: (model.apiType || builtin.type) as any
  }))

  return {
    id,
    name: builtin.name,
    type: builtin.type,
    apiKey: builtin.apiKey,
    baseUrl: builtin.baseUrl || defaultBaseUrls[builtin.type as keyof typeof defaultBaseUrls],
    models,
    enabled: builtin.enabled ?? true,
    allowCustomUrl: true
  }
}