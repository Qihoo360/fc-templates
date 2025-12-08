# YPrompt 前端项目文档

## 项目概述

YPrompt 前端是一个基于 Vue 3 + TypeScript 的提示词生成和管理系统，采用 Composition API 和模块化架构，支持桌面端侧边栏导航和移动端底部导航的响应式设计。

**核心功能**:
- 🤖 AI 引导式需求收集和提示词生成
- 📝 提示词质量分析与优化（系统提示词 + 用户提示词）
- 🎮 提示词测试操练场（规划中）
- 📚 个人提示词库管理（收藏、标签、版本控制）
- 🔐 双认证支持：Linux.do OAuth + 本地用户名密码
- 📱 响应式布局（1024px断点）

## 技术栈

- **框架**: Vue 3.4 + TypeScript 5.3
- **构建工具**: Vite 5.0
- **路由**: Vue Router 4.2
- **状态管理**: Pinia 2.1
- **UI框架**: Tailwind CSS 3.3
- **图标**: Lucide Vue Next 0.544
- **Markdown**: Marked 16.3

## 项目结构

```
src/
├── components/                    # Vue 组件层
│   ├── layout/                   # 布局组件
│   │   ├── DesktopLayout.vue     # 桌面端布局容器
│   │   ├── MobileLayout.vue      # 移动端布局容器
│   │   ├── DesktopSidebar.vue    # 侧边栏导航（可折叠）
│   │   └── MobileBottomNav.vue   # 底部导航栏
│   │
│   ├── modules/                  # 功能模块页面
│   │   ├── GenerateModule.vue    # 生成模块（主要功能）✅
│   │   ├── OptimizeModule.vue    # 优化模块 🚧
│   │   ├── PlaygroundModule.vue  # 操练场模块 🚧
│   │   └── LibraryModule.vue     # 我的提示词模块 🚧
│   │
│   ├── chat/                     # 对话模块
│   │   ├── composables/          # 对话业务逻辑
│   │   │   ├── useChatLogic.ts           # 对话核心逻辑
│   │   │   ├── useChatMessages.ts        # 消息管理
│   │   │   ├── useChatInput.ts           # 输入处理
│   │   │   ├── useChatAttachments.ts     # 附件管理
│   │   │   ├── useChatModel.ts           # 模型选择
│   │   │   ├── useChatQuickReplies.ts    # 快捷回复
│   │   │   └── useChatMessageOperations.ts  # 消息操作
│   │   └── components/           # 对话UI组件
│   │       ├── ChatHeader.vue
│   │       ├── ChatMessageList.vue
│   │       ├── ChatMessage.vue
│   │       ├── ChatInputArea.vue
│   │       ├── ChatModelSelector.vue
│   │       └── ChatQuickReplies.vue
│   │
│   ├── preview/                  # 预览模块
│   │   ├── composables/          # 预览业务逻辑
│   │   │   ├── usePreviewTabs.ts         # Tab切换
│   │   │   ├── usePreviewExecution.ts    # 生成执行
│   │   │   ├── usePreviewClipboard.ts    # 复制功能
│   │   │   ├── usePreviewListOperations.ts  # 列表操作
│   │   │   └── usePreviewHelpers.ts      # 辅助函数
│   │   └── components/           # 预览UI组件
│   │       ├── common/           # 通用组件
│   │       │   ├── PreviewHeader.vue
│   │       │   ├── TabContainer.vue
│   │       │   ├── TabButton.vue
│   │       │   ├── EmptyState.vue
│   │       │   └── LoadingState.vue
│   │       ├── tabs/             # Tab内容组件
│   │       │   ├── ReportTab.vue         # 需求报告
│   │       │   ├── ThinkingTab.vue       # 关键指令
│   │       │   ├── InitialTab.vue        # 初始提示词
│   │       │   ├── AdviceTab.vue         # 优化建议
│   │       │   └── FinalTab.vue          # 最终提示词
│   │       └── dialogs/
│   │           └── SavePromptDialog.vue  # 保存对话框
│   │
│   ├── settings/                 # 设置模块
│   │   ├── composables/          # 设置业务逻辑
│   │   │   ├── useProviderManagement.ts  # 提供商管理
│   │   │   ├── useModelManagement.ts     # 模型管理
│   │   │   ├── useModelTesting.ts        # 模型测试
│   │   │   └── usePromptRules.ts         # 提示词规则
│   │   └── components/           # 设置UI组件
│   │       ├── SettingsHeader.vue
│   │       ├── SettingsButton.vue
│   │       ├── tabs/
│   │       │   ├── ProvidersTab.vue      # 提供商配置
│   │       │   └── PromptsTab.vue        # 提示词规则
│   │       └── dialogs/
│   │           ├── ProviderDialog.vue
│   │           ├── ProviderTypeDialog.vue
│   │           └── ModelDialog.vue
│   │
│   └── modules/library/          # 提示词库模块
│       └── components/
│           ├── PromptList.vue            # 提示词列表
│           ├── PromptDetailModal.vue     # 详情弹窗
│           ├── VersionHistoryPanel.vue   # 版本历史面板
│           ├── VersionHistoryContent.vue # 版本历史内容
│           └── VersionDetailModal.vue    # 版本详情弹窗
│
├── stores/                       # Pinia 状态管理
│   ├── authStore.ts              # 认证状态（登录、用户信息）
│   ├── promptStore.ts            # 提示词生成状态
│   ├── settingsStore.ts          # AI配置和应用设置
│   ├── navigationStore.ts        # 导航状态管理
│   ├── notificationStore.ts      # 通知状态
│   └── optimizeStore.ts          # 优化模块状态
│
├── services/                     # 业务服务层
│   ├── aiService.ts              # AI服务统一入口
│   ├── apiService.ts             # 后端API调用封装
│   ├── aiGuideService.ts         # AI引导式需求收集
│   ├── promptGeneratorService.ts # GPrompt四步生成
│   ├── promptOptimizationService.ts  # 提示词优化服务
│   ├── versionService.ts         # 版本管理服务
│   ├── capabilityDetector.ts     # 模型能力检测
│   │
│   └── ai/                       # AI服务模块化实现
│       ├── providers/            # AI提供商实现
│       │   ├── BaseProvider.ts         # 提供商基类
│       │   ├── OpenAIProvider.ts       # OpenAI实现
│       │   ├── AnthropicProvider.ts    # Claude实现
│       │   ├── GoogleProvider.ts       # Gemini实现
│       │   └── index.ts
│       │
│       ├── streaming/            # 流式处理
│       │   ├── SSEParser.ts            # SSE解析器
│       │   ├── StreamProcessor.ts      # 流处理器
│       │   ├── StreamFilter.ts         # 流过滤器
│       │   └── index.ts
│       │
│       ├── multimodal/           # 多模态转换
│       │   ├── AttachmentConverter.ts        # 附件转换器
│       │   ├── OpenAIAttachmentHandler.ts    # OpenAI格式
│       │   ├── AnthropicAttachmentHandler.ts # Claude格式
│       │   ├── GoogleAttachmentHandler.ts    # Gemini格式
│       │   └── index.ts
│       │
│       ├── errors/               # 错误处理
│       │   ├── ErrorParser.ts          # 错误解析
│       │   ├── AIErrorHandler.ts       # 错误处理器
│       │   └── index.ts
│       │
│       ├── utils/                # 工具函数
│       │   ├── ModelFetcher.ts         # 模型列表获取
│       │   ├── ResponseCleaner.ts      # 响应清理
│       │   ├── apiUrlBuilder.ts        # URL构建
│       │   └── responseCleaners.ts     # 响应清理规则
│       │
│       └── types.ts              # 类型定义
│
├── config/                       # 配置文件
│   ├── prompts.ts                # 提示词配置管理
│   ├── builtinProviders.ts       # 内置提供商配置
│   ├── promptGenerator.ts        # 生成器配置
│   │
│   └── prompts/                  # 内置提示词规则
│       ├── index.ts                          # 导出入口
│       ├── promptOptimization.ts             # 提示词优化
│       ├── requirementReportRules.ts         # 需求报告生成
│       ├── thinkingPointsExtraction.ts       # 关键指令提取
│       ├── finalPromptGenerationRules.ts     # 最终提示词生成
│       ├── optimizationAdvice.ts             # 优化建议
│       ├── systemPromptGeneration.ts         # 系统提示词生成
│       ├── userPromptOptimization.ts         # 用户提示词优化
│       ├── userPromptQualityAnalysis.ts      # 质量分析
│       └── ...
│
├── utils/                        # 通用工具函数
│   ├── aiResponseUtils.ts        # AI响应处理
│   ├── fileUtils.ts              # 文件处理
│   └── jsonParser.ts             # JSON解析
│
└── views/                        # 页面视图（已弃用）
    └── HomeView.vue              # 使用 modules 替代
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 核心功能模块

### 1. 生成模块 (GenerateModule.vue)

**完整的提示词生成功能** ✅

#### AI 引导式需求收集
- 智能对话深入挖掘用户需求
- 自动分析对话历史提取关键信息
- 生成结构化需求描述报告
- 支持多模态输入（图片、文档、音频、视频）

#### GPrompt 四步生成流程
1. **需求报告** - 从对话历史生成结构化需求
2. **关键指令** - 提取核心思考点
3. **初始提示词** - 基于关键指令生成初版
4. **优化建议** - 分析并提供改进方向
5. **最终提示词** - 应用优化生成最终版本

#### 执行模式
- **自动模式**: 一键完成全流程
- **手动模式**: 逐步执行每个阶段，可查看中间结果

**关键文件**:
- `components/modules/GenerateModule.vue`
- `components/ChatInterface.vue`
- `components/PreviewPanel.vue`
- `services/aiGuideService.ts`
- `services/promptGeneratorService.ts`

### 2. 优化模块 (OptimizeModule.vue) ✅

**提示词质量分析与优化**

**功能**:
- ✅ 系统提示词优化（专业的AI指令优化）
- ✅ 用户提示词优化（快速问答优化）
- ✅ 质量评分与分析
- ✅ 实时预览与对比
- ✅ 保存到个人提示词库
- ✅ 版本控制与回滚

**关键文件**:
- `components/modules/OptimizeModule.vue`
- `components/modules/optimize/` - 优化相关组件
- `services/promptOptimizationService.ts`
- `stores/optimizeStore.ts`

### 3. 操练场模块 (PlaygroundModule.vue) 🚧

**提示词实时测试与调试**

**规划功能**:
- 实时测试提示词效果
- 参数调节（temperature, top_p等）
- 性能监控和统计
- 多模型对比测试

### 4. 我的提示词模块 (LibraryModule.vue) ✅

**个人提示词库管理**

**功能**:
- ✅ 提示词列表展示（分页、筛选）
- ✅ 标签分类管理
- ✅ 收藏功能
- ✅ 详情弹窗查看
- ✅ 版本历史查看
- ✅ 版本回滚
- ✅ 直接跳转到优化模块
- 🚧 导入/导出（规划中）

**关键文件**:
- `components/modules/LibraryModule.vue`
- `components/modules/library/` - 库相关组件
- `services/apiService.ts` - API调用
- `services/versionService.ts` - 版本管理

## 状态管理 (Pinia Stores)

### authStore.ts - 认证状态

**状态**:
```typescript
token: string | null           // JWT Token
user: User | null              // 用户信息
isLoading: boolean             // 加载状态
isLoggedIn: computed           // 是否已登录
```

**方法**:
```typescript
loginWithCode(code: string)    // 飞书code登录
refreshToken()                 // 刷新Token
fetchUserInfo()                // 获取用户信息
logout()                       // 登出
initialize()                   // 初始化认证状态
```

### promptStore.ts - 提示词生成状态

**状态**:
```typescript
promptData: {
  requirementReport: string    // 需求报告
  thinkingPoints: string[]     // 关键指令
  initialPrompt: string        // 初始提示词
  advice: string[]             // 优化建议
  finalPrompt: string          // 最终提示词
}
conversationHistory: Message[] // 对话历史
isGenerating: boolean          // 是否生成中
currentStep: string            // 当前步骤
```

### settingsStore.ts - 设置状态

**状态**:
```typescript
providers: Provider[]          // AI提供商列表
selectedProviderId: string     // 当前选中提供商
selectedModelId: string        // 当前选中模型
promptRules: PromptRules       // 提示词生成规则
```

### navigationStore.ts - 导航状态

**状态**:
```typescript
currentModule: string          // 当前模块
isSidebarCollapsed: boolean    // 侧边栏是否折叠
isMobile: boolean              // 是否移动端
modules: Module[]              // 模块配置
```

## AI 服务层架构

### 提供商抽象 (Provider Pattern)

所有AI提供商继承 `BaseProvider`:

```typescript
abstract class BaseProvider {
  abstract chat(messages, options): AsyncIterable<string>
  abstract chatWithStructuredOutput(messages, schema): Promise<any>
  abstract getAvailableModels(): Promise<Model[]>
  abstract supportsStreaming(): boolean
  abstract supportsVision(): boolean
  abstract supportsStructuredOutput(): boolean
}
```

**支持的提供商**:
- `OpenAIProvider` - GPT-3.5/GPT-4系列
- `AnthropicProvider` - Claude系列
- `GoogleProvider` - Gemini系列

### 流式处理

**SSEParser** - 解析Server-Sent Events:
```typescript
parseSSEChunk(chunk: string): SSEEvent[]
extractContent(event: SSEEvent, provider: string): string | null
```

**StreamProcessor** - 处理流式输出:
```typescript
async *processStream(
  response: Response, 
  provider: string
): AsyncIterable<string>
```

### 多模态支持

**AttachmentConverter** - 统一附件格式:
```typescript
convertAttachment(file: File, provider: string): Promise<Attachment>
```

**支持的文件类型**:
- 图片: jpg, jpeg, png, gif, webp
- 文档: pdf, doc, docx, txt, md
- 音频: mp3, wav, ogg
- 视频: mp4, avi, mov

## 后端API集成

### API服务 (apiService.ts)

**认证相关**: (通过 authStore 调用)
```typescript
POST /api/auth/login           // 登录
POST /api/auth/refresh         // 刷新Token
GET  /api/auth/userinfo        // 获取用户信息
POST /api/auth/logout          // 登出
```

**提示词相关**:
```typescript
savePrompt(data)               // POST /api/prompts
getPrompts(params)             // GET /api/prompts
getPrompt(id)                  // GET /api/prompts/{id}
updatePrompt(id, data)         // PUT /api/prompts/{id}
deletePrompt(id)               // DELETE /api/prompts/{id}
toggleFavorite(id, is_favorite) // POST /api/prompts/{id}/favorite
recordPromptUse(id)            // POST /api/prompts/{id}/use
```

**标签相关**:
```typescript
getTags()                      // GET /api/tags
getPopularTags(limit)          // GET /api/tags/popular
createTag(tag_name)            // POST /api/tags
deleteTag(id)                  // DELETE /api/tags/{id}
```

**版本相关**: (通过 versionService.ts)
```typescript
createVersion(promptId, data)  // POST /api/versions/{prompt_id}
getVersions(promptId)          // GET /api/versions/{prompt_id}
rollbackVersion(promptId, version) // POST /api/versions/{prompt_id}/{version}/rollback
compareVersions(promptId, v1, v2)  // GET /api/versions/{prompt_id}/compare
```

## 响应式布局系统

### 布局切换 (1024px断点)

**桌面端** (≥1024px):
- 左侧侧边栏导航（200px展开 / 60px折叠）
- 主内容区域自适应
- Hover展开菜单项

**移动端** (<1024px):
- 底部固定导航栏（4个主要模块）
- 全屏内容区域
- 手势友好的交互

**实现**:
```typescript
// navigationStore.ts
const updateLayoutMode = () => {
  isMobile.value = window.innerWidth < 1024
}

