# 提示词配置文件说明

## 文件结构

```
src/config/prompts/
├── index.ts                  # 统一导出文件
├── systemPromptRules.ts      # 系统提示词规则
└── userGuidedRules.ts        # 用户引导规则
```

## 文件说明

### index.ts
- 统一导出所有提示词规则
- 作为其他模块导入的入口点

### systemPromptRules.ts
- 包含完整的精英提示词工程指南
- 基于《Architecting Intelligence》的系统提示词规则
- 导出 `SYSTEM_PROMPT_RULES` 常量

### userGuidedRules.ts  
- AI需求收集助手的提示词规则
- 用于引导用户有效描述AI自动化需求
- 包含输入验证和对话控制逻辑
- 导出 `USER_GUIDED_PROMPT_RULES` 常量

## 扩展指南

### 添加新的AI助手类型

1. 在 `prompts/` 目录下创建新的规则文件，例如 `codeReviewRules.ts`
2. 导出相应的常量，例如 `CODE_REVIEW_PROMPT_RULES`
3. 在 `index.ts` 中添加导出

示例：

```typescript
// prompts/codeReviewRules.ts
export const CODE_REVIEW_PROMPT_RULES = `你是一个专业的代码审查助手...`

// prompts/index.ts
import { CODE_REVIEW_PROMPT_RULES } from './codeReviewRules'

export {
  SYSTEM_PROMPT_RULES,
  USER_GUIDED_PROMPT_RULES,
  CODE_REVIEW_PROMPT_RULES 
}
```

### 修改现有规则

1. 直接编辑对应的规则文件
2. 保存后会自动应用到系统中
3. 用户在设置界面中的自定义会覆盖默认值

## 命名规范

- 所有常量使用 `UPPER_SNAKE_CASE` 命名
- 文件名使用 `camelCase` 命名，以 `Rules.ts` 结尾
- 导出的常量名应该以 `_RULES` 结尾，例如：
  - `SYSTEM_PROMPT_RULES`
  - `USER_GUIDED_PROMPT_RULES`
  - `CODE_REVIEW_PROMPT_RULES`