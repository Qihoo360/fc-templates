import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';

describe('MemoryStorageProvider', () => {
  let storage: MemoryStorageProvider;

  beforeEach(() => {
    storage = new MemoryStorageProvider();
  });

  describe('基本存储操作', () => {
    it('应该能设置和获取数据', async () => {
      await storage.setItem('test-key', 'test-value');
      const value = await storage.getItem('test-key');
      expect(value).toBe('test-value');
    });

    it('应该在键不存在时返回null', async () => {
      const value = await storage.getItem('non-existent-key');
      expect(value).toBeNull();
    });

    it('应该能删除数据', async () => {
      await storage.setItem('test-key', 'test-value');
      await storage.removeItem('test-key');
      const value = await storage.getItem('test-key');
      expect(value).toBeNull();
    });

    it('应该能清空所有数据', async () => {
      await storage.setItem('key1', 'value1');
      await storage.setItem('key2', 'value2');
      await storage.clearAll();
      
      const value1 = await storage.getItem('key1');
      const value2 = await storage.getItem('key2');
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('高级操作', () => {
    it('应该能更新数据', async () => {
      await storage.setItem('counter', '5');
      
      await storage.updateData<number>('counter', (current) => {
        return (current || 0) + 1;
      });
      
      const result = await storage.getItem('counter');
      expect(JSON.parse(result!)).toBe(6);
    });

    it('应该能处理不存在键的更新', async () => {
      await storage.updateData<number>('new-counter', (current) => {
        return (current || 0) + 10;
      });
      
      const result = await storage.getItem('new-counter');
      expect(JSON.parse(result!)).toBe(10);
    });

    it('应该能批量操作', async () => {
      await storage.batchUpdate([
        { key: 'key1', operation: 'set', value: 'value1' },
        { key: 'key2', operation: 'set', value: 'value2' },
        { key: 'key3', operation: 'set', value: 'value3' }
      ]);

      const value1 = await storage.getItem('key1');
      const value2 = await storage.getItem('key2');
      const value3 = await storage.getItem('key3');
      
      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      expect(value3).toBe('value3');
    });

    it('应该能批量删除', async () => {
      await storage.setItem('key1', 'value1');
      await storage.setItem('key2', 'value2');
      
      await storage.batchUpdate([
        { key: 'key1', operation: 'remove' },
        { key: 'key2', operation: 'remove' }
      ]);

      const value1 = await storage.getItem('key1');
      const value2 = await storage.getItem('key2');
      
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('工具方法', () => {
    it('应该返回正确的存储能力', () => {
      const capabilities = storage.getCapabilities();
      expect(capabilities).toEqual({
        supportsAtomic: true,
        supportsBatch: true,
        maxStorageSize: undefined
      });
    });

    it('应该正确报告存储大小', async () => {
      expect(storage.size).toBe(0);
      
      await storage.setItem('key1', 'value1');
      expect(storage.size).toBe(1);
      
      await storage.setItem('key2', 'value2');
      expect(storage.size).toBe(2);
      
      await storage.removeItem('key1');
      expect(storage.size).toBe(1);
    });

    it('应该正确检查键是否存在', async () => {
      expect(storage.has('test-key')).toBe(false);
      
      await storage.setItem('test-key', 'test-value');
      expect(storage.has('test-key')).toBe(true);
      
      await storage.removeItem('test-key');
      expect(storage.has('test-key')).toBe(false);
    });

    it('应该返回所有键', async () => {
      await storage.setItem('key1', 'value1');
      await storage.setItem('key2', 'value2');
      await storage.setItem('key3', 'value3');
      
      const keys = storage.getAllKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('数据序列化', () => {
    it('应该正确处理复杂对象', async () => {
      const complexObject = {
        name: 'test',
        nested: {
          value: 42,
          array: [1, 2, 3]
        }
      };
      
      await storage.setItem('complex', JSON.stringify(complexObject));
      const result = await storage.getItem('complex');
      const parsed = JSON.parse(result!);
      
      expect(parsed).toEqual(complexObject);
    });

    it('应该通过updateData正确处理JSON数据', async () => {
      const initialData = { count: 0, items: [] };
      await storage.setItem('data', JSON.stringify(initialData));
      
      await storage.updateData<{ count: number; items: string[] }>('data', (current) => {
        return {
          count: (current?.count || 0) + 1,
          items: [...(current?.items || []), 'new-item']
        };
      });
      
      const result = await storage.getItem('data');
      const parsed = JSON.parse(result!);
      
      expect(parsed.count).toBe(1);
      expect(parsed.items).toEqual(['new-item']);
    });
  });
}); 