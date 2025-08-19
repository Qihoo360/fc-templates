# 项目通用经验指南

本指南收录项目开发中的通用经验与最佳实践，快速解决常见问题，提升开发效率。

> **注意**: 功能特定的经验已归档到 `docs/archives/` 对应目录中。

## 📚 已归档的专项经验

- **模态框组件经验** → [106-template-management/modal-experience.md](../archives/106-template-management/modal-experience.md)
- **布局系统经验** → [108-layout-system/experience.md](../archives/108-layout-system/experience.md)
- **主题系统经验** → [109-theme-system/experience.md](../archives/109-theme-system/experience.md)
- **Composable架构经验** → [102-web-architecture-refactor/experience.md](../archives/102-web-architecture-refactor/experience.md)
- **大型架构重构经验** → [117-import-export-architecture-refactor/experience.md](../archives/117-import-export-architecture-refactor/experience.md)
- **版本更新系统经验** → [118-desktop-auto-update-system/experience.md](../archives/118-desktop-auto-update-system/experience.md)
- **MCP Server 模块开发经验** → [120-mcp-server-module/experience.md](../archives/120-mcp-server-module/experience.md)
- **多自定义模型支持经验** → [121-multi-custom-models-support/experience.md](../archives/121-multi-custom-models-support/experience.md)

## 🔧 通用开发规范

### API 集成
```typescript
// 统一 OpenAI 兼容格式
const config = {
  baseURL: "https://api.provider.com/v1",
  models: ["model-name"],
  apiKey: import.meta.env.VITE_API_KEY // 必须使用 Vite 环境变量
};
```

**核心原则**：
- 业务逻辑与API配置分离
- 只传递用户明确配置的参数，不设默认值
- 敏感信息通过环境变量管理

### 错误处理
```typescript
try {
  await apiCall();
} catch (error) {
  console.error('[Service Error]', error); // 开发日志
  throw new Error('操作失败，请稍后重试'); // 用户友好提示
}
```

### 测试规范
```javascript
describe("功能测试", () => {
  beforeEach(() => {
    testId = `test-${Date.now()}`; // 唯一标识避免冲突
  });
  
  // LLM参数测试：每个参数独立测试
  it("should handle temperature parameter", async () => {
    await modelManager.updateModel(configKey, {
      llmParams: { temperature: 0.7 } // 只测试一个参数
    });
  });
});
```

**要点**：
- 使用动态唯一标识符
- 每个LLM参数创建独立测试
- 覆盖异常场景
- 正确清理测试状态

### Vue 开发最佳实践

#### 多根组件的属性继承
**问题**：当一个Vue组件有多个根节点时，它无法自动继承父组件传递的非prop属性（如 `class`），并会产生警告。

**方案**：
1. 在 `<script setup>` 中使用 `defineOptions({ inheritAttrs: false })` 禁用默认的属性继承行为
2. 在模板中，将 `v-bind="$attrs"` 手动绑定到你希望接收这些属性的**特定**根节点上

**示例**:
```
<template>
  <!-- $attrs 会将 class, id 等属性应用到此组件 -->
  <OutputDisplayCore v-bind="$attrs" ... />
  <OutputDisplayFullscreen ... />
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
});
</script>
```

#### 深层组件事件传播机制
**问题**：当全局状态变化需要通知多层级嵌套的组件时，事件传播可能中断，导致深层组件无法及时更新。

**典型场景**：
- 语言切换后，主界面组件更新正常，但Modal内部的组件显示旧状态
- 组件层级差异：`App.vue → ComponentA`（直接引用）vs `App.vue → ComponentB → ComponentC`（间接引用）

**核心原因**：
1. **v-if条件渲染**：组件被销毁后ref失效，无法调用组件方法
2. **事件传播断点**：事件只传播到直接子组件，不会自动向下传播到深层组件
3. **组件生命周期差异**：不同层级的组件可能处于不同的生命周期阶段

**解决方案**：
1. **使用v-show替代v-if**：确保组件实例始终存在，ref保持有效
   ```vue
   <!-- ❌ 问题方案：组件会被销毁 -->
   <Modal v-if="showModal">
     <TemplateSelect ref="templateRef" />
   </Modal>
   
   <!-- ✅ 推荐方案：组件始终渲染 -->
   <Modal v-show="showModal">
     <TemplateSelect ref="templateRef" />
   </Modal>
   ```

2. **建立完整事件传播链**：从事件源到所有消费组件
   ```javascript
   // 父组件：建立事件传播
   const handleGlobalStateChange = (newState) => {
     // 刷新直接子组件
     if (directChildRef.value?.refresh) {
       directChildRef.value.refresh()
     }
     
     // 刷新深层组件（通过中间组件的暴露方法）
     if (intermediateRef.value?.refreshDeepChild) {
       intermediateRef.value.refreshDeepChild()
     }
   }
   
   // 中间组件：暴露深层组件的刷新方法
   const deepChildRef = ref()
   
   const refreshDeepChild = () => {
     if (deepChildRef.value?.refresh) {
       deepChildRef.value.refresh()
     }
   }
   
   defineExpose({
     refreshDeepChild
   })
   ```

