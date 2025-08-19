# UI 模块文件级排查清单 (v3)

本文档将常见问题排查清单以**具体文件为单位**进行组织和索引。当遇到问题时，可直接定位到相关文件，并检查下文中列出的所有关键点。每次团队成员根据此清单解决问题后，都应考虑更新此文件，以保证其时效性。

---

## Part 1: 应用入口与状态组装

### 📍 `packages/web/src/App.vue`

这是组装所有核心 Composable 和 UI 组件的主入口，是检查问题的起点。

- **[x] 顶层 Composable 调用**: 确认所有 `use...()` hook 都在 `<script setup>` 的顶层被调用。它们绝不能存在于 `async` 函数、`.then()` 回调或任何其他异步逻辑内部。
- **[x] `toRef` 适配器**: 检查所有传递给子 Composable 的 props。如果一个 `reactive` 对象的属性（如 `optimizerState.currentChainId`）被传递给一个期望 `Ref` 类型参数的 Composable，请确保它被 `toRef(optimizerState, 'currentChainId')` 正确包装。

---

## Part 2: Composable 架构与逻辑

### 📍 `packages/ui/src/composables/useAppInitializer.ts`
- **[x] 依赖注入完整性**: 确认所有被应用依赖的服务（如 `templateLanguageService`）都已在 `services` 对象中正确注册并返回。

### 📍 `packages/ui/src/composables/usePromptOptimizer.ts`
- **[x] 返回 `reactive`**: 确认 `return` 语句返回的是单一的 `reactive` 对象。
- **[x] `nextTick` 防护**: 在 `handleOptimizePrompt` 等函数中，确认在 `await` 异步服务**之前**，已同步完成状态清理（如 `optimizedPrompt.value = ''`），并紧跟 `await nextTick()`。

### 📍 `packages/ui/src/composables/useModelManager.ts`
- **[x] 返回 `reactive`**: 确认 `return` 语句返回的是单一的 `reactive` 对象。
- **[x] `watch` 内部依赖**: 确认其内部通过 `watch` 监听 `services` 的就绪状态来执行初始化逻辑。

### 📍 `packages/ui/src/composables/useTemplateManager.ts`
- **[x] 返回 `reactive`**: 确认 `return` 语句返回的是单一的 `reactive` 对象。
- **[x] `watch` 内部依赖**: 确认其内部通过 `watch` 监听 `services` 的就绪状态。

### 📍 `packages/ui/src/composables/useHistoryManager.ts`
- **[x] 返回 `reactive`**: 确认 `return` 语句返回的是单一的 `reactive` 对象。
- **[x] `watch` 内部依赖**: 确认其内部通过 `watch` 监听 `services` 的就绪状态。

### 📍 `packages/ui/src/composables/usePromptHistory.ts`
- **[x] `watch` 内部依赖**: 确认其内部通过 `watch` 监听 `services` 的就绪状态。
- **[x] `Ref` 参数类型**: 确认其接收的 `currentChainId` 等参数都是 `Ref` 类型。

### 📍 `packages/ui/src/composables/usePromptTester.ts`
- **[x] 返回 `reactive`**: 确认 `return` 语句返回的是单一的 `reactive` 对象。
- **[x] `watch` 内部依赖**: 确认其内部通过 `watch` 监听 `services` 的就绪状态。

### 📍 `packages/ui/src/composables/useStorage.ts`
- **[x] `watch` 内部依赖**: 确认其内部通过 `watch` 监听 `services` 的就绪状态，以避免 `Invalid watch source` 警告。

---

## Part 3: UI 组件实现

### 📍 `packages/ui/src/components/MainLayout.vue`
- **[x] Flexbox 父容器**: 检查根元素是否为 `flex` 容器，为子元素（如 `InputPanel`）的 `flex-1` 提供约束。

### 📍 `packages/ui/src/components/InputPanel.vue`
- **[x] `min-h-0` 约束**: 检查内部需要滚动的 `textarea` 区域，其父级容器链条上是否应用了 `flex-1 min-h-0` 以实现正确的空间分配。

### 📍 `packages/ui/src/components/OutputPanel.vue`
- **[x] `min-h-0` 约束**: 同 `InputPanel.vue`，检查滚动区域的 Flex 约束。

### 📍 `packages/ui/src/components/TestPanel.vue`
- **[x] `min-h-0` 约束**: 特别注意检查此组件，因其布局复杂，需要确保所有 `flex` 子项都有正确的 `min-h-0` 约束。

### 📍 `packages/ui/src/components/Modal.vue`
- **[x] `v-if` 根元素**: 确认组件的根 DOM 元素上有 `v-if="modelValue"` 指令。
- **[x] `v-model` 支持**: 确认 `close()` 方法中调用了 `emit('update:modelValue', false)`。
- **[x] 安全背景点击**: 确认背景遮罩层的 `@click` 事件处理函数中使用了 `event.target === event.currentTarget` 判断。

