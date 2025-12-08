# YPrompt - 智能提示词生成工具

基于AI对话引导挖掘用户需求的专业提示词生成系统，采用多模块导航架构，基于《Architecting Intelligence: A Definitive Guide to the Art and Science of Elite Prompt Engineering》理论生成高质量的AI提示词。支持桌面端侧边栏导航和移动端底部导航，为不同功能模块提供独立的用户界面。



## 截图
**PC端**  
  
![](imgs/pc.gif)

**移动端**  

![](imgs/mobile.gif)

## 核心功能

### 🏠 生成模块（当前主要功能）
- **AI引导式需求收集**: 通过智能对话深入挖掘用户真实需求
- **GPrompt四步生成**: 关键指令提取 → 初始提示词 → 优化建议 → 最终提示词
- **多AI模型支持**: 支持OpenAI、Anthropic、Google Gemini和自定义AI服务商
- **双模式操作**: 自动生成和手动步进两种执行模式
- **格式语言转换**: 支持Markdown/XML格式切换和中英文互译
- **多模态附件**: 支持图片、文档、音频、视频文件上传

### 🌟 多模块导航系统
- **桌面端**: 可折叠侧边栏导航（200px ↔ 60px）
- **移动端**: 底部导航栏，快速切换功能模块
- **响应式**: 1024px断点自动适配布局
- **模块化**: 每个功能模块独立页面和状态管理

### 📚 我的模块
- **飞书 OAuth 登录**: 通过飞书账号快速登录，自动同步用户信息
- **提示词库管理**: 保存、查看、编辑、删除生成的提示词
- **分类标签**: 为提示词添加标签，方便分类管理
- **版本管理**: 支持提示词版本历史和回滚（开发中）

### ⚡ 未来模块（规划中）
- **优化模块**: 提示词质量分析、A/B 测试、性能评估
- **操练场模块**: 实时测试、参数调节、性能监控

### 🔧 系统特性
- **飞书集成**: 支持飞书 OAuth 2.0 登录，PC 端和移动端自适应
- **用户认证**: JWT Token 认证，安全的前后端分离架构
- **响应式设计**: 完美适配桌面端和移动端设备
- **支持内置提供商**: 将 `builtin-providers.example.json` 复制为 `builtin-providers.json` 并修改您需要的配置即可
- **TypeScript**: 完整的类型安全保障
- **模块化架构**: 易于扩展和维护

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **路由管理**: Vue Router 4.0
- **构建工具**: Vite
- **UI框架**: Tailwind CSS
- **状态管理**: Pinia
- **图标库**: Lucide Vue Next
- **Markdown**: Marked

## 项目结构

