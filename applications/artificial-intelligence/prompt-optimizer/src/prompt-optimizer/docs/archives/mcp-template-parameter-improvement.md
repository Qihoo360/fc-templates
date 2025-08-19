# MCP服务器模板参数改进

## 问题描述

MCP服务器的工具参数中的`template`参数原本是可选的字符串类型，用户不知道可以填写什么值，也没有默认值。这导致用户体验不佳，因为：

1. 用户不知道有哪些可用的模板选项
2. 没有默认值，用户必须猜测或查看文档
3. 容易输入错误的模板ID导致错误

## 解决方案

将`template`参数改为枚举类型，并提供默认值：

### 1. 新增模板选项获取函数

在`packages/mcp-server/src/config/templates.ts`中添加了`getTemplateOptions`函数：

```typescript
export async function getTemplateOptions(
  templateManager: TemplateManager, 
  templateType: 'optimize' | 'userOptimize' | 'iterate'
): Promise<Array<{value: string, label: string, description?: string}>>
```

该函数：
- 根据模板类型获取所有可用模板
- 返回格式化的选项数组，包含value、label和description
- 确保默认模板始终在选项列表中
- 提供错误处理和回退机制

### 2. 修改工具定义

在`packages/mcp-server/src/index.ts`中修改了三个工具的`inputSchema`：

#### optimize-user-prompt
```json
{
  "template": {
    "type": "string",
    "description": "选择优化模板。不同模板有不同的优化策略和风格。",
    "enum": ["user-prompt-professional", "user-prompt-basic", "user-prompt-planning"],
    "default": "user-prompt-basic"
  }
}
```

#### optimize-system-prompt
```json
{
  "template": {
    "type": "string",
    "description": "选择优化模板。不同模板有不同的优化策略和风格。",
    "enum": ["general-optimize", "output-format-optimize", "analytical-optimize"],
    "default": "general-optimize"
  }
}
```

#### iterate-prompt
```json
{
  "template": {
    "type": "string",
    "description": "选择迭代优化模板。不同模板有不同的迭代策略。",
    "enum": ["iterate"],
    "default": "iterate"
  }
}
```

### 3. 添加CoreServicesManager方法

在`packages/mcp-server/src/adapters/core-services.ts`中添加了`getTemplateManager()`方法，用于获取模板管理器实例。

## 改进效果

1. **用户友好**：用户现在可以看到所有可用的模板选项，不需要猜测
2. **有默认值**：每个工具都有合理的默认模板，用户可以直接使用
3. **类型安全**：枚举类型防止用户输入无效的模板ID
4. **描述清晰**：每个参数都有详细的描述说明其用途
5. **动态获取**：模板选项是动态获取的，支持未来添加新模板

## 测试验证

通过测试验证了：
- MCP服务器能够正常启动
- 所有工具都正确注册
- 模板参数包含正确的枚举值和默认值
- 不同类型的模板被正确分类和映射

## 技术细节

- 使用了模板类型映射来处理Core模块和MCP服务器之间的类型差异
- 实现了错误处理和回退机制，确保即使模板加载失败也能提供基本功能
- 过滤掉了MCP服务器特有的`-default`后缀模板，只显示真正的内置模板
- 修改了默认模板ID映射，使用内置模板而不是MCP服务器的简化模板
- 保持了向后兼容性，现有的模板ID仍然有效

## 最终结果

修复后的模板选项：

- **用户优化**: `user-prompt-professional`, `user-prompt-basic`, `user-prompt-planning` (默认: `user-prompt-basic`)
- **系统优化**: `general-optimize`, `output-format-optimize`, `analytical-optimize` (默认: `general-optimize`)
- **迭代优化**: `iterate` (默认: `iterate`)

所有模板ID都是真实存在的内置模板，用户可以放心使用。
