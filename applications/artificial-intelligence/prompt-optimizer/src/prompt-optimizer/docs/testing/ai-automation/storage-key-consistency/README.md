# 存储键一致性测试

## 📋 测试目的

验证应用中所有存储键的使用都遵循统一的常量定义，避免魔法值导致的数据导出不完整、键名不一致等问题。

## 🎯 测试背景

在修复用户设置导出不完整问题时，发现了多个存储键一致性问题：

### 发现的问题
1. **主题设置键名不匹配** - ThemeToggleUI.vue使用 `'theme-id'` 而不是 `'app:settings:ui:theme-id'`
2. **内置模板语言键名不匹配** - TemplateLanguageService使用 `'builtin-template-language'` 而不是 `'app:settings:ui:builtin-template-language'`
3. **核心服务使用魔法值** - ModelManager、TemplateManager、HistoryManager直接使用字符串字面量

### 修复措施
1. 创建统一的存储键常量文件
2. 更新所有组件和服务使用常量
3. 建立AI自动化测试确保一致性

## 🧪 测试场景

### 场景1：数据导出完整性验证
**测试目的：** 验证所有用户设置都能正确导出

**AI执行指导：**
```javascript
// 1. 设置各种用户偏好
browser_click(element="主题切换按钮", ref="theme-toggle");
browser_wait_for(time=1);

browser_click(element="语言切换按钮", ref="language-toggle");
browser_wait_for(time=1);

browser_click(element="内置模板语言切换按钮", ref="builtin-lang-toggle");
browser_wait_for(time=1);

// 2. 选择不同的模型
browser_click(element="模型管理按钮", ref="model-manager");
browser_wait_for(time=2);
// 选择优化模型和测试模型
browser_press_key("Escape");

// 3. 导出数据
browser_click(element="数据管理按钮", ref="data-manager");
browser_wait_for(time=1);
browser_click(element="导出数据按钮", ref="export-button");
browser_wait_for(time=3);
```

**验证点：**
- [ ] 导出的JSON包含所有8个用户设置项
- [ ] 主题设置正确导出 (`app:settings:ui:theme-id`)
- [ ] 语言设置正确导出 (`app:settings:ui:preferred-language`)
- [ ] 内置模板语言设置正确导出 (`app:settings:ui:builtin-template-language`)
- [ ] 模型选择设置正确导出
- [ ] 模板选择设置正确导出

### 场景2：数据导入兼容性验证
**测试目的：** 验证旧版本数据格式的向后兼容性

**AI执行指导：**
```javascript
// 1. 准备旧格式测试数据
const legacyData = {
  "version": 1,
  "data": {
    "userSettings": {
      "theme-id": "dark",
      "preferred-language": "en-US",
      "builtin-template-language": "zh-CN",
      "app:selected-optimize-model": "gemini"
    }
  }
};

// 2. 导入测试数据
browser_click(element="数据管理按钮", ref="data-manager");
browser_wait_for(time=1);
// 上传测试文件
browser_click(element="导入数据按钮", ref="import-button");
browser_wait_for(time=2);

// 3. 验证导入后的设置
browser_snapshot();
```

**验证点：**
- [ ] 旧版本键名能正确转换为新版本键名
- [ ] 导入后设置生效（主题、语言等）
- [ ] 控制台显示键名转换信息
- [ ] 重新导出数据使用新的键名格式

### 场景3：存储键常量使用验证
**测试目的：** 通过代码检查验证所有存储操作都使用常量

**AI执行指导：**
```javascript
// 这是一个代码审查测试，需要检查源代码
// 1. 检查UI组件是否使用常量
// 2. 检查核心服务是否使用常量
// 3. 检查测试文件是否使用常量
```

**验证点：**
- [ ] ThemeToggleUI.vue使用 `UI_SETTINGS_KEYS.THEME_ID`
- [ ] LanguageSwitch.vue使用 `UI_SETTINGS_KEYS.PREFERRED_LANGUAGE`
- [ ] TemplateLanguageService使用正确的完整键名
- [ ] ModelManager使用 `CORE_SERVICE_KEYS.MODELS`
- [ ] TemplateManager使用 `CORE_SERVICE_KEYS.USER_TEMPLATES`
- [ ] HistoryManager使用 `CORE_SERVICE_KEYS.PROMPT_HISTORY`

## 📊 测试结果记录

### 测试执行记录
- **执行时间：** [待填写]
- **测试环境：** [Web/Desktop]
- **执行结果：** [通过/失败]

### 发现的问题
1. [问题描述]
2. [问题描述]

### 修复建议
1. [修复建议]
2. [修复建议]

## 🔄 持续监控

### 自动化检查点
1. **构建时检查** - 确保所有存储键都使用常量定义
2. **测试覆盖** - 验证存储键常量的完整性
3. **代码审查** - 禁止直接使用字符串字面量作为存储键

### 预防措施
1. **ESLint规则** - 检测魔法字符串的使用
2. **TypeScript类型** - 强制使用存储键类型
3. **文档更新** - 维护存储键使用指南

## 📝 相关文档

- [存储键常量定义](../../../../packages/ui/src/constants/storage-keys.ts)
- [核心服务存储键](../../../../packages/core/src/constants/storage-keys.ts)
- [数据管理器实现](../../../../packages/core/src/services/data/manager.ts)
