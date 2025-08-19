# Electron MCP自动化测试指南

## 📖 概述

本指南总结了使用MCP (Model Context Protocol) 对Electron桌面应用进行AI自动化测试的最佳实践和关键技巧。

## 🚀 启动和连接

### Electron应用启动
```javascript
// 1. 确保应用已构建
// 执行: pnpm clean && pnpm build

// 2. 启动Electron应用
app_launch_circuit-electron({
  app: "/path/to/project/packages/desktop/dist/win-unpacked/YourApp.exe",
  mode: "packaged",  // 关键：使用packaged模式
  includeSnapshots: true,
  timeout: 60000
})
```

### 与浏览器测试的区别
- **浏览器**: `browser_navigate` 到URL
- **Electron**: `app_launch_circuit-electron` 启动可执行文件
- **构建要求**: Electron需要先构建才能测试

## 🎯 元素定位策略

### 优先级顺序（重要！）
1. **click_by_text_circuit-electron** (最优先，最稳定)
2. **smart_click_circuit-electron** (自动检测策略)
3. **click_circuit-electron** (CSS选择器)
4. **evaluate_circuit-electron** (JavaScript执行，最后手段)

### 最佳实践示例
```javascript
// ✅ 优先：文本点击
click_by_text_circuit-electron({
  sessionId: "session-id",
  text: "⚙️ Model Manager"
})

// ⚠️ 备选：CSS选择器
click_circuit-electron({
  sessionId: "session-id", 
  selector: "button:nth-child(4)"
})

// 🔧 最后手段：JavaScript执行
evaluate_circuit-electron({
  sessionId: "session-id",
  script: `
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Model Manager')) {
        button.click();
        break;
      }
    }
  `
})
```

## ⚠️ 常见问题解决

### 1. 元素遮挡问题
**症状**: `Error: <element> intercepts pointer events`

**解决方案**:
```javascript
// 方案1: 使用Escape键关闭遮挡元素
key_circuit-electron({ sessionId: "session-id", key: "Escape" })

// 方案2: 点击空白区域
evaluate_circuit-electron({ script: "document.body.click();" })

// 方案3: JavaScript绕过遮挡
evaluate_circuit-electron({
  script: `
    const button = document.querySelector('button[text="Target"]');
    if (button && !button.closest('.fixed')) {
      button.click();
    }
  `
})
```

### 2. 语言切换后元素失效
**问题**: 语言切换后，文本选择器失效

**解决方案**:
```javascript
// ❌ 硬编码文本
click_by_text_circuit-electron({ text: "Model Manager" })

// ✅ 使用包含匹配
evaluate_circuit-electron({
  script: `
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Model') && 
          button.textContent.includes('Manager')) {
        button.click();
        break;
      }
    }
  `
})
```

### 3. 控制台错误信息误导
**重要**: 不要仅依赖控制台错误信息判断功能状态

**正确做法**:
```javascript
// ✅ 关注界面状态变化
// - 检查V1、V2按钮的出现
// - 检查Continue Optimize按钮的激活
// - 检查disabled/pressed/focused状态

// ❌ 错误做法：仅依赖控制台错误信息
```

## 🛠️ 输入和等待策略

### 文本输入最佳实践
```javascript
evaluate_circuit-electron({
  script: `
    const textbox = document.querySelector('textarea[placeholder*="prompt"]');
    if (textbox && textbox.offsetParent !== null) {
      textbox.value = 'test content';
      textbox.dispatchEvent(new Event('input', { bubbles: true }));
      textbox.dispatchEvent(new Event('change', { bubbles: true }));
      textbox.focus();
      return 'success';
    }
    return 'not found';
  `
})
```

### 等待策略
```javascript
// 基础等待
wait_for_load_state_circuit-electron({
  sessionId: "session-id",
  state: "load",
  timeout: 5000
})

// AI请求等待（重要：AI请求需要更长时间）
wait_for_load_state_circuit-electron({
  sessionId: "session-id", 
  state: "networkidle",
  timeout: 15000
})
```

### 超时设置建议
- **基础操作**: 3-5秒
- **AI请求**: 10-20秒  
- **文件操作**: 5-10秒
- **应用启动**: 60秒

## 🔍 状态检查和调试

### 界面状态检查
```javascript
// 使用snapshot检查界面状态
snapshot_circuit-electron({ sessionId: "session-id" })

// 关键状态指标：
// - pressed状态 (按钮激活)
// - disabled状态 (按钮可用性)
// - focused状态 (当前焦点)
// - value字段 (输入内容)
```

### 调试技巧
```javascript
// 调试元素可见性
evaluate_circuit-electron({
  script: `
    const elements = document.querySelectorAll('button');
    return Array.from(elements).map(el => ({
      text: el.textContent.trim(),
      visible: el.offsetParent !== null,
      disabled: el.disabled
    }));
  `
})
```

## 🚨 会话管理

### 处理会话断开
```javascript
try {
  click_by_text_circuit-electron({ sessionId, text: "button" })
} catch (error) {
  if (error.message.includes('page has been closed')) {
    // 重新启动应用
    sessionId = app_launch_circuit-electron({ 
      app: appPath,
      mode: "packaged",
      includeSnapshots: true 
    })
  }
}
```

## 📊 测试执行流程

### 1. 准备阶段
```bash
# 构建应用
pnpm clean && pnpm build

# 确保外部服务运行（如需要）
# 例如：启动Ollama服务
```

### 2. 测试执行
```javascript
// 启动应用
const sessionId = app_launch_circuit-electron({...})

// 获取初始状态
snapshot_circuit-electron({ sessionId })

// 执行测试步骤
// ...

// 关闭应用
close_circuit-electron({ sessionId })
```

### 3. 结果验证
- 重点关注界面状态变化
- 验证功能按钮的激活状态
- 检查数据持久化效果

## 🎯 Electron特有优势

### 1. 真实应用环境
- 测试真实的桌面应用体验
- 验证文件系统操作
- 测试系统集成功能

### 2. 持久化测试
- 应用重启后配置保持
- 数据持久化验证
- 真实的用户工作流程

### 3. 完整功能测试
- 端到端的用户体验
- 真实的性能表现
- 系统级别的集成测试

## 📝 测试场景模板

### 基础功能测试
```javascript
// 1. 启动应用
// 2. 检查初始状态
// 3. 执行功能操作
// 4. 验证结果
// 5. 检查持久化
```

### AI功能测试
```javascript
// 1. 配置模型
// 2. 输入测试数据
// 3. 执行AI操作
// 4. 等待AI响应
// 5. 验证结果质量
```

## 🏆 成功标准

### 技术指标
- 所有测试场景通过
- 无崩溃或异常
- 响应时间合理

### 用户体验
- 操作流程流畅
- 错误处理得当
- 数据安全可靠

---

**最后更新：** 2025-01-09  
**适用范围：** Electron桌面应用AI自动化测试
