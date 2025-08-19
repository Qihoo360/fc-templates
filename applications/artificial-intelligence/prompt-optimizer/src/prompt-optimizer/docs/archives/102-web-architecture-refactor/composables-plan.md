# Vue Composable 架构重构计划

## 1. 背景与问题

在对核心服务进行“去单例化”重构后，应用启动时暴露出一系列与 Vue 响应式系统和组件通信相关的严重问题。这些问题起初表现为多种警告和错误：

1.  **属性类型不匹配**: 子组件收到的 props 类型与预期不符，例如期望 `Boolean` 却收到了 `Object` (`[Vue warn]: Invalid prop: type check failed`)。此问题在 `PromptPanel` 等多个组件中普遍存在。
2.  **无效的侦听源**: `useStorage` 等 Composable 因其依赖的 `services` 对象尚未初始化，导致 `watch` 侦听了一个 `undefined` 源 (`[Vue warn]: Invalid watch source: undefined`)。
3.  **顶层调用错误**: 在某些异步初始化逻辑中尝试调用 Composable，导致 Vue 抛出 `Must be called at the top of a 'setup' function` 错误。

## 2. 根本原因分析

经过排查，这些看似分散的问题，都指向同一个系统性的架构缺陷：**Composable 的状态封装模式不当**。

许多业务逻辑 Composable（如 `usePromptOptimizer`, `useModelManager`）返回的是一个包含了多个 `ref` 的普通 JavaScript 对象，形如：

```typescript
// 旧模式
function usePromptOptimizer() {
  const isIterating = ref(false);
  const someOtherState = ref('');
  return { isIterating, someOtherState }; 
}
```

当在 `App.vue` 中使用时：

```html
<!-- App.vue -->
<script setup>
const optimizer = usePromptOptimizer();
</script>

<template>
  <!-- 
    问题所在：optimizer.isIterating 是一个 ref 对象，
    而不是它内部的值。Vue 的模板自动解包不会深入到对象的属性。
  -->
  <PromptPanel :is-iterating="optimizer.isIterating" />
</template>
```

`PromptPanel` 组件收到的 `is-iterating` prop 是一个 `Ref<boolean>` 对象，而非期望的 `boolean` 值，导致类型检查失败。这个问题是所有连锁反应的核心。

## 3. 解决方案：统一返回 `reactive` 对象

为了从根本上解决问题，我们采取了统一的架构决策：**重构所有核心业务 Composable，使其返回一个单一的 `reactive` 对象**。

```typescript
// ✅ 新模式
function usePromptOptimizer() {
  const state = reactive({
    isIterating: false,
    someOtherState: '',
  });
  
  // ... 逻辑代码修改 state ...

  return state; // 返回一个响应式对象
}
```

当在 `App.vue` 中使用时，问题迎刃而解：

```html
<!-- App.vue (修改后) -->
<script setup>
const optimizerState = usePromptOptimizer();
</script>

<template>
  <!-- 
    现在 optimizerState.isIterating 直接是 boolean 值，
    符合子组件的 prop 预期。
  -->
  <PromptPanel :is-iterating="optimizerState.isIterating" />
</template>
```

这个模式确保了传递给子组件的是原始值，而不是 `ref` 包装器，同时保留了跨组件的状态响应性。

## 4. 实施过程与成果 (已完成) ✅

本次重构已**圆满完成**。

**核心重构**:
- [x] **`usePromptOptimizer`**: 已重构为返回 `reactive` 对象。
- [x] **`useModelManager`**: 已重构为返回 `reactive` 对象。
- [x] **`useHistoryManager`**: 已重构为返回 `reactive` 对象。
- [x] **`useTemplateManager`**: 已重构为返回 `reactive` 对象。
- [x] **`usePromptTester`**: 已重构为返回 `reactive` 对象。
- [x] **`useModals`**: 已重构为返回 `reactive` 对象。

**辅助修复**:
- [x] **修复 `useStorage`**: `ThemeToggleUI` 和 `LanguageSwitch` 组件被修改为通过 `inject` 获取 `services` 实例，并将其传递给 `useStorage`，解决了依赖过早初始化的问题。
- [x] **适配 `App.vue`**: 调整了 `App.vue` 中的模板绑定和 `computed` 属性，以适应新的 `reactive` 状态结构，并修复了因此产生的类型错误。
- [x] **依赖注入**: 在 `ModelSelect` 和 `DataManager` 等组件中，推广了使用 `inject` 直接从 `services` 中获取依赖的模式，简化了 `App.vue` 的模板。

**最终成果**:
- 彻底解决了启动时的所有 Vue `warn` 和 `error`。
- 建立了一套更健壮、更可预测、更符合 Vue 最佳实践的状态管理范式。
- 应用代码，特别是 `App.vue`，变得更加简洁和易于维护。

## 5. 经验总结

- **`reactive` vs. 对象包裹的 `ref`**: 对于一组高度内聚、会被一同传递或操作的响应式状态，使用 `reactive` 封装是比返回一个包含多个 `ref` 的对象更优的模式。它能有效避免深层解包问题，并简化消费端的代码。
- **`provide`/`inject` 是服务注入的利器**: 对于全局性或跨层级的服务/依赖（如 `services` 对象），使用 `provide`/`inject` 是比层层传递 `props` 更优雅、更高效的解决方案。
- **系统性问题需要系统性解决方案**: 面对一系列看似不同的报错，深入分析其共性根源至关重要。本次通过识别核心的“状态封装模式”问题，一次性解决了所有表层症状。