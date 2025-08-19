# 开发经验记录

记录开发过程中的重要经验和最佳实践。

## 🔧 构建与依赖管理 (Monorepo & Vite)

**经验**: 在 pnpm workspace (monorepo) 中，当一个包（如`@core`）需要同时服务于前端（Vite构建的`@ui`包）和后端（Node.js/Electron）时，处理导出和依赖关系需要特别小心，以避免构建冲突。

**场景**:
- 一个`@core`包，其中一部分代码（如tRPC路由）仅用于后端，另一部分是通用代码。
- 一个`@ui`包（使用Vite构建），依赖`@core`包。
- 一个`@desktop`包（使用Electron），也依赖`@core`包，并需要使用其仅后端的代码。

**问题**:
1. 如果`@core`包在其主入口 (`index.ts`) 导出了仅后端的代码，会导致前端应用打包进不必要的服务器依赖（如`@trpc/server`）。
2. 如果为了解决问题1，使用`package.json`的`exports`映射为后端代码创建单独入口，可能会破坏Vite的依赖解析机制，导致`@ui`包构建失败。
3. 如果在`@ui`的Vite配置中将`@core`包设为`external`，会增加最终应用的配置复杂性，使其无法"开箱即用"。

**最佳实践 / 解决方案**:
1.  **组件库自包含 (Batteries Included)**: 在 `@ui` 包的 `vite.config.ts` 中，**移除**内部依赖（如 `@core`）的 `external` 配置。让UI库成为一个完整的、内置所有必要依赖的自包含产品。
2.  **核心包多入口构建**: 在 `@core` 包中，使用 `tsup` 等工具配置**多入口点**构建。一个入口是提供给前端和大部分后端的公共API (`index.ts`)，另一个是仅用于特定后端的专门文件（如 `router.ts`）。
3.  **分离导出与实现 (公共API vs 内部路径)**:
    - **不要**在 `package.json` 中为仅后端的代码创建复杂的 `exports` 映射。保持主 `exports` 干净、简单，只指向公共API。
    - 在需要使用仅后端代码的地方（如 `desktop/main.js`），直接通过**相对文件路径**从 `dist` 目录中 `require` 编译后的文件。

**代码示例**:
- `packages/core/package.json` (scripts):
  `"build": "tsup src/index.ts src/services/trpc/router.ts --format cjs,esm --dts"`
- `packages/desktop/main.js` (import):
  `const { createAppRouter } = require('@prompt-optimizer/core/dist/services/trpc/router.cjs');`

**结论**: 这种"公共API + 内部路径"的策略，优雅地解决了前后端对同一个包的不同需求，保证了Vite构建的顺利进行，也维持了后端功能的可用性。

**核心原则**: 必须同时满足现代前端构建工具（如Vite）和后端环境（Node.js）的模块解析规则。核心是遵守Node.js的`exports`封装性，并以此为基础解决Vite的兼容问题。

**遇到的问题演进**:
1.  **前端加载后端代码**: `@core`包的`index.ts`导出了仅服务器端的代码，导致浏览器报错。
2.  **Vite构建失败**: 为解决问题1，尝试使用`exports`为后端代码创建单独入口，但这种多入口配置导致Vite无法解析依赖。
3.  **Node.js路径未导出 (ERR_PACKAGE_PATH_NOT_EXPORTED)**: 为解决问题2，尝试让后端直接引用内部文件路径，但这违反了Node.js的模块封装规则，因为`exports`字段存在时，所有访问必须经过它的允许。

**最终的最佳实践 (The Standard Way)**:
1.  **组件库自包含 (Batteries Included)**:
    - 在 `@ui` 包的 `vite.config.ts` 中，**移除**内部依赖（如 `@core`）的 `external` 配置。让UI库成为一个完整的、内置所有必要依赖的自包含产品。这是解决问题的起点。
2.  **在核心包中明确声明所有导出**:
    - 在 `@core` 包的 `package.json` 中，使用 `exports` 字段**明确声明所有**需要被外部访问的路径，无论是给前端还是后端使用。
    - 使用 `tsup` 等工具进行多入口点构建，确保 `exports` 中声明的每个路径都有对应的编译产物。
