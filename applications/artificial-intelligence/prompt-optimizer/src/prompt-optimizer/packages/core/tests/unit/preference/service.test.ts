import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PreferenceService } from '../../../src/services/preference/service';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';

describe('PreferenceService', () => {
  let preferenceService: PreferenceService;
  let mockStorage: MemoryStorageProvider;

  beforeEach(() => {
    mockStorage = new MemoryStorageProvider();
    preferenceService = new PreferenceService(mockStorage);
  });

  describe('基本功能', () => {
    it('should set and get preference', async () => {
      await preferenceService.set('test-key', 'test-value');
      const value = await preferenceService.get('test-key', null);
      
      expect(value).toBe('test-value');
    });

    it('should return default value when key does not exist', async () => {
      const value = await preferenceService.get('non-existent-key', 'default');
      
      expect(value).toBe('default');
    });

    it('should delete preference', async () => {
      await preferenceService.set('test-key', 'test-value');
      await preferenceService.delete('test-key');
      const value = await preferenceService.get('test-key', 'default');
      
      expect(value).toBe('default');
    });

    it('should clear all preferences', async () => {
      await preferenceService.set('key1', 'value1');
      await preferenceService.set('key2', 'value2');
      
      await preferenceService.clear();
      
      const value1 = await preferenceService.get('key1', 'default');
      const value2 = await preferenceService.get('key2', 'default');
      
      expect(value1).toBe('default');
      expect(value2).toBe('default');
    });
  });

  describe('批量操作', () => {
    it('should get all preferences', async () => {
      await preferenceService.set('app:settings:ui:theme-id', 'dark');
      await preferenceService.set('app:settings:ui:preferred-language', 'zh-CN');
      await preferenceService.set('app:selected-optimize-model', 'gemini');
      
      const allPreferences = await preferenceService.getAll();
      
      expect(allPreferences).toEqual({
        'app:settings:ui:theme-id': 'dark',
        'app:settings:ui:preferred-language': 'zh-CN',
        'app:selected-optimize-model': 'gemini'
      });
    });

    it('should return empty object when no preferences exist', async () => {
      const allPreferences = await preferenceService.getAll();
      
      expect(allPreferences).toEqual({});
    });

    it('should handle errors gracefully in getAll', async () => {
      // 设置一些正常的偏好
      await preferenceService.set('valid-key', 'valid-value');
      
      // 模拟存储中有损坏的数据
      await mockStorage.setItem('pref:invalid-key', 'invalid-json{');
      
      const allPreferences = await preferenceService.getAll();
      
      // 应该返回有效的偏好，跳过无效的
      expect(allPreferences).toEqual({
        'valid-key': 'valid-value'
      });
    });
  });

  describe('键名管理', () => {
    it('should list all preference keys', async () => {
      await preferenceService.set('key1', 'value1');
      await preferenceService.set('key2', 'value2');
      
      const keys = await preferenceService.keys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should handle prefix correctly in storage', async () => {
      await preferenceService.set('test-key', 'test-value');
      
      // 直接检查存储中的键名应该带有前缀
      const storageValue = await mockStorage.getItem('pref:test-key');
      expect(storageValue).toBe('"test-value"');
      
      // 但是keys()方法应该返回不带前缀的键名
      const keys = await preferenceService.keys();
      expect(keys).toContain('test-key');
      expect(keys).not.toContain('pref:test-key');
    });
  });

  describe('数据类型处理', () => {
    it('should handle different data types', async () => {
      await preferenceService.set('string-key', 'string-value');
      await preferenceService.set('number-key', 42);
      await preferenceService.set('boolean-key', true);
      await preferenceService.set('object-key', { nested: 'value' });
      
      expect(await preferenceService.get('string-key', null)).toBe('string-value');
      expect(await preferenceService.get('number-key', null)).toBe(42);
      expect(await preferenceService.get('boolean-key', null)).toBe(true);
      expect(await preferenceService.get('object-key', null)).toEqual({ nested: 'value' });
    });

    it('should convert all values to strings in getAll', async () => {
      await preferenceService.set('string-key', 'string-value');
      await preferenceService.set('number-key', 42);
      await preferenceService.set('boolean-key', true);
      
      const allPreferences = await preferenceService.getAll();
      
      expect(allPreferences).toEqual({
        'string-key': 'string-value',
        'number-key': '42',
        'boolean-key': 'true'
      });
    });
  });

  describe('错误处理', () => {
    it('should handle storage errors in get', async () => {
      const mockStorageWithError = {
        getItem: vi.fn().mockRejectedValue(new Error('Storage error')),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        keys: vi.fn().mockResolvedValue([]),
        clear: vi.fn()
      };
      
      const serviceWithError = new PreferenceService(mockStorageWithError as any);
      
      await expect(serviceWithError.get('test-key', 'default')).rejects.toThrow('Failed to get preference');
    });

    it('should handle storage errors in set', async () => {
      const mockStorageWithError = {
        getItem: vi.fn(),
        setItem: vi.fn().mockRejectedValue(new Error('Storage error')),
        removeItem: vi.fn(),
        keys: vi.fn().mockResolvedValue([]),
        clear: vi.fn()
      };
      
      const serviceWithError = new PreferenceService(mockStorageWithError as any);
      
      await expect(serviceWithError.set('test-key', 'test-value')).rejects.toThrow('Failed to set preference');
    });
  });
});