### 📍 `packages/ui/src/components/FullscreenDialog.vue`
- **[x] `v-if` / `v-model`**: 同 `Modal.vue`。
- **[x] 安全背景点击**: 同 `Modal.vue`。

### 📍 `packages/ui/src/components/TemplateManager.vue`
- **[x] `v-if` / `v-model`**: 同 `Modal.vue`。
- **[x] 安全背景点击**: 同 `Modal.vue`。

### 📍 `packages/ui/src/components/ModelManager.vue`
- **[x] `v-if` / `v-model`**: 同 `Modal.vue`。
- **[x] 安全背景点击**: 同 `Modal.vue`。

### 📍 `packages/ui/src/components/HistoryDrawer.vue`
- **[x] `v-if` / `v-model`**: 检查 `v-if="show"` 和 `emit('update:show', false)`。
- **[x] 安全背景点击**: 同 `Modal.vue`。

### 📍 `packages/ui/src/components/OutputDisplayCore.vue`
- **[x] 实时 `emit`**: 检查 `<script setup>` 中是否存在一个 `watch`，它正在监听本地的编辑状态，并在内容变化时**立即**通过 `emit('update:content', ...)` 通知父组件。

### 📍 `packages/ui/src/components/MarkdownRenderer.vue`
- **[x] 实时 `emit`**: 检查 `<script setup>` 中是否存在一个 `watch`，它正在监听本地的编辑状态，并在内容变化时**立即**通过 `emit('update:content', ...)` 通知父组件。
- **[x] 无 `prose` 类**: 检查组件模板中的 `class` 属性，确认其中没有 `@apply prose` 或其变体，以避免与自定义主题的样式冲突。

---

## Part 4: 架构一致性与错误处理

### 📍 **职责分离检查** ✅
- **[✅] 单一职责原则**: 每个 Composable 只负责一个明确的功能域，不应承担其他职责
- **[✅] 重复逻辑检查**: 确认没有多个 Composable 实现相同的功能（如模板管理、存储操作）
- **[✅] 初始化逻辑集中**: 相关资源的初始化逻辑应集中在一个地方，避免竞争条件

### 📍 **存储键管理** ✅
- **[✅] 统一存储键定义**: 所有存储键应定义在 `packages/ui/src/constants/storage-keys.ts` 中
- **[✅] 避免魔法字符串**: 不应在代码中直接使用字符串作为存储键
- **[✅] 存储键一致性**: 确认 DataManager 中的存储键与 UI 包中的定义保持同步

### 📍 **服务依赖管理** ✅
- **[✅] 统一服务获取**: 优先使用 `inject('services')` 获取服务，避免 props 和 inject 混用
- **[✅] 服务空值检查**: 如果 services 未正确注入，应立即抛出错误而不是静默处理
- **[✅] 立即失败原则**: 发现服务依赖问题时立即报错，不要使用重试机制掩盖问题

### 📍 **错误处理原则** ✅
- **[✅] 避免静默处理**: 不应使用 try-catch 静默处理错误，应让错误向上传播
- **[✅] 移除掩盖机制**: 不应有备用逻辑或重试机制掩盖真正的问题
- **[✅] 明确错误信息**: 错误信息应明确指出问题所在，便于快速定位
- **[✅] watch中的错误处理**: 即使在watch回调中，也不应掩盖错误，应让错误向上传播

### 📍 **事件处理一致性** ✅
- **[✅] v-model 优先**: 优先使用 v-model 双向绑定，避免复杂的事件处理链
- **[✅] 事件参数一致**: 确认组件发出的事件参数与处理函数期望的参数匹配
- **[✅] 异步事件处理**: 如果事件处理函数是异步的，确认调用方正确处理 Promise

### 📍 **架构分层检查** ✅
- **[✅] 插件层独立性**: 插件层（如 i18n.ts）不应依赖UI组件层的常量或组件
- **[✅] 避免循环依赖**: 确认不同层级之间没有循环引用
- **[✅] 降级处理合理性**: 区分合理的降级处理和掩盖问题的静默处理

### 📍 **Electron兼容性检查** ✅
- **[✅] 存储实例一致性**: 确保i18n等插件使用与App.vue相同的存储实例，避免UI进程和主进程数据不一致
- **[✅] 服务依赖注入**: 插件层应接收服务实例而不是自己创建，确保Electron环境下的数据同步
- **[✅] 延迟初始化**: Web和Extension应用中的i18n都应等待存储服务准备好后再初始化
- **[✅] 避免main创建服务**: main.ts不应直接使用StorageFactory.createDefault()，应由App.vue统一管理
- **[✅] 文件扩展名一致性**: Web和Extension应用都应使用main.ts而不是混用.js和.ts
- **[✅] 模块级副作用检查**: 确保模块导入不会产生存储创建等副作用，特别是factory文件
- **[✅] 历史数据清理**: 修复代码后需要清理浏览器中的历史IndexedDB数据
- **[✅] 强制明确性**: 删除便利方法如createDefault()，强制开发者明确指定存储类型