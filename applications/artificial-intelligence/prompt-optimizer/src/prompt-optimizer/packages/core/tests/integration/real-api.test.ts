import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { ModelManager, HistoryManager, TemplateManager, PromptService } from '../../src'
import { LocalStorageProvider } from '../../src/services/storage/localStorageProvider'
import { createLLMService } from '../../src/services/llm/service'
import { createTemplateManager } from '../../src/services/template/manager'
import { createTemplateLanguageService } from '../../src/services/template/languageService'
import { createModelManager } from '../../src/services/model/manager'
import { createHistoryManager } from '../../src/services/history/manager'

/**
 * 真实API集成测试
 * 只有在相应的环境变量存在时才执行
 */
describe('Real API Integration Tests', () => {
  const hasOpenAIKey = !!process.env.VITE_OPENAI_API_KEY
  const hasCustomKey = !!process.env.VITE_CUSTOM_API_KEY && !!process.env.VITE_CUSTOM_BASE_URL
  const hasGeminiKey = !!process.env.VITE_GEMINI_API_KEY
  const hasDeepSeekKey = !!process.env.VITE_DEEPSEEK_API_KEY

  let storage: LocalStorageProvider
  let modelManager: ModelManager
  let historyManager: HistoryManager
  let templateManager: TemplateManager
  let promptService: PromptService

  beforeAll(() => {
    console.log('环境变量检查:', {
      OPENAI_API_KEY: hasOpenAIKey,
      CUSTOM_API_KEY: hasCustomKey,
      GEMINI_API_KEY: hasGeminiKey,
      DEEPSEEK_API_KEY: hasDeepSeekKey
    })

    if (!hasOpenAIKey && !hasCustomKey && !hasGeminiKey && !hasDeepSeekKey) {
      console.log('跳过真实API测试：未设置任何API密钥环境变量')
    }
  })

  beforeEach(async () => {
    storage = new LocalStorageProvider()
    modelManager = createModelManager(storage)
    historyManager = createHistoryManager(storage)
    
    const languageService = createTemplateLanguageService(storage)
    templateManager = createTemplateManager(storage, languageService)

    
    const llmService = createLLMService(modelManager)
    promptService = new PromptService(modelManager, llmService, templateManager, historyManager)

    // 清理存储
    await storage.clearAll()

    // 添加通用模板
    const template = {
      id: 'test-optimize',
      name: 'Test Optimize',
      content: 'Please optimize this prompt for better AI responses: {{input}}',
      metadata: {
        version: '1.0',
        lastModified: Date.now(),
        templateType: 'optimize' as const,
        language: 'zh' as const
      }
    }
    await templateManager.saveTemplate(template)
  })

  describe('OpenAI API 测试', () => {
    const runOpenAITests = hasOpenAIKey

    it.runIf(runOpenAITests)('应该能使用OpenAI API优化提示词', async () => {
      // 添加OpenAI模型
      const openaiModel = {
        name: 'OpenAI API',
        baseURL: 'https://api.openai.com/v1',
        apiKey: process.env.VITE_OPENAI_API_KEY!,
        models: ['gpt-3.5-turbo'],
        defaultModel: 'gpt-3.5-turbo',
        enabled: true,
        provider: 'openai' as const
      }
      await modelManager.addModel('test-openai', openaiModel)

      // 执行优化
      const request = {
        optimizationMode: 'system' as const,
        targetPrompt: '请优化这个提示词：写一个关于人工智能的故事',
        modelKey: 'test-openai'
      };
      const result = await promptService.optimizePrompt(request)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)

      // 验证历史记录已保存
      const records = await historyManager.getRecords()
      expect(records.length).toBe(1)
      expect(records[0].type).toBe('optimize')
    }, 60000)

    it.skipIf(!runOpenAITests)('跳过OpenAI测试 - 未设置API密钥', () => {
      expect(true).toBe(true)
    })
  })

  describe('Custom API 测试', () => {
    const runCustomTests = hasCustomKey

    it.runIf(runCustomTests)('应该能使用Custom API优化提示词', async () => {
      // 添加Custom模型
      const customModel = {
        name: 'Custom API',
        baseURL: process.env.VITE_CUSTOM_BASE_URL!,
        apiKey: process.env.VITE_CUSTOM_API_KEY!,
        models: ['custom-model'],
        defaultModel: 'custom-model',
        enabled: true,
        provider: 'openai' as const // 使用OpenAI兼容格式
      }
      await modelManager.addModel('test-custom', customModel)

      // 执行优化
      const request = {
        optimizationMode: 'system' as const,
        targetPrompt: '请优化这个提示词：写一个关于机器人的故事',
        modelKey: 'test-custom'
      };
      const result = await promptService.optimizePrompt(request)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)

      // 验证历史记录已保存
      const records = await historyManager.getRecords()
      expect(records.length).toBe(1)
      expect(records[0].type).toBe('optimize')
    }, 60000)

    it.skipIf(!runCustomTests)('跳过Custom API测试 - 未设置API密钥或基础URL', () => {
      expect(true).toBe(true)
    })
  })

  describe('Gemini API 测试', () => {
    const runGeminiTests = hasGeminiKey

    // Gemini API 可能会有频率限制，因此在每个测试之间添加延迟
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒
    });

    it.runIf(runGeminiTests)('应该能使用Gemini API优化提示词', async () => {
      // 添加Gemini模型
      const geminiModel = {
        name: 'Google Gemini',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: process.env.VITE_GEMINI_API_KEY!,
        models: ['gemini-2.0-flash'],
        defaultModel: 'gemini-2.0-flash',
        enabled: true,
        provider: 'gemini' as const
      }
      await modelManager.addModel('test-gemini', geminiModel)

      // 执行优化
      const request = {
        optimizationMode: 'system' as const,
        targetPrompt: '请优化这个提示词：写一个关于太空探索的故事',
        modelKey: 'test-gemini'
      };
      const result = await promptService.optimizePrompt(request)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)

      // 模拟UI层保存历史记录
      await historyManager.createNewChain({
        id: `test_${Date.now()}`,
        originalPrompt: request.targetPrompt,
        optimizedPrompt: result,
        type: 'optimize',
        modelKey: request.modelKey,
        timestamp: Date.now()
      })

      // 验证历史记录已保存
      const records = await historyManager.getRecords()
      expect(records.length).toBe(1)
      expect(records[0].type).toBe('optimize')
    }, 60000)

    it.skipIf(!runGeminiTests)('跳过Gemini测试 - 未设置API密钥', () => {
      expect(true).toBe(true)
    })
  })

  describe('DeepSeek API 测试', () => {
    const runDeepSeekTests = hasDeepSeekKey

    it.runIf(runDeepSeekTests)('应该能使用DeepSeek API优化提示词', async () => {
      // 添加DeepSeek模型
      const deepseekModel = {
        name: 'DeepSeek',
        baseURL: 'https://api.deepseek.com/v1',
        apiKey: process.env.VITE_DEEPSEEK_API_KEY!,
        models: ['deepseek-chat'],
        defaultModel: 'deepseek-chat',
        enabled: true,
        provider: 'openai' as const // 使用OpenAI兼容格式
      }
      await modelManager.addModel('test-deepseek', deepseekModel)

      // 执行优化
      const request = {
        optimizationMode: 'system' as const,
        targetPrompt: '请优化这个提示词：写一个关于人工智能的故事',
        modelKey: 'test-deepseek'
      };
      const result = await promptService.optimizePrompt(request)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)

      // 模拟UI层保存历史记录
      await historyManager.createNewChain({
        id: `test_${Date.now()}`,
        originalPrompt: request.targetPrompt,
        optimizedPrompt: result,
        type: 'optimize',
        modelKey: request.modelKey,
        timestamp: Date.now()
      })

      // 验证历史记录已保存
      const records = await historyManager.getRecords()
      expect(records.length).toBe(1)
      expect(records[0].type).toBe('optimize')
    }, 60000)

    it.skipIf(!runDeepSeekTests)('跳过DeepSeek测试 - 未设置API密钥', () => {
      expect(true).toBe(true)
    })
  })

  describe('轻量级工作流测试', () => {
    const runWorkflowTests = hasOpenAIKey || (hasCustomKey && !!process.env.VITE_CUSTOM_BASE_URL)

    it.runIf(runWorkflowTests)('应该能完成基本的优化流程', async () => {
      // 选择可用的模型
      const modelKey = hasOpenAIKey ? 'openai-model' : 'custom-model'
      const apiKey = hasOpenAIKey ? process.env.VITE_OPENAI_API_KEY! : process.env.VITE_CUSTOM_API_KEY!
      const baseURL = hasOpenAIKey ? 'https://api.openai.com/v1' : process.env.VITE_CUSTOM_BASE_URL!
      const modelName = hasOpenAIKey ? 'gpt-3.5-turbo' : 'custom-model'

      // 添加模型
      await modelManager.addModel(modelKey, {
        name: 'Workflow Test Model',
        baseURL,
        apiKey,
        models: [modelName],
        defaultModel: modelName,
        enabled: true,
        provider: 'openai' as const
      })

      // 优化原始提示词
      const request = {
        optimizationMode: 'system' as const,
        targetPrompt: '写一个故事',
        modelKey: modelKey
      };
      const optimizeResult = await promptService.optimizePrompt(request)

      expect(typeof optimizeResult).toBe('string')
      expect(optimizeResult.length).toBeGreaterThan(0)

      // 模拟UI层保存历史记录
      await historyManager.createNewChain({
        id: `test_${Date.now()}`,
        originalPrompt: request.targetPrompt,
        optimizedPrompt: optimizeResult,
        type: 'optimize',
        modelKey: request.modelKey,
        timestamp: Date.now()
      })

      // 验证历史记录已保存
      const records = await historyManager.getRecords()
      expect(records.length).toBe(1)
      expect(records[0].type).toBe('optimize')

    }, 60000) // 增加超时到60秒

    it.skipIf(!runWorkflowTests)('跳过工作流测试 - 未设置API密钥', () => {
      expect(true).toBe(true)
    })
  })

  describe('并发和错误处理测试', () => {
    const runStabilityTests = hasOpenAIKey || (hasCustomKey && !!process.env.VITE_CUSTOM_BASE_URL)

    it.runIf(runStabilityTests)('应该能正确处理API错误', async () => {
      // 添加一个有无效API密钥的模型
      await modelManager.addModel('invalid-model', {
        name: 'Invalid Model',
        baseURL: 'https://api.openai.com/v1',
        apiKey: 'invalid-key',
        models: ['gpt-3.5-turbo'],
        defaultModel: 'gpt-3.5-turbo',
        enabled: true,
        provider: 'openai' as const
      })

      // 尝试优化应该失败
      const request = {
        optimizationMode: 'system' as const,
        targetPrompt: '测试提示词',
        modelKey: 'invalid-model'
      };
      await expect(promptService.optimizePrompt(request)).rejects.toThrow()

      // 验证没有创建无效的历史记录
      const records = await historyManager.getRecords()
      expect(records.length).toBe(0)
    }, 30000)

    it.skipIf(!runStabilityTests)('跳过稳定性测试 - 未设置API密钥', () => {
      expect(true).toBe(true)
    })
  })
}) 