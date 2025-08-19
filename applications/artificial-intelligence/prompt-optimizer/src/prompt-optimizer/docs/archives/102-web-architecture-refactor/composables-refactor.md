# Vue Composable 架构重构实施记录

## 📋 任务概述

解决在异步回调中调用 Vue Composable 函数导致的错误：`Uncaught (in promise) SyntaxError: Must be called at the top of a 'setup' function`。重构所有 Composable 文件，实现"顶层声明，响应式连接，内部自治"的设计模式。

## 🎯 目标

- 解决 Vue Composable 调用时机问题
- 建立统一的服务接口定义
- 实现响应式的服务依赖注入
- 提高代码一致性和可维护性

## 📅 执行记录

### ✅ 已完成步骤

#### 1. 创建统一的服务接口定义
- **完成时间**: 2025-07-05 上午
- **实际结果**: 成功创建 `packages/ui/src/types/services.ts` 文件，定义 `AppServices` 接口
- **经验总结**: 中心化类型定义提高了代码一致性和可维护性

#### 2. 重构核心 Composable 文件
- **完成时间**: 2025-07-05 下午
- **实际结果**: 成功重构 8 个主要 Composable 文件，使其接收 `services: Ref<AppServices | null>` 参数
- **经验总结**: 统一的参数模式使代码更加一致，易于理解

#### 3. 更新 useAppInitializer
- **完成时间**: 2025-07-05 晚上
- **实际结果**: 增强了错误处理和日志记录，添加了 `error` 状态
- **经验总结**: 良好的错误处理对调试至关重要

#### 4. 更新 useModals
- **完成时间**: 2025-07-05 晚上
- **实际结果**: 将 useModals 也纳入新架构，接收 services 参数
- **经验总结**: 保持架构一致性对于长期维护非常重要

#### 5. 更新文档
- **完成时间**: 2025-07-05 晚上
- **实际结果**: 更新了架构文档和经验记录
- **经验总结**: 及时记录架构决策和经验对团队知识传承很重要

### ⚠️ 待解决问题

#### 6. 更新 App.vue
- **进行中**: 2025-07-06
- **当前状态**: 遇到类型错误，需要进一步解决
- **问题记录**:
  - `services` 对象与 `AppServices` 接口不匹配，特别是 `dataManager` 属性
  - 尝试使用类型断言 `as any` 临时解决，但仍有类型错误
  - 需要进一步研究 `DataManager` 类型定义和实现

## 🔧 核心解决方案

### 架构模式
```typescript
// ❌ 错误：在异步回调中调用Composable
onMounted(async () => {
  const services = await initServices();
  const modelManager = useModelManager(); // 错误：不在setup顶层调用
});

// ✅ 正确：顶层声明，响应式连接
const { services } = useAppInitializer(); // 在顶层调用
const modelManager = useModelManager(services); // 在顶层调用，传入services引用

// 内部实现：响应式连接
export function useModelManager(services: Ref<AppServices | null>) {
  // 状态定义...
  
  // 响应式连接：监听服务就绪
  watch(services, (newServices) => {
    if (!newServices) return;
    // 使用已就绪的服务...
  }, { immediate: true });
  
  return { /* 返回状态和方法 */ };
}
```

### 服务接口定义
```typescript
// packages/ui/src/types/services.ts
export interface AppServices {
  storageProvider: IStorageProvider;
  modelManager: IModelManager;
  templateManager: ITemplateManager;
  historyManager: IHistoryManager;
  dataManager: DataManager;
  llmService: ILLMService;
  promptService: IPromptService;
}
```

## 📊 进展状态

**核心目标 80% 达成**：
- ✅ 解决了 `Must be called at the top of a 'setup' function` 错误
- ✅ 实现了统一、可预测的 Composable 设计模式
- ✅ 提高了代码的可维护性和健壮性
- ✅ 完成了全面的文档更新
- ❌ App.vue 中的类型错误仍需解决

**技术实现**：
- 创建了中心化的 `AppServices` 接口
- 重构了 9 个 Composable 文件，使用统一的参数模式
- 增强了 `useAppInitializer` 的错误处理和日志记录
- 采用了"快速失败"模式，提早暴露潜在问题

**架构特点**：
- 所有 Composable 在 `<script setup>` 顶层调用
- Composable 接收 `services: Ref<Services | null>` 参数
- 内部通过 `watch(services, ...)` 响应服务就绪
- 明确的单向依赖关系

## 🎯 下一步计划

1. **解决 App.vue 类型错误**：
   - 深入研究 `DataManager` 类型定义和实现
   - 检查 `useAppInitializer` 返回的对象结构
   - 可能需要调整 `AppServices` 接口或服务实现

2. **添加错误处理UI**：
   - 利用 `useAppInitializer` 返回的 `error` 状态
   - 添加友好的错误提示界面

3. **编写架构指南**：
   - 为新开发人员创建详细的架构指南
   - 说明 Composable 的正确使用方式

## 💡 核心经验总结

1. **Vue 响应式上下文**: Vue Composable 必须在 `<script setup>` 顶层同步调用
2. **响应式连接模式**: 使用 `watch(services, ...)` 模式处理服务的异步初始化
3. **快速失败原则**: 在开发环境中，快速暴露问题比隐藏问题更有价值
4. **统一架构**: 保持所有 Composable 的一致架构模式
5. **类型系统挑战**: 复杂的类型系统可能导致接口不匹配问题

---

**任务状态**: ⚠️ 部分完成，需要解决类型错误  
**完成度**: 80%  
**最后更新**: 2025-07-01
