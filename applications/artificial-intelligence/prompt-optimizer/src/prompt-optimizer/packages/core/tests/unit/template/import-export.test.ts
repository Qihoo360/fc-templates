import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TemplateManager } from '../../../src/services/template/manager';
import { Template } from '../../../src/services/template/types';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';
import { TemplateLanguageService } from '../../../src/services/template/languageService';
import { PreferenceService } from '../../../src/services/preference/service';

describe('TemplateManager Import/Export', () => {
  let templateManager: TemplateManager;
  let storageProvider: MemoryStorageProvider;
  let languageService: TemplateLanguageService;
  let preferenceService: PreferenceService;

  beforeEach(async () => {
    storageProvider = new MemoryStorageProvider();
    await storageProvider.clearAll();

    preferenceService = new PreferenceService(storageProvider);
    languageService = new TemplateLanguageService(preferenceService);
    await languageService.initialize();
    templateManager = new TemplateManager(storageProvider, languageService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('exportData', () => {
    it('should export only user templates', async () => {
      // 添加用户模板
      const userTemplate: Template = {
        id: 'user-template-1',
        name: 'User Template 1',
        content: 'User template content',
        isBuiltin: false,
        metadata: {
          version: '1.0.0',
          lastModified: Date.now(),
          templateType: 'optimize',
          author: 'User'
        }
      };

      await templateManager.saveTemplate(userTemplate);

      // 导出数据
      const exportedData = await templateManager.exportData();

      // 验证导出的数据
      expect(Array.isArray(exportedData)).toBe(true);
      
      // 应该只包含用户模板，不包含内置模板
      const userTemplates = exportedData.filter(template => !template.isBuiltin);
      const builtinTemplates = exportedData.filter(template => template.isBuiltin);
      
      expect(userTemplates.length).toBeGreaterThan(0);
      expect(builtinTemplates.length).toBe(0);

      // 验证用户模板内容
      const exportedUserTemplate = exportedData.find(template => template.id === 'user-template-1');
      expect(exportedUserTemplate).toBeDefined();
      expect(exportedUserTemplate?.name).toBe('User Template 1');
    });

    it('should export empty array when no user templates exist', async () => {
      const exportedData = await templateManager.exportData();
      
      // 应该返回空数组（只有内置模板，不导出）
      expect(Array.isArray(exportedData)).toBe(true);
      expect(exportedData.length).toBe(0);
    });

    it('should handle export error gracefully', async () => {
      // 模拟listTemplates错误
      vi.spyOn(templateManager, 'listTemplates').mockRejectedValue(new Error('Storage error'));

      await expect(templateManager.exportData()).rejects.toThrow('Failed to export template data');
    });
  });

  describe('importData', () => {
    it('should replace existing user templates', async () => {
      // 先添加一些用户模板
      const existingTemplate: Template = {
        id: 'existing-template',
        name: 'Existing Template',
        content: 'Existing content',
        isBuiltin: false,
        metadata: {
          version: '1.0.0',
          lastModified: Date.now(),
          templateType: 'optimize',
          author: 'User'
        }
      };

      await templateManager.saveTemplate(existingTemplate);

      // 验证模板存在
      const beforeImport = await templateManager.listTemplates();
      const existingUserTemplates = beforeImport.filter(t => !t.isBuiltin);
      expect(existingUserTemplates.length).toBe(1);

      // 导入新模板
      const importData: Template[] = [
        {
          id: 'imported-template-1',
          name: 'Imported Template 1',
          content: 'Imported content 1',
          isBuiltin: false,
          metadata: {
            version: '1.0.0',
            lastModified: Date.now(),
            templateType: 'optimize',
            author: 'User'
          }
        },
        {
          id: 'imported-template-2',
          name: 'Imported Template 2',
          content: 'Imported content 2',
          isBuiltin: false,
          metadata: {
            version: '1.0.0',
            lastModified: Date.now(),
            templateType: 'iterate',
            author: 'User'
          }
        }
      ];

      await templateManager.importData(importData);

      // 验证替换模式：旧模板被删除，新模板被添加
      const afterImport = await templateManager.listTemplates();
      const userTemplates = afterImport.filter(t => !t.isBuiltin);
      
      expect(userTemplates.length).toBe(2);
      expect(userTemplates.find(t => t.id === 'existing-template')).toBeUndefined();
      expect(userTemplates.find(t => t.id === 'imported-template-1')).toBeDefined();
      expect(userTemplates.find(t => t.id === 'imported-template-2')).toBeDefined();
    });

    it('should handle builtin template ID conflicts', async () => {
      // 获取内置模板列表
      const allTemplates = await templateManager.listTemplates();
      const builtinTemplates = allTemplates.filter(t => t.isBuiltin);
      
      if (builtinTemplates.length === 0) {
        // 如果没有内置模板，跳过这个测试
        return;
      }

      const builtinTemplate = builtinTemplates[0];

      // 尝试导入与内置模板ID冲突的模板
      const importData: Template[] = [
        {
          id: builtinTemplate.id, // 使用内置模板的ID
          name: 'Conflicting Template',
          content: 'Conflicting content',
          isBuiltin: false,
          metadata: {
            version: '1.0.0',
            lastModified: Date.now(),
            templateType: 'optimize',
            author: 'User'
          }
        }
      ];

      await templateManager.importData(importData);

      // 验证冲突处理：应该生成新的ID和名称
      const afterImport = await templateManager.listTemplates();
      const userTemplates = afterImport.filter(t => !t.isBuiltin);
      
      expect(userTemplates.length).toBe(1);
      
      const importedTemplate = userTemplates[0];
      expect(importedTemplate.id).not.toBe(builtinTemplate.id); // ID应该被修改
      expect(importedTemplate.id).toMatch(/^user-.*-\d+-[a-z0-9]+$/); // 应该匹配生成的ID格式
      expect(importedTemplate.name).toBe('Conflicting Template (导入副本)'); // 名称应该被修改
    });

    it('should preserve template metadata and set defaults', async () => {
      const importData: Template[] = [
        {
          id: 'metadata-template',
          name: 'Metadata Template',
          content: 'Template with metadata',
          isBuiltin: true, // 应该被强制设置为false
          metadata: {
            version: '2.0.0',
            lastModified: 1000000, // 应该被更新为当前时间
            templateType: 'iterate',
            author: 'Original Author',
            description: 'Original description',
            language: 'en'
          }
        }
      ];

      await templateManager.importData(importData);

      const afterImport = await templateManager.listTemplates();
      const userTemplates = afterImport.filter(t => !t.isBuiltin);
      const importedTemplate = userTemplates.find(t => t.id === 'metadata-template');

      expect(importedTemplate).toBeDefined();
      expect(importedTemplate?.isBuiltin).toBe(false); // 应该被强制设置为false
      expect(importedTemplate?.metadata.version).toBe('2.0.0'); // 保持原值
      expect(importedTemplate?.metadata.lastModified).toBeGreaterThan(1000000); // 应该被更新
      expect(importedTemplate?.metadata.templateType).toBe('iterate'); // 保持原值
      expect(importedTemplate?.metadata.author).toBe('Original Author'); // 保持原值
      expect(importedTemplate?.metadata.description).toBe('Original description'); // 保持原值
      expect(importedTemplate?.metadata.language).toBe('en'); // 被规范化为有效值
    });

    it('should provide default metadata for incomplete templates', async () => {
      const importData: Template[] = [
        {
          id: 'minimal-template',
          name: 'Minimal Template',
          content: 'Minimal content',
          isBuiltin: false,
          metadata: {
            // 只提供部分metadata
            author: 'Test Author'
          } as any
        }
      ];

      await templateManager.importData(importData);

      const afterImport = await templateManager.listTemplates();
      const userTemplates = afterImport.filter(t => !t.isBuiltin);
      const importedTemplate = userTemplates.find(t => t.id === 'minimal-template');

      expect(importedTemplate).toBeDefined();
      expect(importedTemplate?.metadata.version).toBe('1.0.0'); // 默认值
      expect(importedTemplate?.metadata.templateType).toBe('optimize'); // 默认值
      expect(importedTemplate?.metadata.author).toBe('Test Author'); // 保持原值
      expect(importedTemplate?.metadata.lastModified).toBeGreaterThan(0); // 应该被设置
    });

    it('should skip invalid templates', async () => {
      const importData = [
        {
          // 缺少id字段
          name: 'Invalid Template 1',
          content: 'Invalid content 1',
          isBuiltin: false,
          metadata: {
            version: '1.0.0',
            lastModified: Date.now(),
            templateType: 'optimize',
            author: 'User'
          }
        },
        {
          id: 'valid-template',
          name: 'Valid Template',
          content: 'Valid content',
          isBuiltin: false,
          metadata: {
            version: '1.0.0',
            lastModified: Date.now(),
            templateType: 'optimize',
            author: 'User'
          }
        }
      ];

      // 应该不抛出错误，只是跳过无效模板
      await expect(templateManager.importData(importData)).resolves.not.toThrow();

      // 验证有效模板被导入
      const afterImport = await templateManager.listTemplates();
      const userTemplates = afterImport.filter(t => !t.isBuiltin);
      expect(userTemplates.length).toBe(1);
      expect(userTemplates[0].id).toBe('valid-template');
    });

    it('should handle import errors gracefully', async () => {
      const importData: Template[] = [
        {
          id: 'error-template',
          name: 'Error Template',
          content: 'Error content',
          isBuiltin: false,
          metadata: {
            version: '1.0.0',
            lastModified: Date.now(),
            templateType: 'optimize',
            author: 'User'
          }
        }
      ];

      // 模拟saveTemplate错误
      vi.spyOn(templateManager, 'saveTemplate').mockRejectedValue(new Error('Save template error'));

      // 应该不抛出错误，只是记录失败
      await expect(templateManager.importData(importData)).resolves.not.toThrow();
    });
  });

  describe('validateData', () => {
    it('should validate correct template data', async () => {
      const validData: Template[] = [
        {
          id: 'test-template',
          name: 'Test Template',
          content: 'Test content',
          isBuiltin: false,
          metadata: {
            version: '1.0.0',
            lastModified: Date.now(),
            templateType: 'optimize',
            author: 'User'
          }
        }
      ];

      expect(await templateManager.validateData(validData)).toBe(true);
    });

    it('should reject invalid data formats', async () => {
      // 非数组
      expect(await templateManager.validateData({})).toBe(false);
      expect(await templateManager.validateData('string')).toBe(false);
      expect(await templateManager.validateData(null)).toBe(false);

      // 缺少必需字段
      expect(await templateManager.validateData([
        {
          name: 'Test Template',
          // 缺少id
          content: 'Test content',
          isBuiltin: false,
          metadata: {}
        }
      ])).toBe(false);

      // 字段类型错误
      expect(await templateManager.validateData([
        {
          id: 'test-template',
          name: 123, // 应该是字符串
          content: 'Test content',
          isBuiltin: false,
          metadata: {}
        }
      ])).toBe(false);
    });
  });

  describe('getDataType', () => {
    it('should return correct data type', async () => {
      expect(await templateManager.getDataType()).toBe('userTemplates');
    });
  });
});