3. **统一刷新接口**：所有相关组件都暴露相同的刷新方法
   ```javascript
   // 每个需要响应全局状态变化的组件都实现refresh方法
   const refresh = () => {
     // 重新加载数据或更新状态
   }
   
   defineExpose({
     refresh
   })
   ```

**最佳实践**：
- **架构设计**：在设计阶段考虑事件传播的完整路径
- **接口一致性**：定义标准的组件刷新接口（如`refresh()`方法）
- **文档记录**：为复杂的事件传播链建立清晰的架构图
- **测试验证**：确保在所有使用场景下事件都能正确传播

**适用场景**：
- 全局主题切换
- 语言切换
- 用户权限变更
- 模板/配置更新

> **详细案例**：参见 [106-template-management/event-propagation-fix.md](../archives/106-template-management/event-propagation-fix.md)

## ⚡ 快速问题排查

### 布局问题
1. 检查 Flex 约束链是否完整
2. 确认 `min-h-0` 是否添加
3. 验证父容器是否为 `display: flex`

### 滚动问题
1. 检查是否有中间层错误的 `overflow` 属性
2. 确认高度约束是否从顶层正确传递
3. 验证滚动容器是否有正确的 `overflow-y: auto`

### 组件状态同步问题
1. **深层组件未更新**：
   - 检查是否使用了 `v-if` 导致组件被销毁
   - 确认事件传播链是否完整（父→中间→目标组件）
   - 验证目标组件是否暴露了刷新方法

2. **Modal内组件状态异常**：
   - 检查Modal是否使用 `v-show` 而非 `v-if`
   - 确认组件ref在Modal关闭时是否仍然有效
   - 验证全局状态变化事件是否传播到Modal内部

3. **组件ref调用失败**：
   - 确认组件是否已完成挂载（`nextTick`）
   - 检查条件渲染是否导致组件不存在
   - 验证ref绑定的组件是否暴露了对应方法

### API调用问题
1. 检查环境变量是否正确设置（`VITE_` 前缀）
2. 确认参数是否过度设置默认值
3. 验证错误处理是否用户友好

### 测试失败
1. 检查测试ID是否唯一
2. 确认测试后是否正确清理状态
3. 验证LLM参数测试是否独立

## 🔄 版本管理

### 版本同步
```json
// package.json
{
  "scripts": {
    "version": "pnpm run version:sync && git add -A"
  }
}
```
**关键**：使用 `version` 钩子而非 `postversion`，确保同步文件包含在版本提交中。

### 模板管理
- **内置模板**：不可修改，不可导出
- **用户模板**：可修改，导入时生成新ID
- **导入规则**：跳过与内置模板ID重复的模板

## 🚨 关键Bug修复模式

### 参数透明化
```typescript
// ❌ 错误：自动设置默认值
if (!config.temperature) config.temperature = 0.7;

// ✅ 正确：只使用用户配置的参数
const requestConfig = {
  model: modelConfig.defaultModel,
  messages: formattedMessages,
  ...userLlmParams // 只传递用户明确配置的参数
};
```

### 数据导入安全验证
```
// 白名单验证 + 类型检查
for (const [key, value] of Object.entries(importData)) {
  if (!ALLOWED_KEYS.includes(key)) {
    console.warn(`跳过未知配置: ${key}`);
    continue;
  }
  if (typeof value !== 'string') {
    console.warn(`跳过无效类型 ${key}: ${typeof value}`);
    continue;
  }
  await storage.setItem(key, value);
}
```

### 国际化(i18n)键值同步
**问题**：`[intlify] Not found 'key' in 'locale' messages` 错误，通常由中英文语言包键值不同步引起。

**方案**：创建自动化脚本比较两个语言文件，列出差异。

## 📝 文档更新规范

遇到新问题或找到更好解决方案时，应及时更新此文档：
1. 在对应章节添加新经验
2. 更新代码示例
3. 记录修复时间和问题背景
4. 保持文档简洁性，避免过度详细的过程描述

---

**记住**：好的经验文档应该能让团队成员快速找到解决方案，而不是重新踩坑。

## 🎯 Vue Composables 设计经验

### 单例模式的重要性
**问题场景**：多个组件使用同一个composable时，如果每次调用都创建新实例，会导致状态不同步。

**错误实现**：
```typescript
export function useUpdater() {
  const state = reactive({...})  // 每次调用都创建新实例
  return { state, ... }
}
```

