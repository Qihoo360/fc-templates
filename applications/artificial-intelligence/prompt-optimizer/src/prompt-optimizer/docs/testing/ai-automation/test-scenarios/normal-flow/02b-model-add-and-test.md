# 模型添加和连接测试

## 📖 测试概述
验证添加新模型和测试模型连接的完整流程，确保用户能够成功添加本地或远程AI模型并验证其可用性。

## 🎯 测试目标
- 验证添加新模型的完整流程
- 验证模型连接测试的真实有效性
- 验证本地Ollama模型的集成
- 验证模型列表获取功能
- 验证模型启用和禁用功能

## 📋 前置条件
- [ ] 应用已启动并加载完成
- [ ] 本地Ollama服务已启动 (http://localhost:11434)
- [ ] Ollama已安装qwen3:0.6b模型
- [ ] 网络连接正常

---

## 🔧 测试步骤

### 步骤1：打开模型管理器并添加新模型

**AI执行指导：**
- 使用 `browser_snapshot` 获取页面当前状态
- 点击"⚙️ Model Manager"按钮打开模型管理
- 点击"Add"按钮开始添加新模型

**预期结果：**
- 模型管理界面正确打开
- 添加模型对话框显示
- 所有输入字段可见且可编辑

**验证点：**
- [ ] 模型管理界面正确打开
- [ ] Add按钮功能正常
- [ ] 添加模型对话框正确显示

---

### 步骤2：配置本地Ollama模型

**AI执行指导：**
- 在Display Name字段输入："Local Ollama"
- 在API URL字段输入："http://localhost:11434/v1"
- 点击"Click arrow to fetch model list"按钮获取可用模型
- 从下拉列表中选择"qwen3:0.6b"模型
- 不需要填写API Key（本地模型）

**测试数据：**
```
Display Name: Local Ollama
API URL: http://localhost:11434/v1
Model Name: your-model-name (从列表选择，如qwen2.5:0.5b等)
API Key: (留空)
```

**预期结果：**
- 所有字段正确接受输入
- 模型列表成功获取并显示可用模型
- 目标模型出现在选择列表中
- 配置界面响应正常

**验证点：**
- [ ] Display Name输入正常
- [ ] API URL输入正常
- [ ] 模型列表获取功能正常
- [ ] 模型选择功能正常
- [ ] 不需要API Key的配置正确处理

---

### 步骤3：保存模型配置

**AI执行指导：**
- 检查所有配置信息是否正确
- 点击"Save"按钮保存配置
- 等待保存操作完成
- 确认返回到模型管理主界面

**预期结果：**
- 保存操作成功完成
- 新添加的模型出现在模型列表中
- 模型状态显示为可配置状态
- 界面正确更新

**验证点：**
- [ ] 保存操作成功
- [ ] 新模型出现在列表中
- [ ] 模型信息正确显示
- [ ] 界面状态正确更新

---

### 步骤4：测试模型连接

**AI执行指导：**
- 找到刚添加的"Local Ollama"模型
- 点击对应的"Test Connection"按钮
- 等待连接测试完成
- 观察测试结果显示

**预期结果：**
- 测试连接按钮响应正常
- 显示连接测试进行中的状态
- 连接测试成功完成
- 显示成功的连接结果

**验证点：**
- [ ] 测试连接按钮功能正常
- [ ] 连接测试过程状态清晰
- [ ] 连接测试成功完成
- [ ] 成功结果明确显示

---

### 步骤5：启用模型

**AI执行指导：**
- 点击"Enable"按钮启用模型
- 等待启用操作完成
- 检查模型状态变化
- 确认模型可用状态

**预期结果：**
- 启用操作成功完成
- 模型状态更新为已启用
- Enable按钮变为Disable按钮
- 模型可以在主界面选择

**验证点：**
- [ ] 启用操作成功
- [ ] 模型状态正确更新
- [ ] 按钮状态正确变化
- [ ] 模型在主界面可选

---

### 步骤6：验证模型在主界面可用

**AI执行指导：**
- 关闭模型管理对话框
- 检查主界面的模型选择器
- 确认新添加的模型出现在选项中
- 尝试选择该模型

**预期结果：**
- 主界面模型选择器包含新模型
- 模型名称正确显示
- 可以成功选择该模型
- 模型状态显示为可用

**验证点：**
- [ ] 新模型出现在主界面选择器中
- [ ] 模型名称显示正确
- [ ] 模型选择功能正常
- [ ] 模型状态显示正确

---

### 步骤7：测试模型实际功能

**AI执行指导：**
- 选择刚添加的本地模型
- 在提示词输入框输入简单测试内容
- 点击优化按钮进行实际测试
- 观察是否能获得真实的AI响应

**测试数据：**
```
测试提示词: "请帮我写一个简单的问候语"
```

**预期结果：**
- 模型选择成功
- 优化按钮变为可用状态
- 能够发送请求到本地模型
- 获得真实的AI响应

**验证点：**
- [ ] 模型选择成功
- [ ] 优化功能可用
- [ ] 请求发送成功
- [ ] 获得真实AI响应

---

## ⚠️ 常见问题检查

### Ollama服务问题
- Ollama服务未启动
- 模型未安装或下载
- 端口冲突或访问权限问题
- API接口不兼容

### 模型添加问题
- 模型列表获取失败
- 网络连接问题
- API URL格式错误
- 模型名称不正确

### 连接测试问题
- 连接超时
- 认证失败
- 模型不可用
- 服务响应异常

### 功能集成问题
- 模型在主界面不显示
- 选择模型后功能不可用
- 优化请求失败
- 响应格式错误

---

## 🤖 AI验证执行模板

```javascript
// 1. 打开模型管理
browser_click(element="模型管理按钮", ref="model_management_button")
browser_snapshot()

// 2. 添加新模型
browser_click(element="Add按钮", ref="add_model_button")
browser_snapshot()

// 3. 配置Ollama模型
browser_type(element="Display Name", ref="display_name", text="Local Ollama")
browser_type(element="API URL", ref="api_url", text="http://localhost:11434/v1")
browser_click(element="获取模型列表按钮", ref="fetch_models_button")
browser_wait_for(time=3)
browser_select(element="模型选择", ref="model_select", value="qwen3:0.6b")
browser_snapshot()

// 4. 保存配置
browser_click(element="Save按钮", ref="save_button")
browser_wait_for(time=2)
browser_snapshot()

// 5. 测试连接
browser_click(element="Test Connection按钮", ref="test_connection_button")
browser_wait_for(time=5)
browser_snapshot()

// 6. 启用模型
browser_click(element="Enable按钮", ref="enable_button")
browser_wait_for(time=2)
browser_snapshot()

// 7. 验证主界面
browser_click(element="关闭按钮", ref="close_button")
browser_snapshot()

// 8. 测试实际功能
browser_click(element="模型选择器", ref="model_selector")
browser_click(element="Local Ollama", ref="local_ollama_option")
browser_type(element="提示词输入框", ref="prompt_input", text="请帮我写一个简单的问候语")
browser_click(element="优化按钮", ref="optimize_button")
browser_wait_for(time=10)
browser_snapshot()
```

**成功标准：**
- 能够成功添加本地Ollama模型
- 模型连接测试真实有效
- 模型在主界面正确显示和选择
- 能够获得真实的AI响应
- 整个流程无错误或异常
- 模型配置持久保存

---

## 📝 重要说明

### 为什么需要真实模型测试
1. **功能验证**: 确保应用能够与真实AI服务正常通信
2. **集成测试**: 验证从配置到使用的完整流程
3. **性能测试**: 检查实际响应时间和稳定性
4. **错误处理**: 测试各种异常情况的处理能力

### 本地Ollama的优势
1. **无需API Key**: 避免使用真实API密钥的安全风险
2. **稳定可控**: 本地服务不受网络波动影响
3. **成本效益**: 无需消耗付费API额度
4. **隐私保护**: 测试数据不会发送到外部服务

### 测试数据安全
- 使用本地模型避免敏感数据泄露
- 测试用提示词应该是无害的通用内容
- 不在测试中使用真实的业务数据
