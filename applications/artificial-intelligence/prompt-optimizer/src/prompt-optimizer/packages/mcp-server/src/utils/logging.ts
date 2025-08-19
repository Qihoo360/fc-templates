/**
 * 使用标准的 debug 库进行日志记录
 *
 * 使用方式：
 * - 开发环境：DEBUG=mcp:* node server.js
 * - 生产环境：DEBUG=mcp:info,mcp:warn,mcp:error node server.js
 */

import createDebug from 'debug';

// 创建不同级别的调试器
const debugLogger = createDebug('mcp:debug');
const infoLogger = createDebug('mcp:info');
const warnLogger = createDebug('mcp:warn');
const errorLogger = createDebug('mcp:error');

// 为不同级别设置颜色
debugLogger.color = '6'; // cyan
infoLogger.color = '2';  // green
warnLogger.color = '3';  // yellow
errorLogger.color = '1'; // red

/**
 * 设置日志级别（通过环境变量 DEBUG 控制）
 * 这个函数主要用于兼容旧的 API
 */
export function setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
  // debug 库通过环境变量控制，这里我们可以动态设置
  const levelMap = {
    debug: 'mcp:*',
    info: 'mcp:info,mcp:warn,mcp:error',
    warn: 'mcp:warn,mcp:error',
    error: 'mcp:error'
  };

  // 动态设置 DEBUG 环境变量（如果还没有设置的话）
  if (!process.env.DEBUG) {
    process.env.DEBUG = levelMap[level];
  }

  // 强制重新初始化debug库的enabled函数
  const debugPattern = process.env.DEBUG || levelMap[level];
  createDebug.enabled = (namespace: string) => {
    if (debugPattern === 'mcp:*') return namespace.startsWith('mcp:');
    return debugPattern.split(',').some(pattern =>
      pattern.trim() === namespace ||
      (pattern.includes('*') && namespace.startsWith(pattern.replace('*', '')))
    );
  };

  // 重新启用所有调试器
  debugLogger.enabled = createDebug.enabled('mcp:debug');
  infoLogger.enabled = createDebug.enabled('mcp:info');
  warnLogger.enabled = createDebug.enabled('mcp:warn');
  errorLogger.enabled = createDebug.enabled('mcp:error');
}

/**
 * 调试日志
 */
export function debug(message: string, meta?: unknown): void {
  if (meta !== undefined) {
    debugLogger(message, meta);
  } else {
    debugLogger(message);
  }
}

/**
 * 信息日志
 */
export function info(message: string, meta?: unknown): void {
  if (meta !== undefined) {
    infoLogger(message, meta);
  } else {
    infoLogger(message);
  }
}

/**
 * 警告日志
 */
export function warn(message: string, meta?: unknown): void {
  if (meta !== undefined) {
    warnLogger(message, meta);
  } else {
    warnLogger(message);
  }
}

/**
 * 错误日志
 */
export function error(message: string, err?: Error): void {
  if (err) {
    errorLogger(message, {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  } else {
    errorLogger(message);
  }
}
