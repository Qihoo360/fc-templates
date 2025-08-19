/**
 * 参数验证工具
 * 简化的参数验证，移除过度抽象
 */

export class ParameterValidator {

  /**
   * 验证提示词输入
   */
  static validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('提示词必须是非空字符串');
    }
    if (prompt.length > 50000) {
      throw new Error('提示词过长（最大 50,000 字符）');
    }
  }

  /**
   * 验证模板输入
   */
  static validateTemplate(template?: string): void {
    if (template !== undefined && (typeof template !== 'string' || template.trim().length === 0)) {
      throw new Error('模板必须是非空字符串');
    }
  }

  /**
   * 验证需求描述输入
   */
  static validateRequirements(requirements: string): void {
    if (!requirements || typeof requirements !== 'string' || requirements.trim().length === 0) {
      throw new Error('需求描述必须是非空字符串');
    }
    if (requirements.length > 10000) {
      throw new Error('需求描述过长（最大 10,000 字符）');
    }
  }
}
