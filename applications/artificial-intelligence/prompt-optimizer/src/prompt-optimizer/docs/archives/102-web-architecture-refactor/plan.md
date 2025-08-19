# Web 与插件端架构重构计划

## 1. 当前状态与问题

**最新状态 (2024-12-29):** 底层与上层应用重构均已完成。

- **已完成**: `@prompt-optimizer/core` 和 `@prompt-optimizer/ui` 包已成功移除所有单例服务。
- **已解决**: Web 应用 (`@prompt-optimizer/web`) 和浏览器插件 (`@prompt-optimizer/extension`) 的入口文件 (`App.vue`) 已完成适配，应用**能够正常启动和运行**。

本计划旨在记录并总结 `App.vue` 的适配过程。

## 2. 重构目标

- **修复应用启动失败问题**，使其能正常运行。
- **完全对齐上层应用与底层服务架构**，采用统一的 `useAppInitializer` 进行服务初始化。
- **简化 `App.vue`**，使其只负责布局和初始化，将业务逻辑完全委托给 Composables。
- **采用最新的 Composable 架构**，消费返回 `reactive` 对象而不是多个 `ref` 的 Composable。

## 3. 实施计划

### 阶段一：净化 UI 包 (已完成) ✅

1.  **文件**: `packages/ui/src/index.ts`
    -   **任务**: 移除所有从 `@prompt-optimizer/core` 重新导出的服务实例。
    -   **状态**: ✅ **已完成**。UI 包现在只导出组件、Composables、工厂函数和类型。

### 阶段二：创建统一的应用初始化器 (已完成) ✅

1.  **文件**: `packages/ui/src/composables/useAppInitializer.ts` (新建)
    -   **任务**: 创建一个 Vue Composable，根据环境（Web/Electron）创建并返回所有必要服务的实例。
    -   **状态**: ✅ **已完成**。

### 阶段三：重构应用入口 (已完成) ✅

此阶段是本次重构的核心，现已**圆满完成**。

1.  **文件**: `packages/web/src/App.vue` 和 `packages/extension/src/App.vue`
    -   **状态**: ✅ **已完成**。应用已能正常启动。
    -   **最终实现方案**:
        1.  **[x] 清理无效导入**:
            -   在 `<script setup>` 中，删除了所有对单例服务 (`modelManager`, `templateManager` 等) 的直接导入。
        2.  **[x] 依赖 `useAppInitializer`**:
            -   在顶层调用 `const { services, isInitializing } = useAppInitializer()` 作为获取所有服务的唯一来源。
        3.  **[x] 在顶层调用所有业务 Composable**:
            -   遵循 [Composable 重构计划](./composables-refactor-plan.md) 的成果，所有业务逻辑 Composable (如 `usePromptOptimizer`, `useModelManager`) 都在 `<script setup>` 的顶层被调用。
            -   这些 Composable 接收 `services` ref 作为参数，并返回一个单一的 `reactive` 对象。
            -   **示例代码**:
                ```typescript
                // App.vue
                const { services, isInitializing, error } = useAppInitializer();
                
                // 在顶层直接调用，传入 services ref
                const modelManagerState = useModelManager(services);
                const templateManagerState = useTemplateManager(services);
                const optimizerState = usePromptOptimizer(services);
                // ... 其他 Composable
                ```
        4.  **[x] 更新模板 (`<template>`)**:
            -   模板中的所有数据绑定和事件处理，现在都链接到 Composable 返回的 `reactive` 对象的属性上 (e.g., `optimizerState.isIterating`)。
            -   这解决了之前因传递 `ref` 对象而导致的 prop 类型验证失败问题。
        5.  **[x] 修复 `computed` 和类型错误**:
            -   修正了 `App.vue` 中的 `computed` 属性，使其不再错误地访问 `.value`。
            -   添加了缺失的 i18n 翻译条目，如 `promptOptimizer.originalPromptPlaceholder`。
            -   通过 `provide` 正确传递了 `templateLanguageService` 等深层依赖。
        6.  **[x] 推广 `provide`/`inject`**:
            -   保留了 `provide('services', services)`，并鼓励子组件（如 `ModelSelect.vue`, `DataManager.vue`）通过 `inject` 获取服务，减少了 props 传递。

## 4. 预期成果 (已达成)

- [x] Web 端和插件端应用恢复正常，功能与重构前一致。
- [x] `App.vue` 代码变得极为简洁，只负责"初始化"和"布局"。
- [x] 整个应用的启动流程清晰、健壮，完全遵循依赖注入和响应式数据流的最佳实践。
- [x] 为未来在所有平台（Web/插件/桌面）添加新功能打下坚实的基础。 

## 5. 最新进展：净化 UI 子组件 (已完成) ✅

**背景**: 在 `App.vue` 完成对 `useAppInitializer` 的适配后，发现其下属的多个 UI 组件 (`@prompt-optimizer/ui/components/*`) 仍然直接从 `@prompt-optimizer/core` 导入单例服务，这违反了新的依赖注入架构，并可能导致潜在的 bug 和测试难题。

**任务**: 彻底移除 UI 组件层对服务单例的直接依赖，改为通过 `props` 接收服务实例。

**实施清单**:
- [x] **`TemplateSelect.vue`**: 移除对 `templateManager` 的直接导入，改为 props 传入。
- [x] **`ModelSelect.vue`**: 移除对 `modelManager` 的直接导入，改为 props 传入。
- [x] **`OutputDisplayCore.vue`**: 移除对 `compareService` 的直接导入，改为 props 传入。
- [x] **`HistoryDrawer.vue`**: 移除对 `historyManager` 的直接导入（该组件已通过 props 接收数据，只需清理无用导入）。
- [x] **`BuiltinTemplateLanguageSwitch.vue`**: 移除对 `templateManager` 和 `templateLanguageService` 的直接导入，改为 props 传入。
- [x] **`DataManager.vue`**: 移除对 `dataManager` 的直接导入，改为 props 传入或从 `services` inject。
- [x] **`TemplateManager.vue`**: 确保从 `services` 注入中获取 `templateManager` 和 `templateLanguageService`，并正确传递给子组件。

**成果**:
- 所有核心 UI 展示组件均已与服务层解耦。
- 组件的复用性和可测试性得到显著提升。
- 整个前端架构更加符合"依赖于接口而非实现"的原则。
- 项目的架构一致性得到保障，为后续的维护和迭代清除了障碍。 