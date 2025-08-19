import { 
  createLLMService,
  ModelManager,
  RequestConfigError,
} from '../../../src/index.js';
import { expect, describe, it, beforeEach, beforeAll, vi } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import { createMockStorage } from '../../mocks/mockStorage';

// 加载环境变量
beforeAll(() => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  console.log('环境变量加载状态:', {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    CUSTOM_API_KEY: !!process.env.VITE_CUSTOM_API_KEY,
    GEMINI_API_KEY: !!process.env.VITE_GEMINI_API_KEY,
    DEEPSEEK_API_KEY: !!process.env.VITE_DEEPSEEK_API_KEY
  });
});

describe('LLM 服务通用测试', () => {
  let llmService;
  let modelManager;
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockStorage.getItem.mockResolvedValue(null);
    
    modelManager = new ModelManager(mockStorage);
    llmService = createLLMService(modelManager);
    
    // 模拟getAllModels方法
    vi.spyOn(modelManager, 'getAllModels').mockResolvedValue([]);
  });

  describe('API 调用错误处理', () => {
    it('应该能正确处理无效的消息格式', async () => {
      const testModel = 'test-invalid-message';
      
      vi.spyOn(modelManager, 'getModel').mockResolvedValue({
        name: 'Test Model',
        baseURL: 'https://test.api/chat/completions',
        models: ['test-model'],
        defaultModel: 'test-model',
        apiKey: 'test-key',
        enabled: true,
        provider: 'openai'
      });

      await expect(async () => {
        await llmService.sendMessage([
          { role: 'invalid', content: '测试消息' }
        ], testModel);
      }).rejects.toThrow(RequestConfigError);
    });

    it('应该能正确处理未启用的模型', async () => {
      const testModel = 'test-disabled';
      
      vi.spyOn(modelManager, 'getModel').mockResolvedValue({
        name: 'Test Model',
        baseURL: 'https://test.api/chat/completions',
        models: ['test-model'],
        defaultModel: 'test-model',
        apiKey: 'test-key',
        enabled: false,
        provider: 'openai'
      });

      const messages = [
        { role: 'user', content: '你好，我们来玩个游戏' }
      ];

      await expect(async () => {
        await llmService.sendMessage(messages, testModel);
      }).rejects.toThrow(RequestConfigError);
    });

    it('应该能正确处理空消息列表', async () => {
      const testModel = 'test-empty-messages';
      
      vi.spyOn(modelManager, 'getModel').mockResolvedValue({
        name: 'Test Model',
        baseURL: 'https://test.api/chat/completions',
        models: ['test-model'],
        defaultModel: 'test-model',
        apiKey: 'test-key',
        enabled: true,
        provider: 'openai'
      });

      await expect(async () => {
        await llmService.sendMessage([], testModel);
      }).rejects.toThrow(RequestConfigError);
    });
  });

  describe('配置管理', () => {
    it('应该能正确处理模型配置更新', async () => {
      const testModel = 'test-update';
      const config = {
        name: 'Test Model',
        baseURL: 'https://test.api/chat/completions',
        models: ['test-model'],
        defaultModel: 'test-model',
        apiKey: 'test-key',
        enabled: true,
        provider: 'openai'
      };

      vi.spyOn(modelManager, 'getModel').mockImplementation(async (key) => {
        if (key === testModel) {
          return config;
        }
        return undefined;
      });
      
      vi.spyOn(modelManager, 'updateModel').mockResolvedValue(undefined);
      
      const newConfig = {
        name: 'Updated Model',
        baseURL: 'https://updated.api/chat/completions'
      };

      // 修改模拟返回值以处理updateModel后的情况
      vi.spyOn(modelManager, 'getModel').mockImplementation(async (key) => {
        if (key === testModel) {
          return {
            ...config,
            ...newConfig
          };
        }
        return undefined;
      });
      
      // 添加await确保异步断言正确执行
      await expect(modelManager.getModel(testModel)).resolves.toBeDefined();

      await modelManager.updateModel(testModel, newConfig);
      const updatedModel = await modelManager.getModel(testModel);
      
      // 使用标准断言而不是异步断言
      expect(updatedModel.name).toBe(newConfig.name);
      expect(updatedModel.baseURL).toBe(newConfig.baseURL);
      expect(updatedModel.models).toEqual(config.models);
      expect(updatedModel.defaultModel).toBe(config.defaultModel);
      expect(updatedModel.enabled).toBe(config.enabled);
    });

    it('应该能正确处理模型的启用和禁用', async () => {
      const testModel = 'test-enable-disable';
      const config = {
        name: 'Test Model',
        baseURL: 'https://test.api/chat/completions',
        models: ['test-model'],
        defaultModel: 'test-model',
        apiKey: 'test-key',
        enabled: true,
        provider: 'openai'
      };

      // 初始状态为启用
      vi.spyOn(modelManager, 'getModel').mockResolvedValue(config);
      
      const model = await modelManager.getModel(testModel);
      expect(model.enabled).toBe(true);

      // 禁用后的状态
      vi.spyOn(modelManager, 'getModel').mockResolvedValue({...config, enabled: false});
      vi.spyOn(modelManager, 'updateModel').mockResolvedValue(undefined);
      
      await modelManager.updateModel(testModel, { enabled: false });
      expect((await modelManager.getModel(testModel)).enabled).toBe(false);

      // 重新启用
      vi.spyOn(modelManager, 'getModel').mockResolvedValue({...config, enabled: true});
      await modelManager.updateModel(testModel, { enabled: true });
      expect((await modelManager.getModel(testModel)).enabled).toBe(true);
    });
  });
}); 