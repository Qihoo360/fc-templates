# 116 - 桌面应用打包优化

## 概述

将桌面应用从单文件portable模式改为ZIP压缩包模式，解决了存储路径检测问题，简化了代码架构。

## 问题背景

### 原有问题

1. **存储路径问题**：
   - portable模式下，`process.execPath` 指向临时解压目录
   - 数据保存在临时目录，应用关闭后被清理
   - 路径检测逻辑复杂，容易出错

2. **架构复杂性**：
   - 需要复杂的路径检测和回退逻辑
   - 大量调试代码和日志输出
   - 主进程日志在生产环境难以查看

## 解决方案

### 1. 修改打包配置

**之前（不同格式）**：
```json
{
  "win": { "target": "portable" },
  "mac": { "target": "dmg" },
  "linux": { "target": "AppImage" }
}
```

**现在（统一ZIP格式）**：
```json
{
  "win": {
    "target": "zip",
    "artifactName": "${productName}-${version}-${os}-${arch}.${ext}"
  },
  "mac": {
    "target": "zip",
    "artifactName": "${productName}-${version}-${os}-${arch}.${ext}"
  },
  "linux": {
    "target": "zip",
    "artifactName": "${productName}-${version}-${os}-${arch}.${ext}"
  }
}
```

### 2. 简化存储路径逻辑

**之前（复杂检测）**：
- 多种路径检测方法
- 临时目录检查
- 复杂的回退逻辑
- 大量调试日志

**现在（简化逻辑）**：
```javascript
if (app.isPackaged) {
  // ZIP包解压后的portable模式
  const exePath = app.getPath('exe');
  const execDir = path.dirname(exePath);
  userDataPath = path.join(execDir, 'prompt-optimizer-data');
} else {
  // 开发环境
  userDataPath = path.join(__dirname, '..', '..', 'prompt-optimizer-data');
}
```

### 3. 移除调试代码

- 删除 `debugLog` 函数
- 移除文件日志输出
- 删除调试API和IPC接口
- 简化错误处理

## 实施步骤

### 1. 修改打包配置
- 更新 `packages/desktop/package.json`
- 改为ZIP目标格式

### 2. 简化main.js
- 移除复杂的路径检测逻辑
- 删除调试日志函数
- 简化存储初始化代码

### 3. 清理preload.js
- 移除调试API接口

### 4. 更新文档和工作流
- 修改GitHub Actions工作流
- 更新README.md使用说明
- 创建归档文档

## 优势

### 1. 技术优势
- ✅ **路径可靠**：ZIP解压后路径确定，无临时目录问题
- ✅ **代码简洁**：移除复杂检测逻辑，维护性更好
- ✅ **性能更好**：无额外文件I/O操作

### 2. 用户体验
- ✅ **真正portable**：解压到哪里，数据就在哪里
- ✅ **便于管理**：整个文件夹包含应用+数据
- ✅ **便于备份**：复制文件夹即可完整备份

### 3. 分发优势
- ✅ **文件名清晰**：包含版本、系统、架构信息
- ✅ **便于下载**：单个ZIP文件包含所有内容
- ✅ **跨平台一致**：所有平台都使用相同的分发方式

## 使用方法

### 构建
```bash
cd packages/desktop
pnpm run build
```

### 分发
- **Windows**: `PromptOptimizer-1.2.0-win-x64.zip`
- **macOS**: `PromptOptimizer-1.2.0-darwin-x64.zip` / `PromptOptimizer-1.2.0-darwin-arm64.zip`
- **Linux**: `PromptOptimizer-1.2.0-linux-x64.zip`

所有平台：
- 用户解压到任意目录
- 运行对应的可执行文件
- 数据保存在 `prompt-optimizer-data/` 目录

### 数据管理
- **备份**：复制整个应用文件夹
- **迁移**：移动整个文件夹到新位置
- **升级**：替换exe文件，保留数据目录

## 经验总结

1. **简单即美**：复杂的路径检测不如简单的ZIP解压
2. **用户友好**：便携模式更符合用户期望
3. **维护性**：简化的代码更容易维护和调试
4. **可靠性**：减少边界情况，提高稳定性

## 后续优化

1. **自动更新**：考虑添加应用内更新功能
2. **安装包选项**：为需要的用户提供传统安装包
3. **数据迁移**：提供从旧版本迁移数据的工具
