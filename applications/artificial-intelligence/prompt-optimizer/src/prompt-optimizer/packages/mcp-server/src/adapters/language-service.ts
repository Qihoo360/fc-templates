/**
 * 语言服务适配器
 *
 * 提供简单的语言偏好管理，通过环境变量配置
 */

import { BuiltinTemplateLanguage, ITemplateLanguageService } from '@prompt-optimizer/core';

export class SimpleLanguageService implements ITemplateLanguageService {
  private currentLanguage: BuiltinTemplateLanguage;
  private initialized = false;

  constructor(defaultLanguage: string = 'zh-CN') {
    // 映射语言代码到 Core 模块支持的格式
    const languageMap: Record<string, BuiltinTemplateLanguage> = {
      'zh': 'zh-CN',
      'zh-CN': 'zh-CN',
      'chinese': 'zh-CN',
      'en': 'en-US',
      'en-US': 'en-US',
      'english': 'en-US'
    };

    this.currentLanguage = languageMap[defaultLanguage as keyof typeof languageMap] || 'zh-CN';
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async getCurrentLanguage(): Promise<BuiltinTemplateLanguage> {
    return this.currentLanguage;
  }

  async setLanguage(language: BuiltinTemplateLanguage): Promise<void> {
    if (!(await this.isValidLanguage(language))) {
      throw new Error(`Unsupported language: ${language}`);
    }
    this.currentLanguage = language;
  }

  async toggleLanguage(): Promise<BuiltinTemplateLanguage> {
    const newLanguage = this.currentLanguage === 'zh-CN' ? 'en-US' : 'zh-CN';
    await this.setLanguage(newLanguage);
    return newLanguage;
  }

  async isValidLanguage(language: string): Promise<boolean> {
    const supportedLanguages = await this.getSupportedLanguages();
    return supportedLanguages.includes(language as BuiltinTemplateLanguage);
  }

  async getSupportedLanguages(): Promise<BuiltinTemplateLanguage[]> {
    return ['zh-CN', 'en-US'];
  }

  getLanguageDisplayName(language: BuiltinTemplateLanguage): string {
    switch (language) {
      case 'zh-CN':
        return '中文';
      case 'en-US':
        return 'English';
      default:
        return language;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export function createSimpleLanguageService(defaultLanguage?: string): SimpleLanguageService {
  return new SimpleLanguageService(defaultLanguage || 'zh-CN');
}
