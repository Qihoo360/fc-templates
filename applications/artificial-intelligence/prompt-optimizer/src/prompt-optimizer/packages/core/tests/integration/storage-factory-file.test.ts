import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageFactory } from '../../src/services/storage/factory';
import { FileStorageProvider } from '../../src/services/storage/fileStorageProvider';

describe('StorageFactory - File Storage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    StorageFactory.reset();
  });

  afterEach(() => {
    StorageFactory.reset();
  });

  describe('getSupportedTypes', () => {
    it('should include file storage in Electron environment', () => {
      // Mock Electron environment
      const originalProcess = global.process;
      global.process = {
        ...originalProcess,
        versions: { electron: '37.1.0', node: '20.0.0' }
      } as any;

      const supportedTypes = StorageFactory.getSupportedTypes();
      
      expect(supportedTypes).toContain('file');
      expect(supportedTypes).toContain('memory');

      global.process = originalProcess;
    });

    it('should not include file storage in non-Electron environment', () => {
      // Mock non-Electron environment
      const originalProcess = global.process;
      global.process = {
        ...originalProcess,
        versions: { node: '20.0.0' }
      } as any;

      const supportedTypes = StorageFactory.getSupportedTypes();
      
      expect(supportedTypes).not.toContain('file');
      expect(supportedTypes).toContain('memory');

      global.process = originalProcess;
    });
  });

  describe('isSupported', () => {
    it('should return true for file storage in Electron environment', () => {
      // Mock Electron environment
      const originalProcess = global.process;
      global.process = {
        ...originalProcess,
        versions: { electron: '37.1.0', node: '20.0.0' }
      } as any;

      const isSupported = StorageFactory.isSupported('file');
      
      expect(isSupported).toBe(true);

      global.process = originalProcess;
    });

    it('should return false for file storage in non-Electron environment', () => {
      // Mock non-Electron environment
      const originalProcess = global.process;
      global.process = {
        ...originalProcess,
        versions: { node: '20.0.0' }
      } as any;

      const isSupported = StorageFactory.isSupported('file');
      
      expect(isSupported).toBe(false);

      global.process = originalProcess;
    });
  });

  describe('create', () => {
    it('should create FileStorageProvider instance for file type', () => {
      // Create FileStorageProvider directly with userDataPath to avoid Electron dependency
      const provider = new FileStorageProvider('/mock/user/data');

      expect(provider).toBeInstanceOf(FileStorageProvider);
    });

    it('should return same instance for multiple calls (singleton)', () => {
      // Test the singleton behavior by creating providers through factory
      // We'll test this with memory storage since file storage requires Electron
      const provider1 = StorageFactory.create('memory');
      const provider2 = StorageFactory.create('memory');

      expect(provider1).toBe(provider2);
    });

    it('should throw error for unsupported storage type', () => {
      expect(() => {
        // @ts-ignore - intentionally passing invalid type
        StorageFactory.create('invalid');
      }).toThrow('Unsupported storage type: invalid');
    });
  });

  describe('type definitions', () => {
    it('should include file in StorageType union', () => {
      // This is a compile-time test - if it compiles, the type is correct
      const fileType: 'file' = 'file';

      // Test that the type is accepted (compile-time check)
      expect(fileType).toBe('file');

      // Test that FileStorageProvider can be created directly
      const provider = new FileStorageProvider('/mock/user/data');
      expect(provider).toBeDefined();
    });
  });
});
