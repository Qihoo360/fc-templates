# OpenDots AI Native 适配

本目录是 OpenDots 的 AppMkt 模板适配，运行镜像由独立的 OpenDots 公司仓库构建：

- https://code.geelib.qihoo.net:11443/appmkt/OpenDots
- 上游项目：https://github.com/CopilotKit/OpenDots

## 当前适配范围

- 引用固定版本的 OpenDots AppMkt 镜像，不在模板仓库复制应用源码。
- 通过 `OPENAI_BASE_URL`、`OPENAI_MODEL` 和 `OPENAI_API_KEY` 接入 AINative OpenAI 兼容模型网关。
- 通过 `CPK_INTELLIGENCE_API_KEY` 接入 CopilotKit Intelligence。
- 通过 `OWNER_TOKEN` 保护对外 API。
- 通过 Polefs 持久化 `/data/opendots.sqlite`。
- 使用 `/health` 作为基础健康检查入口。
- 第一阶段固定单实例，避免 SQLite 在多实例下产生一致性问题。

当前镜像：`harbor.qihoo.net/wfwqjs-eventing-zevent-pub/opendots:v0.1.0.2`。

镜像 digest：`sha256:ced9fc62602c319995d965f983d92e86df69c785c596faea7e43eae27799650c`。

## AI Native 验证门禁

| 层级 | 验证内容 |
|---|---|
| 模板 | `publish.yaml` 通过 AppMkt Schema 校验 |
| 渲染 | `src/s.yaml` 的参数引用完整，镜像 Dockerfile 和 sourceSubDir 存在 |
| 镜像 | 独立 OpenDots 仓库构建并发布固定 digest 镜像 |
| 健康 | `/health` 返回 200 和 `{"ok":true}` |
| 鉴权 | 未携带 Owner Token 的业务 API 返回 401 |
| 模型 | AINative 模型网关可完成最小对话 |
| 存储 | 页面或工作区数据写入 Polefs，重启后仍可读取 |

详细部署说明见 [src/readme.md](src/readme.md)。