window.addEventListener('resize', updateLayoutMode)
```

## 开发规范

### 组件结构

```
功能模块/
├── composables/           # 业务逻辑（Composition API）
│   ├── useFeatureA.ts    # 单一职责
│   └── useFeatureB.ts
└── components/            # UI组件
    ├── FeatureA.vue      # 展示组件
    └── FeatureB.vue
```

### 命名规范

- **组件**: PascalCase (`ChatInterface.vue`)
- **Composables**: `use` + PascalCase (`useChatMessages.ts`)
- **Store**: camelCase + `Store` (`promptStore.ts`)
- **Service**: camelCase + `Service` (`aiService.ts`)
- **类型**: PascalCase (`interface User {}`)

### 代码组织原则

1. **关注点分离**: 逻辑与视图分离
2. **单一职责**: 每个composable只负责一个功能
3. **可复用性**: 通用逻辑抽取为独立模块
4. **类型安全**: 充分利用TypeScript

### Composable示例

```typescript
// useChatMessages.ts
export function useChatMessages() {
  const messages = ref<Message[]>([])
  
  const addMessage = (message: Message) => {
    messages.value.push(message)
  }
  
  const clearMessages = () => {
    messages.value = []
  }
  
  return {
    messages: readonly(messages),
    addMessage,
    clearMessages
  }
}
```

## 常见开发任务

### 1. 添加新的功能模块

```bash
# 1. 创建模块组件
touch src/components/modules/NewModule.vue

