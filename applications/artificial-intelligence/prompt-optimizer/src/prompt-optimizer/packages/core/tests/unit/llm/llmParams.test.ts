import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createLLMService, ModelManager, LocalStorageProvider } from '../../../src/index.js';
import { validateLLMParams } from '../../../src/services/model/validation';
import type { ModelConfig } from '../../../src/services/model/types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
beforeAll(() => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
});

describe('LLM Parameters (llmParams) Functionality', () => {
  // Check for available API keys
  const openaiCompatibleKeys = [
    'OPENAI_API_KEY', 'VITE_OPENAI_API_KEY',
    'DEEPSEEK_API_KEY', 'VITE_DEEPSEEK_API_KEY', 
    'SILICONFLOW_API_KEY', 'VITE_SILICONFLOW_API_KEY',
    'ZHIPU_API_KEY', 'VITE_ZHIPU_API_KEY',
    'CUSTOM_API_KEY', 'VITE_CUSTOM_API_KEY'
  ];

  const geminiKeys = [
    'GEMINI_API_KEY', 'VITE_GEMINI_API_KEY'
  ];

  const hasOpenAICompatibleKey = openaiCompatibleKeys.some(key => 
    process.env[key] && process.env[key].trim()
  );

  const hasGeminiKey = geminiKeys.some(key => 
    process.env[key] && process.env[key].trim()
  );

  // Configuration interface
  interface ProviderConfig {
    key: string;
    apiKey: string;
    baseURL: string;
    defaultModel: string;
    provider: string;
  }

  // Get all available OpenAI compatible configurations
  const getAvailableOpenAICompatibleConfigs = (): ProviderConfig[] => {
    const configs: ProviderConfig[] = [];
    
    if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
      configs.push({
        key: 'openai',
        apiKey: (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY)!,
        baseURL: 'https://api.openai.com/v1',
        defaultModel: 'gpt-3.5-turbo',
        provider: 'openai'
      });
    }
    
    if (process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY) {
      configs.push({
        key: 'deepseek',
        apiKey: (process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY)!,
        baseURL: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        provider: 'deepseek'
      });
    }
    
    if (process.env.SILICONFLOW_API_KEY || process.env.VITE_SILICONFLOW_API_KEY) {
      configs.push({
        key: 'siliconflow',
        apiKey: (process.env.SILICONFLOW_API_KEY || process.env.VITE_SILICONFLOW_API_KEY)!,
        baseURL: 'https://api.siliconflow.cn/v1',
        defaultModel: 'Pro/deepseek-ai/DeepSeek-V3',
        provider: 'siliconflow'
      });
    }
    
    if (process.env.ZHIPU_API_KEY || process.env.VITE_ZHIPU_API_KEY) {
      configs.push({
        key: 'zhipu',
        apiKey: (process.env.ZHIPU_API_KEY || process.env.VITE_ZHIPU_API_KEY)!,
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        defaultModel: 'glm-4-flash',
        provider: 'zhipu'
      });
    }
    
    if (process.env.CUSTOM_API_KEY || process.env.VITE_CUSTOM_API_KEY) {
      configs.push({
        key: 'custom',
        apiKey: (process.env.CUSTOM_API_KEY || process.env.VITE_CUSTOM_API_KEY)!,
        baseURL: (process.env.CUSTOM_API_BASE_URL || process.env.VITE_CUSTOM_API_BASE_URL)!,
        defaultModel: (process.env.CUSTOM_API_MODEL || process.env.VITE_CUSTOM_API_MODEL)!,
        provider: 'custom'
      });
    }
    
    return configs;
  };

  // Get OpenAI compatible configuration (for backward compatibility)
  const getOpenAICompatibleConfig = () => {
    const configs = getAvailableOpenAICompatibleConfigs();
    return configs.length > 0 ? configs[0] : null;
  };

  // Get Gemini configuration
  const getGeminiConfig = () => {
    if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
      return {
        key: 'gemini',  // Use existing model key
        apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-2.0-flash',
        provider: 'gemini'
      };
    }
    return null;
  };

  describe('OpenAI Compatible Providers', () => {
    const openaiConfig = getOpenAICompatibleConfig();

    if (!hasOpenAICompatibleKey || !openaiConfig) {
      console.log('Skipping OpenAI Compatible tests: No API key available');
      it.skip('should handle llmParams for OpenAI compatible providers', () => {});
      return;
    }

    it('should use custom parameters from llmParams', async () => {
      const storage = new LocalStorageProvider();
      const modelManager = new ModelManager(storage);
      await modelManager.ensureInitialized();
      const llmService = createLLMService(modelManager);

      // Configure model with llmParams
      await modelManager.updateModel(openaiConfig.key, {
        name: 'Test OpenAI Compatible',
        apiKey: openaiConfig.apiKey,
        baseURL: openaiConfig.baseURL,
        defaultModel: openaiConfig.defaultModel,
        enabled: true,
        provider: openaiConfig.provider,
        models: [openaiConfig.defaultModel],
        llmParams: {
          temperature: 0.1, // Very low temperature for predictable output
          max_tokens: 50    // Short response
        }
      });

      const messages = [
        { role: 'user' as const, content: 'Say exactly: "Hello World"' }
      ];

      const response = await llmService.sendMessage(messages, openaiConfig.key);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      // With low temperature and specific instruction, response should be short and focused
      expect(response.length).toBeLessThan(200);
    }, 30000);

    it('should handle timeout parameter for OpenAI compatible providers', async () => {
      const storage = new LocalStorageProvider();
      const modelManager = new ModelManager(storage);
      await modelManager.ensureInitialized();
      const llmService = createLLMService(modelManager);

      // Configure model with custom timeout
      await modelManager.updateModel(openaiConfig.key, {
        name: 'Test OpenAI Compatible',
        apiKey: openaiConfig.apiKey,
        baseURL: openaiConfig.baseURL,
        defaultModel: openaiConfig.defaultModel,
        enabled: true,
        provider: openaiConfig.provider,
        models: [openaiConfig.defaultModel],
        llmParams: {
          timeout: 30000, // 30 seconds timeout
          temperature: 0.5
        }
      });

      const messages = [
        { role: 'user' as const, content: 'Hello' }
      ];

      const response = await llmService.sendMessage(messages, openaiConfig.key);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }, 35000);
  });

  describe('Gemini Provider', () => {
    const geminiConfig = getGeminiConfig();

    if (!hasGeminiKey || !geminiConfig) {
      console.log('Skipping Gemini tests: No GEMINI_API_KEY available');
      it.skip('should handle llmParams for Gemini provider', () => {});
      return;
    }

    it('should use Gemini-specific parameters from llmParams', async () => {
      const storage = new LocalStorageProvider();
      const modelManager = new ModelManager(storage);
      await modelManager.ensureInitialized();
      const llmService = createLLMService(modelManager);

      // Configure Gemini model with llmParams
      await modelManager.updateModel(geminiConfig.key, {
        name: 'Test Gemini',
        apiKey: geminiConfig.apiKey,
        baseURL: geminiConfig.baseURL,
        defaultModel: geminiConfig.defaultModel,
        enabled: true,
        provider: geminiConfig.provider,
        models: [geminiConfig.defaultModel],
        llmParams: {
          temperature: 0.2,
          maxOutputTokens: 100,
          topP: 0.8,
          topK: 20
        }
      });

      const messages = [
        { role: 'user' as const, content: 'Tell me a very short fact about AI' }
      ];

      const response = await llmService.sendMessage(messages, geminiConfig.key);
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
        // With maxOutputTokens=100, response should be relatively short
        expect(response.length).toBeLessThan(500);
    }, 30000);
  });

  describe('Parameter Validation', () => {
    it('should validate OpenAI parameters correctly', () => {
      const validParams = {
        temperature: 0.7,
        max_tokens: 2048,
        timeout: 60000
      };

      const result = validateLLMParams(validParams, 'openai');

      // Debug: print validation results if test fails
      if (!result.isValid) {
        console.log('OpenAI validation failed:', JSON.stringify(result, null, 2));
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid parameter types', () => {
      const invalidParams = {
        temperature: 'invalid', // should be number
        max_tokens: 2048.5 // should be integer
      };

      const result = validateLLMParams(invalidParams, 'openai');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should detect out-of-range parameter values', () => {
      const outOfRangeParams = {
        temperature: 3.0, // exceeds maximum 2.0
        presence_penalty: -3.0 // below minimum -2.0
      };

      const result = validateLLMParams(outOfRangeParams, 'openai');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should warn about unknown parameters', () => {
      const unknownParams = {
        temperature: 0.7,
        unknown_param: 'value'
      };

      const result = validateLLMParams(unknownParams, 'openai');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].parameterName).toBe('unknown_param');
    });

    it('should validate Gemini-specific parameters', () => {
      const geminiParams = {
        temperature: 0.8,
        maxOutputTokens: 2048,
        topK: 40,
        stopSequences: ['END', 'STOP']
      };

      const result = validateLLMParams(geminiParams, 'gemini');

      // Debug: print validation results if test fails
      if (!result.isValid) {
        console.log('Gemini validation failed:', JSON.stringify(result, null, 2));
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate stopSequences array correctly', () => {
      const invalidStopSequences = {
        stopSequences: 'should_be_array'
      };

      const result = validateLLMParams(invalidStopSequences, 'gemini');

      expect(result.isValid).toBe(false);
      expect(result.errors[0].parameterName).toBe('stopSequences');
    });

    it('should filter unsafe parameters in Gemini configuration', () => {
      // 这里我们测试的是参数验证，虽然buildGeminiGenerationConfig是私有方法
      // 但我们可以通过集成测试来验证它的行为
      const unsafeParams = {
        temperature: 0.8,
        maxOutputTokens: 2048,
        // 这些参数应该被警告或过滤
        dangerousParam: 'malicious_value',
        __proto__: 'attack',
        eval: 'dangerous_code'
      };

      const result = validateLLMParams(unsafeParams, 'gemini');

      // 验证不安全的参数被拒绝
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.parameterName === 'dangerousParam')).toBe(true);
    });
  });

  describe('Individual Parameter Tests', () => {
    const openaiCompatibleConfigs = getAvailableOpenAICompatibleConfigs();
    const geminiConfig = getGeminiConfig();

    // Temperature parameter tests
    describe('Temperature Parameter', () => {
      // Test for all OpenAI compatible providers
      openaiCompatibleConfigs.forEach((config) => {
        it(`should accept valid temperature for ${config.provider} provider`, async () => {
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(config.key, {
            name: `Test ${config.provider} Temperature`,
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            defaultModel: config.defaultModel,
            enabled: true,
            provider: config.provider,
            models: [config.defaultModel],
            llmParams: {
              temperature: 0.3
            }
          });

          const messages = [{ role: 'user' as const, content: 'Hello' }];

          const response = await llmService.sendMessage(messages, config.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        }, 30000);
      });
    });

    // Top P parameter tests
    describe('Top P Parameter', () => {
      // Test for all OpenAI compatible providers
      openaiCompatibleConfigs.forEach((config) => {
        it(`should accept valid top_p for ${config.provider} provider`, async () => {
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(config.key, {
            name: `Test ${config.provider} Top P`,
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            defaultModel: config.defaultModel,
            enabled: true,
            provider: config.provider,
            models: [config.defaultModel],
            llmParams: {
              top_p: 0.9
            }
          });

          const messages = [{ role: 'user' as const, content: 'Hello' }];

          const response = await llmService.sendMessage(messages, config.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        }, 30000);
      });
    });

    // Max Tokens parameter tests (OpenAI compatible)
    describe('Max Tokens Parameter', () => {
      // Test for all OpenAI compatible providers
      openaiCompatibleConfigs.forEach((config) => {
        it(`should accept valid max_tokens for ${config.provider} provider`, async () => {
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(config.key, {
            name: `Test ${config.provider} Max Tokens`,
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            defaultModel: config.defaultModel,
            enabled: true,
            provider: config.provider,
            models: [config.defaultModel],
            llmParams: {
              max_tokens: 100
            }
          });

          const messages = [{ role: 'user' as const, content: 'Tell me a short fact' }];

          const response = await llmService.sendMessage(messages, config.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        }, 30000);
      });
    });

    // Frequency Penalty parameter tests
    describe('Frequency Penalty Parameter', () => {
      // Test for all OpenAI compatible providers
      openaiCompatibleConfigs.forEach((config) => {
        it(`should accept valid frequency_penalty for ${config.provider} provider`, async () => {
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(config.key, {
            name: `Test ${config.provider} Frequency Penalty`,
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            defaultModel: config.defaultModel,
            enabled: true,
            provider: config.provider,
            models: [config.defaultModel],
            llmParams: {
              frequency_penalty: 0.3
            }
          });

          const messages = [{ role: 'user' as const, content: 'Hello' }];

          const response = await llmService.sendMessage(messages, config.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        }, 60000);
      });
    });

    // Gemini specific parameters
    describe('Gemini Specific Parameters', () => {
      beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 等待 10 秒
      });

      if (hasGeminiKey && geminiConfig) {
        it('should accept valid maxOutputTokens for Gemini provider', async () => {
          // 添加间隔，避免频率限制，先等10秒
          await new Promise(resolve => setTimeout(resolve, 10000)); 
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(geminiConfig.key, {
            name: 'Test Gemini Max Output Tokens',
            apiKey: geminiConfig.apiKey,
            baseURL: geminiConfig.baseURL,
            defaultModel: geminiConfig.defaultModel,
            enabled: true,
            provider: geminiConfig.provider,
            models: [geminiConfig.defaultModel],
            llmParams: {
              maxOutputTokens: 200
            }
          });

          const messages = [{ role: 'user' as const, content: 'Tell me about AI' }];

          const response = await llmService.sendMessage(messages, geminiConfig.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        }, 60000);
        it('should accept valid candidateCount for Gemini provider', async () => {
          // 添加间隔，避免频率限制，先等10秒
          await new Promise(resolve => setTimeout(resolve, 10000)); 
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(geminiConfig.key, {
            name: 'Test Gemini Candidate Count',
            apiKey: geminiConfig.apiKey,
            baseURL: geminiConfig.baseURL,
            defaultModel: geminiConfig.defaultModel,
            enabled: true,
            provider: geminiConfig.provider,
            models: [geminiConfig.defaultModel],
            llmParams: {
              candidateCount: 1
            }
          });

          const messages = [{ role: 'user' as const, content: 'Hello' }];

          const response = await llmService.sendMessage(messages, geminiConfig.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        }, 60000);
      } else {
        it('should skip Gemini tests when API key is not available', () => {
          expect(true).toBe(true); // 占位测试，确保套件不为空
        });
      }
    });

    // Combined parameters tests
    describe('Combined Parameters', () => {
      // Test for all OpenAI compatible providers
      openaiCompatibleConfigs.forEach((config) => {
        it(`should handle multiple parameters for ${config.provider} provider`, async () => {
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(config.key, {
            name: `Test ${config.provider} Combined`,
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            defaultModel: config.defaultModel,
            enabled: true,
            provider: config.provider,
            models: [config.defaultModel],
            llmParams: {
              temperature: 0.6,
              max_tokens: 50, // 减少token数量以加快响应
              top_p: 0.9,
              presence_penalty: 0.2,
              frequency_penalty: 0.1,
              timeout: 20000 // 减少超时时间
            }
          });

          const messages = [{ role: 'user' as const, content: 'Say hello' }]; // 简化请求

          const response = await llmService.sendMessage(messages, config.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        }, 45000); // 增加测试超时时间
      });
    });
  });

  describe('Edge Cases', () => {
    const openaiCompatibleConfigs = getAvailableOpenAICompatibleConfigs();
    
    it('should handle missing llmParams gracefully', () => {
      const result = validateLLMParams(undefined, 'openai');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle empty llmParams object', () => {
      const result = validateLLMParams({}, 'openai');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    // Test that no default values are set when parameters are not provided
    describe('No Default Values', () => {
      // Test for all OpenAI compatible providers
      openaiCompatibleConfigs.forEach((config) => {
        it(`should not set default values when not provided for ${config.provider}`, async () => {
          const storage = new LocalStorageProvider();
          const modelManager = new ModelManager(storage);
          await modelManager.ensureInitialized();
          const llmService = createLLMService(modelManager);

          await modelManager.updateModel(config.key, {
            name: `Test ${config.provider} No Defaults`,
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            defaultModel: config.defaultModel,
            enabled: true,
            provider: config.provider,
            models: [config.defaultModel],
            // No llmParams provided - testing parameter transparency
          });

          const messages = [{ role: 'user' as const, content: 'Hello' }];

          const response = await llmService.sendMessage(messages, config.key);
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
            // Should work fine without any default values being set
        }, 30000);
      });
    });
  });
}); 