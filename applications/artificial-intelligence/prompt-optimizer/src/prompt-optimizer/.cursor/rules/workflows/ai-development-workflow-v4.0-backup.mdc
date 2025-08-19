# AI开发工作流程

workspace工作区使用和文档管理的实际操作流程。

## 🚀 开始新任务

### 1. 查询背景信息
- 查看 `docs/archives/README.md` 寻找相关历史经验
- 查看 `docs/developer/todo.md` 了解当前开发任务状态
- 查看 `docs/developer/project-structure.md` 了解项目结构
- 需要时参考其他docs文档（主要用于参考，不是必须）

### 2. 检查workspace状态
- 确认workspace是否干净（应该只有模板文件）
- 如果workspace混乱，先执行清理流程
- 确保workspace使用标准模板结构

### 3. 设置新任务（在workspace中）
- 在 `scratchpad.md` 中替换模板内容：
  ```markdown
  ### [新功能名称] - [开始日期]
  **目标**: [具体目标描述]
  **状态**: 进行中

  #### 计划步骤
  [ ] 1. 需求分析
  [ ] 2. 技术方案设计
  [ ] 3. 功能实现
  [ ] 4. 测试验证
  [ ] 5. 文档更新
  ```
- 在 `todo.md` 中添加紧急任务和重要任务

## 🔄 迭代开发

### 开发循环（重复执行）
1. **记录进展** - 在 `scratchpad.md` 中更新进度记录
2. **实现功能** - 编写代码，运行测试
3. **记录发现** - 重要经验写入 `experience.md`
4. **更新状态** - 标记完成的步骤 `[x]`
5. **管理任务** - 在 `todo.md` 中更新任务状态

### 参考文档（按需查看）
- 查看 `docs/developer/general-experience.md` 获取通用经验
- 查看 `docs/developer/` 下的技术文档
- 查看相关 `docs/archives/` 目录获取专项经验

## ✅ 完成任务

### 1. 总结工作
在scratchpad.md中添加：
```markdown
### 完成总结
- 实现了什么功能
- 遇到了什么问题
- 如何解决的
```

### 2. 归档决策（简单判断）
**问自己4个问题**：
- 功能完成了吗？ → 是 → 归档
- 有重要经验吗？ → 是 → 归档
- workspace太乱了吗？ → 是 → 整理
- 有未完成任务吗？ → 是 → 转移到developer/todo.md

## 📁 归档操作

### 快速归档流程
1. **创建目录** - `docs/archives/[下一个编号]-[功能名称]/`
2. **提取内容** - 从workspace文件中提取相关内容
3. **创建文档** - README.md（概述）+ 具体实现文档
4. **更新索引** - 在archives/README.md中添加条目
5. **转移任务** - 未完成任务转移到developer/todo.md
6. **转移经验** - 通用经验转移到developer/general-experience.md
7. **重置workspace** - 使用模板完全重置

### workspace深度清理流程
1. **分析内容** - 识别已完成任务、未完成任务、通用经验、专项经验
2. **按功能归档** - 将相关内容归档到对应的archives目录
3. **任务转移** - 将未完成任务按功能模块和优先级整理到developer/todo.md
4. **经验提取** - 将通用经验提取到developer/general-experience.md
5. **模板重置** - 删除workspace所有文件，从workspace-template复制模板文件

## 📚 日常维护

### 查询历史
- 先看 `docs/archives/README.md` 找功能点
- 再看具体目录的README.md了解概况
- 最后看implementation.md和experience.md获取细节

### 保持整洁
- 每周检查workspace状态，及时清理过期内容
- 完成重要任务后立即归档
- 定期将未完成任务转移到developer/todo.md
- 使用模板重置保持workspace干净

## 🧹 Workspace整理最佳实践

### 整理触发条件
- workspace文件超过200行
- 包含3个以上已完成任务
- 混合了多个不同功能的内容
- 准备开始新的重要任务

### 整理步骤模板
1. **内容分析** - 识别已完成、进行中、计划中的内容
2. **功能分类** - 按功能点对内容进行分组
3. **创建归档** - 为已完成功能创建archives目录
4. **任务转移** - 按优先级整理未完成任务到developer/todo.md
5. **经验提取** - 将通用经验整理到developer/general-experience.md
6. **模板重置** - 使用标准模板完全重置workspace

### 整理质量检查
- ✅ workspace只包含3个模板文件
- ✅ 所有历史任务已正确归档
- ✅ 未完成任务已转移到developer/todo.md
- ✅ archives/README.md已更新索引
- ✅ 交叉引用链接正确

## 🔄 工作流自我改进

### 改进原则
- **保持简洁** - 避免过度膨胀，控制在200行以内
- **基于实践** - 根据实际执行经验调整流程
- **定期评估** - 每次功能流程结束后评估一次工作流效果

### 改进触发
当出现以下情况时，考虑更新此工作流：
- 发现流程步骤不合理或缺失
- workspace使用模式发生变化
- 归档决策标准需要调整
- 新的最佳实践出现

### 改进记录
在 `docs/developer/general-experience.md` 中记录工作流改进想法，定期整合到此文档。

## 🛠️ 实用工具命令

### workspace模板重置
```bash
# Windows
del docs\workspace\*.md
copy docs\workspace-template\*.md docs\workspace\
ren docs\workspace\scratchpad-template.md scratchpad.md
ren docs\workspace\todo-template.md todo.md
ren docs\workspace\experience-template.md experience.md
```

### 快速检查workspace状态
- 文件数量应该是3个（scratchpad.md, todo.md, experience.md）
- 内容应该是模板格式，包含占位符如 `[任务名称]`、`[日期]` 等
- 如果包含具体任务内容，说明需要清理

---

**自迭代版本**: v4.0
**更新时间**: 2025-07-01
**特点**: 基于实际整理经验优化，增加深度清理流程和实用工具
