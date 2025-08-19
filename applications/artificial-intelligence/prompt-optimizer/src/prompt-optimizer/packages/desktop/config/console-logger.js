const log = require('electron-log');
const path = require('path');
const { app } = require('electron');

class ConsoleLogger {
  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    
    this.setupElectronLog();
    this.setupModuleLoggers();
    this.hijackConsole();
  }

  setupElectronLog() {
    // 获取用户数据目录
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const logDir = path.join(userDataPath, 'logs');

    // 主日志配置
    log.transports.file.level = 'info';
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    log.transports.file.resolvePathFn = () => path.join(logDir, 'main.log');

    // 控制台配置
    log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}';

    // 禁用IPC传输
    log.transports.ipc.level = false;
  }

  setupModuleLoggers() {
    // 创建不同模块的日志器
    this.loggers = {
      main: this.createModuleLogger('main'),
      desktop: this.createModuleLogger('desktop'),
      updater: this.createModuleLogger('updater'),
      ipc: this.createModuleLogger('ipc'),
      error: this.createModuleLogger('error')
    };

    // 错误日志特殊配置
    this.loggers.error.transports.file.level = 'error';
    this.loggers.error.transports.console.level = 'error';
  }

  createModuleLogger(moduleName) {
    const moduleLog = log.create(moduleName);
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const logDir = path.join(userDataPath, 'logs');
    
    moduleLog.transports.file.resolvePathFn = () => path.join(logDir, `${moduleName}.log`);
    moduleLog.transports.file.maxSize = 5 * 1024 * 1024; // 5MB per module
    moduleLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    moduleLog.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}';
    
    return moduleLog;
  }

  // 智能解析日志消息，确定使用哪个日志器
  parseLogMessage(message) {
    const messageStr = typeof message === 'string' ? message : String(message);
    
    // 模块映射规则
    const modulePatterns = [
      { pattern: /^\[Main Process\]/i, logger: this.loggers.main, prefix: '[Main Process]' },
      { pattern: /^\[DESKTOP\]/i, logger: this.loggers.desktop, prefix: '[DESKTOP]' },
      { pattern: /^\[Updater\]/i, logger: this.loggers.updater, prefix: '[Updater]' },
      { pattern: /^\[.*IPC.*\]/i, logger: this.loggers.ipc, prefix: '[IPC]' },
    ];

    // 查找匹配的模块
    for (const { pattern, logger, prefix } of modulePatterns) {
      if (pattern.test(messageStr)) {
        const cleanMessage = messageStr.replace(pattern, '').trim();
        return { logger, message: cleanMessage, originalPrefix: prefix };
      }
    }

    // 默认使用主日志器
    return { logger: this.loggers.main, message: messageStr, originalPrefix: null };
  }

  // 劫持 console 方法
  hijackConsole() {
    // 劫持 console.log
    console.log = (...args) => {
      const firstArg = args[0];
      const { logger, message, originalPrefix } = this.parseLogMessage(firstArg);
      
      if (originalPrefix && args.length === 1) {
        // 单个带前缀的消息
        logger.info(message);
      } else if (originalPrefix) {
        // 带前缀的消息和额外参数
        const restArgs = args.slice(1);
        logger.info(message, ...restArgs);
      } else {
        // 普通日志
        logger.info(...args);
      }

      // 开发环境下同时输出到原始控制台
      if (process.env.NODE_ENV === 'development') {
        this.originalConsole.log(...args);
      }
    };

    // 劫持 console.error
    console.error = (...args) => {
      const firstArg = args[0];
      const { logger, message, originalPrefix } = this.parseLogMessage(firstArg);
      
      // 错误总是同时记录到错误日志
      this.loggers.error.error(...args);
      
      if (originalPrefix && args.length >= 2) {
        // 带前缀的错误消息
        const restArgs = args.slice(1);
        logger.error(message, ...restArgs);
      } else {
        // 普通错误
        logger.error(...args);
      }

      // 总是输出到原始控制台（错误很重要）
      this.originalConsole.error(...args);
    };

    // 劫持 console.warn
    console.warn = (...args) => {
      const firstArg = args[0];
      const { logger, message, originalPrefix } = this.parseLogMessage(firstArg);
      
      if (originalPrefix && args.length === 1) {
        logger.warn(message);
      } else if (originalPrefix) {
        const restArgs = args.slice(1);
        logger.warn(message, ...restArgs);
      } else {
        logger.warn(...args);
      }

      // 开发环境下同时输出到原始控制台
      if (process.env.NODE_ENV === 'development') {
        this.originalConsole.warn(...args);
      }
    };

    // 劫持 console.info
    console.info = (...args) => {
      const firstArg = args[0];
      const { logger, message } = this.parseLogMessage(firstArg);
      logger.info(...args);

      if (process.env.NODE_ENV === 'development') {
        this.originalConsole.info(...args);
      }
    };

    // 劫持 console.debug
    console.debug = (...args) => {
      const firstArg = args[0];
      const { logger, message } = this.parseLogMessage(firstArg);
      logger.debug(...args);

      if (process.env.NODE_ENV === 'development') {
        this.originalConsole.debug(...args);
      }
    };
  }

  // 恢复原始 console（如果需要）
  restore() {
    Object.assign(console, this.originalConsole);
  }

  // 设置全局错误处理器
  setupGlobalErrorHandlers() {
    // 捕获未处理的异常
    process.on('uncaughtException', (error) => {
      const errorInfo = {
        type: 'uncaughtException',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        pid: process.pid
      };

      // 记录到错误日志
      this.loggers.error.error('CRITICAL - Uncaught Exception:', JSON.stringify(errorInfo, null, 2));

      // 同时输出到控制台（确保能看到）
      this.originalConsole.error('[CRITICAL] Uncaught Exception:', error);

      // 给日志系统一点时间写入文件
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // 捕获未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      const errorInfo = {
        type: 'unhandledRejection',
        reason: reason instanceof Error ? {
          message: reason.message,
          stack: reason.stack
        } : reason,
        promise: promise.toString(),
        timestamp: new Date().toISOString(),
        pid: process.pid
      };

      // 记录到错误日志
      this.loggers.error.error('CRITICAL - Unhandled Rejection:', JSON.stringify(errorInfo, null, 2));

      // 同时输出到控制台
      this.originalConsole.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);

      // 给日志系统一点时间写入文件
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // 捕获进程警告
    process.on('warning', (warning) => {
      const warningInfo = {
        type: 'processWarning',
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        timestamp: new Date().toISOString()
      };

      this.loggers.error.warn('Process Warning:', JSON.stringify(warningInfo, null, 2));
      this.originalConsole.warn('[WARNING]', warning);
    });

    console.log('[Console Logger] Global error handlers setup completed');
  }

  // 获取日志文件路径
  getLogPaths() {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const logDir = path.join(userDataPath, 'logs');

    return {
      logDir,
      main: path.join(logDir, 'main.log'),
      desktop: path.join(logDir, 'desktop.log'),
      updater: path.join(logDir, 'updater.log'),
      ipc: path.join(logDir, 'ipc.log'),
      error: path.join(logDir, 'error.log')
    };
  }
}

module.exports = ConsoleLogger;