**正确实现**：
```
let globalUpdaterInstance: any = null

export function useUpdater() {
  if (globalUpdaterInstance) {
    return globalUpdaterInstance  // 返回已有实例
  }

  const state = reactive({...})
  const instance = { state, ... }
  globalUpdaterInstance = instance  // 缓存实例
  return instance
}
```

**判断标准**：如果多个组件需要访问同一份状态，就应该使用单例模式。

**常见需要单例的场景**：
- 全局状态管理（如更新状态、用户设置）
- 模态框状态
- 通知系统

### 调试策略
- **日志驱动调试**: 通过详细日志确认每个环节的状态
- **分层验证**: 先验证数据层，再验证UI层
- **避免过度工程**: 不要为了解决问题而添加复杂的补丁

## 🏗️ 架构重构通用经验

### 大型重构策略
**渐进式重构原则**：
1. **接口优先** - 先设计接口，再实现功能
2. **分阶段执行** - 保持功能连续性，避免破坏性变更
3. **测试保护** - 每个阶段都要有测试覆盖
4. **文档同步** - 重构的同时更新文档

### 分布式架构设计
**核心原则**：
- 单一职责：每个服务只负责自己的数据
- 接口统一：所有服务实现相同接口
- 松耦合：服务间通过接口交互
- 可扩展：新增服务只需实现接口

### 存储抽象设计
**避免抽象泄漏**：
- 在服务层封装存储细节
- 使用逻辑键名对外暴露
- 建立清晰的抽象边界
- 文档化存储键的双重用途

### AI自动化测试
**MCP工具应用**：
- 使用浏览器自动化验证真实用户场景
- 建立可重复执行的测试用例
- 验证架构一致性和数据完整性
- 提高测试覆盖率和可靠性

> 详细经验参考：[117-import-export-architecture-refactor](../archives/117-import-export-architecture-refactor/)

## Node.js 应用开发经验

### 环境变量管理
- **加载时机至关重要**: 环境变量必须在任何模块导入之前加载到 `process.env`
- **Node.js 的 `-r` 参数**: 是在模块系统初始化前预加载脚本的最可靠方法
- **路径解析**: 考虑不同的工作目录和部署场景，支持多路径查找

### 构建工具使用
- **入口文件分离**: 入口文件只导出，不执行任何有副作用的代码
- **启动文件独立**: 使用单独的启动文件负责执行主逻辑
- **避免构建副作用**: 确保构建过程不执行任何有副作用的代码

### Windows 兼容性
- **避免复杂进程管理**: 不使用复杂的进程管理工具如 concurrently
- **分离构建和启动**: 采用分离的构建和启动流程
- **简单npm脚本**: 使用简单的 npm scripts 替代复杂的命令组合

## 架构设计经验

### 适配器模式
- **解耦**: 通过适配器模式实现不同系统间的解耦
- **可扩展性**: 适配器模式便于添加新的适配器支持更多功能
- **可维护性**: 每个适配器职责单一，便于维护

### 无状态设计
- **简化部署**: 无状态设计简化了部署流程
- **提高可靠性**: 避免了状态不一致的问题
- **便于测试**: 每次测试都是全新的环境

相关归档:
- [120-mcp-server-module](../archives/120-mcp-server-module/) - MCP Server 模块开发

## 🖥️ Node.js 环境开发经验

### 环境变量加载时机
**问题**：Node.js 环境变量必须在模块导入前加载，否则模块初始化时读取不到
```bash
# ✅ 正确：使用 -r 参数预加载
node -r ./preload-env.js dist/index.js

# ❌ 错误：模块导入后加载环境变量
node dist/index.js  # 此时环境变量可能未加载
```

**解决方案**：
1. 创建预加载脚本支持多路径查找
2. 在启动脚本中统一处理环境变量加载
3. 支持静默加载，避免找不到配置文件时的错误

### 构建时副作用控制
**问题**：构建工具（如 tsup）执行模块级代码时会导致服务器意外启动
```typescript
// ❌ 错误：入口文件直接执行
import { startServer } from './server'
startServer() // 构建时会执行

// ✅ 正确：分离导出和执行
export { startServer } from './server'
// 使用单独的启动文件执行主逻辑
```

### Windows 进程管理
**问题**：Windows 下 concurrently 等进程管理工具信号处理有问题
```json
// ❌ 避免：复杂的进程管理
"scripts": {
  "dev": "concurrently \"npm run build:watch\" \"npm run start\""
}

// ✅ 推荐：简单的分离脚本
"scripts": {
  "build": "tsup",
  "start": "node dist/index.js",
  "dev": "npm run build && npm run start"
}
```

## 📝 使用说明

1. **查找经验**：先查看已归档的专项经验，再查看通用规范
2. **应用实践**：根据具体场景选择合适的解决方案
3. **持续更新**：发现新的通用经验及时补充到本文档
4. **避免重复**：功能特定的经验应归档到对应的archives目录
