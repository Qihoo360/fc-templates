/**
 * 模型基础错误
 */
export class ModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelError';
  }
}

/**
 * 模型配置错误
 */
export class ModelConfigError extends ModelError {
  constructor(message: string) {
    super(message);
    this.name = 'ModelConfigError';
  }
}

/**
 * 模型验证错误
 */
export class ModelValidationError extends ModelError {
  constructor(
    message: string,
    public errors: string[]
  ) {
    super(message);
    this.name = 'ModelValidationError';
  }
} 