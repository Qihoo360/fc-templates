/**
 * 统一的存储键常量定义
 *
 * 这是所有存储键的唯一数据源，UI包和Core包都从这里导入。
 * 集中管理所有存储键，避免在多个地方重复定义导致不一致。
 */

// 核心服务存储键
export const CORE_SERVICE_KEYS = {
  MODELS: 'models', // 模型配置存储键
  USER_TEMPLATES: 'user-templates', // 用户模板存储键
  PROMPT_HISTORY: 'prompt_history', // 提示词历史记录存储键
} as const

// UI设置相关
export const UI_SETTINGS_KEYS = {
  THEME_ID: 'app:settings:ui:theme-id',
  PREFERRED_LANGUAGE: 'app:settings:ui:preferred-language',
  BUILTIN_TEMPLATE_LANGUAGE: 'app:settings:ui:builtin-template-language',
} as const

// 模型选择相关
export const MODEL_SELECTION_KEYS = {
  OPTIMIZE_MODEL: 'app:selected-optimize-model',
  TEST_MODEL: 'app:selected-test-model',
} as const

// 模板选择相关
export const TEMPLATE_SELECTION_KEYS = {
  SYSTEM_OPTIMIZE_TEMPLATE: 'app:selected-optimize-template', // 系统优化模板（兼容旧版本）
  USER_OPTIMIZE_TEMPLATE: 'app:selected-user-optimize-template', // 用户优化模板
  ITERATE_TEMPLATE: 'app:selected-iterate-template', // 迭代模板
} as const

// 所有存储键的联合类型
export const ALL_STORAGE_KEYS = {
  ...CORE_SERVICE_KEYS,
  ...UI_SETTINGS_KEYS,
  ...MODEL_SELECTION_KEYS,
  ...TEMPLATE_SELECTION_KEYS,
} as const

// 导出所有键的数组（用于DataManager等需要遍历的场景）
export const ALL_STORAGE_KEYS_ARRAY = Object.values(ALL_STORAGE_KEYS)

// 类型定义
export type CoreServiceKey = typeof CORE_SERVICE_KEYS[keyof typeof CORE_SERVICE_KEYS]
export type UISettingsKey = typeof UI_SETTINGS_KEYS[keyof typeof UI_SETTINGS_KEYS]
export type ModelSelectionKey = typeof MODEL_SELECTION_KEYS[keyof typeof MODEL_SELECTION_KEYS]
export type TemplateSelectionKey = typeof TEMPLATE_SELECTION_KEYS[keyof typeof TEMPLATE_SELECTION_KEYS]
export type StorageKey = typeof ALL_STORAGE_KEYS[keyof typeof ALL_STORAGE_KEYS]
