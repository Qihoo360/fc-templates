import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ModelManager, HistoryManager } from '../../src'
import { createMockStorage } from '../mocks/mockStorage'

/**
 * 前端兼容性测试 - 验证异步化后的API是否与前端调用方式兼容
 */
describe('Frontend Compatibility Tests', () => {
  let modelManager: ModelManager
  let historyManager: HistoryManager

  beforeEach(() => {
    const mockStorage = createMockStorage()
    modelManager = new ModelManager(mockStorage)
    historyManager = new HistoryManager(mockStorage)
  })

  describe('ModelManager API 兼容性', () => {
    it('getAllModels() 应该返回Promise而不是直接返回数组', async () => {
      // 模拟前端错误的同步调用方式
      const result = modelManager.getAllModels()
      
      // 验证返回的是Promise
      expect(result).toBeInstanceOf(Promise)
      
      // 验证同步调用filter会失败
      try {
        // @ts-ignore - 故意的错误调用方式
        result.filter(m => m.enabled)
        throw new Error('Should not reach here')
      } catch (error) {
        expect(error.message).toContain('filter is not a function')
      }
      
      // 正确的异步调用方式
      const models = await result
      expect(Array.isArray(models)).toBe(true)
    })

    it('getModel() 应该返回Promise', async () => {
      const result = modelManager.getModel('test-key')
      expect(result).toBeInstanceOf(Promise)
    })

    it('getEnabledModels() 应该返回Promise', async () => {
      const result = modelManager.getEnabledModels()
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('HistoryManager API 兼容性', () => {
    it('getAllChains() 应该返回Promise而不是直接返回数组', async () => {
      // 模拟前端错误的同步调用方式
      const result = historyManager.getAllChains()
      
      // 验证返回的是Promise
      expect(result).toBeInstanceOf(Promise)
      
      // 验证同步迭代会失败
      try {
        // @ts-ignore - 故意的错误调用方式
        for (const chain of result) {
          console.log(chain)
        }
        throw new Error('Should not reach here')
      } catch (error) {
        expect(error.message).toContain('not iterable')
      }
      
      // 正确的异步调用方式
      const chains = await result
      expect(Array.isArray(chains)).toBe(true)
    })

    it('getRecords() 应该返回Promise', async () => {
      const result = historyManager.getRecords()
      expect(result).toBeInstanceOf(Promise)
    })

    it('clearHistory() 应该返回Promise', async () => {
      const result = historyManager.clearHistory()
      expect(result).toBeInstanceOf(Promise)
    })

    it('deleteRecord() 应该返回Promise', async () => {
      const result = historyManager.deleteRecord('test-id')
      expect(result).toBeInstanceOf(Promise)
      
      // 正确处理预期的错误
      await expect(result).rejects.toThrow('Record with ID test-id not found')
    })
  })

  describe('模拟前端错误场景', () => {
    it('应该模拟useModelManager中的错误调用', () => {
      // 模拟 useModelManager.ts 第52行的错误调用
      expect(() => {
        // @ts-ignore - 模拟错误的同步调用
        const enabledModels = modelManager.getAllModels().filter(m => m.enabled)
      }).toThrow('filter is not a function')
    })

    it('应该模拟usePromptHistory中的错误调用', () => {
      // 模拟 usePromptHistory.ts 第109行的错误调用
      expect(() => {
        // @ts-ignore - 模拟错误的迭代调用
        for (const chain of historyManager.getAllChains()) {
          console.log(chain)
        }
      }).toThrow('not iterable')
    })
  })

  describe('正确的异步调用模式', () => {
    it('模拟修复后的useModelManager调用模式', async () => {
      // 模拟修复后的正确调用方式
      const allModels = await modelManager.getAllModels()
      const enabledModels = allModels.filter(m => m.enabled)
      
      expect(Array.isArray(allModels)).toBe(true)
      expect(Array.isArray(enabledModels)).toBe(true)
    })

    it('模拟修复后的usePromptHistory调用模式', async () => {
      // 模拟修复后的正确调用方式
      const allChains = await historyManager.getAllChains()
      
      expect(Array.isArray(allChains)).toBe(true)
      
      // 可以正确迭代
      for (const chain of allChains) {
        expect(chain).toBeDefined()
      }
    })

    it('模拟历史记录操作的完整流程', async () => {
      // 清空历史
      await historyManager.clearHistory()
      
      // 获取链列表
      const chains = await historyManager.getAllChains()
      expect(chains).toHaveLength(0)
      
      // 这些操作都应该返回Promise
      expect(historyManager.clearHistory()).toBeInstanceOf(Promise)
      expect(historyManager.getAllChains()).toBeInstanceOf(Promise)
    })
  })

  describe('异步回调兼容性测试', () => {
    it('应该检测onComplete回调中的异步调用问题', async () => {
      // 模拟前端回调中错误的同步调用方式
      let errorCaught = false
      let resultFromCallback: any = null
      
      const mockCallback = () => {
        try {
          // 这模拟了 usePromptOptimizer.ts 中 onComplete 回调的错误用法
          const newRecord = historyManager.createNewChain({
            id: 'test-id',
            originalPrompt: 'test prompt',
            optimizedPrompt: 'optimized prompt', 
            type: 'optimize',
            modelKey: 'test-model',
            templateId: 'test-template',
            timestamp: Date.now(),
            metadata: {}
          })
          
          // 尝试立即访问属性（这会导致 undefined 错误）
          // @ts-ignore - 故意的错误调用方式，模拟前端运行时错误
          resultFromCallback = newRecord.currentRecord.id  // 这里会出错
        } catch (error) {
          errorCaught = true
          console.log('捕获到预期的异步调用错误:', error.message)
        }
      }
      
      // 执行回调
      mockCallback()
      
      // 验证确实捕获到了异步调用错误
      expect(errorCaught).toBe(true)
      expect(resultFromCallback).toBe(null)
    })
    
    it('应该验证正确的异步回调用法', async () => {
      // 模拟正确的异步回调使用方式
      let errorCaught = false
      let resultFromCallback: any = null
      
      const mockAsyncCallback = async () => {
        try {
          // 正确的异步调用方式
          const newRecord = await historyManager.createNewChain({
            id: 'test-id',
            originalPrompt: 'test prompt',
            optimizedPrompt: 'optimized prompt',
            type: 'optimize', 
            modelKey: 'test-model',
            templateId: 'test-template',
            timestamp: Date.now(),
            metadata: {}
          })
          
          // 现在可以安全地访问属性
          resultFromCallback = newRecord.currentRecord.id
        } catch (error) {
          errorCaught = true
          console.error('异步回调失败:', error)
        }
      }
      
      // 执行异步回调
      await mockAsyncCallback()
      
      // 验证没有错误且能正确获取结果
      expect(errorCaught).toBe(false)
      expect(resultFromCallback).toBe('test-id')
    })
  })
}) 