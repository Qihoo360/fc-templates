import { IStorageProvider } from '../../src/services/storage/types';
import { vi } from 'vitest';

/**
 * 创建模拟存储提供程序，用于测试
 */
export function createMockStorage(): IStorageProvider & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clearAll: ReturnType<typeof vi.fn>;
} {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => Promise.resolve(storage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clearAll: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
      return Promise.resolve();
    })
  };
} 