```
src/
├── components/          # Vue组件层（模块化架构）
│   ├── layout/                   # 布局组件
│   │   ├── DesktopLayout.vue     # 桌面端布局容器
│   │   ├── MobileLayout.vue      # 移动端布局容器
│   │   ├── DesktopSidebar.vue    # 桌面端侧边栏导航
│   │   └── MobileBottomNav.vue   # 移动端底部导航
│   ├── modules/                  # 功能模块页面
│   │   ├── GenerateModule.vue    # 🏠 生成模块（主要功能）
│   │   ├── OptimizeModule.vue    # ⚡ 优化模块（规划中）
│   │   ├── PlaygroundModule.vue  # 🎯 操练场模块（规划中）
│   │   └── LibraryModule.vue     # 📚 我的提示词模块
│   ├── ChatInterface.vue         # 对话界面主容器
│   ├── PreviewPanel.vue          # 预览面板主容器
│   ├── SettingsModal.vue         # 设置弹窗主容器
│   ├── PromptGenerator.vue       # 提示词生成器
│   ├── NotificationContainer.vue # 通知容器
│   ├── chat/                     # 对话模块
│   │   ├── composables/          # 业务逻辑组合式函数
│   │   │   ├── useChatMessages.ts
│   │   │   ├── useChatInput.ts
│   │   │   ├── useChatAttachments.ts
│   │   │   ├── useChatModel.ts
│   │   │   ├── useChatQuickReplies.ts
│   │   │   ├── useChatMessageOperations.ts
│   │   │   └── useChatLogic.ts
│   │   └── components/           # UI子组件
│   │       ├── ChatHeader.vue
│   │       ├── ChatModelSelector.vue
│   │       ├── ChatMessageList.vue
│   │       ├── ChatMessage.vue
│   │       ├── ChatQuickReplies.vue
│   │       └── ChatInputArea.vue
│   ├── preview/                  # 预览模块
│   │   ├── composables/          # 业务逻辑组合式函数
│   │   │   ├── usePreviewTabs.ts
│   │   │   ├── usePreviewExecution.ts
│   │   │   ├── usePreviewConversion.ts
│   │   │   ├── usePreviewScrollSync.ts
│   │   │   ├── usePreviewClipboard.ts
│   │   │   ├── usePreviewListOperations.ts
│   │   │   └── usePreviewHelpers.ts
│   │   └── components/           # UI子组件
│   │       ├── common/
│   │       │   ├── PreviewHeader.vue
│   │       │   ├── TabContainer.vue
│   │       │   ├── TabButton.vue
│   │       │   ├── EmptyState.vue
│   │       │   └── LoadingState.vue
│   │       └── tabs/
│   │           ├── ReportTab.vue
│   │           ├── ThinkingTab.vue
│   │           ├── InitialTab.vue
│   │           ├── AdviceTab.vue
│   │           └── FinalTab.vue
│   └── settings/                 # 设置模块
│       ├── composables/          # 业务逻辑组合式函数
│       │   ├── useProviderManagement.ts
│       │   ├── useModelManagement.ts
│       │   ├── useModelTesting.ts
│       │   └── usePromptRules.ts
│       └── components/           # UI子组件
│           ├── SettingsButton.vue
│           ├── SettingsHeader.vue
│           ├── tabs/
│           │   ├── ProvidersTab.vue
│           │   └── PromptsTab.vue
│           └── dialogs/
│               ├── ProviderTypeDialog.vue
│               ├── ProviderDialog.vue
│               └── ModelDialog.vue
├── stores/              # Pinia状态管理
│   ├── authStore.ts             # 用户认证状态
│   ├── promptStore.ts           # 提示词生成状态
│   ├── settingsStore.ts         # AI配置和应用设置
│   ├── notificationStore.ts     # 通知状态
│   └── navigationStore.ts       # 导航状态管理
├── services/            # 业务服务层
│   ├── apiService.ts            # 后端API服务封装
│   ├── aiService.ts             # AI服务统一入口
│   ├── aiGuideService.ts        # AI引导式需求收集
│   ├── promptGeneratorService.ts # GPrompt四步生成
│   ├── capabilityDetector.ts    # 模型能力检测
│   └── ai/                      # AI服务模块化实现
│       ├── providers/           # 提供商实现
│       │   ├── BaseProvider.ts
│       │   ├── OpenAIProvider.ts
│       │   ├── AnthropicProvider.ts
│       │   └── GoogleProvider.ts
│       ├── streaming/           # 流式处理
│       │   ├── StreamProcessor.ts
│       │   ├── SSEParser.ts
│       │   └── StreamFilter.ts
│       ├── multimodal/          # 多模态转换
│       │   ├── AttachmentConverter.ts
│       │   ├── OpenAIAttachmentHandler.ts
│       │   ├── AnthropicAttachmentHandler.ts
│       │   └── GoogleAttachmentHandler.ts
│       ├── errors/              # 错误处理
│       │   ├── AIErrorHandler.ts
│       │   └── ErrorParser.ts
│       ├── utils/               # 工具函数
│       │   ├── ResponseCleaner.ts
│       │   ├── ModelFetcher.ts
│       │   └── apiUrlBuilder.ts
│       ├── types.ts             # 类型定义
│       └── index.ts             # 模块导出
├── config/              # 配置文件
│   ├── prompts.ts              # 提示词配置管理
│   └── prompts/                # 内置提示词规则
│       ├── systemPromptRules.ts
│       ├── thinkingPointsExtraction.ts
│       ├── optimizationAdvice.ts
│       └── userGuidedRules.ts
├── utils/               # 通用工具函数
│   ├── aiResponseUtils.ts
│   └── fileUtils.ts
├── views/               # 页面视图（已弃用，使用 modules）
│   └── HomeView.vue
└── main.ts              # 应用入口（路由配置）
```

## 导航系统

### 桌面端 (≥1024px)
- **侧边栏导航**: 左侧固定侧边栏，支持折叠/展开
- **折叠状态**: 200px (展开) ↔ 60px (折叠)
- **模块切换**: 点击导航项或使用快捷键 Ctrl+1-4
- **设置入口**: 侧边栏底部设置按钮

### 移动端 (<1024px)
- **底部导航**: 固定在底部的四个模块按钮
- **模块切换**: 点击底部导航按钮快速切换
- **响应式适配**: 自动适配小屏幕布局

### 路由管理
```
/generate     - 🏠 生成模块 (默认)
/optimize     - ⚡ 优化模块
/playground   - 🎯 操练场模块
/library      - 📚 我的模块
```

## 开发部署

### 环境变量配置
复制 `.env.example` 创建 `.env.development` 和 `.env.production`：
```bash
# 后端API地址（不要包含 /api 后缀）
VITE_API_BASE_URL=http://localhost:8888

# 飞书应用ID（从飞书开放平台获取）
VITE_FEISHU_APP_ID=your_feishu_app_id
```

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build
```

### 添加新模块
1. 在 `src/components/modules/` 创建新模块组件
2. 在 `src/stores/navigationStore.ts` 添加模块配置
3. 在 `src/main.ts` 添加路由规则
4. 模块可完全自定义页面布局

## 文档

- [技术文档](docs/项目开发文档.md)
- [版本管理设计](docs/提示词版本管理设计方案.md)