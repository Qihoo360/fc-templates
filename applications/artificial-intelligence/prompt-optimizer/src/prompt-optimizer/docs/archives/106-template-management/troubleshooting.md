# 模板管理故障排除清单

## 常见问题和解决方案

### 1. 模板删除错误："Template not found"

**症状：**
- 删除模板时出现 `TemplateError: Template not found: template-xxx` 错误
- 错误通常在 `index.js:1683` 行抛出

**原因：**
- 异步方法调用缺少 `await` 关键字
- 时序问题：`deleteTemplate` 和 `loadTemplates` 并发执行
- 模板在删除过程中被其他操作访问

**解决方案：**
1. 确保所有异步模板操作都使用 `await`：
   ```javascript
   // ❌ 错误
   getTemplateManager.value.deleteTemplate(templateId)
   await loadTemplates()
   
   // ✅ 正确
   await getTemplateManager.value.deleteTemplate(templateId)
   await loadTemplates()
   ```

2. 检查以下函数中的异步调用：
   - `confirmDelete()`
   - `handleSubmit()`
   - `handleFileImport()`
   - `applyMigration()`

### 2. 模板类型错误：在管理界面切换分类后添加模板类型仍然错误

**症状：**
- 在模板管理界面切换到用户提示词分类，但点击添加按钮仍然添加系统提示词模板
- 添加的模板类型与当前显示的分类不匹配

**原因：**
- **核心问题**：`getCurrentTemplateType()` 函数返回固定的 `props.templateType`，不会随用户在管理界面内的分类切换而改变
- 添加模板时使用的模板类型来源错误

**重要概念澄清：**
- **模板管理界面的分类切换**：用户可以在管理界面内切换查看不同类型的模板
- **添加按钮的行为**：应该根据当前显示的分类来决定添加什么类型的模板
  - 当前显示系统提示词分类 → 添加系统提示词模板（`templateType: 'optimize'`）
  - 当前显示用户提示词分类 → 添加用户提示词模板（`templateType: 'userOptimize'`）
  - 当前显示迭代提示词分类 → 添加迭代提示词模板（`templateType: 'iterate'`）

**解决方案：**
1. 修正 `getCurrentTemplateType()` 函数，让它根据当前分类而不是props来决定：
   ```javascript
   // ❌ 错误：使用固定的props值
   function getCurrentTemplateType() {
     return props.templateType
   }

   // ✅ 正确：根据当前分类决定
   function getCurrentTemplateType() {
     switch (currentCategory.value) {
       case 'system-optimize': return 'optimize'
       case 'user-optimize': return 'userOptimize'
       case 'iterate': return 'iterate'
       default: return 'optimize'
     }
   }
   ```

2. 确保分类切换按钮正确更新 `currentCategory`：
   ```javascript
   @click="currentCategory = 'user-optimize'"
   ```

3. 验证添加模板时使用正确的模板类型：
   ```javascript
   templateType: getCurrentTemplateType() // 现在会根据当前分类返回正确的类型
   ```

### 3. 模板管理器打开位置错误

**症状：**
- 从系统优化提示词下拉框点击管理，但打开的是其他分类
- 从导航栏打开模板管理器，定位到错误的分类
- 模板管理器的初始定位与打开来源不匹配

**原因：**
- `currentCategory` 只在组件初始化时设置，不会响应 `props.templateType` 的变化
- 从导航栏打开时使用了错误的默认逻辑

**解决方案：**
1. 添加对 `props.templateType` 变化的监听：
   ```javascript
   // 监听 props.templateType 变化，更新当前分类
   watch(() => props.templateType, (newTemplateType) => {
     currentCategory.value = getCategoryFromProps()
   }, { immediate: true })
   ```

2. 修正导航栏打开的默认逻辑：
   ```javascript
   // ❌ 错误：根据当前优化模式决定
   const openTemplateManager = (templateType?: string) => {
     currentTemplateManagerType.value = templateType || (selectedOptimizationMode.value === 'system' ? 'optimize' : 'userOptimize')
   }

   // ✅ 正确：默认为系统优化提示词
   const openTemplateManager = (templateType?: string) => {
     currentTemplateManagerType.value = templateType || 'optimize'
   }
   ```

3. 确保正确的定位规则：
   - 从系统优化提示词下拉框 → 定位到系统优化提示词分类
   - 从用户优化提示词下拉框 → 定位到用户优化提示词分类
   - 从迭代提示词下拉框 → 定位到迭代提示词分类
   - 从导航栏 → 定位到系统优化提示词分类（默认第一个）

### 4. 模板保存失败

**症状：**
- 保存模板时出现错误
- 模板列表没有更新

**检查项：**
- [ ] `saveTemplate()` 调用是否使用了 `await`
- [ ] `loadTemplates()` 调用是否使用了 `await`
- [ ] 模板数据格式是否正确
- [ ] 模板ID是否符合格式要求（至少3个字符，只包含小写字母、数字和连字符）

### 5. 模板导入失败

**症状：**
- 导入JSON文件时出现错误
- 导入后模板列表没有更新

**检查项：**
- [ ] `importTemplate()` 调用是否使用了 `await`
- [ ] `loadTemplates()` 调用是否使用了 `await`
- [ ] JSON文件格式是否正确
- [ ] 模板schema验证是否通过

### 6. 架构设计原则

