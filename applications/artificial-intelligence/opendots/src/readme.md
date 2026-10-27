# OpenDots AppMkt 适配

OpenDots 是一个持久化 AI 工作空间，支持 Dot Agent、Space 页面、对话、语音、Slack 和可选的浏览器电脑能力。本模板将 OpenDots 部署为一个单实例 FC 自定义容器，并使用 Polefs 保存 SQLite 工作区数据。

## 部署前配置

需要准备以下配置：

- CopilotKit Intelligence 项目密钥：用于创建和运行对话线程。
- AINative 兼容 OpenAI 接口的模型服务地址、模型名和调用密钥。
- OpenDots 应用访问令牌：至少 24 个字符，使用 Bearer Token 访问 API。
- 一个 Polefs 持久化卷：挂载到 `/data`，数据库路径为 `/data/opendots.sqlite`。

默认模型配置使用 AINative 的 OpenAI 兼容地址和 `z-ai/glm-5.3`，可以在部署参数 `OPENAI_URL`、`OPENAI_MODELNAME` 中调整。模板使用 AppMkt OpenAI 资源输出的 `OPENAI_URL`、`OPENAI_MODELNAME`、`OPENAI_API_KEY`，再映射到 OpenDots 原生环境变量。

模板启用 `APP_PROXY_MODE=fc`，不在部署阶段引用自身的 HTTP Trigger 输出。留空 `APP_ORIGIN` 时，OpenDots 按 FC 请求的 Host 推导 HTTPS Origin；如果 FC 前面使用自定义域名，可以填写完整的 `APP_ORIGIN` 覆盖自动推导值。 必须保留至少 24 位的 `OWNER_TOKEN`。

自动模式要求 FC 保留浏览器访问时的 Host。只接受单值 `X-Forwarded-Proto=http/https`（缺失时使用 HTTPS），可选的 `X-Forwarded-Host` 必须匹配当前 Host；错误域名、多值或非法转发头返回 403。模板不使用转发 Host 切换域名。如果平台改写了 Host，请填写精确 `APP_ORIGIN`（包含协议和实际端口，无路径、尾部斜杠、查询或 fragment）；该参数优先于代理推导。已有应用缺少此新增参数时回退为空字符串。

本次修复需要镜像 `v0.1.0.3`，仅删除自引用而继续使用 `v0.1.0.2` 不包含运行时修复。HTTP Trigger 本身仍通过 `triggers` 创建；部署输出不参与创建自身时的环境变量解析。

## 运行约束

本阶段固定单实例运行，因为 OpenDots 的工作区元数据保存在 SQLite 中。扩展到多实例前，需要先完成共享数据库或会话路由方案。模板已提供 `/health` 健康检查入口；业务 API 仍然要求 `OWNER_TOKEN`。

## 验证路径

部署完成后依次验证：

1. `GET /health` 返回 `{"ok":true}`。
2. 带 `Authorization: Bearer <OWNER_TOKEN>` 请求 `/api/state` 返回 200。
3. 页面可以加载，配置状态包含模型和 Intelligence 配置。
4. 发送一条最小对话，确认 Intelligence 和 AINative 模型网关均可用。
5. 在页面中创建或编辑内容，重启实例后确认 SQLite 数据仍存在。
