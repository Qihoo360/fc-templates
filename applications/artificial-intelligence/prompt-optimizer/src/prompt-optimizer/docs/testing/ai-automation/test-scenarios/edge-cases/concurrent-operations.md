# 并发操作边缘情况测试

## 📖 测试概述
测试应用在并发操作和竞态条件下的稳定性，发现多线程、异步操作相关的bug。

## 🎯 测试目标
- 发现竞态条件bug
- 测试并发操作处理
- 验证状态管理一致性
- 发现资源竞争问题

## 🔍 Bug发现重点
- 数据竞争和状态不一致
- 重复请求处理
- 资源锁定问题
- 内存泄漏和资源释放
- UI状态混乱

---

## 🧪 测试场景

### 场景1：快速连续点击测试

**测试目的：** 发现按钮防抖和重复请求处理的bug

**AI执行指导：**
```javascript
// 快速连续点击优化按钮
browser_type(element="原始提示词输入框", ref="e54", text="并发测试内容");

// 连续快速点击10次
for (let i = 0; i < 10; i++) {
    browser_click(element="开始优化按钮", ref="e78");
    // 不等待，立即下一次点击
}

// 检查状态
browser_snapshot();
browser_wait_for(time=5);
browser_snapshot();
```

**预期发现的问题：**
- 多个优化请求同时发送
- 按钮状态管理混乱
- 结果显示重复或错乱
- 网络请求重复
- 界面卡死或无响应

**验证点：**
- [ ] 只有一个请求被处理
- [ ] 按钮状态正确管理
- [ ] 结果显示正常
- [ ] 没有重复网络请求
- [ ] 界面保持响应

---

### 场景2：同时操作多个功能测试

**测试目的：** 发现多功能并发操作的冲突问题

**AI执行指导：**
```javascript
// 输入内容
browser_type(element="原始提示词输入框", ref="e54", text="多功能并发测试");

// 同时触发多个操作
browser_click(element="开始优化按钮", ref="e78"); // 开始优化
browser_click(element="模型管理按钮", ref="e21"); // 打开模型管理
browser_click(element="模板管理按钮", ref="e15"); // 打开模板管理
browser_click(element="历史记录按钮", ref="e18"); // 打开历史记录

// 检查状态
browser_snapshot();

// 尝试在弹窗打开时继续操作
browser_click(element="开始优化按钮", ref="e78");
browser_snapshot();
```

**预期发现的问题：**
- 弹窗层级混乱
- 优化过程被中断
- 数据状态不一致
- 界面元素重叠
- 焦点管理错误

**验证点：**
- [ ] 弹窗正确管理
- [ ] 优化过程不受影响
- [ ] 数据状态一致
- [ ] 界面显示正常
- [ ] 焦点管理正确

---

### 场景3：优化过程中的干扰操作测试

**测试目的：** 发现优化过程中被干扰时的处理bug

**AI执行指导：**
```javascript
// 开始优化
browser_type(element="原始提示词输入框", ref="e54", text="优化干扰测试");
browser_click(element="开始优化按钮", ref="e78");

// 在优化过程中进行各种干扰操作
browser_wait_for(time=1); // 等待优化开始

// 尝试修改输入
browser_type(element="原始提示词输入框", ref="e54", text="修改后的内容");

// 尝试切换模型
browser_click(element="模型选择按钮", ref="e59");

// 尝试切换模板
browser_click(element="模板选择按钮", ref="e69");

// 尝试再次点击优化
browser_click(element="开始优化按钮", ref="e78");

// 检查最终状态
browser_wait_for(time=10);
browser_snapshot();
```

**预期发现的问题：**
- 优化结果与输入不匹配
- 优化过程异常中断
- 状态显示错误
- 数据不一致
- 界面状态混乱

**验证点：**
- [ ] 优化结果正确对应输入
- [ ] 优化过程稳定
- [ ] 状态显示准确
- [ ] 数据保持一致
- [ ] 界面状态正常

---

### 场景4：多窗口/标签页并发测试

**测试目的：** 发现多实例运行时的数据同步问题

**AI执行指导：**
```javascript
// 在当前窗口开始操作
browser_type(element="原始提示词输入框", ref="e54", text="窗口1测试内容");
browser_click(element="开始优化按钮", ref="e78");

// 打开新标签页
browser_tab_new("http://localhost:18181/");

// 在新标签页进行操作
browser_type(element="原始提示词输入框", ref="e54", text="窗口2测试内容");
browser_click(element="开始优化按钮", ref="e78");

// 切换回第一个标签页
browser_tab_select(0);
browser_snapshot();

// 切换到第二个标签页
browser_tab_select(1);
browser_snapshot();

// 检查数据是否同步
browser_click(element="历史记录按钮", ref="e18");
browser_snapshot();
```

**预期发现的问题：**
- 数据不同步
- 历史记录混乱
- 配置冲突
- 存储竞争
- 状态不一致

**验证点：**
- [ ] 数据正确同步
- [ ] 历史记录准确
- [ ] 配置保持一致
- [ ] 存储操作正常
- [ ] 状态管理正确

---

### 场景5：网络中断恢复测试