# 2. 在 navigationStore.ts 添加模块配置
const modules = [
  // ...existing modules
  {
    id: 'new',
    name: '新模块',
    path: '/new',
    icon: 'NewIcon',
    order: 5
  }
]

# 3. 在 main.ts 添加路由
{
  path: '/new',
  name: 'new',
  component: () => import('./components/modules/NewModule.vue')
}
```

### 2. 添加新的AI提供商

```typescript
// 1. 创建 Provider 类
// src/services/ai/providers/NewProvider.ts
export class NewProvider extends BaseProvider {
  async chat(messages, options) {
    // 实现chat方法
  }
  
  async getAvailableModels() {
    // 实现获取模型列表
  }
  
  supportsStreaming() { return true }
  supportsVision() { return false }
}

// 2. 在 providers/index.ts 导出
export { NewProvider } from './NewProvider'

// 3. 在 aiService.ts 注册
const providerMap = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  google: GoogleProvider,
  new: NewProvider  // 添加这行
}
```

### 3. 修改提示词生成规则

```typescript
// 方法1: 直接修改配置文件
// src/config/prompts/promptOptimization.ts
export const promptOptimizationRules = `
你的新规则...
`

// 方法2: 在设置界面修改（保存到 settingsStore）
// 设置 > 提示词规则 Tab
```

### 4. 添加新的Tab到预览面板

```vue
<!-- 1. 创建Tab组件 -->
<!-- src/components/preview/components/tabs/NewTab.vue -->
<template>
  <div class="new-tab">
    {{ content }}
  </div>
