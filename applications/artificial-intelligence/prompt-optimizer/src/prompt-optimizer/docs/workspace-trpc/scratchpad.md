# 开发草稿本

记录当前开发任务的进展和思考。

---
## 新增任务：修复 Monorepo 构建与依赖解析问题 - [2024-07-28]
**目标**: 解决因 tRPC 重构引入的 `@trpc/server` 在浏览器环境加载，以及后续引发的一系列 Vite 构建失败和依赖解析问题。
**状态**: 已完成 ✅

#### 解决步骤
[x] 1. **分析浏览器端tRPC服务器错误**：确认了错误是由于 `@prompt-optimizer/core` 的主入口导出了仅服务器端的 `createAppRouter` 函数导致。
[x] 2. **分离客户端与服务器端代码**：从 `core` 包的 `index.ts` 中移除了 `createAppRouter` 的导出，初步解决了前端打包问题，但破坏了Electron后端的导入。
[x] 3. **解决Vite构建失败问题**：尝试使用 `package.json` 的 `exports` 映射来修复后端导入，但这与Vite的构建逻辑冲突，导致 `ui` 包构建失败。最终方案是：
    - **`ui` 包**：从 `vite.config.ts` 的 `externals` 中移除 `@prompt-optimizer/core`，使其成为一个自包含的、内置依赖的库。
    - **`core` 包**：使用 `tsup` 多入口构建，同时编译公共API (`index.ts`)和服务器路由(`router.ts`)，但不为后者创建 `exports` 映射。
    - **`desktop` 包**：修改 `main.js`，通过直接的文件路径 (`require('@prompt-optimizer/core/dist/services/trpc/router.cjs')`) 来导入服务器路由，绕过 `exports` 映射。
[x] 4. **修复Node.js模块导出错误 (ERR_PACKAGE_PATH_NOT_EXPORTED)**：发现上一步的直接路径导入违反了Node.js的模块封装规则。最终的、正确的做法是：
    - 在 `core` 包的 `package.json` 中，使用 `exports` 字段明确导出 `./trpc-router` 路径。
    - 在 `desktop` 包的 `main.js` 中，使用标准路径 `require('@prompt-optimizer/core/trpc-router')` 进行导入。
[x] 5. **验证修复**：重新构建 `core` 包，确保 Node.js 环境（Electron）可以正常启动，同时验证 Vite 构建（如果失败则下一步处理）

#### 完成总结
- **实现了什么**: 彻底解决了在浏览器环境中加载服务器代码的问题，并梳理了 monorepo 仓库中，一个包同时服务于前端（Vite）和后端（Node.js）时的最佳构建与导出策略。
- **遇到的核心问题**:
    1. 前后端代码耦合导致服务器模块被打包进前端。
    2. `package.json` 的 `exports` 映射在 Vite 和 Node.js 环境下的行为差异导致构建冲突。
    3. `external` 配置导致库本身不完整，增加了使用者的配置负担。
    4. **Node.js 模块封装规则**: 只要 `package.json` 中存在 `exports` 字段，就禁止通过文件路径直接访问未在 `exports` 中声明的任何内部模块。
- **解决方案**: 采用"**标准导出，按需消费**"的策略。
    1. **对内对外，一视同仁**: 所有需要被包外部访问的路径（无论是前端用还是后端用），都必须在 `package.json` 的 `exports` 字段中明确声明。
    2. **组件库自包含**: Vite 构建的UI库应该将内部依赖打包，移除 `external` 配置，使其成为一个独立完整的单元。
    3. **消费者使用标准路径**: 所有消费者（无论是Vite还是Node.js）都应该通过 `exports` 中声明的标准路径来导入模块，而不是依赖内部文件结构。
---
## 新增任务：修复开发命令导致样式丢失的问题 - [2024-07-28]
**目标**: 解决 `pnpm run dev:desktop` 命令导致 web 程序样式丢失的问题。
**状态**: 已完成 ✅

#### 问题分析
- **现象**: 执行 `dev:desktop` 命令后，桌面应用中的网页内容没有CSS样式。但执行 `dev:fresh` 则是正常的。
- **根源**: 这是一个典型的"赛跑条件" (Race Condition)。`dev:desktop` 命令会**并行**启动两个进程：
    1. `watch:ui` (`vite build --watch`)：负责监视和重新构建UI库，会操作`packages/ui/dist`目录。
    2. `dev:web` (`vite dev`)：启动Vite开发服务器，它需要从`packages/ui/dist`目录中读取`style.css`。
- **冲突点**: 在 `dev:web` 尝试读取 `style.css` 的一瞬间，`watch:ui` 可能正在清理或重建 `dist` 目录，导致文件暂时不存在，从而加载失败。`dev:fresh` 的成功是偶然的，因为它包含了 `pnpm install` 等额外步骤，改变了两个进程的启动时机，恰好避开了冲突。

#### 解决方案
- **核心思想**: 在开发环境中，应该完全信赖 Vite 开发服务器处理依赖的能力，而不是预先构建依赖库。
- **具体操作**:
    1. 在 `package.json` 中创建一个新的、专门为桌面开发优化的并行命令 `dev:desktop:parallel:fixed`。
    2. 在这个新命令中，移除了导致问题的 `watch:ui` 任务。
    3. 只保留并行的 `dev:web` 和 `pnpm -F @prompt-optimizer/desktop dev`。
    4. 修改 `dev:desktop` 命令，使其调用这个新的、修复过的并行命令。
