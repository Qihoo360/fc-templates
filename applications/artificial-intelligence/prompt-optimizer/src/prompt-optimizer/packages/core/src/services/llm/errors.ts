/**
 * 基础错误类
 */
export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // 确保原型链正确
  }
}

/**
 * API错误
 * 用于表示API调用过程中的错误
 */
export class APIError extends BaseError {
  constructor(message: string) {
    super(`API错误: ${message}`);
  }
}

/**
 * 请求配置错误
 * 用于表示请求配置验证失败的错误
 */
export class RequestConfigError extends BaseError {
  constructor(message: string) {
    super(`配置错误: ${message}`);
  }
}

/**
 * 验证错误
 * 用于表示参数验证失败的错误
 */
export class ValidationError extends BaseError {
  constructor(message: string) {
    super(`验证错误: ${message}`);
  }
}

/**
 * 初始化错误
 * 用于表示服务初始化失败的错误
 */
export class InitializationError extends BaseError {
  constructor(message: string) {
    super(`初始化错误: ${message}`);
  }
}

/**
 * LLM服务基础错误
 */
export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * 模型配置错误
 */
export class ModelConfigError extends LLMError {
  constructor(message: string) {
    super(message);
    this.name = 'ModelConfigError';
  }
}

// 添加统一错误常量
export const ERROR_MESSAGES = {
  API_KEY_REQUIRED: '优化失败: API密钥不能为空',
  MODEL_NOT_FOUND: '优化失败: 模型不存在',
  TEMPLATE_INVALID: '优化失败: 提示词格式无效',
  EMPTY_INPUT: '优化失败: 提示词不能为空',
  OPTIMIZATION_FAILED: '优化失败',
  ITERATION_FAILED: '迭代失败',
  TEST_FAILED: '测试失败',
  MODEL_KEY_REQUIRED: '优化失败: 模型Key不能为空',
  INPUT_TOO_LONG: '优化失败: 输入内容过长'
} as const; 