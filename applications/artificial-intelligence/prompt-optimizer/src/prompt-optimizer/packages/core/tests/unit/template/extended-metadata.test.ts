import { describe, it, expect, beforeEach } from 'vitest';
import { createTemplateManager } from '../../../src/services/template/manager';
import { createTemplateLanguageService } from '../../../src/services/template/languageService';
import { MemoryStorageProvider } from '../../../src/services/storage/memoryStorageProvider';
import { PreferenceService } from '../../../src/services/preference/service';

describe('Extended Metadata Fields Support', () => {
  let templateManager: any;
  let storageProvider: MemoryStorageProvider;
  let languageService: any;

  beforeEach(async () => {
    storageProvider = new MemoryStorageProvider();
    const preferenceService = new PreferenceService(storageProvider);
    languageService = createTemplateLanguageService(preferenceService);
    templateManager = createTemplateManager(storageProvider, languageService);

  });

  it('should save and retrieve template with custom metadata fields', async () => {
    const templateWithExtraFields = {
      id: 'test-extended-template',
      name: '扩展字段测试模板',
      content: '这是一个测试扩展字段的模板',
      metadata: {
        version: '1.0.0',
        lastModified: Date.now(),
        templateType: 'optimize' as const,
        // 基础可选字段
        author: '测试作者',
        description: '测试描述',
        language: 'zh' as const,
        // 额外自定义字段
        customField: '自定义内容',
        tags: ['测试', '扩展', '元数据'],
        priority: 5,
        category: '实验性',
        isExperimental: true,
        config: {
          maxTokens: 1000,
          temperature: 0.7
        }
      }
    };

    // 保存模板
    await templateManager.saveTemplate(templateWithExtraFields);

    // 获取模板
    const savedTemplate = await templateManager.getTemplate('test-extended-template');

    // 验证基础字段
    expect(savedTemplate.id).toBe('test-extended-template');
    expect(savedTemplate.name).toBe('扩展字段测试模板');
    expect(savedTemplate.metadata.version).toBe('1.0.0');
    expect(savedTemplate.metadata.templateType).toBe('optimize');
    expect(savedTemplate.metadata.author).toBe('测试作者');
    expect(savedTemplate.metadata.description).toBe('测试描述');
    expect(savedTemplate.metadata.language).toBe('zh');

    // 验证额外字段
    expect(savedTemplate.metadata.customField).toBe('自定义内容');
    expect(savedTemplate.metadata.tags).toEqual(['测试', '扩展', '元数据']);
    expect(savedTemplate.metadata.priority).toBe(5);
    expect(savedTemplate.metadata.category).toBe('实验性');
    expect(savedTemplate.metadata.isExperimental).toBe(true);
    expect(savedTemplate.metadata.config).toEqual({
      maxTokens: 1000,
      temperature: 0.7
    });
  });

  it('should export and import template with custom metadata fields', async () => {
    const templateWithExtraFields = {
      id: 'test-export-import',
      name: '导出导入测试',
      content: '测试导出导入功能',
      metadata: {
        version: '1.0.0',
        lastModified: Date.now(),
        templateType: 'iterate' as const,
        customData: {
          nested: {
            value: 'deep nesting test'
          }
        },
        arrayField: [1, 2, 3, { key: 'value' }],
        booleanField: false,
        numberField: 42.5
      }
    };

    // 保存原始模板
    await templateManager.saveTemplate(templateWithExtraFields);

    // 导出模板
    const exportedJson = await templateManager.exportTemplate('test-export-import');
    
    // 删除原模板
    await templateManager.deleteTemplate('test-export-import');

    // 导入模板
    await templateManager.importTemplate(exportedJson);

    // 验证导入的模板
    const importedTemplate = await templateManager.getTemplate('test-export-import');
    
    expect(importedTemplate.metadata.customData).toEqual({
      nested: {
        value: 'deep nesting test'
      }
    });
    expect(importedTemplate.metadata.arrayField).toEqual([1, 2, 3, { key: 'value' }]);
    expect(importedTemplate.metadata.booleanField).toBe(false);
    expect(importedTemplate.metadata.numberField).toBe(42.5);
  });

  it('should maintain core field validation while allowing extra fields', async () => {
    // 测试缺少必需字段时仍然会报错
    const invalidTemplate = {
      id: 'invalid-template',
      name: '无效模板',
      content: '测试内容',
      metadata: {
        // 缺少必需的 version 字段
        lastModified: Date.now(),
        templateType: 'optimize' as const,
        customField: '这个自定义字段应该被忽略'
      }
    };

    await expect(templateManager.saveTemplate(invalidTemplate as any))
      .rejects.toThrow('Template validation failed');
  });

  it('should handle templates with mixed field types in metadata', async () => {
    const mixedFieldsTemplate = {
      id: 'mixed-fields-test',
      name: '混合字段测试',
      content: '测试各种数据类型',
      metadata: {
        version: '2.0.0',
        lastModified: Date.now(),
        templateType: 'userOptimize' as const,
        // 不同类型的自定义字段
        stringField: 'string value',
        numberField: 123,
        booleanField: true,
        arrayField: ['a', 'b', 'c'],
        objectField: { nested: 'value' },
        nullField: null,
        undefinedField: undefined
      }
    };

    await templateManager.saveTemplate(mixedFieldsTemplate);
    const savedTemplate = await templateManager.getTemplate('mixed-fields-test');

    expect(savedTemplate.metadata.stringField).toBe('string value');
    expect(savedTemplate.metadata.numberField).toBe(123);
    expect(savedTemplate.metadata.booleanField).toBe(true);
    expect(savedTemplate.metadata.arrayField).toEqual(['a', 'b', 'c']);
    expect(savedTemplate.metadata.objectField).toEqual({ nested: 'value' });
    expect(savedTemplate.metadata.nullField).toBe(null);
    // undefined 字段在JSON序列化后通常会被忽略
  });
}); 