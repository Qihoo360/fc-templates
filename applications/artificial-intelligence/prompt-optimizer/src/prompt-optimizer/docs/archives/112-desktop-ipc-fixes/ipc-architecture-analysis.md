# IPC架构分析与开发经验

## 📝 背景

在Desktop版本开发中遇到的IPC架构问题分析和解决经验。

## 🔍 架构差异分析

### 1. Web环境 vs Desktop环境

**Web环境（单进程）**：
```
Vue组件 → 直接调用 → 服务实例
```

**Desktop环境（多进程）**：
```
Vue组件 → ElectronProxy → IPC → Main进程 → 服务实例
```

### 2. 常见问题模式

#### 问题1：接口契约缺失
```typescript
// ❌ 接口定义不完整
interface ITemplateManager {
  getTemplate(id: string): Promise<Template>;
  // 缺少语言相关方法
}

// ✅ 完整的接口定义
interface ITemplateManager {
  getTemplate(id: string): Promise<Template>;
  getCurrentBuiltinTemplateLanguage(): Promise<BuiltinTemplateLanguage>;
  changeBuiltinTemplateLanguage(language: BuiltinTemplateLanguage): Promise<void>;
}
```

#### 问题2：代理实现不完整
```typescript
// ❌ 代理类缺少方法
class ElectronTemplateManagerProxy implements ITemplateManager {
  async getTemplate(id: string): Promise<Template> {
    return this.electronAPI.getTemplate(id);
  }
  // 缺少其他方法的实现
}

// ✅ 完整的代理实现
class ElectronTemplateManagerProxy implements ITemplateManager {
  async getTemplate(id: string): Promise<Template> {
    return this.electronAPI.getTemplate(id);
  }
  
  async getCurrentBuiltinTemplateLanguage(): Promise<BuiltinTemplateLanguage> {
    return this.electronAPI.getCurrentBuiltinTemplateLanguage();
  }
}
```

#### 问题3：IPC链路不完整
```javascript
// preload.js - 缺少方法暴露
window.electronAPI = {
  template: {
    getTemplate: (id) => ipcRenderer.invoke('template-getTemplate', id),
    // 缺少语言相关方法
  }
}

// main.js - 缺少处理器
ipcMain.handle('template-getTemplate', async (event, id) => {
  // 处理逻辑
});
// 缺少语言相关处理器
```

## 🛠️ 修复策略

### 1. 接口优先设计
```typescript
// 步骤1：定义完整接口
export interface ITemplateManager {
  // 所有需要的方法
}

// 步骤2：Web环境实现
export class TemplateManager implements ITemplateManager {
  // 完整实现
}

// 步骤3：Electron代理实现
export class ElectronTemplateManagerProxy implements ITemplateManager {
  // 完整代理实现
}
```

### 2. IPC链路完整性检查
```
Vue组件调用 → 检查代理方法 → 检查preload暴露 → 检查main处理器 → 检查服务方法
```

### 3. 错误处理原则
```typescript
// ❌ 错误掩盖
async someMethod() {
  try {
    return await this.service.method();
  } catch (error) {
    return null; // 掩盖了错误
  }
}

// ✅ 错误传播
async someMethod() {
  return await this.service.method(); // 让错误自然传播
}
```

## 🎯 开发检查清单

### IPC功能开发检查
- [ ] 接口定义是否完整？
- [ ] Web环境实现是否完整？
- [ ] Electron代理实现是否完整？
- [ ] preload.js是否暴露了所有方法？
- [ ] main.js是否有对应的处理器？
- [ ] 错误处理是否正确？
- [ ] 两种环境是否都测试过？

### 架构违规检查
- [ ] preload.js是否只做转发，没有业务逻辑？
- [ ] 是否所有方法都是异步的？
- [ ] 是否使用了统一的错误处理格式？
- [ ] 是否有直接的跨进程调用？

## 💡 最佳实践

### 1. 渐进式开发
1. 先在Web环境实现和测试
2. 定义完整的接口
3. 实现Electron代理
4. 完善IPC链路
5. 在Desktop环境测试

### 2. 调试技巧
```javascript
// 在每个环节添加日志
console.log('[Vue] Calling method:', methodName);
console.log('[Proxy] Forwarding to IPC:', methodName);
console.log('[Main] Handling IPC:', methodName);
console.log('[Service] Executing:', methodName);
```

### 3. 类型安全
```typescript
// 使用严格的类型检查
interface ElectronAPI {
  template: {
    [K in keyof ITemplateManager]: ITemplateManager[K];
  };
}
```

## 🔗 相关经验

这些架构分析为后续的开发提供了基础：
- 建立了完整的IPC开发流程
- 形成了接口优先的设计原则
- 建立了完整的开发和调试检查清单

这些经验在后续的序列化优化（115）中得到了进一步应用。
