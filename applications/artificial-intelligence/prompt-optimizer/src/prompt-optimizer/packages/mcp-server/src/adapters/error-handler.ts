/**
 * 错误处理适配器
 * 
 * 将 Core 模块的错误转换为 MCP 协议兼容的错误格式
 */

import { McpError } from '@modelcontextprotocol/sdk/types.js';

// 定义 MCP 错误代码
export const MCP_ERROR_CODES = {
  INTERNAL_ERROR: -32000,
  PROMPT_OPTIMIZATION_FAILED: -32001,
  INVALID_PARAMS: -32602,
  METHOD_NOT_FOUND: -32601,
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600
} as const;

export class MCPErrorHandler {
  /**
   * 转换 Core 模块错误为 MCP 错误
   */
  static convertCoreError(error: Error): McpError {
    // 优化相关错误
    if (error.name.includes('OptimizationError') || error.name.includes('IterationError') || error.name.includes('TestError')) {
      return new McpError(
        MCP_ERROR_CODES.PROMPT_OPTIMIZATION_FAILED,
        `提示词优化失败: ${error.message}`,
        { originalError: error.name }
      );
    }

    // 参数验证错误
    if (error.message.includes('必须是') || error.message.includes('不能为空') || error.message.includes('过长')) {
      return new McpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        error.message,
        { originalError: error.name }
      );
    }

    // 配置相关错误
    if (error.message.includes('Model') || error.message.includes('API key') || error.message.includes('Template')) {
      return new McpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `配置错误: ${error.message}`,
        { originalError: error.name }
      );
    }

    // 默认内部错误
    return new McpError(
      MCP_ERROR_CODES.INTERNAL_ERROR,
      `内部错误: ${error.message}`,
      { originalError: error.name }
    );
  }

  /**
   * 创建参数验证错误
   */
  static createValidationError(message: string): McpError {
    return new McpError(MCP_ERROR_CODES.INVALID_PARAMS, `参数验证失败: ${message}`);
  }

  /**
   * 创建内部错误
   */
  static createInternalError(message: string): McpError {
    return new McpError(MCP_ERROR_CODES.INTERNAL_ERROR, message);
  }
}
