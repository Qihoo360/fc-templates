# 测试002：旧版本数据导入兼容性验证

## 📋 测试信息
- **测试ID：** TEST-002
- **测试类型：** 兼容性测试
- **优先级：** 中
- **预计执行时间：** 3分钟

## 🎯 测试目标
验证应用能正确导入使用旧版本短键名的数据文件，并自动转换为新的完整键名格式。

## 📝 测试前提条件
1. 应用已启动并完成初始化
2. 用户可以访问数据管理功能
3. 准备好包含旧版本键名的测试数据文件

## 🧪 测试数据准备

### 创建测试数据文件
创建名为 `legacy-test-data.json` 的文件，内容如下：

```json
{
  "version": 1,
  "data": {
    "userSettings": {
      "theme-id": "dark",
      "preferred-language": "en-US",
      "builtin-template-language": "zh-CN",
      "app:selected-optimize-model": "gemini",
      "app:selected-test-model": "siliconflow",
      "app:selected-optimize-template": "general-optimize",
      "app:selected-iterate-template": "iterate"
    },
    "models": [
      {
        "key": "test-model",
        "id": "test-model",
        "name": "Test Model",
        "enabled": true
      }
    ],
    "userTemplates": [
      {
        "id": "test-template",
        "name": "Test Template",
        "content": "Test content",
        "isBuiltin": false,
        "metadata": {
          "templateType": "optimize",
          "version": "1.0",
          "lastModified": 1640995200000
        }
      }
    ],
    "history": [
      {
        "id": "test-history",
        "prompt": "Test prompt",
        "timestamp": 1640995200000
      }
    ]
  }
}
```

## 🧪 测试步骤

### 步骤1：清空当前数据（可选）
```javascript
// 1.1 打开数据管理
browser_click(element="数据管理按钮", ref="data-manager");
browser_wait_for(time=1);
browser_snapshot();

// 1.2 如果需要，可以先清空现有数据
// 这一步是可选的，取决于测试需求
```

### 步骤2：导入旧版本数据
```javascript
// 2.1 选择导入功能
browser_click(element="导入数据区域", ref="import-area");
browser_wait_for(time=1);

// 2.2 上传测试文件
// 注意：这里需要实际的文件上传操作
// 具体实现取决于UI的文件上传方式
browser_file_upload(paths=["./legacy-test-data.json"]);
browser_wait_for(time=2);

// 2.3 确认导入
browser_click(element="确认导入按钮", ref="confirm-import");
browser_wait_for(time=3);
browser_snapshot();
```

### 步骤3：验证导入结果
```javascript
// 3.1 检查导入成功提示
browser_snapshot();

// 3.2 关闭数据管理对话框
browser_press_key("Escape");
browser_wait_for(time=1);

// 3.3 验证设置是否生效
// 检查主题是否变为dark
// 检查语言是否变为en-US
browser_snapshot();
```

### 步骤4：验证键名转换
```javascript
// 4.1 重新导出数据验证转换结果
browser_click(element="数据管理按钮", ref="data-manager");
browser_wait_for(time=1);

browser_click(element="导出数据按钮", ref="export-button");
browser_wait_for(time=3);
browser_snapshot();
```

## ✅ 验证点

### 导入过程验证
- [ ] **导入成功** - 显示导入成功提示，无错误信息
- [ ] **控制台日志** - 显示键名转换信息
- [ ] **设置生效** - 导入的设置在UI中正确显示

### 键名转换验证
- [ ] `theme-id` → `app:settings:ui:theme-id`
- [ ] `preferred-language` → `app:settings:ui:preferred-language`
- [ ] `builtin-template-language` → `app:settings:ui:builtin-template-language`
- [ ] 新格式键名保持不变

### 功能验证
- [ ] **主题设置** - 界面主题变为导入的dark主题
- [ ] **语言设置** - 界面语言变为导入的en-US
- [ ] **模板语言** - 内置模板语言变为导入的zh-CN
- [ ] **模型选择** - 优化和测试模型选择正确
- [ ] **模板选择** - 模板选择设置正确

### 重新导出验证
- [ ] **新格式键名** - 重新导出的数据使用完整的新格式键名
- [ ] **数据完整性** - 所有导入的数据都正确保存
- [ ] **向前兼容** - 新导出的数据格式符合最新标准

## 🚨 失败处理

### 如果导入失败：
1. 检查文件格式是否正确
2. 查看控制台错误信息
3. 验证文件上传功能是否正常
4. 检查数据验证逻辑

### 如果键名转换失败：
1. 检查LEGACY_KEY_MAPPING配置
2. 验证normalizeSettingKey函数
3. 查看控制台是否有转换日志
4. 检查isValidSettingKey验证逻辑

### 如果设置不生效：
1. 检查导入后的存储内容
2. 验证各组件的设置读取逻辑
3. 检查是否需要页面刷新
4. 验证响应式更新机制

## 📊 测试结果

### 执行信息
- **执行时间：** [待填写]
- **执行环境：** [Web/Desktop]
- **浏览器版本：** [待填写]

### 结果记录
- **测试状态：** [通过/失败/部分通过]
- **键名转换数量：** [成功转换数量]/3
- **设置生效情况：** [描述]

### 控制台日志记录
```
[记录相关的控制台输出，特别是键名转换信息]
```

### 重新导出的JSON
```json
[粘贴重新导出的JSON内容，验证键名格式]
```

## 🔄 后续行动
- [ ] 如果测试失败，分析失败原因
- [ ] 如果测试通过，验证其他旧版本数据格式
- [ ] 更新兼容性文档
- [ ] 考虑添加更多边界情况测试
