## **`TestPanel.vue` 组件升级改造文档**

### 1. **目标**

将 `TestPanel.vue` 组件中用于显示"原始提示词结果"和"优化后提示词结果"的 `OutputPanelUI` 组件，全面升级为功能更强大、体验更统一的 `OutputDisplay` 组件。

### 2. **核心原则**

本次改造将遵循与 `PromptPanel.vue` 中 `OutputDisplay` 用法一致的架构模式，确保代码库风格的统一性和可维护性。核心原则如下：

*   **父组件拥有状态**：`TestPanel.vue` 将作为数据的所有者，全权负责管理测试结果的流式接收、内容存储和加载状态。
*   **单向数据流**：所有状态（如内容和加载状态）将通过 `props` 的形式单向传递给子组件 `OutputDisplay`。
*   **关注点分离**：`TestPanel.vue` 关注业务逻辑（如何获取数据），而 `OutputDisplay` 关注视图呈现（如何展示数据）。

### 3. **改造范围**

*   **文件**: `packages/ui/src/components/TestPanel.vue`

### 4. **详细实施步骤**

#### **4.1. 模板 (`<template>`) 修改**

1.  **移除 Markdown 切换按钮**:
    *   在模板中，找到并彻底删除用于切换 Markdown 渲染的两个 `<button>` 元素及其相关的 `enableMarkdown` 逻辑。`OutputDisplay` 自带视图切换功能，外部控制已不再需要。

2.  **替换 "原始提示词测试结果" 面板**:
    *   找到 `v-show="isCompareMode"` 的 `div`。
    *   删除内部的 `<OutputPanelUI ... />` 组件。
    *   在原位置添加以下新结构：
        ```html
        <h3 class="text-lg font-semibold theme-text truncate mb-3">{{ t('test.originalResult') }}</h3>
        <OutputDisplay
          :content="originalTestResult"
          :streaming="isTestingOriginal"
          mode="readonly"
          class="flex-1 h-full"
        />
        ```

3.  **替换 "优化后提示词测试结果" 面板**:
    *   找到显示优化结果的 `div`。
    *   删除内部的 `<OutputPanelUI ... />` 组件。
    *   在原位置添加以下新结构：
        ```html
        <h3 class="text-lg font-semibold theme-text truncate mb-3">
          {{ isCompareMode ? t('test.optimizedResult') : t('test.testResult') }}
        </h3>
        <OutputDisplay
          :content="optimizedTestResult"
          :streaming="isTestingOptimized"
          mode="readonly"
          class="flex-1 h-full"
        />
        ```

4.  **移除 `ref` 属性**:
    *   从模板中删除 `ref="originalOutputPanelRef"` 和 `ref="optimizedOutputPanelRef"` 属性，它们将不再被使用。

#### **4.2. 脚本 (`<script setup>`) 修改**

1.  **更新导入**:
    *   从 `'./OutputPanel.vue'` 的导入语句中移除 `OutputPanelUI`。
    *   添加从 `'./OutputDisplay.vue'` 导入 `OutputDisplay`。
    *   确保已从 `'../composables/useToast'` 导入 `useToast` 并初始化 `const toast = useToast()`。

2.  **移除废弃的状态**:
    *   删除以下 `ref` 定义：
        ```javascript
        const originalOutputPanelRef = ref(null)
        const optimizedOutputPanelRef = ref(null)
        const enableMarkdown = ref(true); // 如果存在
        ```

3.  **重构 `testOriginalPrompt` 函数**:
    *   此函数将从委托模式重构为主动管理模式。
    *   **修改后**的完整逻辑应如下：
        ```javascript
        const testOriginalPrompt = async () => {
          if (!props.originalPrompt) return

          isTestingOriginal.value = true
          originalTestResult.value = ''
          originalTestError.value = '' // 可选，主要用于调试
          
          await nextTick(); // 确保状态更新和DOM清空完成

          try {
            const streamHandler = {
              onToken: (token) => {
                originalTestResult.value += token
              },
              onComplete: () => { /* 流结束后不再需要设置 isTesting, 由 finally 处理 */ },
              onError: (err) => {
                const errorMessage = err.message || t('test.error.failed')
                originalTestError.value = errorMessage
                toast.error(errorMessage)
              }
            }

            // ... 此处构建 systemPrompt 和 userPrompt 的逻辑保持不变 ...

            await props.promptService.testPromptStream(
              systemPrompt,
              userPrompt,
              selectedTestModel.value,
              streamHandler
            )
          } catch (error) {
            console.error('[TestPanel] Original prompt test failed:', error); // 增加详细错误日志
            const errorMessage = error.message || t('test.error.failed')
            originalTestError.value = errorMessage
            toast.error(errorMessage)
            originalTestResult.value = ''
          } finally {
            // 确保无论成功或失败，加载状态最终都会被关闭
            isTestingOriginal.value = false
          }
        }
        ```

4.  **重构 `testOptimizedPrompt` 函数**:
    *   应用与 `testOriginalPrompt` 完全相同的重构逻辑，但操作对象是 `optimized` 相关的状态 (`props.optimizedPrompt`, `isTestingOptimized`, `optimizedTestResult`, `optimizedTestError`)。
    *   **关键增强点**: 同样需要在这里的 `try-catch-finally` 结构中加入 `await nextTick()` 和 `console.error` 日志。

5.  **移除 `defineExpose`**:
    *   由于不再需要从外部引用组件内部的 `ref` 或方法，请删除整个 `defineExpose` 代码块。

### 5. **预期结果**

*   `TestPanel.vue` 不再依赖 `OutputPanel.vue`，而是完全使用 `OutputDisplay.vue`。
*   测试结果区域拥有了与主优化面板一致的外观和交互（如视图切换、全屏等），但被限制为只读模式。
*   流式数据显示逻辑被正确地移至 `TestPanel.vue` 的 `<script>` 部分，代码结构更清晰，状态管理更可靠。
*   项目减少了一个仅用于特定场景的 `OutputPanel.vue` 组件，提高了代码的复用性和一致性。 