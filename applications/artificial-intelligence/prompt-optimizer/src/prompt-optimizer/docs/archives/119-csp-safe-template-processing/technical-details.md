# CSP-Safe Template Processing

## 问题背景

浏览器扩展环境中存在严格的内容安全策略(CSP)限制，禁止使用 `unsafe-eval`。这导致 Handlebars.compile() 无法在浏览器扩展中正常工作，因为它在内部使用了 `Function` 构造函数或 `eval()` 来动态编译模板。

## 错误信息

```
OptimizationError: Optimization failed: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self'".
```

## 解决方案

我们实现了一个CSP兼容的模板处理器，专门用于浏览器扩展环境：

### 1. CSPSafeTemplateProcessor

位置：`packages/core/src/services/template/csp-safe-processor.ts`

**功能特性：**
- 支持基本的 `{{variable}}` 变量替换
- 不使用 `eval()` 或 `Function` 构造函数
- 自动检测浏览器扩展环境
- 对不支持的 Handlebars 功能提供警告

**支持的语法：**
- ✅ `{{variableName}}` - 基本变量替换
- ✅ `{{ variableName }}` - 带空格的变量
- ✅ 预定义变量：`{{originalPrompt}}`、`{{lastOptimizedPrompt}}`、`{{iterateInput}}`

**不支持的语法：**
- ❌ `{{#if condition}}` - 条件语句
- ❌ `{{#each items}}` - 循环语句
- ❌ `{{#unless condition}}` - 否定条件
- ❌ `{{> partial}}` - 部分模板
- ❌ `{{{unescaped}}}` - 非转义输出

### 2. 自动环境检测

`TemplateProcessor` 会自动检测运行环境：

```typescript
// 检测是否在浏览器扩展环境中
if (CSPSafeTemplateProcessor.isExtensionEnvironment()) {
  // 使用CSP安全的处理器
  return CSPSafeTemplateProcessor.processContent(msg.content, context);
} else {
  // 使用完整的Handlebars功能
  return Handlebars.compile(msg.content, { noEscape: true })(context);
}
```

### 3. 环境检测逻辑

```typescript
static isExtensionEnvironment(): boolean {
  try {
    return typeof chrome !== 'undefined' && 
           typeof chrome.runtime !== 'undefined' && 
           typeof chrome.runtime.getManifest === 'function';
  } catch (error) {
    return false;
  }
}
```

## 使用示例

### 基本变量替换

```typescript
const content = 'Hello {{name}}, you are {{age}} years old.';
const context = { name: 'Alice', age: '25' };
const result = CSPSafeTemplateProcessor.processContent(content, context);
// 结果: "Hello Alice, you are 25 years old."
```

### 预定义模板变量

```typescript
const content = 'Original: {{originalPrompt}}, Input: {{iterateInput}}';
const context = {
  originalPrompt: 'Write a story',
  iterateInput: 'Make it more dramatic'
};
const result = CSPSafeTemplateProcessor.processContent(content, context);
// 结果: "Original: Write a story, Input: Make it more dramatic"
```

## 兼容性

| 环境 | 模板引擎 | 功能支持 |
|------|----------|----------|
| 浏览器扩展 | CSPSafeTemplateProcessor | 基本变量替换 |
| Web应用 | Handlebars | 完整功能 |
| Desktop应用 | Handlebars | 完整功能 |

## 测试

相关测试文件：
- `packages/core/tests/unit/template/csp-safe-processor.test.ts`
- `packages/core/tests/unit/template/extension-environment.test.ts`

运行测试：
```bash
cd packages/core
npm test -- csp-safe-processor.test.ts
npm test -- extension-environment.test.ts
```

## 注意事项

1. **功能限制**：在浏览器扩展环境中，只支持基本的变量替换，不支持复杂的 Handlebars 功能
2. **向后兼容**：其他环境仍然使用完整的 Handlebars 功能
3. **警告提示**：当模板包含不支持的功能时，会在控制台显示警告
4. **变量处理**：未定义的变量会被替换为空字符串

## 相关文件

- `packages/core/src/services/template/csp-safe-processor.ts` - CSP安全处理器
- `packages/core/src/services/template/processor.ts` - 主模板处理器（已修改）
- `packages/extension/public/manifest.json` - 扩展清单文件（CSP配置）
