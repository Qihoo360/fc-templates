import { describe, it, expect, beforeEach } from 'vitest';
import { 
  LLMService, 
  ModelManager, 
  ModelConfig, 
  APIError, 
  RequestConfigError,
  Message 
} from '../../../src/index';
import { createMockStorage } from '../../mocks/mockStorage';

describe('LLMService', () => {
  let service: LLMService;
  let modelManager: ModelManager;
  
  beforeEach(() => {
    const mockStorage = createMockStorage();
    modelManager = new ModelManager(mockStorage);
    service = new LLMService(modelManager);
  });

  const mockModelConfig: ModelConfig = {
    name: 'Test Model',
    baseURL: 'https://api.test.com',
    apiKey: 'test-key',
    models: ['model-1'],
    defaultModel: 'model-1',
    enabled: true,
    provider: 'openai'
  };

  const mockMessages: Message[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ];

  describe('validateModelConfig', () => {
    it('should throw error when model is disabled', () => {
      const disabledConfig = { ...mockModelConfig, enabled: false };
      expect(() => service['validateModelConfig'](disabledConfig))
        .toThrow('模型未启用');
    });

    it('should allow empty apiKey for services like Ollama', () => {
      const configWithEmptyApiKey = { ...mockModelConfig, apiKey: '' };
      expect(() => service['validateModelConfig'](configWithEmptyApiKey))
        .not.toThrow();
    });

    it('should throw error when provider is missing', () => {
      const invalidConfig = { ...mockModelConfig, provider: '' };
      expect(() => service['validateModelConfig'](invalidConfig))
        .toThrow('模型提供商不能为空');
    });

    it('should throw error when defaultModel is missing', () => {
      const invalidConfig = { ...mockModelConfig, defaultModel: '' };
      expect(() => service['validateModelConfig'](invalidConfig))
        .toThrow('默认模型不能为空');
    });
  });

  describe('validateMessages', () => {
    it('should validate valid messages', () => {
      expect(() => service['validateMessages'](mockMessages)).not.toThrow();
    });

    it('should throw error for empty messages', () => {
      expect(() => service['validateMessages']([]))
        .toThrow('消息列表不能为空');
    });

    it('should throw error for invalid role', () => {
      const invalidMessages: Message[] = [{ role: 'invalid' as any, content: 'test' }];
      expect(() => service['validateMessages'](invalidMessages))
        .toThrow('不支持的消息类型: invalid');
    });

    it('should throw error for missing content', () => {
      const invalidMessages: Message[] = [{ role: 'user', content: '' }];
      expect(() => service['validateMessages'](invalidMessages))
        .toThrow('消息格式无效: 缺少必要字段');
    });
  });
}); 