</template>

<!-- 2. 在 PreviewPanel.vue 添加 -->
<template>
  <TabContainer>
    <TabButton @click="activeTab = 'new'">新Tab</TabButton>
    <!-- ... -->
  </TabContainer>
  
  <NewTab v-if="activeTab === 'new'" :content="data.newContent" />
</template>

<!-- 3. 在 promptStore.ts 添加字段 -->
interface PromptData {
  // ...existing fields
  newContent: string
}
```

### 5. 调试流式输出

```typescript
// 在 StreamProcessor.ts 添加日志
async *processStream(response, provider) {
  for await (const chunk of parseSSEChunk(chunk)) {
    console.log('[Stream Debug]', chunk) // 添加调试日志
    const content = extractContent(chunk, provider)
    if (content) yield content
  }
}
```

## 环境配置

### 内置提供商配置

复制 `builtin-providers.example.json` 为 `builtin-providers.json`:

```json
{
  "providers": [
    {
      "id": "openai-builtin",
      "name": "OpenAI (内置)",
      "type": "openai",
      "apiKey": "sk-...",
      "baseURL": "https://api.openai.com/v1",
      "models": [
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "contextWindow": 8192,
          "supportsVision": true
        }
      ]
    },
    {
      "id": "anthropic-builtin",
      "name": "Claude (内置)",
      "type": "anthropic",
      "apiKey": "sk-ant-...",
      "baseURL": "https://api.anthropic.com",
      "models": [
        {
          "id": "claude-3-opus-20240229",
          "name": "Claude 3 Opus",
          "contextWindow": 200000,
          "supportsVision": true
        }
      ]
    }
  ]
}
```

### 环境变量

创建 `.env.local`:

```bash
# 后端API地址
VITE_API_BASE_URL=http://localhost:8888

