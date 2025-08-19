import { Template } from './types';
import { Message } from '../llm/types';
import { Handlebars } from './minimal';
import { CSPSafeTemplateProcessor } from './csp-safe-processor';
import type { OptimizationMode } from '../prompt/types';

/**
 * 模板变量上下文
 */
export interface TemplateContext {
  originalPrompt?: string;
  iterateInput?: string;
  lastOptimizedPrompt?: string;
  optimizationMode?: OptimizationMode;  // 优化模式
  // Allow additional string properties for template flexibility
  // but with stricter typing than the previous implementation
  [key: string]: string | undefined;
}

/**
 * Simplified template processor with organized methods
 */
export class TemplateProcessor {
  /**
   * Process template and return message array
   */
  static processTemplate(template: Template, context: TemplateContext): Message[] {
    // Validate template content
    this.validateTemplate(template);
    
    // Validate context compatibility
    this.validateContextCompatibility(template, context);
    
    // Build messages based on template type
    return this.buildMessages(template, context);
  }

  /**
   * Validate template content
   */
  private static validateTemplate(template: Template): void {
    if (!template?.content) {
      throw new Error(`Template content is missing or invalid for template: ${template?.id || 'unknown'}`);
    }

    // Check for empty array content
    if (Array.isArray(template.content) && template.content.length === 0) {
      throw new Error(`Template content cannot be empty for template: ${template.id}`);
    }
  }

  /**
   * Validate context compatibility with template type
   */
  private static validateContextCompatibility(template: Template, context: TemplateContext): void {
    // Check that iteration context requires advanced template
    const isIterateContext = context.originalPrompt && context.iterateInput;
    if (isIterateContext && typeof template.content === 'string') {
      throw new Error(
        `Iteration context requires advanced template (message array format) for variable substitution.\n` +
        `Template ID: ${template.id}\n` +
        `Current template type: Simple template (string format)\n` +
        `Suggestion: Please use message array format template that supports variable substitution`
      );
    }
  }

  /**
   * Build messages from template
   */
  private static buildMessages(template: Template, context: TemplateContext): Message[] {
    // Simple template: no template technology, directly use as system prompt
    if (typeof template.content === 'string') {
      const messages: Message[] = [
        { role: 'system', content: template.content }
      ];
      
      // Add user message - pass user content directly without template replacement
      if (context.originalPrompt) {
        messages.push({ role: 'user', content: context.originalPrompt });
      }
      
      return messages;
    }

    // Advanced template: use template technology for variable substitution
    if (Array.isArray(template.content)) {
      // Check if we're in a browser extension environment with CSP restrictions
      if (CSPSafeTemplateProcessor.isExtensionEnvironment()) {
        return template.content.map(msg => {
          // Validate template content for CSP-safe processing
          CSPSafeTemplateProcessor.validateTemplate(msg.content);

          return {
            role: msg.role,
            content: CSPSafeTemplateProcessor.processContent(msg.content, context)
          };
        });
      } else {
        // Use full Handlebars functionality in non-CSP environments
        return template.content.map(msg => ({
          role: msg.role,
          content: Handlebars.compile(msg.content, { noEscape: true })(context)
        }));
      }
    }

    throw new Error(`Invalid template content format for template: ${template.id}`);
  }

  /**
   * Check if template is simple type
   */
  static isSimpleTemplate(template: Template): boolean {
    return typeof template.content === 'string';
  }
} 