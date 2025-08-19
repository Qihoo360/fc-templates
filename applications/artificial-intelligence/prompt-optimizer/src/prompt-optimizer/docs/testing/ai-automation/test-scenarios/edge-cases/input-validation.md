# 输入验证边缘情况测试

## 📖 测试概述
测试应用对各种异常输入的处理能力，发现输入验证相关的bug和用户体验问题。

## 🎯 测试目标
- 发现输入验证漏洞
- 测试极限输入情况
- 验证错误处理机制
- 发现UI显示问题

## 🔍 Bug发现重点
- 输入长度限制处理
- 特殊字符处理
- 空输入处理
- 格式验证问题
- 内存泄漏风险

---

## 🧪 测试场景

### 场景1：超长文本输入测试

**测试目的：** 发现长文本处理的性能问题和UI显示bug

**AI执行指导：**
```javascript
// 生成超长文本
const longText = "这是一个测试文本。".repeat(1000); // 约10000字符
browser_type(element="原始提示词输入框", ref="e54", text=longText);

// 检查界面响应
browser_snapshot();

// 尝试优化
browser_click(element="开始优化按钮", ref="e78");
browser_wait_for(time=30); // 等待更长时间
```

**预期发现的问题：**
- 输入框滚动异常
- 界面卡顿或无响应
- 内存使用过高
- 优化超时或失败
- 结果显示异常

**验证点：**
- [ ] 输入框能否正常显示长文本
- [ ] 界面是否保持响应
- [ ] 优化是否能正常完成
- [ ] 内存使用是否合理
- [ ] 错误处理是否恰当

---

### 场景2：特殊字符和Emoji测试

**测试目的：** 发现字符编码和显示相关的bug

**AI执行指导：**
```javascript
// 测试各种特殊字符
const specialChars = [
    "🚀🎯💡🔥⭐️🌟✨🎉🎊🎈", // Emoji
    "中文测试内容包含各种符号！@#￥%……&*（）", // 中文特殊符号
    "English with symbols: !@#$%^&*()_+-=[]{}|;':\",./<>?", // 英文特殊符号
    "数学符号：∑∏∫∂∇∆∞±×÷≤≥≠≈∝∈∉∪∩⊂⊃", // 数学符号
    "HTML标签：<script>alert('test')</script><div>test</div>", // HTML注入测试
    "SQL注入：'; DROP TABLE users; --", // SQL注入测试
    "换行测试：\n第一行\n第二行\n第三行", // 换行符
    "制表符测试：\t制表符\t分隔\t内容" // 制表符
];

for (const testText of specialChars) {
    browser_type(element="原始提示词输入框", ref="e54", text=testText);
    browser_snapshot();
    browser_click(element="开始优化按钮", ref="e78");
    browser_wait_for(time=10);
    browser_snapshot();
}
```

**预期发现的问题：**
- 字符显示异常或乱码
- HTML/脚本注入漏洞
- 换行符处理错误
- Emoji显示问题
- 编码转换错误

**验证点：**
- [ ] 特殊字符正确显示
- [ ] 没有脚本注入风险
- [ ] 换行符正确处理
- [ ] Emoji正常显示
- [ ] 编码转换正确

---

### 场景3：空输入和边界值测试

**测试目的：** 发现空值处理和边界条件的bug

**AI执行指导：**
```javascript
// 测试各种空输入情况
const emptyInputs = [
    "", // 完全空白
    " ", // 单个空格
    "   ", // 多个空格
    "\n", // 只有换行
    "\t", // 只有制表符
    "\n\t ", // 混合空白字符
];

for (const emptyInput of emptyInputs) {
    // 清空输入框
    browser_click(element="原始提示词输入框", ref="e54");
    browser_press_key("Ctrl+a");
    browser_press_key("Delete");
    
    // 输入测试内容
    browser_type(element="原始提示词输入框", ref="e54", text=emptyInput);
    
    // 尝试优化
    browser_click(element="开始优化按钮", ref="e78");
    browser_snapshot();
    
    // 检查错误处理
    browser_wait_for(time=3);
}
```

**预期发现的问题：**
- 空输入时按钮状态错误
- 缺少输入验证提示
- 空白字符处理不当
- 错误信息不明确
- 界面状态异常

**验证点：**
- [ ] 空输入时有适当提示
- [ ] 按钮状态正确禁用
- [ ] 空白字符正确处理
- [ ] 错误信息清晰明确
- [ ] 界面状态一致

