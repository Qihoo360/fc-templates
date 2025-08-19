/**
 * 提示词服务基础错误
 */
export class PromptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromptError';
  }
}

/**
 * 优化错误
 */
export class OptimizationError extends PromptError {
  constructor(
    message: string,
    public originalPrompt: string
  ) {
    super(message);
    this.name = 'OptimizationError';
  }
}

/**
 * 迭代错误
 */
export class IterationError extends PromptError {
  constructor(
    message: string,
    public originalPrompt: string,
    public iterateInput: string
  ) {
    super(message);
    this.name = 'IterationError';
  }
}

/**
 * 测试错误
 */
export class TestError extends PromptError {
  constructor(
    message: string,
    public prompt: string,
    public testInput: string
  ) {
    super(message);
    this.name = 'TestError';
  }
}

/**
 * 服务依赖错误
 */
export class ServiceDependencyError extends PromptError {
  constructor(
    message: string,
    public serviceName: string
  ) {
    super(message);
    this.name = 'ServiceDependencyError';
  }
} 