**服务依赖注入：**
- [ ] 使用依赖注入而不是直接创建服务实例
- [ ] 避免在UI组件中使用 `StorageFactory.createDefault()`
- [ ] 确保服务实例在整个应用中保持一致

**错误处理：**
- [ ] 立即抛出异常而不是静默处理
- [ ] 避免掩盖问题的重试机制
- [ ] 在服务检查失败时快速失败

**异步操作：**
- [ ] 所有异步方法调用都使用 `await`
- [ ] 避免并发执行可能冲突的操作
- [ ] 确保操作顺序的正确性

### 7. 代码审查清单

**模板管理相关代码审查时检查：**
- [ ] 所有 `templateManager` 方法调用是否正确使用 `await`
- [ ] 异步函数是否正确声明为 `async`
- [ ] 错误处理是否完整
- [ ] 是否有竞态条件的风险
- [ ] 模板ID生成和验证逻辑是否正确
- [ ] 是否移除了有害的默认值
- [ ] 优化模式是否正确传递给所有相关组件

### 8. 测试建议

**单元测试：**
- [ ] 测试模板CRUD操作的异步行为
- [ ] 测试错误情况下的异常处理
- [ ] 测试并发操作的安全性

**集成测试：**
- [ ] 测试完整的模板管理流程
- [ ] 测试UI组件与服务层的交互
- [ ] 测试Electron环境下的IPC通信

### 9. 内置模板语言切换后迭代页面模板选择不更新

**症状：**
- 在模板管理界面切换内置模板语言后，主界面的优化提示词下拉框正确更新
- 但执行优化后点击"继续优化"，迭代页面的模板选择显示旧语言的模板名称
- 下拉列表已更新为新语言，但当前选中项还是旧语言
- 实际发送请求时生效的是新语言（因为通过templateId重新获取）

**根本原因：**
- **事件传播路径不同**：主界面和迭代页面的TemplateSelect组件在不同的层级
- **组件层级差异**：
  - 主界面：`App.vue → TemplateSelectUI`（直接引用）
  - 迭代页面：`App.vue → PromptPanelUI → TemplateSelect`（间接引用）
- **刷新机制缺失**：语言切换事件无法传播到深层的TemplateSelect组件

**详细分析：**
1. **主界面正常的原因**：
   - 在TemplateManager关闭时会自动调用 `templateSelectRef?.refresh?.()`
   - 组件层级简单，事件传播路径短
   - 有直接的引用和刷新机制

2. **迭代页面异常的原因**：
   - 迭代页面的TemplateSelect没有被包含在语言切换的刷新逻辑中
   - 组件层级更深，需要额外的事件传播机制
   - 之前没有建立完整的事件传播链

**解决方案：**
1. **建立事件传播链**：
   ```javascript
   // TemplateManager.vue - 发出语言变化事件
   const handleLanguageChanged = async (newLanguage: string) => {
     // ... 现有逻辑 ...

     // 发出语言变化事件，通知父组件
     emit('languageChanged', newLanguage)
   }
   ```

2. **App.vue处理事件并传播**：
   ```javascript
   // 处理模板语言变化
   const handleTemplateLanguageChanged = (newLanguage: string) => {
     // 刷新主界面的模板选择组件
     if (templateSelectRef.value?.refresh) {
       templateSelectRef.value.refresh()
     }

     // 刷新迭代页面的模板选择组件
     if (promptPanelRef.value?.refreshIterateTemplateSelect) {
       promptPanelRef.value.refreshIterateTemplateSelect()
     }
   }
   ```

3. **PromptPanel暴露刷新方法**：
   ```javascript
   // PromptPanel.vue - 暴露刷新迭代模板的方法
   const refreshIterateTemplateSelect = () => {
     if (iterateTemplateSelectRef.value?.refresh) {
       iterateTemplateSelectRef.value.refresh()
     }
   }

   defineExpose({
     refreshIterateTemplateSelect
   })
   ```

**修复验证：**
- [x] 语言切换事件正确传播到所有TemplateSelect组件
- [x] 迭代页面的下拉列表正确更新为新语言
- [x] 用户可以在迭代页面选择正确语言的模板
- [x] 主界面和迭代页面行为一致

**经验总结：**
1. **组件层级影响事件传播**：深层组件需要额外的事件传播机制
2. **统一刷新机制**：所有相关组件都应该有统一的刷新接口
3. **完整的事件链**：确保事件能够传播到所有需要响应的组件
4. **架构一致性**：相同功能的组件应该有相同的响应机制

### 10. 监控和调试

**日志记录：**
- [ ] 记录模板操作的开始和结束
- [ ] 记录异步操作的时序
- [ ] 记录错误的详细上下文

**调试技巧：**
- [ ] 使用浏览器开发者工具检查异步调用栈
- [ ] 检查模板管理器的初始化状态
- [ ] 验证模板数据的完整性

## 预防措施

1. **代码规范：**
   - 所有异步模板操作必须使用 `await`
   - 异步函数必须声明为 `async`
   - 错误处理必须完整
   - 移除所有有害的默认值，特别是优化模式相关的默认值

2. **架构原则：**
   - 使用依赖注入管理服务实例
   - 避免在UI层直接创建服务
   - 保持服务实例的一致性

3. **测试覆盖：**
   - 为所有模板操作编写单元测试
   - 测试异步操作的正确性
   - 测试错误情况的处理

4. **代码审查：**
   - 重点检查异步操作的正确性
   - 验证错误处理的完整性
   - 确保架构原则的遵循
