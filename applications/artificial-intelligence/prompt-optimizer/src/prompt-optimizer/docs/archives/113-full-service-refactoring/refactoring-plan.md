# 待办事项

## 🎯 核心任务：核心服务接口隔离重构

### 优先级：高

- **目标**：确保UI层完全通过接口与核心服务交互，统一Web和Desktop架构。
- **截止日期**：待定

---

### ✅ 已完成

1.  **重构 `ModelManager`**
    - [x] 在 `useAppInitializer` 中创建 `modelManagerAdapter`
    - [x] 补全 `IModelManager` 接口
    - [x] 添加 `isInitialized`, `getModelOptions` 到 `ModelManager` 实现
    - [x] 更新 `ElectronModelManagerProxy`
    - [x] 更新 `preload.js`
    - [x] 更新 `main.js`

2.  **重构 `HistoryManager`**
    - [x] 在 `useAppInitializer` 中创建 `historyManagerAdapter`
    - [x] 补全 `IHistoryManager` 接口 (修正 `addIteration`, 添加 `deleteChain`)
    - [x] 添加 `deleteChain` 到 `HistoryManager` 实现
    - [x] 更新 `ElectronHistoryManagerProxy`
    - [x] 更新 `preload.js`
    - [x] 更新 `main.js`

---

### 📋 待处理

3.  **重构 `TemplateManager`**
    - [ ] 在 `useAppInitializer` 中创建 `templateManagerAdapter`
    - [ ] 根据编译错误，检查并补全 `ITemplateManager` 接口
    - [ ] 为新增的接口方法更新 `ElectronTemplateManagerProxy`
    - [ ] 为新增的接口方法更新 `preload.js`
    - [ ] 为新增的接口方法更新 `main.js`

4.  **重构 `LLMService`**
    - [ ] 在 `useAppInitializer` 中创建 `llmServiceAdapter`
    - [ ] 补全 `ILLMService` 接口
    - [ ] 更新 `ElectronLLMProxy`
    - [ ] 更新 `preload.js`
    - [ ] 更新 `main.js`

5.  **重构 `PromptService`**
    - [ ] 在 `useAppInitializer` 中创建 `promptServiceAdapter`
    - [ ] 补全 `IPromptService` 接口
    - [ ] 更新 `ElectronPromptServiceProxy`
    - [ ] 更新 `preload.js`
    - [ ] 更新 `main.js`

6.  **最终验证**
    - [ ] 运行完整的单元测试和集成测试
    - [ ] 分别启动 Web 和 Desktop 应用，手动测试所有核心功能

---

### 📝 备注
- `DataManager` 和 `PreferenceService` 的重构将根据需要进行，目前看可能不是必需的。

## 🔥 紧急任务

### 本周必须完成
- [ ] [任务描述] - [截止日期] - [负责人]
- [ ] [任务描述] - [截止日期] - [负责人]

### 今日重点
- [ ] [任务描述] - [预计时间]
- [ ] [任务描述] - [预计时间]

## ⭐ 重要任务

### 功能开发
- [ ] [功能名称] - [优先级] - [预计工期]
- [ ] [功能名称] - [优先级] - [预计工期]

### 技术债务
- [ ] [技术债务描述] - [影响程度] - [预计工期]
- [ ] [技术债务描述] - [影响程度] - [预计工期]

### 文档更新
- [ ] [文档名称] - [更新内容] - [预计时间]
- [ ] [文档名称] - [更新内容] - [预计时间]

## 📋 一般任务

### 优化改进
- [ ] [优化项目] - [预期效果]
- [ ] [优化项目] - [预期效果]

### 学习研究
- [ ] [学习内容] - [学习目标]
- [ ] [学习内容] - [学习目标]

### 工具配置
- [ ] [工具名称] - [配置目标]
- [ ] [工具名称] - [配置目标]

## ✅ 已完成

### 本周完成
- [x] [任务描述] - [完成日期] - [备注]
- [x] [任务描述] - [完成日期] - [备注]

## 🗓️ 未来计划

### 下周计划
- [计划内容] - [预期目标]
- [计划内容] - [预期目标]

### 本月目标
- [月度目标] - [关键里程碑]
- [月度目标] - [关键里程碑]

---

## 📝 使用说明

1. **优先级管理** - 按紧急程度分类任务
2. **时间估算** - 为每个任务估算所需时间
3. **定期更新** - 每日更新进度，每周回顾调整
4. **完成标记** - 及时标记完成的任务并记录备注