**测试目的：** 发现网络异常情况下的并发处理问题

**AI执行指导：**
```javascript
// 开始多个优化操作
const testPrompts = [
    "网络测试1：人工智能发展",
    "网络测试2：机器学习应用", 
    "网络测试3：深度学习原理"
];

// 快速启动多个优化
for (const prompt of testPrompts) {
    browser_type(element="原始提示词输入框", ref="e54", text=prompt);
    browser_click(element="开始优化按钮", ref="e78");
    browser_wait_for(time=1);
}

// 模拟网络恢复后的重试
browser_wait_for(time=5);

// 检查各个请求的状态
browser_snapshot();

// 尝试重新优化
browser_click(element="开始优化按钮", ref="e78");
browser_snapshot();
```

**预期发现的问题：**
- 请求队列混乱
- 重试机制失效
- 状态显示错误
- 数据丢失
- 界面假死

**验证点：**
- [ ] 请求队列正确管理
- [ ] 重试机制正常
- [ ] 状态显示准确
- [ ] 数据完整保存
- [ ] 界面保持响应

---

### 场景6：内存压力下的并发测试

**测试目的：** 发现内存不足时的并发处理问题

**AI执行指导：**
```javascript
// 创建大量数据
const largePrompt = "大数据测试内容。".repeat(1000);

// 连续进行多次大数据优化
for (let i = 0; i < 5; i++) {
    browser_type(element="原始提示词输入框", ref="e54", text=`${largePrompt} 第${i+1}次测试`);
    browser_click(element="开始优化按钮", ref="e78");
    
    // 在优化过程中打开其他功能
    browser_click(element="历史记录按钮", ref="e18");
    browser_click(element="模板管理按钮", ref="e15");
    
    // 关闭弹窗
    browser_press_key("Escape");
    browser_press_key("Escape");
    
    browser_wait_for(time=2);
}

// 检查最终状态
browser_snapshot();
```

**预期发现的问题：**
- 内存泄漏
- 性能急剧下降
- 界面卡顿或崩溃
- 数据处理错误
- 资源释放失败

**验证点：**
- [ ] 内存使用合理
- [ ] 性能保持稳定
- [ ] 界面响应正常
- [ ] 数据处理正确
- [ ] 资源正确释放

---

### 场景7：快速切换功能模块测试

**测试目的：** 发现功能模块切换时的状态管理问题

**AI执行指导：**
```javascript
// 快速切换各个功能模块
const actions = [
    () => browser_click(element="模型管理按钮", ref="e21"),
    () => browser_click(element="模板管理按钮", ref="e15"),
    () => browser_click(element="历史记录按钮", ref="e18"),
    () => browser_click(element="数据管理按钮", ref="e24"),
    () => browser_press_key("Escape"), // 关闭弹窗
];

// 快速循环执行
for (let round = 0; round < 3; round++) {
    for (const action of actions) {
        action();
        browser_wait_for(time=0.5); // 很短的等待时间
    }
}

// 检查最终状态
browser_snapshot();

// 测试基本功能是否还能正常工作
browser_type(element="原始提示词输入框", ref="e54", text="功能切换后测试");
browser_click(element="开始优化按钮", ref="e78");
browser_wait_for(time=5);
browser_snapshot();
```

**预期发现的问题：**
- 模块状态混乱
- 事件监听器泄漏
- 界面渲染错误
- 数据状态不一致
- 功能失效

**验证点：**
- [ ] 模块状态正确
- [ ] 事件处理正常
- [ ] 界面渲染正确
- [ ] 数据状态一致
- [ ] 功能正常工作

---

## 🐛 并发Bug模式

### 竞态条件Bug
- 多个请求同时修改状态
- 异步操作顺序错乱
- 资源访问冲突
- 状态更新丢失

### 资源管理Bug
- 内存泄漏
- 事件监听器未清理
- 网络连接未关闭
- 定时器未清除

### 状态同步Bug
- 界面状态不一致
- 数据状态混乱
- 缓存不同步
- 存储冲突

### 性能相关Bug
- 并发操作导致卡顿
- 资源竞争影响性能
- 队列堆积
- 响应时间延长

---

## 📊 并发测试报告模板

```markdown
# 并发操作Bug报告

## Bug信息
- **发现时间：** [时间]
- **并发场景：** [具体并发操作]
- **严重程度：** 高/中/低
- **Bug类型：** 竞态条件/资源管理/状态同步/性能

## 并发操作描述
[详细描述并发操作的步骤和时序]

## 复现步骤
1. [具体步骤]
2. [并发操作]
3. [观察结果]

## 预期行为
[并发操作应该如何正确处理]

## 实际行为
[实际发生的问题]

## 影响评估
- **数据完整性：** [是否影响数据]
- **用户体验：** [对用户的影响]
- **系统稳定性：** [对系统的影响]

## 技术分析
- **可能原因：** [技术层面的分析]
- **涉及组件：** [相关的代码组件]
- **修复建议：** [技术修复方案]
```

---

**注意：** 并发测试可能导致应用状态异常，建议在测试环境中执行，并准备好重置应用状态的方法。
