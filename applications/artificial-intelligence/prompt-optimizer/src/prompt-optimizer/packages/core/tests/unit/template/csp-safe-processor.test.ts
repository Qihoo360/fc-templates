import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CSPSafeTemplateProcessor } from '../../../src/services/template/csp-safe-processor';
import type { TemplateContext } from '../../../src/services/template/processor';

describe('CSPSafeTemplateProcessor', () => {
  describe('processContent', () => {
    it('should replace simple variables', () => {
      const content = 'Hello {{name}}!';
      const context: TemplateContext = { name: 'World' };
      
      const result = CSPSafeTemplateProcessor.processContent(content, context);
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const content = 'Hello {{name}}, you are {{age}} years old.';
      const context: TemplateContext = { name: 'Alice', age: '25' };
      
      const result = CSPSafeTemplateProcessor.processContent(content, context);
      expect(result).toBe('Hello Alice, you are 25 years old.');
    });

    it('should handle missing variables by replacing with empty string', () => {
      const content = 'Hello {{name}}, {{missing}} variable.';
      const context: TemplateContext = { name: 'Bob' };
      
      const result = CSPSafeTemplateProcessor.processContent(content, context);
      expect(result).toBe('Hello Bob,  variable.');
    });

    it('should handle variables with whitespace', () => {
      const content = 'Hello {{ name }}, welcome to {{ place }}.';
      const context: TemplateContext = { name: 'Charlie', place: 'the party' };
      
      const result = CSPSafeTemplateProcessor.processContent(content, context);
      expect(result).toBe('Hello Charlie, welcome to the party.');
    });

    it('should handle predefined template variables', () => {
      const content = 'Original: {{originalPrompt}}, Last: {{lastOptimizedPrompt}}, Input: {{iterateInput}}';
      const context: TemplateContext = {
        originalPrompt: 'Write a story',
        lastOptimizedPrompt: 'Write a creative story about space',
        iterateInput: 'Make it more dramatic'
      };
      
      const result = CSPSafeTemplateProcessor.processContent(content, context);
      expect(result).toBe('Original: Write a story, Last: Write a creative story about space, Input: Make it more dramatic');
    });

    it('should handle empty context', () => {
      const content = 'Hello {{name}}!';
      const context: TemplateContext = {};
      
      const result = CSPSafeTemplateProcessor.processContent(content, context);
      expect(result).toBe('Hello !');
    });

    it('should handle content without variables', () => {
      const content = 'This is a simple text without variables.';
      const context: TemplateContext = { name: 'Test' };
      
      const result = CSPSafeTemplateProcessor.processContent(content, context);
      expect(result).toBe('This is a simple text without variables.');
    });
  });

  describe('isExtensionEnvironment', () => {
    beforeEach(() => {
      // Clear any existing globals
      delete (global as any).chrome;
      delete (global as any).window;
      delete (global as any).navigator;
    });

    afterEach(() => {
      // Clean up
      delete (global as any).chrome;
      delete (global as any).window;
      delete (global as any).navigator;
    });

    it('should return false in Node.js environment (no window)', () => {
      expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
    });

    it('should return true for valid browser extension', () => {
      // Mock browser environment
      (global as any).window = {};
      (global as any).navigator = { userAgent: 'Chrome' };

      (global as any).chrome = {
        runtime: {
          getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test Extension' }))
        }
      };

      expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(true);
    });

    it('should return false when chrome is undefined', () => {
      (global as any).window = {};
      (global as any).navigator = { userAgent: 'Chrome' };

      expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
    });

    it('should return false when chrome.runtime is undefined', () => {
      (global as any).window = {};
      (global as any).navigator = { userAgent: 'Chrome' };
      (global as any).chrome = {};

      expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
    });

    it('should return false when chrome.runtime.getManifest is undefined', () => {
      (global as any).window = {};
      (global as any).navigator = { userAgent: 'Chrome' };
      (global as any).chrome = {
        runtime: {}
      };

      expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
    });

    it('should return false when getManifest throws error', () => {
      (global as any).window = {};
      (global as any).navigator = { userAgent: 'Chrome' };
      (global as any).chrome = {
        runtime: {
          getManifest: vi.fn(() => { throw new Error('Not available'); })
        }
      };

      expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
    });

    it('should return false when getManifest returns invalid manifest', () => {
      (global as any).window = {};
      (global as any).navigator = { userAgent: 'Chrome' };
      (global as any).chrome = {
        runtime: {
          getManifest: vi.fn(() => null)
        }
      };

      expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
    });

    describe('Electron environment detection', () => {
      it('should return false when window.require exists (Electron)', () => {
        (global as any).window = { require: vi.fn() };
        (global as any).navigator = { userAgent: 'Chrome' };
        (global as any).chrome = {
          runtime: {
            getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test' }))
          }
        };

        expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
      });

      it('should return false when window.electronAPI exists (Electron)', () => {
        (global as any).window = { electronAPI: {} };
        (global as any).navigator = { userAgent: 'Chrome' };
        (global as any).chrome = {
          runtime: {
            getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test' }))
          }
        };

        expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
      });

      it('should return false when window.electron exists (Electron)', () => {
        (global as any).window = { electron: {} };
        (global as any).navigator = { userAgent: 'Chrome' };
        (global as any).chrome = {
          runtime: {
            getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test' }))
          }
        };

        expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
      });

      it('should return false when user agent contains Electron', () => {
        (global as any).window = {};
        (global as any).navigator = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) MyApp/1.0.0 Chrome/120.0.0.0 Electron/28.0.0 Safari/537.36' };
        (global as any).chrome = {
          runtime: {
            getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test' }))
          }
        };

        expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(false);
      });

      it('should handle errors in Electron detection gracefully', () => {
        // Mock window that throws error when accessing properties
        const mockWindow = {};
        Object.defineProperty(mockWindow, 'require', {
          get: () => { throw new Error('Access denied'); }
        });

        (global as any).window = mockWindow;
        (global as any).navigator = { userAgent: 'Chrome' };
        (global as any).chrome = {
          runtime: {
            getManifest: vi.fn(() => ({ manifest_version: 3, name: 'Test' }))
          }
        };

        // Should still work and return true for valid extension
        expect(CSPSafeTemplateProcessor.isExtensionEnvironment()).toBe(true);
      });
    });
  });

  describe('validateTemplate', () => {
    it('should not warn for simple variable substitution', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      CSPSafeTemplateProcessor.validateTemplate('Hello {{name}}!');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should warn for unsupported Handlebars features', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const unsupportedTemplates = [
        '{{#if condition}}text{{/if}}',
        '{{#each items}}{{this}}{{/each}}',
        '{{#unless condition}}text{{/unless}}',
        '{{#with object}}{{property}}{{/with}}',
        '{{> partial}}',
        '{{& unescaped}}',
        '{{{unescaped}}}'
      ];

      unsupportedTemplates.forEach(template => {
        CSPSafeTemplateProcessor.validateTemplate(template);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Template contains unsupported Handlebars features')
        );
        consoleSpy.mockClear();
      });

      consoleSpy.mockRestore();
    });
  });
});
