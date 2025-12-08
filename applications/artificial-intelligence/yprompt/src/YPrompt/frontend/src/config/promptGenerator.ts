/**
 * 提示词生成器模块配置
 * 便于将来封装为独立子模块或集成到更大的项目中
 */

export interface PromptGeneratorConfig {
  // 欢迎消息配置
  welcomeMessage: string
  
  // 快速回复选项
  quickReplies: string[]
  
  // 对话设置
  maxConversationTurns: number
  typingDelay: number
}

// 默认配置
export const DEFAULT_PROMPT_GENERATOR_CONFIG: PromptGeneratorConfig = {
  welcomeMessage: "您好！我是提示词工程专家，将通过几个问题帮您构建一个高质量的AI提示词。请先告诉我：您希望用AI来解决什么问题或完成什么任务？",
  
  quickReplies: [
    '请使用相关最佳实践的推荐建议',
    '强制生成需求报告'
  ],
  
  maxConversationTurns: 5,
  typingDelay: 50
}

// 模块标识符
export const MODULE_INFO = {
  name: 'PromptGenerator',
  version: '1.0.0',
  description: '智能提示词生成器',
  author: 'YPrompt Team'
}

// 导出配置获取函数，便于将来扩展自定义配置
export function getPromptGeneratorConfig(customConfig?: Partial<PromptGeneratorConfig>): PromptGeneratorConfig {
  return {
    ...DEFAULT_PROMPT_GENERATOR_CONFIG,
    ...customConfig
  }
}
