import { ModelConfig } from './types';
import { ValidatedCustomModelEnvConfig, scanCustomModelEnvVars } from '../../utils/environment';
import { createStaticModels } from './static-models';

/**
 * 获取静态模型键列表
 * 通过创建临时静态模型配置来动态获取键列表，避免硬编码
 */
function getStaticModelKeys(): string[] {
  const tempStaticModels = createStaticModels({
    OPENAI_API_KEY: '',
    GEMINI_API_KEY: '',
    DEEPSEEK_API_KEY: '',
    SILICONFLOW_API_KEY: '',
    ZHIPU_API_KEY: '',
    CUSTOM_API_KEY: '',
    CUSTOM_API_BASE_URL: '',
    CUSTOM_API_MODEL: ''
  });

  return Object.keys(tempStaticModels);
}

/**
 * 生成自定义模型的显示名称
 * @param suffix 后缀名
 * @returns 格式化的显示名称
 */
export function generateCustomModelName(suffix: string): string {
  // 将下划线和连字符替换为空格，并转换为标题格式
  return suffix
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * 将已验证的自定义模型环境变量配置转换为ModelConfig
 * 输入的配置已通过 validateCustomModelConfig 验证，确保所有必需字段存在
 * @param envConfig 已验证的环境变量配置
 * @returns ModelConfig对象
 */
export function generateModelConfig(envConfig: ValidatedCustomModelEnvConfig): ModelConfig {
  // 输入配置已通过验证，直接使用（所有必需字段已确保存在）
  const modelName = generateCustomModelName(envConfig.suffix);

  return {
    name: modelName,
    baseURL: envConfig.baseURL,
    models: [envConfig.model],
    defaultModel: envConfig.model,
    apiKey: envConfig.apiKey,
    enabled: true,
    provider: 'custom',
    llmParams: {}
  };
}

/**
 * 生成所有动态自定义模型配置
 * @returns 动态模型配置映射
 */
export function generateDynamicModels(): Record<string, ModelConfig> {
  const dynamicModels: Record<string, ModelConfig> = {};

  try {
    // 获取已验证的自定义模型配置（scanCustomModelEnvVars已完成所有验证）
    const customModelConfigs = scanCustomModelEnvVars();

    Object.entries(customModelConfigs).forEach(([suffix, envConfig]) => {
      try {
        const modelKey = `custom_${suffix}`;

        // 检查是否与静态模型key冲突（动态获取静态模型键，避免硬编码）
        const staticModelKeys = getStaticModelKeys();
        if (staticModelKeys.includes(suffix)) {
          console.warn(`[generateDynamicModels] Suffix conflict: ${suffix} conflicts with static model, skipping`);
          return;
        }

        // 配置已通过验证，直接生成模型配置
        dynamicModels[modelKey] = generateModelConfig(envConfig);
        console.log(`[generateDynamicModels] Generated model: ${modelKey} (${dynamicModels[modelKey].name})`);
      } catch (error) {
        console.error(`[generateDynamicModels] Error generating model for ${suffix}:`, error);
        // 继续处理其他模型，不因单个模型错误而中断
      }
    });

    console.log(`[generateDynamicModels] Successfully generated ${Object.keys(dynamicModels).length} dynamic custom models`);
  } catch (error) {
    console.error('[generateDynamicModels] Error scanning custom model environment variables:', error);
  }

  return dynamicModels;
}
