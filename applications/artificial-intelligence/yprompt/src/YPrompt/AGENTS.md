# AGENTS 总览

YPrompt 是一个双端协同的提示词管理系统：前端采用 Vue 3 + Pinia + Tailwind 构建响应式 UI，后端由 Sanic 提供基于 SQLite/MySQL 的 API 服务，并支持 Linux.do OAuth 与本地认证。此文档定义了各角色 Agent 的工作范围、关键入口以及协作方式，便于后续二次开发快速分工。

## 项目快照
- **目录结构**：`frontend/` 承载 Vue 应用（模块化组件 + composables）；`backend/` 承载 Sanic 应用（apps/modules/* 蓝图自动注册）；`data/` 保存 SQLite、日志与缓存。
- **运行链路**：浏览器命中 `frontend/src/main.ts` 配置的路由和守卫，认证后通过 `frontend/src/services/apiService.ts` 调用后端 REST 接口，后端在 `backend/apps/__init__.py` 中初始化数据库/JWT/蓝图并暴露 `/api/**`。
- **核心功能**：AI 引导生成、提示词优化、个人库与版本管理、双认证、双数据库、响应式布局。

## Agent 分工

### 前端 Agent
- **职责**：
  - 维护路由、布局与模块页面（Generate/Optimize/Playground/Library），位于 `frontend/src/main.ts` 与 `frontend/src/components/modules/`。
  - 维护 Pinia stores（认证、提示词、导航、设置、优化等），确保状态与 API 契约一致，入口 `frontend/src/stores/`。
  - 扩展 AI 服务、Provider、流式解析，集中在 `frontend/src/services/ai/` 及 `aiService.ts`。
  - 管理提示词配置与规则（`frontend/src/config/prompts.ts` 及其子目录），同步云端/本地版本。
- **关键工作流**：
  1. 认证：`authStore` 负责 Linux.do OAuth code 登录、本地用户名密码登录、token 刷新、用户恢复。
  2. API：`apiService.ts` 统一封装 fetch，自动附带 token 与错误处理；模块服务（如 `versionService.ts`）基于它实现业务。
  3. 模块：GenerateModule 整合聊天、预览面板；OptimizeModule 负责系统/用户提示词的质检；LibraryModule 提供列表、版本、收藏、标签等视图。
- **常用命令**：`npm install`、`npm run dev`、`npm run build`、`npm run type-check`。

### 后端 Agent
- **职责**：
  - 维护 Sanic 应用生命周期（`backend/apps/__init__.py`），包括日志、CORS、JWT、数据库、蓝图自动注册。
  - 编写/维护业务模块（`backend/apps/modules/*`），每个模块包含 `models.py`（OpenAPI 模型）、`services.py`、`views.py`。
  - 维护工具层（`backend/apps/utils/`）：数据库适配器、JWT、OAuth、密码工具、认证中间件等。
  - 保障配置（`backend/config/*.py`）与迁移脚本（`backend/migrations/*.sql`）正确，覆盖 SQLite 自动初始化、管理员同步、MySQL 配置。
- **核心能力点**：
  1. **双数据库**：`db_utils.py` + `db_adapter.py` 统一接口，SQLite 首次启动自动建库并创建/同步 admin 账号；MySQL 通过 ezmysql 连接池。
  2. **双认证**：`apps/modules/auth/views.py` 同时提供 Linux.do OAuth `/api/auth/linux-do/login` 与本地 `/api/auth/local/login`/`register` 入口；`LinuxDoOAuth` & `PasswordUtil` & `JWTUtil` 提供支持。
  3. **提示词/版本/标签** 模块提供 REST API（`/api/prompts`, `/api/versions`, `/api/tags`）；`prompt_rules` 模块负责系统内置规则管理。
- **常用命令**：`python3 -m venv venv && source venv/bin/activate`、`pip install -r requirements.txt`、`python run.py`（可加 `--workers=4`）。

### 协调/集成 Agent
- **职责**：
  - 定义前后端契约，确保 `apiService` 中的请求与后端返回的数据结构一致，如 `/api/prompts` 列表返回 `total/page/limit/items`。
  - 管理配置与部署：对接 `.env` / `config/base.py` / `config/settings.py`，保证环境变量（数据库、JWT、OAuth、默认管理员）在两个端正确暴露。
  - 监控数据目录（`data/yprompt.db`, `data/logs/**`），统一备份策略，并在多环境之间同步迁移脚本。
  - 推动测试/验证：组织前端 E2E、后端 API/单元测试、接口对齐检查。

## 协作基线
- **API 契约**：遵循 `/api/*` REST 设计，成功返回 `{'code':200,'data':...}`，失败返回 `{'code':xxx,'message':...}`；前端遇到 `401` 时需清理本地凭证并重定向登录。
- **认证链路**：前端通过 `/api/auth/config` 获取可用认证方式；Linux.do 回调页面负责提取 `code` 并调用 `/api/auth/linux-do/login`；本地模式通过 `/api/auth/local/login` 与 `/register` 完成。
- **数据一致性**：提示词与版本模块需要维护 `current_version`、`total_versions`、版本快照，前端 Library/Version 面板依赖这些字段；标签模块依赖 `tags` 字段的逗号分隔格式。
- **配置安全**：永远不要提交真实密钥到 repo；本地调试使用 `.env.local` / `builtin-providers.json`；生产环境通过环境变量覆盖 `SECRET_KEY`、数据库、OAuth、管理员密码。

## 快速启动备忘
1. **前端**：在 `frontend/` 运行 `npm install && npm run dev`，确保 `.env.local` 中的 `VITE_API_BASE_URL` 指向运行中的后端；必要时复制 `builtin-providers.example.json`。
2. **后端**：在 `backend/` 中安装依赖并执行 `python run.py`；默认使用 `../data/yprompt.db`，首次启动会自动创建表结构与管理员账号；需要 MySQL 时在 `config/base.py` 或环境变量中切换。
3. **联调**：保证浏览器可访问 `http://localhost:5173`，后端默认 `http://localhost:8888`；Swagger 文档在 `/docs`，OpenAPI JSON 在 `/openapi.json`。

## 后续开发提示
- 规划中的模块（如 Playground 扩展、多模型对比）已在目录中占位，可由前端 Agent 接手实现 UI + 调用；后端 Agent 需要配套 API。
- MySQL 初始化脚本仍需补充/验证，若启用 MySQL 需先编写/执行迁移。
- 考虑在后续迭代中加入邮箱验证、二次验证、权限系统、Redis 缓存及数据备份机制。

> 使用本文档快速定位职责、入口和启动方式，确保多 Agent 协作时对系统整体有一致的 mental model。
