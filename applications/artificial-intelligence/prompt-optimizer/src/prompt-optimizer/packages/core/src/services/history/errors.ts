/**
 * 历史记录基础错误
 */
export class HistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HistoryError';
  }
}

/**
 * 历史记录未找到错误
 */
export class HistoryNotFoundError extends HistoryError {
  constructor(id: string) {
    super(`未找到ID为${id}的历史记录`);
    this.name = 'HistoryNotFoundError';
  }
}

/**
 * 历史记录链错误
 */
export class HistoryChainError extends HistoryError {
  constructor(message: string) {
    super(message);
    this.name = 'HistoryChainError';
  }
}

/**
 * 记录不存在错误
 */
export class RecordNotFoundError extends HistoryError {
  constructor(
    message: string,
    public recordId: string
  ) {
    super(message);
    this.name = 'RecordNotFoundError';
  }
}

/**
 * 存储错误
 */
export class StorageError extends HistoryError {
  constructor(
    message: string,
    public operation: 'read' | 'write' | 'delete' | 'init' | 'storage'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * 记录验证错误
 */
export class RecordValidationError extends HistoryError {
  constructor(
    message: string,
    public errors: string[]
  ) {
    super(message);
    this.name = 'RecordValidationError';
  }
} 