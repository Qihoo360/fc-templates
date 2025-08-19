/**
 * 静态常量定义
 * 这个文件只包含纯静态常量，没有任何动态逻辑或副作用
 * 可以安全地在 Electron preload 脚本的沙箱环境中加载
 */

// IPC事件名称常量
const IPC_EVENTS = {
  UPDATE_CHECK: 'updater-check-update',
  UPDATE_CHECK_ALL_VERSIONS: 'updater-check-all-versions',
  UPDATE_START_DOWNLOAD: 'updater-start-download',
  UPDATE_INSTALL: 'updater-install-update',
  UPDATE_IGNORE_VERSION: 'updater-ignore-version',
  UPDATE_UNIGNORE_VERSION: 'updater-unignore-version',
  UPDATE_GET_IGNORED_VERSIONS: 'updater-get-ignored-versions',
  UPDATE_DOWNLOAD_SPECIFIC_VERSION: 'updater-download-specific-version',
  UPDATE_DOWNLOAD_STARTED: 'updater-download-started',

  // 主进程发送给渲染进程的事件
  UPDATE_AVAILABLE_INFO: 'update-available-info',
  UPDATE_NOT_AVAILABLE: 'update-not-available',
  UPDATE_DOWNLOAD_PROGRESS: 'update-download-progress',
  UPDATE_DOWNLOADED: 'update-downloaded',
  UPDATE_ERROR: 'update-error'
};

// 偏好设置键名常量
const PREFERENCE_KEYS = {
  IGNORED_VERSIONS: 'updater.ignoredVersions' // 多版本忽略存储
};

// 默认配置
const DEFAULT_CONFIG = {
  autoDownload: false,
  checkInterval: 24 * 60 * 60 * 1000, // 24小时
  timeout: 30000 // 30秒
};

module.exports = {
  IPC_EVENTS,
  PREFERENCE_KEYS,
  DEFAULT_CONFIG
};
