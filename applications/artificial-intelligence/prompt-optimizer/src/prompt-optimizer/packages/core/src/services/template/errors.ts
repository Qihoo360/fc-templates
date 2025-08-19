/**
 * 提示词错误基类
 */
export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

/**
 * 提示词加载错误
 */
export class TemplateLoadError extends TemplateError {
  constructor(
    message: string,
    public templateId: string
  ) {
    super(message);
    this.name = 'TemplateLoadError';
  }
}

/**
 * 提示词验证错误
 */
export class TemplateValidationError extends TemplateError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateValidationError';
  }
}

/**
 * 提示词缓存错误
 */
export class TemplateCacheError extends TemplateError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateCacheError';
  }
}

/**
 * 提示词存储错误
 */
export class TemplateStorageError extends TemplateError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateStorageError';
  }
} 