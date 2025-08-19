import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TemplateProcessor } from '../../../src/services/template/processor';
import type { Template, TemplateContext } from '../../../src/services/template/processor';

describe('TemplateProcessor in Extension Environment', () => {
  beforeEach(() => {
    // Mock Chrome extension environment
    (global as any).chrome = {
      runtime: {
        getManifest: vi.fn(() => ({ name: 'Test Extension' }))
      }
    };
  });

  afterEach(() => {
    // Clean up
    delete (global as any).chrome;
  });

  it('should use CSP-safe processing in extension environment', () => {
    const template: Template = {
      id: 'test-template',
      name: 'Test Template',
      content: [
        {
          role: 'system',
          content: 'You are a {{role}} expert.'
        },
        {
          role: 'user',
          content: 'Please help me with: {{originalPrompt}}'
        }
      ],
      metadata: {
        version: '1.0',
        lastModified: Date.now(),
        templateType: 'optimize'
      }
    };

    const context: TemplateContext = {
      role: 'writing',
      originalPrompt: 'creating a novel'
    };

    // This should not throw a CSP error
    const result = TemplateProcessor.processTemplate(template, context);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'system',
      content: 'You are a writing expert.'
    });
    expect(result[1]).toEqual({
      role: 'user',
      content: 'Please help me with: creating a novel'
    });
  });

  it('should handle missing variables gracefully in extension environment', () => {
    const template: Template = {
      id: 'test-template',
      name: 'Test Template',
      content: [
        {
          role: 'system',
          content: 'Hello {{name}}, your {{missing}} variable is handled.'
        }
      ],
      metadata: {
        version: '1.0',
        lastModified: Date.now(),
        templateType: 'optimize'
      }
    };

    const context: TemplateContext = {
      name: 'User'
    };

    const result = TemplateProcessor.processTemplate(template, context);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: 'system',
      content: 'Hello User, your  variable is handled.'
    });
  });

  it('should warn about unsupported Handlebars features in extension environment', () => {
    // Mock extension environment
    (global as any).window = {};

    // Mock navigator safely
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Chrome' },
      writable: true,
      configurable: true
    });

    (global as any).chrome = {
      runtime: {
        getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test Extension' }))
      }
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const template: Template = {
      id: 'test-template',
      name: 'Test Template',
      content: [
        {
          role: 'system',
          content: '{{#if condition}}This won\'t work in extensions{{/if}}'
        }
      ],
      metadata: {
        version: '1.0',
        lastModified: Date.now(),
        templateType: 'optimize'
      }
    };

    const context: TemplateContext = {};

    // Should still process but warn about unsupported features
    const result = TemplateProcessor.processTemplate(template, context);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Template contains unsupported Handlebars features')
    );

    // The CSP-safe processor should handle this by doing simple variable replacement
    // Since {{#if condition}} and {{/if}} are not valid variables, they get replaced with empty strings
    // Only the text content "This won't work in extensions" remains
    expect(result[0].content).toBe('This won\'t work in extensions');

    consoleSpy.mockRestore();

    // Clean up
    delete (global as any).chrome;
    delete (global as any).window;
    delete (global as any).navigator;
  });

  it('should process predefined template variables correctly', () => {
    const template: Template = {
      id: 'iterate-template',
      name: 'Iterate Template',
      content: [
        {
          role: 'system',
          content: 'Original: {{originalPrompt}}'
        },
        {
          role: 'user',
          content: 'Last optimized: {{lastOptimizedPrompt}}, New input: {{iterateInput}}'
        }
      ],
      metadata: {
        version: '1.0',
        lastModified: Date.now(),
        templateType: 'iterate'
      }
    };

    const context: TemplateContext = {
      originalPrompt: 'Write a story',
      lastOptimizedPrompt: 'Write a creative story about space exploration',
      iterateInput: 'Make it more dramatic and add conflict'
    };

    const result = TemplateProcessor.processTemplate(template, context);

    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('Original: Write a story');
    expect(result[1].content).toBe('Last optimized: Write a creative story about space exploration, New input: Make it more dramatic and add conflict');
  });
});
