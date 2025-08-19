/**
 * 自动更新配置
 * 集中管理更新相关的配置信息，避免硬编码
 */

// 导入静态常量
const { IPC_EVENTS, PREFERENCE_KEYS, DEFAULT_CONFIG } = require('./constants');

// 从package.json读取仓库信息
const packageJson = require('../package.json');

// 从环境变量或package.json获取仓库信息
const getRepositoryInfo = () => {
  // 优先使用环境变量
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    return { owner, repo };
  }
  
  // 从package.json的repository字段获取
  if (packageJson.repository && packageJson.repository.url) {
    const repoUrl = packageJson.repository.url;
    const match = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }
  
  // 从build.publish配置获取
  if (packageJson.build && packageJson.build.publish) {
    const { owner, repo } = packageJson.build.publish;
    if (owner && repo) {
      return { owner, repo };
    }
  }
  
  // 最后的fallback（应该避免到达这里）
  console.warn('[Update Config] No repository info found, using fallback');
  return { owner: 'unknown', repo: 'unknown' };
};

// 验证版本号格式
const validateVersion = (version) => {
  if (!version || typeof version !== 'string') {
    return false;
  }
  
  // 基本的版本号格式验证（支持语义化版本）
  const versionRegex = /^v?\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/;
  return versionRegex.test(version);
};

// 构建安全的Release URL
const buildReleaseUrl = (version) => {
  if (!validateVersion(version)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  
  const { owner, repo } = getRepositoryInfo();
  
  if (owner === 'unknown' || repo === 'unknown') {
    throw new Error('Repository information not available');
  }
  
  // 确保版本号以v开头
  const versionTag = version.startsWith('v') ? version : `v${version}`;
  
  // 使用URL构造器确保安全性
  const baseUrl = 'https://github.com';
  return `${baseUrl}/${owner}/${repo}/releases/tag/${encodeURIComponent(versionTag)}`;
};

// 注意：静态常量已移至 constants.js 文件
// 这里只保留动态逻辑函数

module.exports = {
  // 动态函数
  getRepositoryInfo,
  validateVersion,
  buildReleaseUrl,

  // 重新导出静态常量（保持向后兼容）
  IPC_EVENTS,
  PREFERENCE_KEYS,
  DEFAULT_CONFIG
};
