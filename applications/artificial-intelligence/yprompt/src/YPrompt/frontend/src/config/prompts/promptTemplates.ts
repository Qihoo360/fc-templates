// 提示词模板统一导出
// 提供对所有独立提示词文件的便捷访问

export * from './thinkingPointsExtraction'
export * from './systemPromptGeneration'
export * from './optimizationAdvice'
export * from './optimizationApplication'

// 为了向后兼容，重新导出原有的结构
export { FINAL_PROMPT_GENERATION_RULES, FINAL_PROMPT_SYSTEM_MESSAGES } from './finalPromptGenerationRules'