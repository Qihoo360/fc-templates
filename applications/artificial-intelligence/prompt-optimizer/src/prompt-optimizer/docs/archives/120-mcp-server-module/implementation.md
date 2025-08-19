# MCP Server 模块技术实现详解

## 🔧 架构设计

### 整体架构
MCP Server 模块采用了分层架构设计，确保了与 Core 模块的解耦：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │    │   MCP Client    │    │   MCP Client    │
│ (Claude Desktop)│    │ (MCP Inspector) │    │   (Custom App)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │ MCP Protocol
          ┌────────────────────────────────────────────────┐
          │              MCP Server                        │
          │  ┌─────────────────────────────────────────┐   │
          │  │           Transport Layer               │   │
          │  │  ┌─────────────┐  ┌─────────────────┐   │   │
          │  │  │    stdio    │  │ Streamable HTTP │   │   │
          │  │  └─────────────┘  └─────────────────┘   │   │
          │  └─────────────────────────────────────────┘   │
          │  ┌─────────────────────────────────────────┐   │
          │  │           MCP Protocol Layer            │   │
          │  │            ┌─────────┐                  │   │
          │  │            │  Tools  │                  │   │
          │  │            └─────────┘                  │   │
          │  └─────────────────────────────────────────┘   │
          │  ┌─────────────────────────────────────────┐   │
          │  │         Service Adapter Layer           │   │
          │  └─────────────────────────────────────────┘   │
          └────────────────────┬───────────────────────────┘
                               │
          ┌────────────────────────────────────────────────┐
          │              Core Module                       │
          │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
          │  │PromptService│ │ LLMService  │ │ Template │  │
          │  └─────────────┘ └─────────────┘ │ Manager  │  │
          │  ┌─────────────┐ ┌─────────────┐ └──────────┘  │
          │  │HistoryMgr   │ │ ModelMgr    │ ┌──────────┐  │
          │  └─────────────┘ └─────────────┘ │ Memory   │  │
          │                                  │ Storage  │  │
          │                                  └──────────┘  │
          └────────────────────────────────────────────────┘
```

### 模块结构
```
packages/mcp-server/
├── package.json                 # 项目配置和依赖
├── tsconfig.json               # TypeScript 配置
├── src/
│   ├── index.ts                # 主入口点（仅导出）
│   ├── start.ts                # 启动入口点
│   ├── config/                 # 配置管理
│   │   ├── environment.ts      # 环境变量管理
│   │   ├── models.ts           # 默认模型配置
│   │   └── templates.ts        # 默认模板配置
│   ├── tools/                  # MCP Tools 实现
│   │   ├── index.ts            # Tools 导出
│   │   ├── optimize-user-prompt.ts      # 用户提示词优化
│   │   ├── optimize-system-prompt.ts    # 系统提示词优化
│   │   └── iterate-prompt.ts            # 提示词迭代优化
│   ├── adapters/               # 服务适配层
│   │   ├── core-services.ts    # Core 服务初始化和管理
│   │   ├── parameter-adapter.ts # 参数格式转换
│   │   └── error-handler.ts    # 错误处理适配
│   └── utils/                  # 工具函数
│       └── logging.ts          # 日志工具
├── examples/                   # 使用示例
│   ├── stdio-client.js         # stdio 客户端示例
│   └── http-client.js          # HTTP 客户端示例
├── docs/                       # 文档
│   └── README.md               # 使用说明
└── tests/                      # 测试文件
    ├── tools.test.ts           # Tools 测试
    └── integration.test.ts     # 集成测试
```

## 🐛 问题诊断与解决

### 环境变量加载时机问题
**问题描述**: Core 包的 `defaultModels` 在模块导入时就初始化，无法读取到后来通过 dotenv 加载的环境变量。

**解决方案**: 创建预加载脚本 (`preload-env.js`)，在 Node.js 启动时预加载环境变量：

```javascript
// preload-env.js
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 按优先级加载环境变量
const paths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../.env.local'),
  resolve(__dirname, '../../.env.local'),
  // ... 更多路径
];

paths.forEach(path => {
  try {
    config({ path });
  } catch (error) {
    // 忽略文件不存在的错误
  }
});
```

使用 `-r` 参数预加载:
```json
{
  "scripts": {
    "dev": "node -r ./preload-env.js dist/start.js --transport=http"
  }
}
```

### 构建时产生后台进程问题
**问题描述**: 在 `src/index.ts` 文件末尾有立即执行的代码，当 `tsup` 构建时会意外启动服务器并占用端口。

**解决方案**: 文件分离策略

1. `src/index.ts` - 只导出函数，不执行：
```typescript
// 导出 main 函数供外部调用
export { main };
```

2. `src/start.ts` - 专门用于启动：
```typescript
#!/usr/bin/env node
import { main } from './index.js';

// 启动服务器
main().catch(console.error);
```

3. 更新构建配置：
```json
{
  "scripts": {
    "build": "tsup src/index.ts src/start.ts --format cjs,esm --dts --clean",
    "dev": "node -r ./preload-env.js dist/start.js --transport=http"
  }
}
```

## 📝 实施步骤

1. 项目结构设计与初始化
2. Core 服务管理器实现
3. 参数适配层实现
4. 默认配置管理
5. MCP Tools 实现
6. 错误处理与转换
7. MCP Server 实例创建
8. 多传输方式支持
9. 测试与文档

## 🔍 调试过程

在开发过程中，我们使用了以下调试方法：

1. **MCP Inspector 调试**: 使用官方调试工具进行协议级别测试
2. **日志驱动调试**: 详细记录每个环节状态，快速定位问题
3. **分层测试策略**: 先测试 Core 服务再测试 MCP 包装，快速定位问题

## 🧪 测试验证

### 构建测试
- ✅ CJS/ESM 双格式输出
- ✅ TypeScript 类型定义生成
- ✅ 构建时无副作用（不启动服务器）

### 功能测试
- ✅ 环境变量正确加载
- ✅ 模型自动选择和配置
- ✅ 模板加载和管理
- ✅ MCP 工具注册和调用
- ✅ HTTP/stdio 双传输支持

### 兼容性测试
- ✅ Windows 10/11
- ✅ Node.js 18+
- ✅ MCP Inspector 集成
- ✅ Claude Desktop 兼容