# 测试001：数据导出完整性验证

## 📋 测试信息
- **测试ID：** TEST-001
- **测试类型：** 功能测试
- **优先级：** 高
- **预计执行时间：** 5分钟

## 🎯 测试目标
验证修复存储键一致性问题后，所有用户设置都能正确导出到JSON文件中。

## 📝 测试前提条件
1. 应用已启动并完成初始化
2. 用户可以访问设置和数据管理功能
3. 浏览器支持文件下载功能

## 🧪 测试步骤

### 步骤1：设置用户偏好
```javascript
// 1.1 切换主题设置
browser_click(element="主题切换按钮", ref="theme-toggle");
browser_wait_for(time=1);
browser_snapshot();

// 1.2 切换界面语言
browser_click(element="语言切换按钮", ref="language-toggle");
browser_wait_for(time=1);
browser_snapshot();

// 1.3 切换内置模板语言
browser_click(element="内置模板语言切换按钮", ref="builtin-lang-toggle");
browser_wait_for(time=1);
browser_snapshot();
```

### 步骤2：配置模型选择
```javascript
// 2.1 打开模型管理
browser_click(element="模型管理按钮", ref="model-manager");
browser_wait_for(time=2);
browser_snapshot();

// 2.2 选择优化模型
browser_click(element="优化模型选择", ref="optimize-model-select");
browser_wait_for(time=1);
browser_click(element="Gemini模型选项", ref="gemini-option");
browser_wait_for(time=1);

// 2.3 选择测试模型
browser_click(element="测试模型选择", ref="test-model-select");
browser_wait_for(time=1);
browser_click(element="SiliconFlow模型选项", ref="siliconflow-option");
browser_wait_for(time=1);

browser_press_key("Escape");
browser_wait_for(time=1);
```

### 步骤3：配置模板选择
```javascript
// 3.1 打开模板管理
browser_click(element="模板管理按钮", ref="template-manager");
browser_wait_for(time=2);
browser_snapshot();

// 3.2 选择系统优化模板
browser_click(element="系统优化模板选择", ref="system-optimize-template");
browser_wait_for(time=1);

// 3.3 选择迭代模板
browser_click(element="迭代模板选择", ref="iterate-template");
browser_wait_for(time=1);

browser_press_key("Escape");
browser_wait_for(time=1);
```

### 步骤4：导出数据
```javascript
// 4.1 打开数据管理
browser_click(element="数据管理按钮", ref="data-manager");
browser_wait_for(time=1);
browser_snapshot();

// 4.2 执行数据导出
browser_click(element="导出数据按钮", ref="export-button");
browser_wait_for(time=3);
browser_snapshot();
```

## ✅ 验证点

### 主要验证点
- [ ] **导出成功** - 文件成功下载，无错误提示
- [ ] **JSON格式正确** - 导出文件是有效的JSON格式
- [ ] **包含所有设置项** - userSettings包含8个预期的设置项

### 详细验证点
- [ ] `app:settings:ui:theme-id` - 主题设置正确导出
- [ ] `app:settings:ui:preferred-language` - 语言设置正确导出
- [ ] `app:settings:ui:builtin-template-language` - 内置模板语言设置正确导出
- [ ] `app:selected-optimize-model` - 优化模型选择正确导出
- [ ] `app:selected-test-model` - 测试模型选择正确导出
- [ ] `app:selected-optimize-template` - 系统优化模板选择正确导出
- [ ] `app:selected-user-optimize-template` - 用户优化模板选择正确导出（如果设置过）
- [ ] `app:selected-iterate-template` - 迭代模板选择正确导出

### 预期JSON结构
```json
{
  "version": 1,
  "data": {
    "userSettings": {
      "app:settings:ui:theme-id": "dark",
      "app:settings:ui:preferred-language": "zh-CN",
      "app:settings:ui:builtin-template-language": "zh-CN",
      "app:selected-optimize-model": "gemini",
      "app:selected-test-model": "siliconflow",
      "app:selected-optimize-template": "general-optimize",
      "app:selected-iterate-template": "iterate"
    },
    "models": [...],
    "userTemplates": [...],
    "history": [...]
  }
}
```

## 🚨 失败处理

### 如果导出的userSettings少于7个项目：
1. 检查控制台是否有错误信息
2. 验证各个设置是否真的被保存
3. 检查存储键名是否正确
4. 记录缺失的具体设置项

### 如果键名格式不正确：
1. 检查是否还有组件使用旧的短键名
2. 验证常量定义是否正确导入
3. 检查是否有缓存问题

## 📊 测试结果

### 执行信息
- **执行时间：** [待填写]
- **执行环境：** [Web/Desktop]
- **浏览器版本：** [待填写]

### 结果记录
- **测试状态：** [通过/失败/部分通过]
- **导出的设置项数量：** [实际数量]/8
- **发现的问题：** [问题描述]

### 导出的实际JSON
```json
[粘贴实际导出的JSON内容]
```

## 🔄 后续行动
- [ ] 如果测试失败，创建bug报告
- [ ] 如果测试通过，更新测试状态
- [ ] 记录任何改进建议