3.  **所有消费者都使用标准路径**:
    - 无论是前端还是后端，都应该通过 `exports` 中声明的标准路径来导入模块 (e.g., `'@prompt-optimizer/core'` 或 `'@prompt-optimizer/core/trpc-router'`)。
    - **禁止**任何包从另一个包的内部文件路径（如 `dist/...`）进行导入。

**代码示例 (最终正确配置)**:
- `packages/core/package.json`:
  ```json
  "exports": {
    ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./trpc-router": { "import": "./dist/services/trpc/router.js", "require": "./dist/services/trpc/router.cjs" }
  },
  "scripts": {
    "build": "tsup src/index.ts src/services/trpc/router.ts --format cjs,esm --dts"
  }
  ```
- `packages/desktop/main.js`:
  `const { createAppRouter } = require('@prompt-optimizer/core/trpc-router');`

**结论**: 这个标准化的解决方案保证了 `@core` 包的强封装性，同时为不同环境的消费者提供了清晰、稳定、唯一的访问接口。如果在此基础上Vite仍然构建失败，那么下一步应该去调整Vite自身的配置（如 `resolve.alias` 或 `optimizeDeps.exclude`），而不是破坏包的封装规则。

## 🔧 技术经验

### 架构设计
- [经验描述] - [适用场景] - [记录日期]

### 错误处理
- [错误类型] - [解决方案] - [预防措施] - [记录日期]

### 性能优化
- [优化点] - [优化方法] - [效果] - [记录日期]

### 测试实践
- [测试类型] - [最佳实践] - [工具推荐] - [记录日期]

## 🛠️ 工具配置

### 开发工具
- [工具名称] - [配置要点] - [使用技巧] - [记录日期]

### 调试技巧
- [问题类型] - [调试方法] - [工具使用] - [记录日期]

## 📚 学习资源

### 有用文档
- [文档标题] - [链接] - [要点总结] - [记录日期]

### 代码示例
- [功能描述] - [代码片段或文件位置] - [使用场景] - [记录日期]

## 🚫 避坑指南

### 常见错误
- [错误描述] - [原因分析] - [避免方法] - [记录日期]

### 设计陷阱
- [设计问题] - [问题后果] - [正确做法] - [记录日期]

## 🔄 流程改进

### 工作流优化
- **经验**: 在Monorepo中设计开发命令时，要避免并行进程操作同一目录导致的"赛跑条件"。
- **场景**: 使用`concurrently`并行执行多个任务，其中一个任务是Vite开发服务器(`vite dev`)，另一个是其依赖库的监视构建任务(`vite build --watch`)。
- **问题**: `vite dev`在启动时需要读取依赖库（如`@ui`）的构建产物（如`dist/style.css`），而`vite build --watch`在同一时间可能正在清理或重写该`dist`目录，导致文件读取失败，引发样式丢失等问题。
- **最佳实践**:
    1.  **信任Vite开发服务器**：在开发环境下，应该最大限度地利用Vite开发服务器的内置能力。它能够直接处理对工作区内其他包（workspace-local packages）的依赖，并从它们的**源文件**（`src`）进行实时编译和热更新。
    2.  **避免预构建和监视**：因此，在启动主应用的开发服务器时，**不应该**同时运行其依赖库的`build --watch`任务。
    3.  **简化并行命令**: 开发命令应只包含主应用的开发服务器（如`vite dev`）和其他必要的后端服务（如`electron .`）。让单个Vite实例全权负责所有前端代码的编译。
- **示例 (package.json)**:
  - **错误示范**: `concurrently "pnpm -F @ui watch" "pnpm -F @web dev"`
  - **正确示范**: `concurrently "pnpm -F @web dev" "pnpm -F @desktop dev"` (假设web负责所有UI，desktop是后端)
- **记录日期**: 2024-07-28

### 文档管理
- [管理经验] - [工具使用] - [效率提升] - [记录日期]

---

## 📝 使用说明

1. **及时记录** - 遇到重要经验立即记录
2. **分类整理** - 按照上述分类组织内容
3. **定期回顾** - 每周回顾一次，提取可复用经验
4. **归档整理** - 任务完成时将相关经验归档到archives
