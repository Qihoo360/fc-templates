/**
 * 存储错误类
 */
export class StorageError extends Error {
  constructor(
    message: string, 
    public readonly operation: 'read' | 'write' | 'delete' | 'clear'
  ) {
    super(message);
    this.name = 'StorageError';
  }
} 