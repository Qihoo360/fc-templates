# 版本同步机制

## 概述

为了确保项目中所有组件的版本号保持一致，我们建立了自动版本同步机制。该机制会自动将根目录 `package.json` 中的版本号同步到其他需要版本号的文件中。

## 自动同步的文件

目前自动同步版本号的文件包括：

- `packages/extension/public/manifest.json` - 浏览器扩展清单文件

## 使用方法

### 方法1: 使用 pnpm version 命令（推荐）

使用标准的 pnpm 版本管理命令，版本号会自动同步：

```bash
# 升级补丁版本 (1.0.7 -> 1.0.8)
pnpm version patch

# 升级次版本 (1.0.7 -> 1.1.0)
pnpm version minor

# 升级主版本 (1.0.7 -> 2.0.0)
pnpm version major
```

### 方法2: 手动同步

如果直接修改了 `package.json` 中的版本号，可以手动运行同步命令：

```bash
pnpm run version:sync
```

## 工作原理

1. **pnpm version 命令**: 更新 `package.json` 中的版本号
2. **version 钩子**: 在创建 commit 前运行同步脚本并暂存变更
   - 执行 `pnpm run version:sync` 同步其他文件的版本号
   - 执行 `git add -A` 将所有变更添加到暂存区
3. **同步脚本**: `scripts/sync-versions.js` 读取新的版本号并更新其他文件
4. **git commit**: pnpm 创建包含所有版本号变更的提交和标签

## 添加新的同步文件

如需添加更多文件的版本同步，编辑 `scripts/sync-versions.js` 文件中的 `versionFiles` 数组：

```javascript
const versionFiles = [
  {
    path: 'packages/extension/public/manifest.json',
    field: 'version',
    description: '浏览器扩展清单文件'
  },
  {
    path: 'path/to/your/file.json',
    field: 'version',
    description: '你的文件描述'
  }
];
```

## 注意事项

- 确保目标文件是有效的 JSON 格式
- 版本字段必须存在于目标文件中
- 脚本会在出现错误时退出并显示错误信息
- 所有版本号变更都会被记录到控制台

## 故障排除

如果同步失败，请检查：

1. 目标文件是否存在且格式正确
2. 版本字段是否存在于目标文件中
3. 是否有文件权限问题
4. Node.js 版本是否兼容

如有问题，可以直接运行同步脚本进行调试：

```bash
node scripts/sync-versions.js
``` 