- **结果**: 由 `dev:web` 这一个 Vite 实例全权负责处理所有前端依赖（包括 `@prompt-optimizer/ui` 的源文件）的实时编译和供应，彻底杜绝了"赛跑条件"。

---

## 当前任务

### Electron流式API tRPC重构 - [2024-07-27]
**目标**: 使用 `electron-trpc` 重构 `PromptService` 的流式方法（`optimizePromptStream`, `iteratePromptStream`, `testPromptStream`），实现主进程与渲染器进程之间端到端的类型安全流式通信，彻底解决当前功能缺失的问题。
**状态**: 进行中

#### 计划步骤
[x] 1. **环境搭建与依赖安装**
    - [x] 在 `packages/desktop` 中安装 `electron-trpc`。
    - [x] 在 `packages/core` 中安装 `@trpc/server`。
    - [x] 在 `packages/ui` 中安装 `@trpc/client`。
    - [x] 验证 `pnpm install` 是否能成功执行，确保依赖关系正确。
    - 预期结果：所有依赖项被正确添加到各自的`package.json`文件中，项目可以正常编译。
    - 风险评估：低。主要是版本兼容性问题。

[x] 2. **tRPC后端（主进程）实现**
    - [x] 在 `packages/core/src/services` 创建 `trpc/` 目录。
    - [x] 在 `trpc/` 中创建 `router.ts` 定义tRPC的根路由器（`appRouter`），并包含一个 `prompt` 路由器。
    - [x] 在 `prompt` 路由器中，使用 `subscription` 来实现 `optimizePromptStream`。
    - [x] `subscription` 内部逻辑将调用真实的 `PromptService` 实例，并将 `onToken` 等回调的数据通过 `observer.next()` 发送出去。
    - [x] 在 `packages/desktop/main.js` 中，创建tRPC的IPC link，并将 `appRouter` 附加到上面。
    - 预期结果：主进程能够处理来自渲染器的tRPC请求和订阅。
    - 风险评估：中。需要正确处理`Observable`和回调的转换，确保流的生命周期（开始、数据、结束、错误）被正确管理。

[x] 3. **tRPC前端（渲染器进程）实现**
    - [x] 在 `packages/desktop/preload.js` 中，使用 `exposeIPCHandler` 将tRPC的处理器暴露给渲染器。
    - [x] 在 `packages/ui/src/composables/useAppInitializer.ts` 中，修改 `initElectronServices`，创建tRPC客户端实例，并用它来构建新的 `PromptService` 代理。
    - [x] 新的 `TRPCPromptServiceProxy` 使用tRPC客户端来调用后端方法。`optimizePromptStream` 将调用 `client.prompt.optimizePromptStream.subscribe(...)`。
    - 预期结果：渲染器能够通过类型安全的客户端与主进程通信，代码更简洁。
    - 风险评估：中。需要正确配置客户端的 `links`，并确保 `useAppInitializer` 中的服务替换逻辑无误。

[x] 4. **代码重构与清理**
    - [x] 移除旧的 `ElectronPromptServiceProxy` 中基于 `console.warn` 的实现，替换为tRPC调用。
    - [x] 验证 `usePromptOptimizer.ts` 无需任何修改即可与新的代理正常工作。
    - [ ] 同样的方式重构 `iteratePromptStream` 和 `testPromptStream`。
    - 预期结果：旧的IPC代码被完全移除，所有流式调用都通过tRPC。
    - 风险评估：低。主要是替换和删除代码。

[ ] 5. **功能测试与验证**
    - [ ] 启动桌面应用 (`pnpm --filter @prompt-optimizer/desktop dev`)。
    - [ ] 执行一次"优化提示词"操作，验证打字机效果是否出现。
    - [ ] 查看控制台，确认没有 `not implemented` 警告，也没有历史记录创建失败的错误。
    - [ ] 执行一次"迭代优化"，验证功能正常。
    - [ ] 执行 `npm run test`，确保所有现有测试用例仍然通过。
    - 预期结果：桌面应用的功能与Web版完全一致，没有错误。
    - 风险评估：中。可能会发现一些在重构过程中未预料到的边界情况。

[ ] 6. **文档更新**
    - [ ] 在 `docs/developer/architecture` 目录下创建 `trpc-ipc.md` 文档，记录本次重构的架构决策和实现细节。
    - [ ] 更新 `docs/developer/project-structure.md` 以反映新的 `trpc` 相关文件。
    - [ ] 在 `docs/workspace/experience.md` 中记录本次重构的关键经验。

#### 进展记录
- [日期] [具体进展描述]
- [日期] [遇到的问题和解决方案]

#### 重要发现
- [记录重要的技术发现或经验]

---

## 历史任务

### [已完成任务名称] - [完成日期] ✅
**总结**: [简要总结]
**经验**: [重要经验提取]

---

## 待办事项

### 紧急
- [ ] [紧急任务1]
- [ ] [紧急任务2]

### 重要
- [ ] [重要任务1]
- [ ] [重要任务2]

### 一般
- [ ] [一般任务1]
- [ ] [一般任务2]

---

## 问题记录

### 未解决
- [问题描述] - [发现日期]

### 已解决
- [问题描述] - [解决方案] - [解决日期]

---

## 备注
[其他需要记录的信息]

### 里程碑
- [ ] 完成依赖安装与环境配置。
- [ ] 完成tRPC后端实现。
- [ ] 完成tRPC前端实现并成功通信。
- [ ] 完成所有流式方法的重构。
- [ ] 所有功能在桌面端测试通过。
- [ ] 完成相关文档的编写与更新。
