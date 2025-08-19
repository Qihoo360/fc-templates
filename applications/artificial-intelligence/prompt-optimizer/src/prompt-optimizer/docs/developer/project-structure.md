# 项目结构文档

> **注意:** 本文档专注于项目的文件和目录结构。关于技术栈详情和实现流程，请参考 [技术文档](./technical-documentation.md)。

## 1. 项目整体架构

### 1.1 根目录结构
```
prompt-optimizer/
├── packages/             # 项目包
│   ├── core/            # 核心功能包
│   │   ├── src/         # 核心源代码
│   │   ├── tests/       # 核心包测试
│   │   └── package.json # 核心包配置
│   ├── web/             # Web版本
│   │   ├── src/         # Web源代码
│   │   ├── tests/       # Web测试
│   │   └── package.json # Web包配置
│   └── extension/       # Chrome插件
├── docs/                # 项目文档
├── tools/               # 工具脚本
└── ...配置文件
```

### 1.2 配置文件
- `pnpm-workspace.yaml` - 工作区配置
- `.env.example` - 环境变量示例
- `package.json` - 项目配置
- `.vscode/` - VSCode配置目录
- `.cursorrules` - Cursor IDE配置
- `.gitignore` - Git忽略配置

### 1.3 工作区文件
- `README.md` - 项目说明文档
- `scratchpad.md` - 开发笔记和任务规划（已迁移到docs/workspace/）
- `experience.md` - 项目经验总结（已迁移到docs/workspace/）

### 1.4 文档目录 (docs/)
- `README.md` - 文档索引
- `development-guidelines.md` - 开发指南
- `project-status.md` - 项目状态
- `project-structure.md` - 项目结构
- `technical-documentation.md` - 技术文档
- `prd.md` - 产品需求文档
- `CHANGELOG.md` - 更新日志

## 2. 核心包结构 (packages/core)

### 2.1 源代码目录 (packages/core/src/)
```
src/
├── services/           # 核心服务
│   ├── llm/           # LLM服务
│   │   ├── service.ts # LLM服务实现
│   │   ├── types.ts   # 类型定义
│   │   └── errors.ts  # 错误定义
│   ├── model/         # 模型管理
│   │   ├── manager.ts # 模型管理器
│   │   ├── types.ts   # 类型定义
│   │   └── defaults.ts# 默认配置
│   ├── prompt/        # 提示词服务
│   │   ├── service.ts # 提示词服务实现
│   │   ├── types.ts   # 类型定义
│   │   └── errors.ts  # 错误定义
│   ├── template/      # 模板服务
│   │   ├── manager.ts # 模板管理器
│   │   ├── types.ts   # 类型定义
│   └── history/       # 历史记录服务
│       ├── manager.ts # 历史管理器
│       └── types.ts   # 类型定义
├── types/             # 公共类型定义
└── utils/             # 工具函数
```

### 2.2 API目录 (src/api/)
- `api/llm.js` - LLM API调用封装

### 2.3 配置目录 (packages/core/config/)
- `models.js` - LLM模型配置
- `prompts.js` - 提示词模板配置

### 2.4 测试目录 (packages/core/tests/)
```
tests/
├── unit/             # 单元测试
│   └── services/     # 服务测试
│       ├── llm/      # LLM服务测试
│       ├── model/    # 模型管理测试
│       └── prompt/   # 提示词服务测试
└── integration/      # 集成测试
    └── services/     # 服务集成测试
```

### 2.5 核心包配置
- `package.json` - 核心包配置
- `tsconfig.json` - TypeScript配置
- `vitest.config.ts` - 测试配置

## 3. Web包结构 (packages/web)

### 3.1 源代码目录 (packages/web/src/)
```
src/
├── components/        # Vue组件
│   ├── PromptPanel.vue    # 提示词面板
│   ├── ModelManager.vue   # 模型管理器
│   ├── TemplateManager.vue# 模板管理器
│   ├── InputPanel.vue     # 输入面板
│   └── OutputPanel.vue    # 输出面板
├── composables/       # Vue组合式函数
├── services/          # 业务逻辑
│   ├── llm/           # LLM服务
│   ├── model/         # 模型配置
│   ├── prompt/        # 提示词服务
│   ├── promptManager.js # 提示词管理
│   └── themeManager.js # 主题管理
├── assets/           # 静态资源
│   ├── images/       # 图片资源
│   └── styles/       # 样式资源
├── prompts/          # 提示词模板
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

### 3.2 组件目录详情 (packages/web/src/components/)
- `PromptPanel.vue` - 提示词输入和优化面板
- `InputPanel.vue` - 输入面板组件
- `OutputPanel.vue` - 输出面板组件
- `ModelConfig.vue` - 模型配置组件
- `ThemeToggle.vue` - 主题切换组件
- `LoadingSpinner.vue` - 加载动画组件

### 3.3 测试目录 (packages/web/tests/)
```
tests/
├── unit/            # 单元测试
│   ├── components/  # 组件测试
│   └── services/    # 服务测试
└── integration/     # 集成测试
    └── services/    # 服务集成测试
```

### 3.4 Web包配置
- `package.json` - Web包配置
- `vite.config.ts` - Vite配置
- `tailwind.config.js` - TailwindCSS配置
- `.env.local` - 本地环境变量
- `postcss.config.js` - PostCSS配置
- `index.html` - 项目入口HTML文件

## 4. 扩展包结构 (packages/extension)

### 4.1 源代码目录 (packages/extension/src/)
```
src/
├── popup/           # 弹出窗口界面
├── background/      # 后台脚本
├── content/         # 内容脚本
└── manifest.json    # 扩展配置文件
```

### 4.2 扩展包配置
- `package.json` - 扩展包配置
- `vite.config.ts` - 构建配置

## 5. 依赖关系

### 5.1 核心包依赖 (@prompt-optimizer/core)
```
@prompt-optimizer/core
├── @openai/openai ^4.83.0      # OpenAI SDK
├── @google/generative-ai ^0.21.0 # Google Generative AI SDK
└── uuid ^11.0.5                # UUID生成
```

### 5.2 Web包依赖 (@prompt-optimizer/web)
```
@prompt-optimizer/web
├── @prompt-optimizer/core  # 依赖核心包
├── vue ^3.5.x             # Vue框架
├── pinia ^2.1.x           # 状态管理
└── tailwindcss ^3.4.1     # 样式框架
```

### 5.3 扩展包依赖 (@prompt-optimizer/extension)
```
@prompt-optimizer/extension
├── @prompt-optimizer/core  # 依赖核心包
├── @prompt-optimizer/ui    # 依赖UI组件包
└── vue ^3.5.x             # Vue框架
``` 