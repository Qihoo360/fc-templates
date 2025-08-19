import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelManager, createModelManager } from '../../../src/services/model/manager';
import { IStorageProvider } from '../../../src/services/storage/types';
import { ModelConfig } from '../../../src/services/model/types';
import { ModelConfigError } from '../../../src/services/llm/errors';
import { defaultModels } from '../../../src/services/model/defaults';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';

// Helper to create a deep copy of defaultModels for isolated tests
const getCleanDefaultModels = () => JSON.parse(JSON.stringify(defaultModels));

describe('ModelManager', () => {
  let modelManager: ModelManager;
  let storageProvider: IStorageProvider;

  const createModelConfig = (name: string, enabled = true, apiKey = 'test_api_key', models = ['model1', 'model2'], defaultModel = 'model1', provider = 'custom'): ModelConfig => ({
    name,
    baseURL: `http://localhost/${name}/v1`,
    models,
    defaultModel,
    apiKey,
    enabled,
    provider,
  });

  beforeEach(async () => {
    // 为每个测试创建一个新的、干净的内存存储实例
    storageProvider = new MemoryStorageProvider();
    // 清理存储状态
    await storageProvider.clearAll();
    // 使用工厂函数创建 ModelManager 实例
    modelManager = createModelManager(storageProvider);
    // 确保在每个测试运行前，ModelManager 都已完全初始化
    await modelManager.ensureInitialized();
  });

  afterEach(async () => {
    // 清理存储状态
    await storageProvider.clearAll();
  });

  describe('addModel', () => {
    it('should add a new model and save', async () => {
      const newModel = createModelConfig('NewModel');
      await modelManager.addModel('newKey', newModel);
      
      const allModels = await modelManager.getAllModels();
      const addedModel = allModels.find(m => m.key === 'newKey');
      expect(addedModel).toBeDefined();
      expect(addedModel?.name).toBe('NewModel');
    });

    it('should throw ModelConfigError when adding a model with an existing key', async () => {
      const existingModel = createModelConfig('ExistingModel');
      await modelManager.addModel('existingKey', existingModel);
      
      await expect(modelManager.addModel('existingKey', createModelConfig('DuplicateKey')))
        .rejects.toThrow(ModelConfigError);
    });

    it('should throw ModelConfigError when adding a model with invalid config', async () => {
      const invalidModel = { ...createModelConfig('Invalid'), name: '' };
      
      await expect(modelManager.addModel('invalidKey', invalidModel as ModelConfig))
        .rejects.toThrow(ModelConfigError);
    });
  });
  
  describe('getAllModels', () => {
    it('should return all models including their keys', async () => {
      const model = createModelConfig('TestModel');
      await modelManager.addModel('testKey', model);
      
      const result = await modelManager.getAllModels();
      expect(result.some(m => m.key === 'testKey')).toBe(true);
    });

    it('should return default models after initialization', async () => {
      const result = await modelManager.getAllModels();
      // 检查是否包含默认模型
      expect(result.length).toBeGreaterThan(0);
      
      // 检查是否包含一个已知的默认模型
      const defaultKeys = Object.keys(defaultModels);
      if (defaultKeys.length > 0) {
        const firstDefaultKey = defaultKeys[0];
        expect(result.some(m => m.key === firstDefaultKey)).toBe(true);
      }
    });
  });

  describe('getModel', () => {
    it('should retrieve an existing model by key', async () => {
      const model = createModelConfig('MyModel');
      await modelManager.addModel('myKey', model);
      
      const result = await modelManager.getModel('myKey');
      expect(result).toEqual(model);
    });

    it('should return undefined for a non-existent model key', async () => {
      const result = await modelManager.getModel('nonExistentKey');
      expect(result).toBeUndefined();
    });
  });

  describe('updateModel', () => {
    it('should update an existing model and save', async () => {
      const originalModel = createModelConfig('OriginalName');
      await modelManager.addModel('updateKey', originalModel);
      
      const updates: Partial<ModelConfig> = { 
        name: 'UpdatedName', 
        apiKey: 'new_api_key' 
      };
      
      await modelManager.updateModel('updateKey', updates);
      
      const updatedModel = await modelManager.getModel('updateKey');
      expect(updatedModel?.name).toBe('UpdatedName');
      expect(updatedModel?.apiKey).toBe('new_api_key');
    });

    it('should throw ModelConfigError when updating a non-existent model', async () => {
      await expect(modelManager.updateModel('nonExistentKey', { name: 'NewName' }))
        .rejects.toThrow(ModelConfigError);
    });
  });

  describe('deleteModel', () => {
    it('should delete an existing model', async () => {
      const model = createModelConfig('DeleteMe');
      await modelManager.addModel('deleteKey', model);
      
      await modelManager.deleteModel('deleteKey');
      
      const modelAfterDelete = await modelManager.getModel('deleteKey');
      expect(modelAfterDelete).toBeUndefined();
    });

    it('should not fail when deleting a non-existent model', async () => {
      await expect(modelManager.deleteModel('nonExistentKey'))
        .rejects.toThrow(ModelConfigError);
    });
  });

  describe('enableModel & disableModel', () => {
    it('should enable a disabled model', async () => {
      const disabledModel = createModelConfig('DisabledModel', false);
      await modelManager.addModel('disabledKey', disabledModel);
      
      await modelManager.enableModel('disabledKey');
      
      const model = await modelManager.getModel('disabledKey');
      expect(model?.enabled).toBe(true);
    });

    it('should disable an enabled model', async () => {
      const enabledModel = createModelConfig('EnabledModel', true);
      await modelManager.addModel('enabledKey', enabledModel);
      
      await modelManager.disableModel('enabledKey');
      
      const model = await modelManager.getModel('enabledKey');
      expect(model?.enabled).toBe(false);
    });
  });

  describe('getEnabledModels', () => {
    it('should return only enabled models', async () => {
      // The beforeEach hook now provides a clean, initialized modelManager for each test.
      const enabledModel1 = createModelConfig('EnabledModel1', true);
      const enabledModel2 = createModelConfig('EnabledModel2', true);
      const disabledModel = createModelConfig('DisabledModel', false);

      // Add models to the manager instance for this test
      await modelManager.addModel('test-enabled-1', enabledModel1);
      await modelManager.addModel('test-enabled-2', enabledModel2);
      await modelManager.addModel('test-disabled', disabledModel);

      const enabledModels = await modelManager.getEnabledModels();
      
      // Default models might also be enabled, so we check for at least 2
      expect(enabledModels.length).toBeGreaterThanOrEqual(2);
      
      // Verify our specific enabled models are present
      const enabledModel1Found = enabledModels.find(m => m.key === 'test-enabled-1');
      const enabledModel2Found = enabledModels.find(m => m.key === 'test-enabled-2');
      expect(enabledModel1Found).toBeDefined();
      expect(enabledModel1Found?.name).toBe('EnabledModel1');
      expect(enabledModel2Found).toBeDefined();
      
      // Verify our specific disabled model is not present
      const disabledModelInResults = enabledModels.find(m => m.key === 'test-disabled');
      expect(disabledModelInResults).toBeUndefined();
    });
  });

  describe('llmParams deep copy', () => {
    it('should deep copy llmParams to avoid reference sharing when adding models', async () => {
      const originalLlmParams = {
        temperature: 0.7,
        max_tokens: 4096
      };
      
      const modelConfig = createModelConfig('TestModel', true, 'test_key', ['model1'], 'model1', 'openai');
      modelConfig.llmParams = originalLlmParams;

      await modelManager.addModel('test-model', modelConfig);
      
      // Modify the original llmParams
      originalLlmParams.temperature = 0.9;
      originalLlmParams.max_tokens = 2048;
      
      // Get the stored model and verify it wasn't affected
      const storedModel = await modelManager.getModel('test-model');
      expect(storedModel?.llmParams?.temperature).toBe(0.7);
      expect(storedModel?.llmParams?.max_tokens).toBe(4096);
    });

    it('should deep copy llmParams when updating models', async () => {
      const initialModel = createModelConfig('TestModel', true);
      await modelManager.addModel('test-model', initialModel);

      const updateLlmParams = {
        temperature: 0.5,
        top_p: 0.9
      };

      await modelManager.updateModel('test-model', {
        llmParams: updateLlmParams
      });

      // Modify the original update params
      updateLlmParams.temperature = 1.0;
      updateLlmParams.top_p = 0.5;

      // Get the stored model and verify it wasn't affected
      const storedModel = await modelManager.getModel('test-model');
      expect(storedModel?.llmParams?.temperature).toBe(0.5);
      expect(storedModel?.llmParams?.top_p).toBe(0.9);
    });

    it('should handle undefined llmParams gracefully', async () => {
      const modelConfig = createModelConfig('TestModel', true);
      // Explicitly set llmParams to undefined
      modelConfig.llmParams = undefined;

      await modelManager.addModel('test-model', modelConfig);
      
      const storedModel = await modelManager.getModel('test-model');
      expect(storedModel?.llmParams).toBeUndefined();
    });
  });

  describe('llmParams security validation', () => {
    it('should reject dangerous parameters when adding models', async () => {
      const modelWithDangerousParams = createModelConfig('DangerousModel', true, 'test_key', ['model1'], 'model1', 'openai');
      modelWithDangerousParams.llmParams = {
        temperature: 0.7,
        __proto__: { malicious: 'code' }, // Dangerous parameter
        constructor: function() { return 'hack'; } // Another dangerous parameter
      };

      await expect(modelManager.addModel('dangerous-model', modelWithDangerousParams))
        .rejects.toThrow(ModelConfigError);
    });

    it('should reject invalid parameter types when adding models', async () => {
      const modelWithInvalidTypes = createModelConfig('InvalidModel', true, 'test_key', ['model1'], 'model1', 'openai');
      modelWithInvalidTypes.llmParams = {
        temperature: 'invalid_string', // Should be number
        max_tokens: 1024.5 // Should be integer
      };

      await expect(modelManager.addModel('invalid-model', modelWithInvalidTypes))
        .rejects.toThrow(ModelConfigError);
    });

    it('should reject out-of-range parameters when adding models', async () => {
      const modelWithOutOfRangeParams = createModelConfig('OutOfRangeModel', true, 'test_key', ['model1'], 'model1', 'openai');
      modelWithOutOfRangeParams.llmParams = {
        temperature: 5.0, // Exceeds maximum 2.0
        presence_penalty: -3.0 // Below minimum -2.0
      };

      await expect(modelManager.addModel('out-of-range-model', modelWithOutOfRangeParams))
        .rejects.toThrow(ModelConfigError);
    });

    it('should accept valid parameters when adding models', async () => {
      const modelWithValidParams = createModelConfig('ValidModel', true, 'test_key', ['model1'], 'model1', 'openai');
      modelWithValidParams.llmParams = {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      };

      await expect(modelManager.addModel('valid-model', modelWithValidParams))
        .resolves.not.toThrow();
      
      const storedModel = await modelManager.getModel('valid-model');
      expect(storedModel?.llmParams).toEqual(modelWithValidParams.llmParams);
    });

    it('should validate llmParams when updating models', async () => {
      const initialModel = createModelConfig('TestModel', true, 'test_key', ['model1'], 'model1', 'openai');
      await modelManager.addModel('test-model', initialModel);

      // Try to update with dangerous parameters
      await expect(modelManager.updateModel('test-model', {
        llmParams: {
          temperature: 0.5,
          eval: 'malicious_code()' // Dangerous parameter
        }
      })).rejects.toThrow(ModelConfigError);
    });

    it('should validate provider-specific parameters', async () => {
      const geminiModel = createModelConfig('GeminiModel', true, 'test_key', ['gemini-pro'], 'gemini-pro', 'gemini');
      geminiModel.llmParams = {
        temperature: 0.8,
        maxOutputTokens: 2048,
        topK: 40,
        topP: 0.9,
        stopSequences: ['END', 'STOP']
      };

      await expect(modelManager.addModel('gemini-model', geminiModel))
        .resolves.not.toThrow();
      
      const storedModel = await modelManager.getModel('gemini-model');
      expect(storedModel?.llmParams).toEqual(geminiModel.llmParams);
    });
  });
});