# 飞书OAuth配置（可选，用于本地测试）
VITE_FEISHU_APP_ID=your_app_id
```

## 计划改造 - 认证迁移

### 当前实现: 飞书 OAuth

**文件**: `src/stores/authStore.ts`

**流程**:
1. 获取飞书授权码 (code)
2. 调用后端 `/api/auth/login`
3. 后端验证飞书code并返回JWT
4. 前端保存token和用户信息

### 目标: linux.do OAuth

**需要修改的部分**:

1. **authStore.ts** - OAuth回调处理
```typescript
// 当前
const loginWithCode = async (code: string) => {
  // 调用后端 /api/auth/login
}

// 改造后
const loginWithLinuxDo = async (code: string) => {
  // 调用后端 /api/auth/linux-do/login
}
```

2. **登录页面** - 替换登录按钮
```vue
<!-- 当前 -->
<button @click="loginWithFeishu">飞书登录</button>

<!-- 改造后 -->
<button @click="loginWithLinuxDo">Linux.do 登录</button>
```

3. **用户信息字段适配**
```typescript
// 根据linux.do返回的用户信息调整User接口
interface User {
  id: number
  linux_do_id: string  // 替代 open_id
  name: string
  avatar: string
  email?: string
  // 移除飞书特有字段
}
```

**注意**: 主要改造在后端，前端只需调整API调用和用户信息字段。

## 性能优化建议

1. **代码分割**:
   - 路由懒加载 ✅
   - 组件异步加载（大型组件）
   
2. **状态管理**:
   - 避免不必要的响应式数据
   - 使用 `shallowRef` 处理大对象
   
3. **渲染优化**:
   - 虚拟滚动（长列表）
   - `v-memo` 缓存重复渲染
   
4. **打包优化**:
   - Tree-shaking
   - Gzip压缩
   - 图片懒加载

## 调试技巧

### Vue DevTools

浏览器安装 Vue DevTools 扩展，可以:
- 查看组件树和props
- 检查Pinia store状态
- 追踪事件
- 性能分析

### 类型检查

```bash
# 运行类型检查
npm run type-check

