# LLM高级参数配置指南

## 概述

`llmParams` 功能允许您为每个模型配置详细的参数，以精确控制LLM的行为。本系统采用**智能参数分类**和**透明化传递**机制，确保参数配置的专业性和可靠性。

## 🔧 核心设计原则

### 1. 参数透明化 (2024.12.20 更新)
- **不设置默认值**: 系统不会自动添加任何默认值，避免用户误解
- **直接传递**: 用户配置什么参数就传递什么参数
- **SDK原生**: 依赖各LLM服务商的SDK默认行为

### 2. 智能参数分类
- **按提供商过滤**: UI自动根据模型类型显示相关参数
- **避免混淆**: OpenAI类型模型只显示OpenAI参数，Gemini模型只显示Gemini参数
- **参数隔离**: 不同提供商的参数互不干扰

### 3. 扩展性保证
- **自定义参数**: 支持任意SDK兼容的自定义参数
- **未来兼容**: 新参数无需修改核心代码即可使用
- **类型保持**: 保持参数原始类型和结构

## 🚀 参数生效机制

### OpenAI兼容提供商 (OpenAI, DeepSeek, Zhipu, SiliconFlow, Custom)

#### 参数传递流程
```typescript
// 1. 分离特殊参数
const {
  timeout,           // 客户端配置参数
  model,            // 避免覆盖主模型配置
  messages,         // 避免覆盖主消息
  ...restLlmParams  // 所有其他参数
} = modelConfig.llmParams || {};

// 2. 创建客户端实例
const openai = new OpenAI({
  apiKey,
  baseURL,
  timeout: timeout || (isStream ? 90000 : 60000),  // 仅timeout有特殊处理
  maxRetries: isStream ? 2 : 3
});

// 3. 构建API请求 - 无默认值设置
const completionConfig = {
  model: modelConfig.defaultModel,
  messages: formattedMessages,
  ...restLlmParams  // 直接传递所有其他参数
};

// 4. 发送请求
const response = await openai.chat.completions.create(completionConfig);
```

#### 支持的参数

| 参数名 | 类型 | 范围 | 说明 | 
|--------|------|------|------|
| `timeout` | integer | ≥1000 | 请求超时(毫秒) - 客户端配置 |
| `temperature` | number | 0.0-2.0 | 控制输出随机性 |
| `max_tokens` | integer | ≥1 | 最大生成token数量 |
| `top_p` | number | 0.0-1.0 | 核心采样参数 |
| `presence_penalty` | number | -2.0-2.0 | 存在惩罚 |
| `frequency_penalty` | number | -2.0-2.0 | 频率惩罚 |
| `stop` | array | - | 停止序列 |
| `seed` | integer | - | 随机种子 |
| `stream` | boolean | - | 流式输出（系统自动处理） |

### Gemini提供商

#### 参数传递流程
```typescript
// 1. 分离已知参数和未知参数
const {
  temperature,
  maxOutputTokens,
  topP,
  topK,
  candidateCount,
  stopSequences,
  ...otherSafeParams  // 未知参数也会传递
} = modelConfig.llmParams || {};

// 2. 构建生成配置 - 无默认值设置
const generationConfig = { ...otherSafeParams };

// 3. 仅添加用户明确配置的参数
if (temperature !== undefined) {
  generationConfig.temperature = temperature;
}
if (maxOutputTokens !== undefined) {
  generationConfig.maxOutputTokens = maxOutputTokens;
}
// ... 其他参数类似处理

// 4. 创建聊天会话
const chat = model.startChat({
  history: formatHistory(messages),
  ...(Object.keys(generationConfig).length > 0 && { generationConfig })
});
```

#### 支持的参数

| 参数名 | 类型 | 范围 | 说明 |
|--------|------|------|------|
| `temperature` | number | 0.0-2.0 | 控制输出随机性 |
| `maxOutputTokens` | integer | ≥1 | 最大输出token数量 |
| `topP` | number | 0.0-1.0 | 核心采样参数 |
| `topK` | integer | ≥1 | Top-K采样 |
| `candidateCount` | integer | 1-8 | 候选响应数量 |
| `stopSequences` | array | - | 停止序列数组 |

## 🎯 UI智能参数管理

### 参数类型自动识别
系统会根据模型的`provider`字段自动显示相关参数：

```typescript
// 根据provider过滤参数定义
const availableParams = advancedParameterDefinitions.filter(def => 
  def.appliesToProviders.includes(currentProvider) &&
  !Object.keys(currentParams).includes(def.name)
);
```

### 提供商映射关系
```typescript
const providerMapping = {
  // OpenAI兼容类型
  'openai': ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'timeout'],
  'deepseek': ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'timeout'],
  'zhipu': ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'timeout'],
  'siliconflow': ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'timeout'],
  'custom': ['temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'timeout'],
  
  // Gemini类型
  'gemini': ['temperature', 'topP', 'maxOutputTokens', 'topK', 'candidateCount', 'stopSequences']
};
```

### UI显示增强
- 显示当前提供商类型
- 显示可选参数数量
- 彩色状态指示
- 自动过滤已配置参数

## 📋 配置示例

### OpenAI模型配置
```json
{
  "name": "OpenAI GPT-4",
  "provider": "openai",
  "llmParams": {
    "temperature": 0.3,      // 低随机性，更确定的输出
    "max_tokens": 4096,      // 限制输出长度
    "top_p": 0.8,           // 核心采样
    "presence_penalty": 0.1, // 鼓励新话题
    "timeout": 90000         // 90秒超时
  }
}
```

