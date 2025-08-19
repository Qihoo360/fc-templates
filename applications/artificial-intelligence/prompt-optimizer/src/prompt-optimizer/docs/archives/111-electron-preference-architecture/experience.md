# 开发经验总结

## 🎯 核心经验

### 1. Electron API初始化时序管理
**经验**: Electron环境下，preload脚本的API暴露和渲染进程的组件初始化存在时序竞争

**最佳实践**:
```typescript
// ❌ 错误做法：直接访问API
window.electronAPI.preference.get(key, defaultValue)

// ✅ 正确做法：先检查再访问
if (isElectronApiReady()) {
  await window.electronAPI.preference.get(key, defaultValue)
} else {
  await waitForElectronApi()
  // 然后再访问
}
```

**适用场景**: 所有Electron应用的服务初始化

### 2. Vue组件初始化与服务依赖
**经验**: Vue的onMounted钩子可能在服务完全就绪前触发，导致竞态条件

**解决方案**:
- 使用异步初始化模式
- 在服务层实现延迟加载
- 添加服务就绪状态检查

**避免方式**: 不要在组件挂载时立即调用可能未就绪的服务

### 3. API路径标准化
**经验**: preload.js暴露的API路径必须与代码访问路径完全一致

**标准模式**:
```typescript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  preference: { /* API methods */ }
})

// 代码访问
window.electronAPI.preference.get()
```

**常见错误**: 
- preload暴露在`electronAPI`下，代码访问`api`
- API结构不一致导致undefined访问

## 🛠️ 技术实现经验

### 1. 环境检测最佳实践
```typescript
// 多层检测确保API完整可用
export function isElectronApiReady(): boolean {
  const window_any = window as any;
  const hasElectronAPI = typeof window_any.electronAPI !== 'undefined';
  const hasPreferenceApi = hasElectronAPI && 
    typeof window_any.electronAPI.preference !== 'undefined';
  return hasElectronAPI && hasPreferenceApi;
}
```

**关键点**:
- 不仅检测环境，还要检测具体API可用性
- 使用类型安全的检测方式
- 提供详细的调试日志

### 2. 异步等待模式
```typescript
export function waitForElectronApi(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    // 立即检查，避免不必要的等待
    if (isElectronApiReady()) {
      resolve(true);
      return;
    }
    
    // 轮询检查 + 超时保护
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isElectronApiReady()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 50);
  });
}
```

**设计要点**:
- 快速路径：已就绪时立即返回
- 合理间隔：50ms平衡性能和响应性
- 超时保护：防止无限等待
- 清理资源：及时清理定时器

### 3. 代理服务保护模式
```typescript
class ElectronPreferenceServiceProxy {
  private ensureApiAvailable() {
    if (!window?.electronAPI?.preference) {
      throw new Error('Electron API not available');
    }
  }

  async get<T>(key: string, defaultValue: T): Promise<T> {
    this.ensureApiAvailable(); // 每次调用前检查
    return window.electronAPI.preference.get(key, defaultValue);
  }
}
```

**设计原则**:
- 防御式编程：每次调用前都检查
- 明确错误信息：便于问题排查
- 统一检查逻辑：避免重复代码

## 🚫 避坑指南

### 1. 常见错误模式

#### 错误1: 假设API立即可用
```typescript
// ❌ 危险：假设API已就绪
export function useTemplateManager() {
  const services = inject('services')
  // 这里可能在API就绪前就被调用
  services.preferenceService.get('template-selection', null)
}
```

#### 错误2: 不一致的API路径
```typescript
// ❌ 错误：路径不匹配
// preload.js: window.electronAPI.preference
// 代码访问: window.api.preference
```

#### 错误3: 缺少超时保护
```typescript
// ❌ 危险：可能无限等待
while (!isApiReady()) {
  await sleep(100) // 没有超时机制
}
```

### 2. 调试技巧

#### 添加详细日志
```typescript
console.log('[isElectronApiReady] API readiness check:', {
  hasElectronAPI,
  hasPreferenceApi,
});
```

#### 使用断点调试
- 在API检测函数设置断点
- 检查window对象的实际结构
- 验证API暴露的完整性

#### 时序分析
- 记录每个初始化步骤的时间戳
- 分析组件挂载和API就绪的时序关系

## 🔄 架构设计经验

### 1. 服务层抽象
**经验**: 通过服务层抽象，UI组件不需要知道底层存储实现

**好处**:
- 环境无关：同一套UI代码在Web/Electron下都能运行
- 易于测试：可以轻松mock服务层
- 职责分离：UI专注展示，服务层处理数据

### 2. 代理模式应用
**经验**: 在Electron环境下使用代理模式封装IPC通信

**优势**:
- 接口统一：代理服务实现相同接口
- 错误隔离：代理层处理通信错误
- 透明切换：上层代码无需感知环境差异

### 3. 依赖注入模式
**经验**: 使用依赖注入管理服务实例

**实现方式**:
```typescript
// 环境适配的服务创建
if (isRunningInElectron()) {
  preferenceService = new ElectronPreferenceServiceProxy()
} else {
  preferenceService = createPreferenceService(storageProvider)
}

// 统一注入
provide('services', { preferenceService, ... })
```

## 📊 性能优化经验

### 1. 初始化性能
- **延迟加载**: 只在需要时初始化服务
- **并行初始化**: 无依赖的服务可以并行初始化
- **缓存检测结果**: 避免重复的环境检测

### 2. 运行时性能
- **批量操作**: 合并多个配置读写操作
- **异步处理**: 使用Promise避免阻塞UI
- **错误恢复**: 优雅处理API调用失败

## 🧪 测试策略经验

### 1. 环境模拟
```typescript
// Mock Electron环境
Object.defineProperty(window, 'electronAPI', {
  value: {
    preference: {
      get: jest.fn(),
      set: jest.fn(),
    }
  }
})
```

### 2. 时序测试
- 测试API就绪前的访问行为
- 测试超时场景的处理
- 测试并发初始化的安全性

### 3. 集成测试
- 端到端测试完整的初始化流程
- 验证不同环境下的行为一致性
- 测试错误恢复机制

## 🔗 相关资源

### 文档链接
- [Electron Context Bridge文档](https://www.electronjs.org/docs/api/context-bridge)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

### 代码示例
- 完整实现见: `packages/core/src/services/preference/`
- 测试用例见: `packages/core/tests/`

---

**总结日期**: 2025-01-01  
**适用版本**: Electron 37.x, Vue 3.x  
**经验等级**: 生产环境验证 