# 监听模式
npm run type-check -- --watch
```

### 网络调试

```typescript
// 在 aiService.ts 启用调试
const DEBUG = true

if (DEBUG) {
  console.log('[AI Request]', messages)
  console.log('[AI Response]', response)
}
```

## 项目特色

1. **模块化架构** - composables + components 分离
2. **响应式设计** - 桌面端和移动端无缝切换
3. **多AI支持** - 抽象Provider，易于扩展
4. **流式输出** - 实时显示AI生成过程
5. **多模态** - 支持图片、文档、音视频输入
6. **类型安全** - 完整的TypeScript支持

## 开发建议

1. **优先使用Composition API** - 逻辑复用更灵活
2. **保持组件职责单一** - 便于维护和测试
3. **善用TypeScript** - 减少运行时错误
4. **遵循命名规范** - 提高代码可读性
5. **编写可复用的composables** - 避免重复代码

## 常见问题

### Q: 如何添加新的对话快捷回复?

A: 修改 `useChatQuickReplies.ts`:
```typescript
const quickReplies = ref([
  // 添加新的快捷回复
  { id: '4', text: '你的新问题', category: 'custom' }
])
```

### Q: 如何自定义Tab样式?

A: 修改 `TabButton.vue` 的Tailwind类:
```vue
<button class="your-custom-classes">
  <!-- ... -->
</button>
```

### Q: 流式输出不工作?

A: 检查:
1. Provider是否支持流式 (`supportsStreaming()`)
2. API endpoint是否返回SSE格式
3. 浏览器控制台Network tab查看响应

## 相关文档

- **根目录文档**: `/CLAUDE.md` - 前后端统一文档
- **后端文档**: `/backend/CLAUDE.md` - 后端详细文档
- **Vue 3文档**: https://vuejs.org
- **Pinia文档**: https://pinia.vuejs.org
- **Tailwind CSS**: https://tailwindcss.com

## 联系方式

如需帮助或反馈问题，请联系项目维护者。