### DeepSeek模型配置
```json
{
  "name": "DeepSeek Coder V3",
  "provider": "deepseek", 
  "llmParams": {
    "temperature": 0.1,      // 代码生成需要低随机性
    "max_tokens": 8192,      // 较长的代码输出
    "top_p": 0.95,          // 平衡多样性和质量
    "timeout": 120000        // 代码生成可能需要更长时间
  }
}
```

### Gemini模型配置
```json
{
  "name": "Gemini Pro",
  "provider": "gemini",
  "llmParams": {
    "temperature": 0.8,      // 创意任务高随机性
    "maxOutputTokens": 2048, // 适中输出长度
    "topP": 0.95,           // 核心采样
    "topK": 40,             // Top-K采样
    "candidateCount": 1,     // 单个响应
    "stopSequences": ["END", "STOP"] // 自定义停止词
  }
}
```

### 自定义模型配置
```json
{
  "name": "Custom LLaMA",
  "provider": "custom",
  "llmParams": {
    "temperature": 0.7,
    "max_tokens": 4096,
    
    // 自定义参数示例
    "repetition_penalty": 1.1,
    "do_sample": true,
    "pad_token_id": 0,
    "eos_token_id": 2
  }
}
```

## 🔍 验证与调试

### 参数验证API
```typescript
import { validateLLMParams } from '@prompt-optimizer/core';

const validation = validateLLMParams(llmParams, provider);

if (!validation.isValid) {
  console.error('参数验证失败:', validation.errors);
  validation.errors.forEach(error => {
    console.error(`- ${error.parameterName}: ${error.message}`);
  });
}

if (validation.warnings.length > 0) {
  console.warn('参数警告:', validation.warnings);
  validation.warnings.forEach(warning => {
    console.warn(`- ${warning.parameterName}: ${warning.message}`);
  });
}
```

### 测试每个参数
系统为每个参数提供独立的测试用例：

```typescript
// 测试temperature参数
await testParameter('temperature', 0.3, provider);

// 测试max_tokens参数  
await testParameter('max_tokens', 100, provider);

// 测试组合参数
await testParameters({
  temperature: 0.6,
  max_tokens: 150,
  top_p: 0.9
}, provider);
```

## ⚡ 最佳实践

### 1. 参数选择策略
```typescript
// 代码生成任务
const codingParams = {
  temperature: 0.1,      // 低随机性
  max_tokens: 8192,      // 长输出
  top_p: 0.95           // 高质量采样
};

// 创意写作任务
const creativeParams = {
  temperature: 0.8,      // 高随机性
  max_tokens: 2048,      // 适中输出
  top_p: 0.9,           // 平衡采样
  presence_penalty: 0.3  // 鼓励新想法
};

// 问答任务
const qaParams = {
  temperature: 0.3,      // 中等随机性
  max_tokens: 1024,      // 简洁回答
  frequency_penalty: 0.1 // 避免重复
};
```

### 2. 渐进式调优
```typescript
// 第一步：基础配置
let params = {
  temperature: 0.7
};

// 第二步：添加输出控制
params = {
  ...params,
  max_tokens: 2048,
  top_p: 0.9
};

// 第三步：精细调整
params = {
  ...params,
  presence_penalty: 0.1,
  frequency_penalty: 0.1
};
```

### 3. 性能优化
```typescript
// 快速响应场景
const fastParams = {
  max_tokens: 512,       // 限制输出长度
  timeout: 30000         // 较短超时
};

// 高质量场景
const qualityParams = {
  temperature: 0.2,      // 低随机性
  top_p: 0.8,           // 精确采样
  timeout: 120000        // 较长超时
};
```

## 🛠️ 故障排除

### 常见问题诊断

1. **参数不生效**
   ```typescript
   // 检查参数名是否正确
   console.log('支持的参数:', advancedParameterDefinitions
     .filter(def => def.appliesToProviders.includes(provider))
     .map(def => def.name));
   ```

2. **类型错误**
   ```typescript
   // 确保参数类型正确
   const temperature = parseFloat(userInput); // 确保是number
   const maxTokens = parseInt(userInput, 10);  // 确保是integer
   ```

3. **范围错误** 
   ```typescript
   // 检查参数范围
   if (temperature < 0 || temperature > 2) {
     throw new Error('temperature必须在0-2之间');
   }
   ```

### 调试工具

1. **启用详细日志**
   ```typescript
   // 在modelManager中启用调试
   const debugMode = process.env.NODE_ENV === 'development';
   if (debugMode) {
     console.log('LLM参数配置:', llmParams);
     console.log('当前provider:', provider);
   }
   ```

2. **参数传递跟踪**
   ```typescript
   // 查看实际传递的参数
   console.log('传递给SDK的参数:', {
     ...completionConfig,
     provider,
     timestamp: new Date().toISOString()
   });
   ```

## 📝 更新日志

### 2024.12.20 - 参数透明化更新
- ✅ 移除所有自动设置的默认值
- ✅ 改进参数类型自动过滤
- ✅ 优化UI显示和标签
- ✅ 增强测试覆盖率
- ✅ 添加参数组合测试
- ✅ 完善故障排除指南

### 核心改进
- **透明化原则**: 只传递用户明确配置的参数
- **智能分类**: 根据provider自动显示相关参数
- **UI优化**: 移除标签中的冗余提供商标识
- **测试完善**: 为每个参数添加独立测试用例 