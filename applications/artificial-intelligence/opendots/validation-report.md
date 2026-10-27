# OpenDots 第一阶段适配验证报告

- 验证日期：2026-10-27
- 验证范围：模板、独立仓库镜像和本地容器运行态
- 当前结论：本地适配通过，等待 AppMkt 验证应用部署

## 已通过

| 验证项 | 结果 | 证据 |
|---|---|---|
| OpenDots 接口测试 | 通过 | 55 个测试文件，347 个测试全部通过 |
| TypeScript 类型检查 | 通过 | `npm run typecheck` |
| OpenDots lint | 通过 | `npm run lint` |
| OpenDots 生产构建 | 通过 | `npm run build` |
| 模板 Schema 校验 | 通过 | `tests/test_template.py`，5/5 |
| 模板参数渲染 | 通过 | `tests/test_template.py` |
| Docker 镜像构建 | 通过 | `opendots-appmkt:local` |
| OpenDots 镜像发布 | 通过 | `harbor.qihoo.net/wfwqjs-eventing-zevent-pub/opendots:v0.1.0.2` |
| 容器健康检查 | 通过 | `GET /health` 返回 200 和 `{"ok":true}` |
| API 鉴权 | 通过 | 无令牌 `/api/state` 返回 401，正确令牌返回 200 |
| 镜像固定 | 通过 | digest 为 `sha256:ced9fc62602c319995d965f983d92e86df69c785c596faea7e43eae27799650c` |

## 未验证

- 使用真实 AINative 模型网关完成最小对话。
- 使用真实 CopilotKit Intelligence 创建和运行线程。
- 通过 AppMkt 接口部署验证应用。
- Polefs 写入 SQLite 后执行实例重启恢复验证。
- Slack、浏览器电脑、Composio 和语音能力。

## 上架门禁

在真实模型、Intelligence、部署、存储恢复验证完成前，不判定为可上架。任何一项失败都需要保留部署日志和运行日志，再修复模板或运行配置后重新验证。
