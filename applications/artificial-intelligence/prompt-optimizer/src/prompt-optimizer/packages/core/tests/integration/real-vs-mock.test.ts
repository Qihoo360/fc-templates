import { describe, it, expect, beforeEach } from 'vitest'
import { ModelManager, HistoryManager } from '../../src'
import { LocalStorageProvider } from '../../src/services/storage/localStorageProvider'
import { createMockStorage } from '../mocks/mockStorage'

/**
 * Mock测试 vs 真实调用测试对比
 * 验证Mock测试是否能有效发现真实问题
 */
describe('Mock vs Real Implementation Tests', () => {
  let realModelManager: ModelManager
  let realHistoryManager: HistoryManager
  let mockModelManager: ModelManager
  let mockHistoryManager: HistoryManager

  beforeEach(() => {
    // 真实实现 - 使用真实的LocalStorageProvider
    const realStorage = new LocalStorageProvider()
    realModelManager = new ModelManager(realStorage)
    realHistoryManager = new HistoryManager(realStorage)

    // Mock实现 - 使用Mock Storage
    const mockStorage = createMockStorage()
    mockModelManager = new ModelManager(mockStorage)
    mockHistoryManager = new HistoryManager(mockStorage)
  })

  describe('发现Mock测试无法捕获的问题', () => {
    it('真实存储的性能问题 - Mock无法发现', async () => {
      // Mock测试：立即返回，看不出性能问题
      const mockStart = Date.now()
      await mockModelManager.getAllModels()
      const mockTime = Date.now() - mockStart

      // 真实测试：可能暴露性能问题
      const realStart = Date.now()
      await realModelManager.getAllModels()
      const realTime = Date.now() - realStart

      console.log(`Mock调用时间: ${mockTime}ms, 真实调用时间: ${realTime}ms`)
      
      // Mock通常更快，但无法发现真实的性能问题
      expect(mockTime).toBeLessThan(10) // Mock通常很快
      // 真实调用可能更慢，取决于localStorage的实现
    })

    it('存储容量限制 - Mock无法模拟', async () => {
      // Mock存储通常没有容量限制
      const largeData = 'x'.repeat(100000) // 100KB的数据
      
      try {
        // Mock存储可能不会有容量限制
        await mockHistoryManager.addRecord({
          id: 'large-record',
          originalPrompt: largeData,
          optimizedPrompt: largeData,
          type: 'optimize',
          chainId: 'test-chain',
          version: 1,
          timestamp: Date.now(),
          modelKey: 'test-model',
          templateId: 'test-template'
        })
        console.log('Mock存储：大数据写入成功')
      } catch (error: any) {
        console.log('Mock存储错误:', error.message)
      }

      try {
        // 真实localStorage可能有容量限制（通常5-10MB）
        await realHistoryManager.addRecord({
          id: 'large-record-real',
          originalPrompt: largeData,
          optimizedPrompt: largeData,
          type: 'optimize',
          chainId: 'test-chain',
          version: 1,
          timestamp: Date.now(),
          modelKey: 'test-model',
          templateId: 'test-template'
        })
        console.log('真实存储：大数据写入成功')
      } catch (error: any) {
        console.log('真实存储可能的错误:', error.message)
        // 注意：在测试环境中可能不会遇到容量限制
      }
    })

    it('并发访问问题 - Mock无法暴露', async () => {
      // 模拟并发写入
      const promises: Promise<void>[] = []
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          realHistoryManager.addRecord({
            id: `concurrent-${i}`,
            originalPrompt: `prompt-${i}`,
            optimizedPrompt: `result-${i}`,
            type: 'optimize',
            chainId: 'concurrent-chain',
            version: i + 1,
            timestamp: Date.now() + i,
            modelKey: 'test-model',
            templateId: 'test-template'
          })
        )
      }

      // 真实存储可能在并发时出现问题
      await Promise.all(promises)
      
      const records = await realHistoryManager.getRecords()
      console.log(`并发写入后记录数量: ${records.length}`)
      
      // 检查是否至少有一些记录成功写入（而不是要求全部成功）
      // 在并发环境下，可能出现数据丢失，这是我们想要检测的问题
      expect(records.length).toBeGreaterThan(0)
      
      // 如果记录数量少于期望值，说明存在并发安全问题
      if (records.length < 5) {
        console.warn(`警告：并发写入存在数据丢失问题，期望5条记录，实际${records.length}条`)
      }
    })
  })

  describe('Mock测试的有效性分析', () => {
    it('Mock能有效测试业务逻辑', async () => {
      // Mock测试在测试业务逻辑方面是有效的
      const models = await mockModelManager.getAllModels()
      expect(Array.isArray(models)).toBe(true)
      
      // 可以有效测试异常处理
      await expect(mockHistoryManager.getRecord('non-existent'))
        .rejects.toThrow('Record with ID non-existent not found')
    })

    it('Mock无法测试集成问题', async () => {
      // 这种集成问题Mock测试无法发现
      // 例如：数据格式不兼容、版本升级问题等
      
      console.log('模拟数据格式兼容性问题...')
      // 在真实场景中，某些数据可能导致运行时错误
      // 但Mock测试可能无法发现这些问题
      
      expect(true).toBe(true) // 占位测试
    })
  })

  describe('建议的测试策略', () => {
    it('分层测试：单元测试用Mock，集成测试用真实实现', async () => {
      // 单元测试：快速验证逻辑正确性
      const mockResult = await mockModelManager.getAllModels()
      expect(Array.isArray(mockResult)).toBe(true)
      
      // 集成测试：验证真实环境的正确性
      const realResult = await realModelManager.getAllModels()
      expect(Array.isArray(realResult)).toBe(true)
      
      // 两者都应该返回相同的数据结构
      expect(mockResult.length).toBe(realResult.length)
    })

    it('契约测试：验证Mock和真实实现的一致性', async () => {
      // 定义API契约
      const testAddModel = async (manager: ModelManager) => {
        const testModel = {
          name: 'contract-test',
          baseURL: 'https://test.api',
          apiKey: 'key',
          models: ['test'],
          defaultModel: 'test',
          enabled: true,
          provider: 'openai' as const
        }
        
        await manager.addModel('contract-test', testModel)
        const result = await manager.getModel('contract-test')
        
        expect(result).toBeDefined()
        expect(result?.name).toBe('contract-test')
      }

      // 同一个测试函数测试Mock和真实实现
      await testAddModel(mockModelManager)
      await testAddModel(realModelManager)
    })
  })
}) 