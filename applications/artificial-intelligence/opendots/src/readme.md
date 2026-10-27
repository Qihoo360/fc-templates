# OpenDots AppMkt 适配

OpenDots 是一个持久化 AI 工作空间，支持 Dot Agent、Space 页面、对话、语音、Slack 和可选的浏览器电脑能力。本模板将 OpenDots 部署为一个单实例 FC 自定义容器，并使用 Polefs 保存 SQLite 工作区数据。

## 部署前配置

需要准备以下配置：

- CopilotKit Intelligence 项目密钥：用于创建和运行对话线程。
- AINative 兼容 OpenAI 接口的模型服务地址、模型名和调用密钥。
- OpenDots 应用访问令牌：至少 24 个字符，使用 Bearer Token 访问 API。
- 一个 Polefs 持久化卷：挂载到 `/data`，数据库路径为 `/data/opendots.sqlite`。

默认模型配置使用 AINative 的 OpenAI 兼容地址和 `z-ai/glm-5.3`，可以在部署参数中调整。

## 运行约束

本阶段固定单实例运行，因为 OpenDots 的工作区元数据保存在 SQLite 中。扩展到多实例前，需要先完成共享数据库或会话路由方案。模板已提供 `/health` 健康检查入口；业务 API 仍然要求 `OWNER_TOKEN`。

## 验证路径

部署完成后依次验证：

1. `GET /health` 返回 `{"ok":true}`。
2. 带 `Authorization: Bearer <OWNER_TOKEN>` 请求 `/api/state` 返回 200。
3. 页面可以加载，配置状态包含模型和 Intelligence 配置。
4. 发送一条最小对话，确认 Intelligence 和 AINative 模型网关均可用。
5. 在页面中创建或编辑内容，重启实例后确认 SQLite 数据仍存在。
