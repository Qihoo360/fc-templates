import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TemplateLanguageService } from '../../../src/services/template/languageService';
import { createMockStorage } from '../../mocks/mockStorage';
import { PreferenceService } from '../../../src/services/preference/service';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';

describe('TemplateLanguageService', () => {
  let service: TemplateLanguageService;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockPreferenceService: PreferenceService;

  beforeEach(() => {
    // Mock navigator.language to English for consistent test environment
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      configurable: true
    });

    mockStorage = createMockStorage();
    const memoryStorage = new MemoryStorageProvider();
    mockPreferenceService = new PreferenceService(memoryStorage);
    service = new TemplateLanguageService(mockPreferenceService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default language when no saved preference', async () => {
      mockStorage.getItem.mockResolvedValue(null);

      await service.initialize();

      expect(await service.getCurrentLanguage()).toBe('en-US');
      expect(service.isInitialized()).toBe(true);
    });

    it('should load saved language preference', async () => {
      // Mock PreferenceService to return saved language
      vi.spyOn(mockPreferenceService, 'get').mockResolvedValue('en-US');

      await service.initialize();

      expect(await service.getCurrentLanguage()).toBe('en-US');
      expect(mockPreferenceService.get).toHaveBeenCalledWith('app:settings:ui:builtin-template-language', null);
    });

    it('should fallback to default language on invalid saved preference', async () => {
      vi.spyOn(mockPreferenceService, 'get').mockResolvedValue('invalid-lang');

      await service.initialize();

      expect(await service.getCurrentLanguage()).toBe('en-US');
    });

    it('should handle storage errors gracefully', async () => {
      vi.spyOn(mockPreferenceService, 'get').mockRejectedValue(new Error('Storage error'));

      await service.initialize();

      expect(await service.getCurrentLanguage()).toBe('en-US');
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('language management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should set language successfully', async () => {
      vi.spyOn(mockPreferenceService, 'set').mockResolvedValue();

      await service.setLanguage('en-US');

      expect(await service.getCurrentLanguage()).toBe('en-US');
      expect(mockPreferenceService.set).toHaveBeenCalledWith('app:settings:ui:builtin-template-language', 'en-US');
    });

    it('should reject invalid language', async () => {
      await expect(service.setLanguage('invalid-lang' as any)).rejects.toThrow(
        'Unsupported language: invalid-lang'
      );
    });

    it('should toggle between languages', async () => {
      // Start with detected language (en-US in test environment)
      expect(await service.getCurrentLanguage()).toBe('en-US');

      // Toggle to Chinese
      const newLang1 = await service.toggleLanguage();
      expect(newLang1).toBe('zh-CN');
      expect(await service.getCurrentLanguage()).toBe('zh-CN');

      // Toggle back to English
      const newLang2 = await service.toggleLanguage();
      expect(newLang2).toBe('en-US');
      expect(await service.getCurrentLanguage()).toBe('en-US');
    });
  });

  describe('utility methods', () => {
    it('should validate languages correctly', async () => {
      expect(await service.isValidLanguage('zh-CN')).toBe(true);
      expect(await service.isValidLanguage('en-US')).toBe(true);
      expect(await service.isValidLanguage('fr-FR')).toBe(false);
      expect(await service.isValidLanguage('')).toBe(false);
    });
  });

  describe('browser language detection', () => {
    it('should detect Chinese browser language', async () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'zh-CN',
        configurable: true
      });

      const memoryStorage = new MemoryStorageProvider();
      const newPreferenceService = new PreferenceService(memoryStorage);
      const newService = new TemplateLanguageService(newPreferenceService);
      await newService.initialize();

      expect(await newService.getCurrentLanguage()).toBe('zh-CN');
    });

    it('should detect English browser language', async () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      });

      const memoryStorage = new MemoryStorageProvider();
      const newPreferenceService = new PreferenceService(memoryStorage);
      const newService = new TemplateLanguageService(newPreferenceService);
      await newService.initialize();

      expect(await newService.getCurrentLanguage()).toBe('en-US');
    });

    it('should default to English for unsupported browser languages', async () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });

      const memoryStorage = new MemoryStorageProvider();
      const newPreferenceService = new PreferenceService(memoryStorage);
      const newService = new TemplateLanguageService(newPreferenceService);
      await newService.initialize();

      expect(await newService.getCurrentLanguage()).toBe('en-US');
    });
  });

  describe('instance behavior', () => {
    it('should create independent instances', () => {
      const memoryStorage1 = new MemoryStorageProvider();
      const preferenceService1 = new PreferenceService(memoryStorage1);
      const memoryStorage2 = new MemoryStorageProvider();
      const preferenceService2 = new PreferenceService(memoryStorage2);

      const instance1 = new TemplateLanguageService(preferenceService1);
      const instance2 = new TemplateLanguageService(preferenceService2);

      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(TemplateLanguageService);
      expect(instance2).toBeInstanceOf(TemplateLanguageService);
    });
  });
});
