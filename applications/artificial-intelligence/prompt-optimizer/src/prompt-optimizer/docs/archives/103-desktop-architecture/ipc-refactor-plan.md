# 高层服务代理IPC模型重构计划

## 📋 任务概述

解决当前底层 `fetch` 代理方案因模拟不完善导致的脆弱性和兼容性问题。建立一个稳定、可维护、职责清晰的桌面端应用架构，将主进程作为后端服务提供者，渲染进程作为纯粹的前端消费者。

## 🎯 目标

- 废弃底层 `fetch` 代理，切换到高层服务接口代理
- 建立稳定的 IPC 通信协议
- 实现主进程的服务提供者角色
- 提高系统的可维护性和稳定性

## 📅 计划时间线

- **开始时间**: 2024-07-25
- **当前状态**: 📋 计划阶段
- **预计完成**: 待定

## 🔧 计划步骤

### 1. 清理 `core` 包
- [ ] 移除所有特定于 Electron 的逻辑（如 `isRunningInElectron` 和 `fetch` 注入）
- [ ] 使其回归为一个纯粹、平台无关的核心业务逻辑库
- [ ] 确保 core 包可以在任何 JavaScript 环境中运行

### 2. 改造 `main.js`
- [ ] 使其成为服务提供者
- [ ] 通过 `require('@prompt-optimizer/core')` 直接消费 `core` 包
- [ ] 在主进程中实例化 `LLMService` 等核心服务
- [ ] 建立服务管理和生命周期控制

### 3. 实现主进程存储方案
- [ ] 为 `main.js` 中的服务提供一个适合 Node.js 环境的存储方案
- [ ] 第一阶段先实现一个临时的 `MemoryStorageProvider`
- [ ] 后续实现文件持久化存储

### 4. 重构 IPC 通信协议
- [ ] 废弃底层的 `api-fetch` 代理
- [ ] 在 `main.js` 和 `preload.js` 中建立基于 `ILLMService` 公共方法的高层 IPC 接口
- [ ] 实现方法级别的 IPC 调用（如 `testConnection`, `sendMessageStream`）

### 5. 创建渲染进程代理
- [ ] 在 `core` 包中创建一个 `ElectronLLMProxy` 类
- [ ] 该类实现 `ILLMService` 接口
- [ ] 内部方法通过 `window.electronAPI.llm.*` 调用 IPC 接口

### 6. 改造服务初始化逻辑
- [ ] 修改 `useServiceInitializer.ts`
- [ ] 使其能够根据当前环境（Web 或 Electron）判断
- [ ] 为应用提供真实的 `LLMService` 实例或 `ElectronLLMProxy` 代理实例

## 🚨 问题分析

### 当前架构问题
1. **底层代理的脆弱性**: 
   - `fetch` 代理导致 `AbortSignal`、`Headers` 等对象在跨IPC传输时出现序列化和实例类型不匹配的问题
   - 导致应用崩溃且难以维护

2. **关注点分离违反**:
   - 试图模拟一个复杂且不稳定的底层Web API
   - 违反了关注点分离原则

3. **维护困难**:
   - 底层对象的模拟不完善
   - 调试和错误排查困难

### 解决方案优势
1. **稳定的接口**: 代理我们自己定义的高层、稳定的服务接口
2. **简单的数据结构**: 基于稳定、简单、可序列化的数据结构和接口
3. **清晰的职责**: 主进程专注于服务提供，渲染进程专注于UI

## 🏗️ 新架构设计

### 主进程架构
```javascript
// main.js
const { LLMService, StorageProvider } = require('@prompt-optimizer/core');

class MainProcessServices {
  constructor() {
    this.storageProvider = new NodeStorageProvider();
    this.llmService = new LLMService(this.storageProvider);
  }
  
  async testConnection(config) {
    return await this.llmService.testConnection(config);
  }
  
  async sendMessageStream(messages, config, onChunk) {
    return await this.llmService.sendMessageStream(messages, config, onChunk);
  }
}

const services = new MainProcessServices();

// IPC 处理器
ipcMain.handle('llm:testConnection', async (event, config) => {
  return await services.testConnection(config);
});

ipcMain.handle('llm:sendMessageStream', async (event, messages, config) => {
  // 处理流式响应的特殊逻辑
});
```

### 渲染进程代理
```typescript
// ElectronLLMProxy.ts
export class ElectronLLMProxy implements ILLMService {
  async testConnection(config: LLMConfig): Promise<boolean> {
    return await window.electronAPI.llm.testConnection(config);
  }
  
  async sendMessageStream(
    messages: Message[], 
    config: LLMConfig, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return await window.electronAPI.llm.sendMessageStream(messages, config, onChunk);
  }
}
```

### 环境检测和初始化
```typescript
// useServiceInitializer.ts
export function useServiceInitializer() {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  
  if (isElectron) {
    return {
      llmService: new ElectronLLMProxy(),
      storageProvider: new ElectronStorageProxy()
    };
  } else {
    return {
      llmService: new LLMService(new WebStorageProvider()),
      storageProvider: new WebStorageProvider()
    };
  }
}
```

## 📋 里程碑

- [ ] 完成方案设计与文档同步
- [ ] 完成代码重构
- [ ] 桌面应用在新架构下成功运行
- [ ] 实现主进程的文件持久化存储

## 💡 核心经验

1. **跨进程通信原则**: 应基于稳定、简单、可序列化的数据结构和接口
2. **避免底层对象代理**: 不要试图代理复杂的底层原生对象
3. **关注点分离**: 主进程专注于服务，渲染进程专注于UI
4. **接口稳定性**: 高层接口比底层API更稳定，更适合跨进程通信

## 🔗 相关文档

- [当前桌面架构](./README.md)
- [桌面应用实施记录](./desktop-implementation.md)
- [IPC通信最佳实践](./ipc-best-practices.md)

---

**任务状态**: 📋 计划阶段  
**优先级**: 高  
**最后更新**: 2025-07-01
