# AI开发工作流程 v5.0

简化的3核心流程架构，专注于任务的完整生命周期管理。

## 🎯 核心理念

**3个核心工作流程**：
1. **任务初始化** - 设置新任务，分析需求，制定计划
2. **任务执行** - 迭代开发，更新进度，记录发现  
3. **任务归档** - 整理成果，创建文档，重置环境

**关键原则**：
- 保持workspace简洁，只处理当前任务
- 及时反馈，使用mcp-feedback-enhanced工具主动沟通
- 完整记录，为后续开发提供参考

## 📋 工作流程选择指南

### 何时使用工作流程1：任务初始化
**触发条件**：
- 开始新的功能开发
- 开始重大重构工作
- workspace为空或为模板状态
- 用户提出新的开发需求

**文档**：[1-task-initialization.md](./1-task-initialization.md)

### 何时使用工作流程2：任务执行
**触发条件**：
- 任务已经初始化，正在开发过程中
- 需要记录开发进展
- 遇到技术问题需要记录
- 任务状态发生变化

**文档**：[2-task-execution.md](./2-task-execution.md)

### 何时使用工作流程3：任务归档
**触发条件**：
- 任务基本完成，需要整理
- workspace内容过多，需要清理
- 重要经验需要永久保存
- 准备开始新的重大任务

**文档**：[3-task-archiving.md](./3-task-archiving.md)

## 🤖 AI助手使用规范

### 必须使用反馈工具
每个工作流程都要求AI助手在关键节点使用`mcp-feedback-enhanced`工具：
- **任务开始时** - 确认理解和计划
- **关键里程碑** - 汇报进展并获取反馈
- **遇到问题时** - 寻求指导和确认
- **任务完成时** - 确认结果和下一步

### 反馈时机要求
- **不要等到最后才反馈** - 在过程中主动沟通
- **重要决策前必须反馈** - 获得用户确认再继续
- **发现问题立即反馈** - 不要继续错误的方向

### 反馈内容要求
- **简洁明确** - 用1-2句话说明当前状态和需要确认的内容
- **提供选择** - 给出具体的方案选项供用户选择
- **包含上下文** - 说明为什么需要这个反馈

## 🔧 常用工具命令

### Workspace重置
```batch
del docs\workspace\*.md
copy docs\workspace-template\*.md docs\workspace\
ren docs\workspace\scratchpad-template.md scratchpad.md
ren docs\workspace\todo-template.md todo.md  
ren docs\workspace\experience-template.md experience.md
```

### 创建新归档
```batch
mkdir "docs\archives\[编号]-[功能名称]"
```

### 检查workspace状态
应该只有3个文件，且内容为模板格式：
- `scratchpad.md` - 包含 `[任务名称]` 等占位符
- `todo.md` - 包含 `[任务描述]` 等占位符  
- `experience.md` - 包含 `[经验描述]` 等占位符

## 📚 相关文档

- [quick-reference.md](./quick-reference.md) - 快速参考卡片
- [ai-development-workflow-v4.0-backup.mdc](./ai-development-workflow-v4.0-backup.mdc) - 历史版本备份

## 📊 版本信息

- **当前版本**: v5.0
- **更新时间**: 2025-01-01
- **主要改进**: 简化为3核心流程，强化反馈机制，去除复杂度分级
- **向后兼容**: v4.0备份文件保留在同目录

---

**核心原则**: 简单、及时、完整 