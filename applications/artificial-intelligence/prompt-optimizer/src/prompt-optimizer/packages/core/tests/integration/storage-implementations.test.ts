import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageProvider } from '../../src/services/storage/localStorageProvider';
import { DexieStorageProvider } from '../../src/services/storage/dexieStorageProvider';
import { StorageFactory } from '../../src/services/storage/factory';
import { HistoryManager } from '../../src/services/history/manager';
import { TemplateManager } from '../../src/services/template/manager';
import { ModelManager } from '../../src/services/model/manager';
import { createTemplateManager } from '../../src/services/template/manager';
import { createTemplateLanguageService } from '../../src/services/template/languageService';
import { createModelManager } from '../../src/services/model/manager';
import { IStorageProvider } from '../../src/services/storage/types';
import { PromptRecord } from '../../src/services/history/types';
import { v4 as uuidv4 } from 'uuid';
import {createPreferenceService} from "../../src";

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(),
}));

// Mock model manager
vi.mock('../../src/services/model/manager', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    modelManager: {
      getModel: vi.fn().mockReturnValue({
        name: 'Test Model',
        defaultModel: 'test-model'
      })
    }
  };
});

/**
 * 存储实现通用测试套件
 * 这个测试套件会对所有存储实现运行相同的测试，确保它们的行为一致
 */
