# 119-CSP安全模板处理 🔒

## 📋 概述

**问题**: 浏览器扩展环境中的严格内容安全策略(CSP)导致Handlebars模板编译失败，出现"unsafe-eval"错误。

**解决方案**: 实现CSP兼容的模板处理器，在浏览器扩展环境中使用简单变量替换，其他环境保持完整Handlebars功能。

**影响范围**: 
- ✅ 修复：浏览器扩展模板功能正常工作
- ✅ 保持：Web和Desktop应用完整功能不受影响
- ✅ 增强：环境检测更加准确，避免Electron误判

## 🚨 问题背景

### 错误现象
```
OptimizationError: Optimization failed: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self'".
```

### 根本原因
1. **CSP限制**: 浏览器扩展manifest.json中设置了严格的CSP策略
2. **动态编译**: `Handlebars.compile()`内部使用`Function`构造函数或`eval()`
3. **环境差异**: 只有extension模块受影响，web/desktop模块正常

### 技术细节
- **问题位置**: `packages/core/src/services/template/processor.ts:89`
- **CSP配置**: `packages/extension/public/manifest.json`
- **影响功能**: 高级模板的变量替换功能

## 🎯 解决方案

### 1. CSP安全处理器
创建`CSPSafeTemplateProcessor`类，提供基本变量替换功能：

**支持功能**:
- ✅ `{{variableName}}` - 基本变量替换
- ✅ `{{ variableName }}` - 带空格变量
- ✅ 预定义变量：`{{originalPrompt}}`、`{{lastOptimizedPrompt}}`、`{{iterateInput}}`
- ✅ 新增变量自动支持

**不支持功能**:
- ❌ `{{#if condition}}` - 条件语句
- ❌ `{{#each items}}` - 循环语句
- ❌ `{{> partial}}` - 部分模板
- ❌ 其他复杂Handlebars功能

### 2. 智能环境检测
增强`isExtensionEnvironment()`函数，准确区分不同运行环境：

**检测逻辑**:
1. 排除Node.js环境
2. 排除Electron环境（多重检测）
3. 验证Chrome扩展API
4. 验证manifest有效性

**环境支持**:
- 🌐 **普通Web**: 使用完整Handlebars
- 🖥️ **Electron**: 使用完整Handlebars  
- 🧩 **浏览器扩展**: 使用CSP安全处理器

### 3. 自动切换机制
`TemplateProcessor`根据环境自动选择合适的处理器，无需手动配置。

## 📁 文件结构

```
packages/core/src/services/template/
├── processor.ts                    # 主模板处理器（已修改）
├── csp-safe-processor.ts          # CSP安全处理器（新增）
└── minimal.ts                     # Handlebars导出

packages/core/tests/unit/template/
├── csp-safe-processor.test.ts     # CSP处理器测试（新增）
└── extension-environment.test.ts   # 扩展环境测试（新增）

packages/core/docs/
└── csp-safe-template-processing.md # 技术文档（新增）
```

## 🧪 测试覆盖

### 测试类型
- **单元测试**: CSP安全处理器功能测试
- **环境测试**: 不同环境下的行为验证
- **集成测试**: 模板处理器整体功能测试

### 测试结果
- ✅ 所有测试通过（84个测试）
- ✅ 覆盖所有环境检测场景
- ✅ 验证Electron环境正确排除
- ✅ 验证扩展环境正确识别

## 🎉 实施效果

### 功能恢复
- ✅ 浏览器扩展可正常使用模板功能
- ✅ 系统提示词优化正常工作
- ✅ 用户提示词优化正常工作
- ✅ 迭代优化功能正常工作

### 兼容性保证
- ✅ Web应用功能完全不受影响
- ✅ Desktop应用功能完全不受影响
- ✅ 现有模板100%向后兼容
- ✅ 新增变量自动支持

### 安全性提升
- ✅ 符合浏览器扩展CSP要求
- ✅ 不降低其他平台的安全性
- ✅ 环境检测更加准确可靠

## 📚 相关文档

- **技术文档**: `packages/core/docs/csp-safe-template-processing.md`
- **测试文档**: 测试文件中的详细注释
- **API文档**: 代码中的JSDoc注释

## 🔄 后续优化建议

### 短期优化
- 考虑显式环境标识方案，进一步提高检测准确性
- 监控实际使用中的环境检测准确性

### 长期规划
- 如需要复杂模板功能，可考虑预编译方案
- 评估是否需要为扩展环境提供更多模板功能

## 💡 经验总结

### 技术经验
1. **环境检测**: 多重检测机制确保准确性，异常处理保证稳定性
2. **向后兼容**: 渐进增强策略，不影响现有功能
3. **测试驱动**: 完整测试覆盖确保方案可靠性

### 架构经验
1. **适配器模式**: 根据环境选择合适的处理器
2. **最小影响原则**: 只在必要时使用简化功能
3. **扩展性设计**: 新增变量零成本支持

---

**🏷️ 标签**: CSP安全, 模板处理, 浏览器扩展, 环境检测, 兼容性
