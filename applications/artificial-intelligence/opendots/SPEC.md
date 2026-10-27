# OpenDots AI Native 适配 Spec

## 应用画像

| 项目 | 结论 |
|---|---|
| 运行时 | Node.js 24 + React/Vite + Hono |
| 对外端口 | `4310` |
| 启动入口 | `node dist/server/server/index.js` |
| 必需模型依赖 | OpenAI 兼容的 AINative 模型网关 |
| 必需对话依赖 | CopilotKit Intelligence |
| 本地持久化 | SQLite `/data/opendots.sqlite` |
| FC 持久化 | Polefs 挂载到 `/data` |
| 第一阶段实例数 | 1 个实例 |
| 健康检查 | `GET /health` |

## 应该发生

- 模板 Schema 校验通过。
- `src/s.yaml` 参数渲染完整，源码目录和 Dockerfile 存在。
- Node.js 24 容器镜像构建成功。
- 容器监听 `0.0.0.0:4310`。
- `/health` 返回 HTTP 200 和 `{"ok":true}`。
- 未携带 Owner Token 的 `/api/*` 请求被拒绝。
- 携带正确 Owner Token 的 `/api/state` 请求返回 200。
- 使用 AINative 的 OpenAI 兼容接口完成最小对话。
- OpenDots 写入的工作区数据保存到 Polefs。
- 实例重启后仍能读取已有 SQLite 数据。

## 绝对不能发生

- API Key、Owner Token 或 Intelligence Key 写入镜像层、模板默认值或 Git 历史。
- 未授权请求访问 OpenDots 业务 API。
- 在未解决 SQLite 一致性前将实例数扩展到多个实例。
- 使用强制推送覆盖已有模板或应用历史。
- 部署失败、健康检查失败或模型验证失败后继续判定为可上架。
- 通过绕过 AppMkt 模板配置直接修改生产 FC 资源。
- 将可选的浏览器、Slack、Composio 或语音依赖误判为第一阶段部署成功条件。

## 第一阶段完成条件

模板测试、源码测试、类型检查、lint、生产构建、镜像构建和容器健康/鉴权验证全部通过后，才进入 AppMkt 验证应用部署。模型对话、Polefs 重启恢复和真实部署仍需在目标环境中补充验证证据。