describe('存储实现通用测试', () => {
  // 定义要测试的存储实现
  const storageImplementations: Array<{
    name: string;
    createProvider: () => IStorageProvider;
    cleanup?: () => Promise<void>;
  }> = [
    {
      name: 'LocalStorageProvider',
      createProvider: () => new LocalStorageProvider(),
      cleanup: async () => {
        // 清理 localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
      }
    }
    // 暂时禁用 Dexie 测试，因为测试环境没有 IndexedDB
    // {
    //   name: 'DexieStorageProvider', 
    //   createProvider: () => new DexieStorageProvider(),
    //   cleanup: async () => {
    //     // 清理 Dexie 数据库
    //     try {
    //       const provider = new DexieStorageProvider();
    //       await provider.clearAll();
    //       await provider.close();
    //     } catch (error) {
    //       // 忽略清理错误
    //     }
    //   }
    // }
  ];

  // 为每个存储实现运行测试
  storageImplementations.forEach(({ name, createProvider, cleanup }) => {
    describe(`${name} 实现测试`, () => {
      let storageProvider: IStorageProvider;

      beforeEach(async () => {
        storageProvider = createProvider();
        
        // 清理存储
        if (cleanup) {
          await cleanup();
        }
        
        // 重置 UUID mock
        (uuidv4 as any).mockClear();
        let counter = 0;
        (uuidv4 as any).mockImplementation(() => `mock-uuid-${++counter}`);
      });

      afterEach(async () => {
        if (cleanup) {
          await cleanup();
        }
      });

      describe('基础存储操作', () => {
        it('应该能够设置和获取数据', async () => {
          const key = 'test-key';
          const value = 'test-value';

          await storageProvider.setItem(key, value);
          const retrieved = await storageProvider.getItem(key);

          expect(retrieved).toBe(value);
        });

        it('应该在键不存在时返回null', async () => {
          const result = await storageProvider.getItem('non-existent-key');
          expect(result).toBeNull();
        });

        it('应该能够删除数据', async () => {
          const key = 'test-key';
          const value = 'test-value';

          await storageProvider.setItem(key, value);
          await storageProvider.removeItem(key);
          const result = await storageProvider.getItem(key);

          expect(result).toBeNull();
        });

        it('应该能够清空所有数据', async () => {
          await storageProvider.setItem('key1', 'value1');
          await storageProvider.setItem('key2', 'value2');
          
          await storageProvider.clearAll();
          
          const result1 = await storageProvider.getItem('key1');
          const result2 = await storageProvider.getItem('key2');
          
          expect(result1).toBeNull();
          expect(result2).toBeNull();
        });
      });

      describe('原子操作测试', () => {
        it('应该支持原子更新操作', async () => {
          if (!storageProvider.updateData) {
            console.log(`${name} 不支持原子更新，跳过测试`);
            return;
          }

          const key = 'atomic-test';
          const initialData = { count: 0 };

          // 设置初始数据
          await storageProvider.setItem(key, JSON.stringify(initialData));

          // 执行原子更新
          await storageProvider.updateData(key, (current: any) => {
            const data = current || { count: 0 };
            return { count: data.count + 1 };
          });

          // 验证结果
          const result = await storageProvider.getItem(key);
          const parsedResult = JSON.parse(result!);
          expect(parsedResult.count).toBe(1);
        });

        it('应该支持并发原子更新', async () => {
          if (!storageProvider.updateData) {
            console.log(`${name} 不支持原子更新，跳过测试`);
            return;
          }

          const key = 'concurrent-test';
          const initialData = { count: 0 };

          // 设置初始数据
          await storageProvider.setItem(key, JSON.stringify(initialData));

          // 并发执行多个原子更新
          const updatePromises = Array.from({ length: 5 }, () =>
            storageProvider.updateData!(key, (current: any) => {
              const data = current || { count: 0 };
              return { count: data.count + 1 };
            })
          );

          await Promise.all(updatePromises);

          // 验证最终结果
          const result = await storageProvider.getItem(key);
          const parsedResult = JSON.parse(result!);
          expect(parsedResult.count).toBe(5);
        });
      });

      describe('批量操作测试', () => {
        it('应该支持批量更新操作', async () => {
          if (!storageProvider.batchUpdate) {
            console.log(`${name} 不支持批量更新，跳过测试`);
            return;
          }

          const operations = [
            { key: 'batch1', operation: 'set' as const, value: 'value1' },
            { key: 'batch2', operation: 'set' as const, value: 'value2' },
            { key: 'batch3', operation: 'set' as const, value: 'value3' }
          ];

          await storageProvider.batchUpdate(operations);

          // 验证所有数据都已设置
          const result1 = await storageProvider.getItem('batch1');
          const result2 = await storageProvider.getItem('batch2');
          const result3 = await storageProvider.getItem('batch3');

          expect(result1).toBe('value1');
          expect(result2).toBe('value2');
          expect(result3).toBe('value3');
        });

        it('应该支持批量删除操作', async () => {
          if (!storageProvider.batchUpdate) {
            console.log(`${name} 不支持批量更新，跳过测试`);
            return;
          }

          // 先设置一些数据
          await storageProvider.setItem('delete1', 'value1');
          await storageProvider.setItem('delete2', 'value2');

          // 批量删除
          const operations = [
            { key: 'delete1', operation: 'remove' as const },
            { key: 'delete2', operation: 'remove' as const }
          ];

          await storageProvider.batchUpdate(operations);

          // 验证数据已删除
          const result1 = await storageProvider.getItem('delete1');
          const result2 = await storageProvider.getItem('delete2');

          expect(result1).toBeNull();
          expect(result2).toBeNull();
        });
      });

      describe('HistoryManager 集成测试', () => {
        let historyManager: HistoryManager;
        let modelManager: ModelManager;

        beforeEach(() => {
          modelManager = createModelManager(storageProvider);
          historyManager = new HistoryManager(storageProvider, modelManager);
        });

        it('应该能够添加和获取历史记录', async () => {
          const record: PromptRecord = {
            id: 'test-record-1',
            chainId: 'test-chain-1',
            originalPrompt: 'Test original prompt',
            optimizedPrompt: 'Test optimized prompt',
            type: 'optimize',
            version: 1,
            timestamp: Date.now(),
            modelKey: 'test-model',
            templateId: 'test-template',
            metadata: {}
          };

          await historyManager.addRecord(record);
          const records = await historyManager.getRecords();

          expect(records).toHaveLength(1);
          expect(records[0].id).toBe('test-record-1');
        });

        it('应该能够创建新的记录链', async () => {
          const chainParams = {
            id: 'chain-record-1',
            originalPrompt: 'Chain original prompt',
            optimizedPrompt: 'Chain optimized prompt',
            type: 'optimize' as const,
            modelKey: 'test-model',
            templateId: 'test-template',
            timestamp: Date.now(),
            metadata: {}
          };

          const chain = await historyManager.createNewChain(chainParams);

          expect(chain.chainId).toBe('mock-uuid-1');
          expect(chain.rootRecord.id).toBe('chain-record-1');
          expect(chain.currentRecord.id).toBe('chain-record-1');
          expect(chain.versions).toHaveLength(1);
        });

        it('应该支持并发添加记录', async () => {
          const records: PromptRecord[] = Array.from({ length: 5 }, (_, i) => ({
            id: `concurrent-record-${i}`,
            chainId: `concurrent-chain-${i}`,
            originalPrompt: `Original prompt ${i}`,
            optimizedPrompt: `Optimized prompt ${i}`,
            type: 'optimize',
            version: 1,
            timestamp: Date.now() + i,
            modelKey: 'test-model',
            templateId: 'test-template',
            metadata: {}
          }));

          // 并发添加记录
          await Promise.all(records.map(record => historyManager.addRecord(record)));

          // 验证所有记录都已添加
          const allRecords = await historyManager.getRecords();
          expect(allRecords).toHaveLength(5);

          // 验证记录按时间戳排序（最新的在前）
          for (let i = 0; i < allRecords.length - 1; i++) {
            expect(allRecords[i].timestamp).toBeGreaterThanOrEqual(allRecords[i + 1].timestamp);
          }
        });
      });

      describe('TemplateManager 集成测试', () => {
        let templateManager: TemplateManager;

        beforeEach(async () => {
          const preferenceService = createPreferenceService(storageProvider)
          const languageService = createTemplateLanguageService(preferenceService);
          templateManager = createTemplateManager(storageProvider, languageService);
    
        });

        it('应该能够保存和获取模板', async () => {
          const template = {
            id: 'test-template',
            name: 'Test Template',
            content: 'Test content: {{input}}',
            isBuiltin: false,
            metadata: {
              version: '1.0.0',
              templateType: 'optimize' as const,
              lastModified: Date.now(),
              language: 'zh' as const
            }
          };

          await templateManager.saveTemplate(template);
          const retrieved = await templateManager.getTemplate('test-template');

          expect(retrieved.id).toBe('test-template');
          expect(retrieved.name).toBe('Test Template');
        });

        it('应该能够列出所有模板', async () => {
          const template1 = {
            id: 'template-1',
            name: 'Template 1',
            content: 'Content 1: {{input}}',
            isBuiltin: false,
            metadata: {
              version: '1.0.0',
              templateType: 'optimize' as const,
              lastModified: Date.now(),
              language: 'zh' as const
            }
          };

          const template2 = {
            id: 'template-2',
            name: 'Template 2',
            content: 'Content 2: {{input}}',
            isBuiltin: false,
            metadata: {
              version: '1.0.0',
              templateType: 'iterate' as const,
              lastModified: Date.now(),
              language: 'zh' as const
            }
          };

          await templateManager.saveTemplate(template1);
          await templateManager.saveTemplate(template2);

          const templates = await templateManager.listTemplates();
          const userTemplates = templates.filter(t => !t.isBuiltin);

          expect(userTemplates).toHaveLength(2);
        });
      });

      describe('ModelManager 集成测试', () => {
        let modelManager: ModelManager;

        beforeEach(async () => {
          modelManager = createModelManager(storageProvider);
        });

        it('应该能够添加和获取模型配置', async () => {
          const config = {
            name: 'Test Model',
            baseURL: 'https://api.test.com',
            models: ['test-model-1'],
            defaultModel: 'test-model-1',
            enabled: false,
            provider: 'test'
          };

          await modelManager.addModel('test-model', config);
          const retrieved = await modelManager.getModel('test-model');

          expect(retrieved?.name).toBe('Test Model');
          expect(retrieved?.baseURL).toBe('https://api.test.com');
        });

        it('应该能够启用和禁用模型', async () => {
          const config = {
            name: 'Test Model',
            baseURL: 'https://api.test.com',
            models: ['test-model-1'],
            defaultModel: 'test-model-1',
            enabled: false,
            provider: 'test',
            apiKey: 'test-api-key'
          };

          await modelManager.addModel('test-model', config);
          await modelManager.enableModel('test-model');

          const enabledModels = await modelManager.getEnabledModels();
          expect(enabledModels.some(m => m.key === 'test-model')).toBe(true);

          await modelManager.disableModel('test-model');
          const disabledModels = await modelManager.getEnabledModels();
          expect(disabledModels.some(m => m.key === 'test-model')).toBe(false);
        });
      });
    });
  });

  describe('存储工厂测试', () => {
    it('应该能够创建 localStorage 提供器', () => {
      const provider = StorageFactory.create('localStorage');
      expect(provider).toBeInstanceOf(LocalStorageProvider);
    });

    it('应该能够创建 Dexie 提供器', () => {
      const provider = StorageFactory.create('dexie');
      expect(provider).toBeInstanceOf(DexieStorageProvider);
    });

    it('应该在不支持的类型时抛出错误', () => {
      expect(() => {
        // @ts-ignore - 故意传入无效类型
        StorageFactory.create('invalid');
      }).toThrow('Unsupported storage type: invalid');
    });

    it('应该能够创建指定类型的提供器', () => {
      const dexieProvider = StorageFactory.create('dexie');
      expect(dexieProvider).toBeDefined();
      expect(dexieProvider instanceof DexieStorageProvider).toBe(true);

      const localProvider = StorageFactory.create('localStorage');
      expect(localProvider).toBeDefined();
      expect(localProvider instanceof LocalStorageProvider).toBe(true);
    });

    it('应该确保相同类型的提供器是单例', () => {
      // 重置工厂状态
      StorageFactory.reset();

      // 创建多个相同类型的提供器实例
      const provider1 = StorageFactory.create('memory');
      const provider2 = StorageFactory.create('memory');
      const provider3 = StorageFactory.create('memory');

      // 验证它们是同一个实例
      expect(provider1).toBe(provider2);
      expect(provider2).toBe(provider3);
      expect(provider1).toBe(provider3);
    });

    it('应该确保相同类型的提供器是单例', () => {
      // 重置工厂状态
      StorageFactory.reset();
      
      // 创建多个相同类型的提供器
      const localStorage1 = StorageFactory.create('localStorage');
      const localStorage2 = StorageFactory.create('localStorage');
      const dexie1 = StorageFactory.create('dexie');
      const dexie2 = StorageFactory.create('dexie');
      
      // 验证相同类型是单例
      expect(localStorage1).toBe(localStorage2);
      expect(dexie1).toBe(dexie2);
      
      // 验证不同类型是不同实例
      expect(localStorage1).not.toBe(dexie1);
    });

    it('应该能够重置工厂状态', () => {
      // 创建一些实例
      const memory1 = StorageFactory.create('memory');
      const localStorage1 = StorageFactory.create('localStorage');

      // 重置状态
      StorageFactory.reset();

      // 创建新实例应该是不同的对象
      const memory2 = StorageFactory.create('memory');
      const localStorage2 = StorageFactory.create('localStorage');

      expect(memory2).not.toBe(memory1);
      expect(localStorage2).not.toBe(localStorage1);
    });
  });

  // 注意：数据迁移测试需要浏览器环境，在 Node.js 测试环境中无法运行
  // 这些测试应该在 E2E 测试中进行
}); 