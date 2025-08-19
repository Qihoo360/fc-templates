import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelManager } from '../../../src/services/model/manager';
import { ModelConfig } from '../../../src/services/model/types';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';

describe('ModelManager Import/Export', () => {
  let modelManager: ModelManager;
  let storageProvider: MemoryStorageProvider;

  beforeEach(async () => {
    storageProvider = new MemoryStorageProvider();
    modelManager = new ModelManager(storageProvider);
    await modelManager.ensureInitialized();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('exportData', () => {
    it('should export all models', async () => {
      // 添加一些测试模型
      const testModel: ModelConfig = {
        name: 'Test Model',
        baseURL: 'https://api.test.com/v1',
        models: ['test-model-1', 'test-model-2'],
        defaultModel: 'test-model-1',
        provider: 'test-provider',
        enabled: true,
        apiKey: 'test-key'
      };

      await modelManager.addModel('test-model', testModel);

      // 导出数据
      const exportedData = await modelManager.exportData();

      // 验证导出的数据
      expect(Array.isArray(exportedData)).toBe(true);
      expect(exportedData.length).toBeGreaterThan(0);

      // 查找我们添加的测试模型
      const exportedTestModel = exportedData.find(model => model.key === 'test-model');
      expect(exportedTestModel).toBeDefined();
      expect(exportedTestModel?.name).toBe('Test Model');
      expect(exportedTestModel?.enabled).toBe(true);
    });

    it('should include built-in models in export', async () => {
      const exportedData = await modelManager.exportData();
      
      // 应该包含内置模型
      const builtinModels = exportedData.filter(model => 
        ['openai', 'anthropic', 'google', 'ollama'].includes(model.key)
      );
      expect(builtinModels.length).toBeGreaterThan(0);
    });

    it('should handle export error gracefully', async () => {
      // 模拟存储错误
      vi.spyOn(modelManager, 'getAllModels').mockRejectedValue(new Error('Storage error'));

      await expect(modelManager.exportData()).rejects.toThrow('Failed to export model data');
    });
  });

  describe('importData', () => {
    it('should import new models', async () => {
      const importData = [
        {
          key: 'new-model-1',
          name: 'New Model 1',
          baseURL: 'https://api.new1.com/v1',
          models: ['new-1'],
          defaultModel: 'new-1',
          provider: 'new-provider',
          enabled: true
        },
        {
          key: 'new-model-2',
          name: 'New Model 2',
          baseURL: 'https://api.new2.com/v1',
          models: ['new-2'],
          defaultModel: 'new-2',
          provider: 'new-provider',
          enabled: false
        }
      ];

      await modelManager.importData(importData);

      // 验证模型已被导入
      const model1 = await modelManager.getModel('new-model-1');
      expect(model1).toBeDefined();
      expect(model1?.name).toBe('New Model 1');
      expect(model1?.enabled).toBe(true);

      const model2 = await modelManager.getModel('new-model-2');
      expect(model2).toBeDefined();
      expect(model2?.name).toBe('New Model 2');
      expect(model2?.enabled).toBe(false);
    });

    it('should update existing models', async () => {
      // 先添加一个模型
      const originalModel: ModelConfig = {
        name: 'Original Model',
        baseURL: 'https://api.original.com/v1',
        models: ['original'],
        defaultModel: 'original',
        provider: 'original-provider',
        enabled: false
      };
      await modelManager.addModel('existing-model', originalModel);

      // 导入更新的模型配置
      const importData = [
        {
          key: 'existing-model',
          name: 'Updated Model',
          baseURL: 'https://api.updated.com/v1',
          models: ['updated'],
          defaultModel: 'updated',
          provider: 'updated-provider',
          enabled: true, // 更新启用状态
          apiKey: 'new-api-key'
        }
      ];

      await modelManager.importData(importData);

      // 验证模型已被更新
      const updatedModel = await modelManager.getModel('existing-model');
      expect(updatedModel).toBeDefined();
      expect(updatedModel?.name).toBe('Updated Model');
      expect(updatedModel?.enabled).toBe(true); // 应该使用导入的启用状态
      expect(updatedModel?.apiKey).toBe('new-api-key');
    });

    it('should prioritize imported enabled status', async () => {
      // 测试启用状态的优先级处理
      const importData = [
        {
          key: 'openai', // 内置模型
          name: 'OpenAI',
          baseURL: 'https://api.openai.com/v1',
          models: ['gpt-4', 'gpt-3.5-turbo'],
          defaultModel: 'gpt-4',
          provider: 'openai',
          enabled: false // 导入时设置为禁用
        }
      ];

      await modelManager.importData(importData);

      const openaiModel = await modelManager.getModel('openai');
      expect(openaiModel?.enabled).toBe(false); // 应该使用导入的状态
    });

    it('should skip invalid models', async () => {
      const importData = [
        {
          // 缺少key字段
          name: 'Invalid Model',
          baseURL: 'https://api.invalid.com/v1',
          models: ['invalid'],
          defaultModel: 'invalid',
          provider: 'invalid',
          enabled: true
        },
        {
          key: 'valid-model',
          name: 'Valid Model',
          baseURL: 'https://api.valid.com/v1',
          models: ['valid'],
          defaultModel: 'valid',
          provider: 'valid',
          enabled: true
        }
      ];

      // 应该不抛出错误，只是跳过无效模型
      await expect(modelManager.importData(importData)).resolves.not.toThrow();

      // 验证有效模型被导入
      const validModel = await modelManager.getModel('valid-model');
      expect(validModel).toBeDefined();
    });

    it('should handle import errors gracefully', async () => {
      const importData = [
        {
          key: 'error-model',
          name: 'Error Model',
          baseURL: 'https://api.error.com/v1',
          models: ['error'],
          defaultModel: 'error',
          provider: 'error',
          enabled: true
        }
      ];

      // 模拟addModel错误
      vi.spyOn(modelManager, 'addModel').mockRejectedValue(new Error('Add model error'));

      // 应该不抛出错误，只是记录失败
      await expect(modelManager.importData(importData)).resolves.not.toThrow();
    });
  });

  describe('validateData', () => {
    it('should validate correct model data', async () => {
      const validData = [
        {
          key: 'test-model',
          name: 'Test Model',
          baseURL: 'https://api.test.com/v1',
          models: ['test'],
          defaultModel: 'test',
          provider: 'test',
          enabled: true
        }
      ];

      expect(await modelManager.validateData(validData)).toBe(true);
    });

    it('should reject invalid data formats', async () => {
      // 非数组
      expect(await modelManager.validateData({})).toBe(false);
      expect(await modelManager.validateData('string')).toBe(false);
      expect(await modelManager.validateData(null)).toBe(false);

      // 缺少必需字段
      expect(await modelManager.validateData([
        {
          name: 'Test Model',
          // 缺少key
          baseURL: 'https://api.test.com/v1',
          models: ['test'],
          defaultModel: 'test',
          provider: 'test',
          enabled: true
        }
      ])).toBe(false);

      // 字段类型错误
      expect(await modelManager.validateData([
        {
          key: 'test-model',
          name: 123, // 应该是字符串
          baseURL: 'https://api.test.com/v1',
          models: ['test'],
          defaultModel: 'test',
          provider: 'test',
          enabled: true
        }
      ])).toBe(false);
    });
  });

  describe('getDataType', () => {
    it('should return correct data type', async () => {
      expect(await modelManager.getDataType()).toBe('models');
    });
  });
});
