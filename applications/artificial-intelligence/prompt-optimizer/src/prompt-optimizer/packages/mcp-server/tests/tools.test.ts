/**
 * MCP Tools 基础测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CoreServicesManager } from '../src/adapters/core-services.js';
import { ParameterValidator } from '../src/adapters/parameter-adapter.js';
import { MCPErrorHandler, MCP_ERROR_CODES } from '../src/adapters/error-handler.js';

describe('MCP Server Tools', () => {
  let coreServices: CoreServicesManager;

  beforeAll(async () => {
    // 设置测试环境变量
    process.env.MCP_DEFAULT_MODEL_API_KEY = 'test-key';
    process.env.MCP_DEFAULT_MODEL_PROVIDER = 'openai';
    process.env.MCP_DEFAULT_MODEL_NAME = 'gpt-4';

    coreServices = CoreServicesManager.getInstance();
    
    // 注意：这里只测试初始化，不测试实际的 LLM 调用
    // 实际的 LLM 调用需要真实的 API 密钥
  });

  describe('ParameterValidator', () => {
    it('应该正确验证提示词输入', () => {
      expect(() => ParameterValidator.validatePrompt('有效的提示词')).not.toThrow();
      expect(() => ParameterValidator.validatePrompt('')).toThrow('提示词必须是非空字符串');
      expect(() => ParameterValidator.validatePrompt('   ')).toThrow('提示词必须是非空字符串');
      expect(() => ParameterValidator.validatePrompt('a'.repeat(60000))).toThrow('提示词过长');
    });

    it('应该正确验证需求输入', () => {
      expect(() => ParameterValidator.validateRequirements('有效的需求描述')).not.toThrow();
      expect(() => ParameterValidator.validateRequirements('')).toThrow('需求描述必须是非空字符串');
      expect(() => ParameterValidator.validateRequirements('   ')).toThrow('需求描述必须是非空字符串');
      expect(() => ParameterValidator.validateRequirements('a'.repeat(15000))).toThrow('需求描述过长');
    });

    it('应该正确验证模板输入', () => {
      expect(() => ParameterValidator.validateTemplate('valid-template')).not.toThrow();
      expect(() => ParameterValidator.validateTemplate(undefined)).not.toThrow();
      expect(() => ParameterValidator.validateTemplate('')).toThrow('模板必须是非空字符串');
      expect(() => ParameterValidator.validateTemplate('   ')).toThrow('模板必须是非空字符串');
    });
  });

  describe('MCPErrorHandler', () => {
    it('应该正确转换验证错误', () => {
      const error = new Error('提示词必须是非空字符串');
      const mcpError = MCPErrorHandler.convertCoreError(error);

      expect(mcpError.code).toBe(MCP_ERROR_CODES.INVALID_PARAMS); // -32602
      expect(mcpError.message).toContain('提示词必须是非空字符串');
    });

    it('应该正确转换优化错误', () => {
      const error = new Error('优化失败');
      error.name = 'OptimizationError';
      const mcpError = MCPErrorHandler.convertCoreError(error);

      expect(mcpError.code).toBe(MCP_ERROR_CODES.PROMPT_OPTIMIZATION_FAILED); // -32001
      expect(mcpError.message).toContain('提示词优化失败');
    });

    it('应该将未知错误处理为内部错误', () => {
      const error = new Error('未知错误');
      const mcpError = MCPErrorHandler.convertCoreError(error);

      expect(mcpError.code).toBe(MCP_ERROR_CODES.INTERNAL_ERROR); // -32000
      expect(mcpError.message).toContain('内部错误');
    });

    it('应该正确创建验证错误', () => {
      const mcpError = MCPErrorHandler.createValidationError('测试验证错误');

      expect(mcpError.code).toBe(MCP_ERROR_CODES.INVALID_PARAMS);
      expect(mcpError.message).toContain('参数验证失败: 测试验证错误');
    });

    it('应该正确创建内部错误', () => {
      const mcpError = MCPErrorHandler.createInternalError('测试内部错误');

      expect(mcpError.code).toBe(MCP_ERROR_CODES.INTERNAL_ERROR);
      expect(mcpError.message).toContain('测试内部错误');
    });
  });
});