---

### 场景4：快速连续输入测试

**测试目的：** 发现输入处理的竞态条件和性能问题

**AI执行指导：**
```javascript
// 快速连续输入测试
for (let i = 0; i < 20; i++) {
    browser_type(element="原始提示词输入框", ref="e54", text=`快速输入测试${i}`);
    // 不等待，立即进行下一次输入
}

// 快速连续点击测试
for (let i = 0; i < 10; i++) {
    browser_click(element="开始优化按钮", ref="e78");
}

// 检查最终状态
browser_snapshot();
```

**预期发现的问题：**
- 输入丢失或重复
- 界面更新延迟
- 按钮状态混乱
- 多次请求发送
- 内存泄漏

**验证点：**
- [ ] 最终输入内容正确
- [ ] 界面状态一致
- [ ] 没有重复请求
- [ ] 性能保持正常
- [ ] 内存使用稳定

---

### 场景5：复制粘贴异常测试

**测试目的：** 发现复制粘贴功能的边缘情况bug

**AI执行指导：**
```javascript
// 测试大量复制粘贴
const largeText = "复制粘贴测试内容。".repeat(500);

// 模拟复制粘贴操作
browser_click(element="原始提示词输入框", ref="e54");
browser_press_key("Ctrl+a");
browser_type(element="原始提示词输入框", ref="e54", text=largeText);

// 测试部分选择复制
browser_press_key("Ctrl+a");
browser_press_key("Ctrl+c");
browser_press_key("Ctrl+v");
browser_press_key("Ctrl+v"); // 重复粘贴

// 检查结果
browser_snapshot();
```

**预期发现的问题：**
- 复制粘贴内容丢失
- 格式化问题
- 性能下降
- 内容重复
- 界面卡顿

**验证点：**
- [ ] 复制粘贴功能正常
- [ ] 内容格式保持
- [ ] 性能影响可接受
- [ ] 没有内容重复
- [ ] 界面响应正常

---

### 场景6：输入框焦点异常测试

**测试目的：** 发现焦点管理相关的UI bug

**AI执行指导：**
```javascript
// 测试焦点切换
browser_click(element="原始提示词输入框", ref="e54");
browser_type(element="原始提示词输入框", ref="e54", text="焦点测试");

// 快速切换焦点
browser_click(element="模型选择按钮", ref="e59");
browser_click(element="原始提示词输入框", ref="e54");
browser_click(element="模板选择按钮", ref="e69");
browser_click(element="原始提示词输入框", ref="e54");

// 测试Tab键导航
browser_press_key("Tab");
browser_press_key("Tab");
browser_press_key("Tab");
browser_press_key("Shift+Tab");

// 检查焦点状态
browser_snapshot();
```

**预期发现的问题：**
- 焦点丢失或错位
- Tab导航顺序错误
- 焦点样式异常
- 键盘操作失效
- 可访问性问题

**验证点：**
- [ ] 焦点正确管理
- [ ] Tab导航顺序合理
- [ ] 焦点样式清晰
- [ ] 键盘操作正常
- [ ] 可访问性良好

---

## 🐛 常见Bug模式

### 输入验证Bug
- 长度限制不生效
- 特殊字符处理错误
- 空值检查缺失
- 格式验证不严格

### 性能相关Bug
- 大输入导致卡顿
- 内存使用过高
- 响应时间过长
- 界面更新延迟

### UI显示Bug
- 文本溢出或截断
- 字符编码问题
- 焦点管理错误
- 样式显示异常

### 安全相关Bug
- XSS注入风险
- 输入过滤不当
- 敏感信息泄露
- 权限验证缺失

---

## 📊 Bug报告模板

```markdown
# 输入验证Bug报告

## Bug信息
- **发现时间：** [时间]
- **测试场景：** [具体场景]
- **严重程度：** 高/中/低
- **Bug类型：** 输入验证/性能/UI/安全

## 复现步骤
1. [具体步骤]
2. [具体步骤]
3. [具体步骤]

## 预期行为
[应该发生什么]

## 实际行为
[实际发生了什么]

## 影响评估
[对用户和系统的影响]

## 建议修复
[修复建议和优先级]
```

---

**注意：** 这些测试专门设计用于发现bug，可能会导致应用异常。在生产环境中谨慎执行。
