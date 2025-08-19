/**
 * MCP 服务器模板配置
 * 完全复用 core 包的内置模板系统
 */

import { TemplateManager } from '@prompt-optimizer/core';

/**
 * 获取默认模板 ID
 * 动态从 core 的模板管理器中获取指定类型的第一个模板
 */
export async function getDefaultTemplateId(
  templateManager: TemplateManager,
  optimizationMode: 'user' | 'system' | 'iterate'
): Promise<string> {
  // 映射优化模式到模板类型
  const templateTypeMap = {
    'user': 'userOptimize' as const,
    'system': 'optimize' as const,
    'iterate': 'iterate' as const
  };

  const templateType = templateTypeMap[optimizationMode];
  if (!templateType) {
    throw new Error(`Unknown optimization mode: ${optimizationMode}`);
  }

  // 从 core 获取指定类型的模板列表
  const templates = await templateManager.listTemplatesByType(templateType);

  if (templates.length === 0) {
    throw new Error(`No templates found for type: ${templateType}`);
  }

  // 返回第一个模板的 ID（内置模板会排在前面）
  return templates[0].id;
}

/**
 * 获取指定类型的所有可用模板选项
 * 直接使用 core 包的 TemplateManager，无需过滤
 */
export async function getTemplateOptions(
  templateManager: TemplateManager,
  templateType: 'optimize' | 'userOptimize' | 'iterate'
): Promise<Array<{value: string, label: string, description?: string}>> {
  try {
    // 直接使用 core 的模板管理器获取模板
    const templates = await templateManager.listTemplatesByType(templateType);

    // 将模板转换为选项格式
    const options = templates.map(template => ({
      value: template.id,
      label: template.name,
      description: template.metadata.description || (template.isBuiltin ? '内置模板' : '用户模板')
    }));

    return options;
  } catch (error) {
    console.error(`Failed to get template options for ${templateType}:`, error);
    return [];
  }
}
