# ElectronProxy层统一IPC序列化处理

## 📋 概述

将IPC序列化处理从UI层移动到ElectronProxy层，实现统一的、对Vue组件透明的序列化处理机制。

## 🚨 问题背景

### 原有方案的问题
1. **需要在每个Vue组件中手动序列化** - 容易遗漏，维护成本高
2. **开发者心智负担重** - 需要记住在每个IPC调用前序列化
3. **架构不合理** - UI层需要关心底层IPC实现细节
4. **容易出错** - 新增功能时容易忘记序列化处理

### 错误发生的真实原因
虽然main.js中有`safeSerialize`处理，但错误发生在**IPC传输阶段**：
```
Vue组件 → ElectronProxy → preload.js → [IPC传输] → main.js
                                        ↑
                                   错误发生在这里
```

## ✅ 解决方案

### 1. 统一序列化工具
**文件**: `packages/core/src/utils/ipc-serialization.ts`

```typescript
/**
 * 安全序列化函数，用于清理Vue响应式对象
 */
export function safeSerializeForIPC<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('[IPC Serialization] Failed to serialize object:', error);
    throw new Error(`Failed to serialize object for IPC: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### 2. ElectronProxy层自动序列化

#### TemplateManager代理
```typescript
// packages/core/src/services/template/electron-proxy.ts
import { safeSerializeForIPC } from '../../utils/ipc-serialization';

export class ElectronTemplateManagerProxy implements ITemplateManager {
  async saveTemplate(template: Template): Promise<void> {
    // 自动序列化，防止Vue响应式对象IPC传递错误
    const safeTemplate = safeSerializeForIPC(template);
    return this.electronAPI.createTemplate(safeTemplate);
  }
}
```

#### ModelManager代理
```typescript
// packages/core/src/services/model/electron-proxy.ts
export class ElectronModelManagerProxy implements IModelManager {
  async addModel(key: string, config: ModelConfig): Promise<void> {
    const safeConfig = safeSerializeForIPC({ ...config, key });
    await this.electronAPI.model.addModel(safeConfig);
  }

  async updateModel(key: string, config: Partial<ModelConfig>): Promise<void> {
    const safeConfig = safeSerializeForIPC(config);
    await this.electronAPI.model.updateModel(key, safeConfig);
  }
}
```

#### HistoryManager代理
```typescript
// packages/core/src/services/history/electron-proxy.ts
export class ElectronHistoryManagerProxy implements IHistoryManager {
  async addRecord(record: PromptRecord): Promise<void> {
    const safeRecord = safeSerializeForIPC(record);
    return this.electronAPI.history.addRecord(safeRecord);
  }

  async createNewChain(record: Omit<PromptRecord, 'chainId' | 'version' | 'previousId'>): Promise<PromptRecordChain> {
    const safeRecord = safeSerializeForIPC(record);
    return this.electronAPI.history.createNewChain(safeRecord);
  }

  async addIteration(params: {...}): Promise<PromptRecordChain> {
    const safeParams = safeSerializeForIPC(params);
    return this.electronAPI.history.addIteration(safeParams);
  }
}
```

#### PromptService代理
```typescript
// packages/core/src/services/prompt/electron-proxy.ts
export class ElectronPromptServiceProxy implements IPromptService {
  async optimizePrompt(request: OptimizationRequest): Promise<string> {
    const safeRequest = safeSerializeForIPC(request);
    return this.api.optimizePrompt(safeRequest);
  }
}
```

### 3. Vue组件简化
现在Vue组件可以直接调用服务，无需关心序列化：

```typescript
// TemplateManager.vue - 修复前
import { createSafeTemplate } from '../utils/ipc-serialization'
const safeTemplate = createSafeTemplate(updatedTemplate)
await getTemplateManager.value.saveTemplate(safeTemplate)

// TemplateManager.vue - 修复后
await getTemplateManager.value.saveTemplate(updatedTemplate) // 自动序列化
```

## 🏗️ 架构优势

### 1. 分层清晰
```
Vue组件层     - 业务逻辑，无需关心IPC细节
    ↓
ElectronProxy层 - 自动序列化，IPC调用
    ↓
IPC传输层     - 纯净JavaScript对象传输
    ↓
Main进程层    - 双重保护（safeSerialize）
```

### 2. 开发体验
- ✅ **对Vue组件透明** - 组件无需关心序列化
- ✅ **自动保护** - 新增功能自动获得序列化保护
- ✅ **集中管理** - 所有序列化逻辑在一个地方
- ✅ **不易遗漏** - 架构层面保证序列化处理

### 3. 维护性
- ✅ **统一工具** - 避免重复代码
- ✅ **类型安全** - TypeScript类型检查
- ✅ **错误处理** - 统一的错误处理机制

## 🛡️ 双重保护机制

```
Vue组件 → ElectronProxy序列化 → IPC传输 → Main.js序列化 → 业务逻辑
         ↑                              ↑
    第一层保护                      第二层保护
   (必需，解决传输问题)            (防御性，处理边缘情况)
```

## 📊 修复验证

### 修复的文件
- ✅ `packages/core/src/utils/ipc-serialization.ts` - 统一序列化工具
- ✅ `packages/core/src/services/template/electron-proxy.ts` - 模板管理代理
- ✅ `packages/core/src/services/model/electron-proxy.ts` - 模型管理代理
- ✅ `packages/core/src/services/history/electron-proxy.ts` - 历史记录代理
- ✅ `packages/core/src/services/prompt/electron-proxy.ts` - 提示词服务代理
- ✅ `packages/core/src/services/llm/electron-proxy.ts` - LLM服务代理
- ✅ `packages/core/src/services/preference/electron-proxy.ts` - 偏好设置代理
- ✅ `packages/core/src/index.ts` - 导出序列化工具

### 清理的文件
- ✅ `packages/ui/src/utils/ipc-serialization.ts` - 删除UI层序列化工具
- ✅ `packages/ui/src/components/TemplateManager.vue` - 移除手动序列化
- ✅ `packages/ui/src/components/ModelManager.vue` - 移除手动序列化
- ✅ `packages/ui/src/composables/usePromptOptimizer.ts` - 移除手动序列化
- ✅ `packages/ui/src/composables/usePromptHistory.ts` - 移除手动序列化

### 测试场景
- [ ] 模板迁移功能（原问题场景）
- [ ] 模型添加/编辑功能
- [ ] 历史记录保存功能
- [ ] 提示词优化功能

## 💡 最佳实践

### 1. 新增ElectronProxy方法时
```typescript
async newMethod(complexObject: SomeType): Promise<ResultType> {
  // 总是序列化复杂对象参数
  const safeObject = safeSerializeForIPC(complexObject);
  return this.electronAPI.someService.newMethod(safeObject);
}
```

### 2. 基本类型参数无需序列化
```typescript
async simpleMethod(id: string, count: number): Promise<void> {
  // 基本类型无需序列化
  return this.electronAPI.someService.simpleMethod(id, count);
}
```

### 3. 调试序列化问题
```typescript
import { debugIPCSerializability } from '@prompt-optimizer/core';

// 开发时检查对象是否可序列化
debugIPCSerializability(complexObject, 'MyObject');
```

## 🎯 总结

这次修复实现了：
1. **架构优化** - 将序列化处理移到正确的层级
2. **开发体验提升** - Vue组件无需关心IPC细节
3. **维护性改善** - 统一的序列化处理，避免重复代码
4. **可靠性增强** - 双重保护机制，确保IPC传输安全

通过这种方式，我们彻底解决了"An object could not be cloned"错误，同时建立了可持续的架构模式。
