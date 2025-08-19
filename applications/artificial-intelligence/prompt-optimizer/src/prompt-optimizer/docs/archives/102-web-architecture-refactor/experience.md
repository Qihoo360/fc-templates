# Web架构重构经验总结

## 📋 概述

Web架构重构过程中积累的核心经验，包括Vue Composable架构设计、响应式系统优化和依赖注入最佳实践。

## 🎯 Vue Composable 架构重构：解决异步初始化问题

### 问题背景
在异步回调中调用Vue Composable函数会导致错误：`Uncaught (in promise) SyntaxError: Must be called at the top of a 'setup' function`。这违反了Vue Composition API的核心规则，需要重构架构。

### 核心解决方案：顶层声明，响应式连接，内部自治
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

### 架构设计要点
1. **统一服务接口**：创建`AppServices`接口，统一管理所有核心服务
2. **服务初始化器**：`useAppInitializer`负责创建和初始化所有服务
3. **Composable参数模式**：所有Composable接收`services`引用作为参数

### 关键经验
1. **Vue响应式上下文**: Vue Composable必须在`<script setup>`顶层同步调用
2. **响应式连接模式**: 使用`watch`监听服务就绪，而不是在回调中调用Composable
3. **快速失败原则**: 在开发环境中，快速暴露问题比隐藏问题更有价值
4. **统一架构**: 保持所有Composable的一致架构模式
5. **类型系统挑战**: 复杂的类型系统可能导致接口不匹配问题

## 🔄 Composable 重构：`reactive` vs `ref` 的深度实践

### 背景
为解决 Vue 深层嵌套 `ref` 无法自动解包的问题，我们将多个核心 Composables 的返回值从包含多个 `ref` 的对象，重构为了单一的 `reactive` 对象。

### 核心挑战与解决方案

#### 1. 依赖注入失败
- **现象**: 组件无法通过 `inject` 获取服务实例
- **根因**: 服务创建了但没有正确注册到依赖注入系统
- **解决**: 确保服务完整的创建、注册、提供链条

#### 2. 响应式接口不匹配
- **现象**: `Cannot read properties of null (reading 'value')` 错误
- **根因**: `reactive` 对象属性与期望 `ref` 的接口不匹配
- **解决**: 使用 `toRef` 作为适配器
  ```typescript
  // 为 reactive 对象的属性创建一个双向绑定的 ref
  const selectedTemplateRef = toRef(optimizer, 'selectedTemplate');
  ```

#### 3. 外部API健壮性
- **现象**: API检测失败导致解析错误
- **根因**: 未检查响应内容类型就尝试解析JSON
- **解决**: 在解析前检查 `Content-Type` 响应头

### 总结
- `reactive` 适用于管理**一组**相关状态，简化顶层 API
- `ref` 依然是跨组件传递**单个**响应式变量的可靠方式
- `toRef` 和 `toRefs` 是在 `reactive` 和 `ref` 之间适配的必备工具
- 依赖注入和服务初始化流程的正确性是复杂应用稳定运行的基石

## 💡 核心经验总结

1. **Vue响应式上下文**: Vue Composable必须在`<script setup>`顶层同步调用
2. **响应式连接模式**: 使用`watch`监听服务就绪，保持代码清晰和可维护
3. **快速失败原则**: 在开发环境中，快速暴露问题比隐藏问题更有价值
4. **统一架构**: 保持所有Composable的一致架构模式
5. **类型系统**: 复杂的类型系统需要仔细处理接口匹配问题
6. **响应式系统**: `reactive`和`ref`各有适用场景，`toRef`是重要的适配工具

## 🔗 相关文档

- [Web架构重构概述](./README.md)
- [Composable重构实施记录](./composables-refactor.md)
- [架构设计原则](./design-principles.md)

---

**文档类型**: 经验总结  
**适用范围**: Vue Composable架构开发  
**最后更新**: 2025-07-01
