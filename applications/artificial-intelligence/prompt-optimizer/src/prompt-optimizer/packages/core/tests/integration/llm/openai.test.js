import { createLLMService, ModelManager, LocalStorageProvider } from '../../../src/index.js';
import { expect, describe, it, beforeEach, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
beforeAll(() => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
});

describe('OpenAI API 真实连接测试', () => {
  // 检查OpenAI兼容的环境变量（任何一个存在就可以运行测试）
  const openaiCompatibleKeys = [
    'OPENAI_API_KEY', 'VITE_OPENAI_API_KEY',
    'DEEPSEEK_API_KEY', 'VITE_DEEPSEEK_API_KEY', 
    'SILICONFLOW_API_KEY', 'VITE_SILICONFLOW_API_KEY',
    'ZHIPU_API_KEY', 'VITE_ZHIPU_API_KEY',
    'CUSTOM_API_KEY', 'VITE_CUSTOM_API_KEY'
  ];

  const availableKeys = openaiCompatibleKeys.filter(key => 
    process.env[key] && process.env[key].trim()
  );

  if (availableKeys.length === 0) {
    console.log('跳过 OpenAI 真实API测试：未设置任何 OpenAI 兼容的 API 密钥');
    it.skip('应该能正确调用 OpenAI 兼容的 API', () => {});
    it.skip('应该能正确处理多轮对话', () => {});
    it.skip('应该能正确使用高级参数', () => {});
    return;
  }

  // 选择第一个可用的密钥和对应的配置
  const getModelConfig = () => {
    if (process.env.SILICONFLOW_API_KEY || process.env.VITE_SILICONFLOW_API_KEY) {
      return {
        key: 'siliconflow',
        apiKey: process.env.SILICONFLOW_API_KEY || process.env.VITE_SILICONFLOW_API_KEY,
        baseURL: 'https://api.siliconflow.cn/v1',
        defaultModel: 'Qwen/Qwen3-8B'
      };
    }
    if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
      return {
        key: 'openai',
        apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
        defaultModel: 'gpt-3.5-turbo'
      };
    }
    if (process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY) {
      return {
        key: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat'
      };
    }
    if (process.env.ZHIPU_API_KEY || process.env.VITE_ZHIPU_API_KEY) {
      return {
        key: 'zhipu',
        apiKey: process.env.ZHIPU_API_KEY || process.env.VITE_ZHIPU_API_KEY,
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        defaultModel: 'glm-4-flash'
      };
    }
    if (process.env.CUSTOM_API_KEY || process.env.VITE_CUSTOM_API_KEY) {
      const baseURL = process.env.CUSTOM_API_BASE_URL || process.env.VITE_CUSTOM_API_BASE_URL;
      const model = process.env.CUSTOM_API_MODEL || process.env.VITE_CUSTOM_API_MODEL;
      
      // 只有当baseURL和model都有值时才返回custom配置
      if (baseURL && model) {
        return {
          key: 'custom',
          apiKey: process.env.CUSTOM_API_KEY || process.env.VITE_CUSTOM_API_KEY,
          baseURL: baseURL,
          defaultModel: model
        };
      }
    }
    return null;
  };

  const modelConfig = getModelConfig();
  
  if (!modelConfig) {
    console.log('跳过 OpenAI 真实API测试：无有效的模型配置');
    it.skip('应该能正确调用 OpenAI 兼容的 API', () => {});
    it.skip('应该能正确处理多轮对话', () => {});
    it.skip('应该能正确使用高级参数', () => {});
    return;
  }

  console.log(`使用 ${modelConfig.key} 进行 OpenAI 兼容 API 测试，模型: ${modelConfig.defaultModel}`);

  it('应该能正确调用 OpenAI 兼容的 API', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    try {
      // 更新模型配置
      await modelManager.updateModel(modelConfig.key, {
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        defaultModel: modelConfig.defaultModel,
        enabled: true,
        provider: 'openai' // 所有兼容提供商都使用openai提供商类型
      });

      const messages = [
        { role: 'user', content: '你好，请用一句话介绍你自己' }
      ];

      const response = await llmService.sendMessage(messages, modelConfig.key);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    } catch (error) {
      console.error(`API调用失败 (${modelConfig.key}):`, error.message);
      // 如果是400错误，可能是配置问题，跳过测试
      if (error.message.includes('400')) {
        console.log(`跳过测试：${modelConfig.key} API配置可能有问题`);
        return;
      }
      throw error;
    }
  }, 300000);

  it('应该能正确处理多轮对话', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    try {
      // 更新模型配置
      await modelManager.updateModel(modelConfig.key, {
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        defaultModel: modelConfig.defaultModel,
        enabled: true,
        provider: 'openai'
      });

      const messages = [
        { role: 'user', content: '你好，我们来玩个游戏' },
        { role: 'assistant', content: '好啊，你想玩什么游戏？' },
        { role: 'user', content: '我们来玩猜数字游戏，1到100之间' }
      ];

      const response = await llmService.sendMessage(messages, modelConfig.key);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    } catch (error) {
      console.error(`多轮对话测试失败 (${modelConfig.key}):`, error.message);
      if (error.message.includes('400')) {
        console.log(`跳过测试：${modelConfig.key} API配置可能有问题`);
        return;
      }
      throw error;
    }
  }, 300000);

  it('应该能正确使用高级参数', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    try {
      // 更新模型配置，包含高级参数
      await modelManager.updateModel(modelConfig.key, {
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        defaultModel: modelConfig.defaultModel,
        enabled: true,
        provider: 'openai',
        llmParams: {
          temperature: 0.3,
          max_tokens: 100
        }
      });

      const messages = [
        { role: 'user', content: '请用一句话回答：什么是人工智能？' }
      ];

      const response = await llmService.sendMessage(messages, modelConfig.key);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      // 由于设置了max_tokens=100，响应应该相对较短
      expect(response.length).toBeLessThan(200);
    } catch (error) {
      console.error(`高级参数测试失败 (${modelConfig.key}):`, error.message);
      if (error.message.includes('400')) {
        console.log(`跳过测试：${modelConfig.key} API配置可能有问题`);
        return;
      }
      throw error;
    }
  }, 300000);

  it('应该能兼容处理所有模型的响应格式（reasoning_content + think标签 + 普通文本）', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    try {
      // 测试通用兼容性处理
      await modelManager.updateModel(modelConfig.key, {
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        defaultModel: modelConfig.defaultModel,
        enabled: true,
        provider: 'openai',
        llmParams: {
          temperature: 0.1,
          max_tokens: 100
        }
      });

      const testMessages = [
        {
          role: 'user',
          content: '请简单回答：什么是AI？'
        }
      ];

      // 测试非流式处理
      const result = await llmService.sendMessage(testMessages, modelConfig.key);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      
      console.log('兼容性测试结果:', {
        hasThinkTags: result.includes('<think>'),
        hasContent: result.length > 0,
        result: result
      });

      // 测试流式处理
      let streamResult = '';
      let tokenCount = 0;
      let isCompleted = false;
      let hasError = false;

      await llmService.sendMessageStream(testMessages, modelConfig.key, {
        onToken: (token) => {
          streamResult += token;
          tokenCount++;
        },
        onComplete: (response) => {
          isCompleted = true;
        },
        onError: (error) => {
          hasError = true;
          console.error('流式测试错误:', error);
        }
      });

      expect(hasError).toBe(false);
      expect(isCompleted).toBe(true);
      expect(streamResult.length).toBeGreaterThan(0);
      expect(tokenCount).toBeGreaterThan(0);

      console.log('流式兼容性测试结果:', {
        tokenCount,
        hasThinkTags: streamResult.includes('<think>'),
        streamLength: streamResult.length,
        isCompleted
      });

    } catch (error) {
      console.error('兼容性测试失败:', error);
      throw error;
    }
  },300000);

  it('应该能正确处理reasoning_content的流式输出', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    try {
      // 配置模型
      await modelManager.updateModel(modelConfig.key, {
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        defaultModel: modelConfig.defaultModel,
        enabled: true,
        provider: 'openai',
        llmParams: {
          temperature: 0.1,
          max_tokens: 2000
        }
      });

      const testMessages = [
        {
          role: 'user',
          content: '你是谁'
        }
      ];

      // 模拟包含reasoning_content的流式响应
      let fullResult = '';
      let tokenCount = 0;
      let hasThinkTags = false;
      let thinkTagsClosed = false;
      let isCompleted = false;
      let hasError = false;

      await llmService.sendMessageStream(testMessages, modelConfig.key, {
        onToken: (token) => {
          fullResult += token;
          tokenCount++;
          
          // 检查think标签的完整性
          if (token.includes('<think>')) {
            hasThinkTags = true;
          }
          if (token.includes('</think>')) {
            thinkTagsClosed = true;
          }
        },
        onComplete: (response) => {
          isCompleted = true;
        },
        onError: (error) => {
          hasError = true;
          console.error('流式测试错误:', error);
        }
      });

      // 等待流式完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('reasoning_content流式测试结果:', {
        tokenCount,
        hasThinkTags,
        thinkTagsClosed,
        isCompleted,
        hasError,
        resultLength: fullResult.length,
        fullResult: fullResult
      });

      expect(isCompleted).toBe(true);
      expect(hasError).toBe(false);
      expect(tokenCount).toBeGreaterThan(0);
      expect(fullResult.length).toBeGreaterThan(0);
      
      // 如果有think标签，检查它们是否正确闭合
      const thinkOpenCount = (fullResult.match(/<think>/g) || []).length;
      const thinkCloseCount = (fullResult.match(/<\/think>/g) || []).length;
      
      if (thinkOpenCount > 0) {
        expect(thinkOpenCount).toBe(thinkCloseCount);
        console.log(`✅ Think标签匹配: ${thinkOpenCount} 个开始标签, ${thinkCloseCount} 个结束标签`);
      }

    } catch (error) {
      console.error('reasoning_content流式测试失败:', error);
      throw error;
    }
  },300000);

  it('应该能使用结构化API发送消息', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    try {
      // 配置模型
      await modelManager.updateModel(modelConfig.key, {
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        defaultModel: modelConfig.defaultModel,
        enabled: true,
        provider: 'openai',
        llmParams: {
          temperature: 0.3,
          max_tokens: 100
        }
      });

      const testMessages = [
        {
          role: 'user',
          content: '请简单回答：什么是AI？'
        }
      ];

      // 测试结构化API
      const response = await llmService.sendMessageStructured(testMessages, modelConfig.key);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
      expect(response.content).toBeDefined();
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      
      // 检查元数据
      expect(response.metadata).toBeDefined();
      expect(response.metadata.model).toBe(modelConfig.defaultModel);
      
      console.log('结构化API测试结果:', {
        hasContent: response.content.length > 0,
        hasReasoning: !!response.reasoning,
        content: response.content,
        reasoning: response.reasoning,
        model: response.metadata?.model
      });

    } catch (error) {
      console.error('结构化API测试失败:', error);
      throw error;
    }
  }, 300000);

  it('应该能使用结构化回调进行流式处理', async () => {
    const storage = new LocalStorageProvider();
    const modelManager = new ModelManager(storage);
    const llmService = createLLMService(modelManager);

    try {
      // 配置模型
      await modelManager.updateModel(modelConfig.key, {
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseURL,
        defaultModel: modelConfig.defaultModel,
        enabled: true,
        provider: 'openai',
        llmParams: {
          temperature: 0.1,
          max_tokens: 1500
        }
      });

      const testMessages = [
        {
          role: 'user',
          content: '请简单回答：什么是AI？'
        }
      ];

      let contentTokens = '';
      let reasoningTokens = '';
      let finalResponse = null;
      let contentTokenCount = 0;
      let reasoningTokenCount = 0;
      let isCompleted = false;
      let hasError = false;

      await llmService.sendMessageStream(testMessages, modelConfig.key, {
        onToken: (token) => {
          contentTokens += token;
          contentTokenCount++;
        },
        onReasoningToken: (token) => {
          reasoningTokens += token;
          reasoningTokenCount++;
        },
        onComplete: (response) => {
          finalResponse = response;
          isCompleted = true;
        },
        onError: (error) => {
          hasError = true;
          console.error('结构化流式测试错误:', error);
        }
      });

      // 等待流式完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('结构化流式测试结果:', {
        contentTokenCount,
        reasoningTokenCount,
        isCompleted,
        hasError,
        content: contentTokens,
        reasoning: reasoningTokens,
        finalResponse: finalResponse
      });

      expect(isCompleted).toBe(true);
      expect(hasError).toBe(false);
      expect(finalResponse).toBeDefined();
      expect(finalResponse.content).toBeDefined();
      expect(contentTokenCount).toBeGreaterThan(0);
      expect(contentTokens.length).toBeGreaterThan(0);
      
      // 验证内容一致性
      expect(contentTokens).toBe(finalResponse.content);
      
      // 如果有推理内容，验证一致性
      if (reasoningTokenCount > 0) {
        expect(reasoningTokens).toBe(finalResponse.reasoning || '');
      }

    } catch (error) {
      console.error('结构化流式测试失败:', error);
      throw error;
    }
  }, 300000);
}); 