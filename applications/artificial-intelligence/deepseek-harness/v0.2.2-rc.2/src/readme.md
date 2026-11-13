# 应用介绍

本案例将 DeepSeek Harness dsh-v0.2.2-rc.2 部署到函数计算 FC。

DeepSeek Harness 是 DeepSeek AI 开源的 agent harness，提供 Web UI、模型会话、工作区管理、文件操作、Shell 工具、Web 工具和可扩展的 Agent 能力。

| 入口 | 说明 |
| --- | --- |
| Web UI | Agent 对话和设置界面 |
| Model Settings | 配置模型供应商和模型 |
| Workspace | 管理持久化工作区和 Session |
| Agent Tools | 文件、Shell、Web、Session 和 Subagent 能力，实际范围受运行环境限制 |

* [GitHub 仓库](https://github.com/deepseek-ai/deepseek-harness)
* [DeepSeek Harness 文档](https://deepseek-harness.github.io/deepseek-harness/)

# 前期准备

使用该模板需要准备：

* 函数计算 FC 及可用部署区域
* 持久化文件存储卷
* 兼容 OpenAI API 的模型服务
* 模型服务 API key
* Web 登录 Token

应用以 appmkt 用户运行，UID / GID 为 10001:10001。持久化卷挂载到 /home/appmkt。

# 部署 & 体验

* 通过智汇云官网 → 产品列表 → Serverless 开发 → 应用商店部署。
* 填写 Web 登录 Token、模型服务地址、模型名称和模型调用密钥。
* 选择或创建持久化存储卷。
* 部署完成后，通过函数详情页的 HTTP 域名访问 Web UI。
* 首次访问时，在 URL 查询参数中使用部署时填写的 DSH_WEB_AUTH_TOKEN 完成登录。

| 配置 | 路径 |
| --- | --- |
| Volume 挂载点 | /home/appmkt |
| HOME | /home/appmkt |
| Harness 数据目录 | /home/appmkt/.dsh |
| 默认工作区 | /home/appmkt/workspace |

# 登录 Token

部署时必须填写 DSH_WEB_AUTH_TOKEN：

* Token 用于首次 Web 登录。
* Token 由部署参数注入运行时，不写入镜像。
* 应用启动日志不会打印完整 Token。
* 丢失 Token 后需要更新环境变量并重启实例。

访问地址形式：

    https://<函数域名>/?token=<DSH_WEB_AUTH_TOKEN>

认证成功后，应用通过 HttpOnly、SameSite=Strict Cookie 维护会话。

# 工作区和持久化

默认工作区为 /home/appmkt/workspace，可以通过 DSH_WORKSPACE_PATH 修改为 Volume 内的其他绝对路径。

持久化目录包括：

* /home/appmkt/.dsh：Harness 配置、凭据、Profile 和 Session 数据。
* /home/appmkt/workspace：默认工作区和用户工作文件。
* /home/appmkt/.dsh/logs：应用运行日志及诊断数据。

重建容器时需要继续挂载相同的 Volume，才能保留配置、凭据、Session 和工作文件。

# 资源和运行方式

模板使用一个常驻 Web 函数：

| 配置 | 值 |
| --- | --- |
| 容器端口 | 3080 |
| CPU | 2 |
| 内存 | 4096 MB |
| 最小实例数 | 1 |
| 最大实例数 | 1 |
| 实例并发 | 1 |
| 运行用户 | appmkt |
| 网络 | VPC |
| 存储访问 | ReadWriteOncePod |

应用依赖持久化文件系统和常驻进程。模板默认使用单实例，避免共享工作区产生文件锁和并发写入问题。

# 健康检查和访问控制

应用启动后监听 HTTP 端口。Web 请求受 Host / Origin 和 Cookie 认证机制保护：

* 未携带有效登录 Token 的请求不能完成首次认证。
* 未认证 API 请求返回未授权响应。
* DSH_WEB_AUTH_TOKEN 不应通过日志、URL 分享或公开文档泄露。
* 反向代理访问时需要保持外部 Host，并按上游要求配置可信域名和路径转发。

生产环境建议使用受控域名、TLS 和访问控制策略暴露服务。

# 注意事项

* 模板 Dockerfile 当前引用适配阶段的镜像 Tag；发布到 AppMKT 前必须替换为构建环境可访问的固定 registry 镜像 Tag 或 digest。
* 模型服务必须兼容 openai-completions 协议；实际支持的模型和请求字段由模型网关决定。
* 当前模板验证了本地 Web 启动、Token exchange、Cookie 认证、匿名请求拒绝、工作区初始化、默认模型目录和持久化重启。
* 真实模型调用、FC 实际部署、VPC 出网、网络存储文件锁和反向代理行为需要在目标环境单独验证。
* Shell、Subprocess、SSH、Browser 和 Computer Use 能力可能受 FC 运行时权限、网络和系统依赖限制。
* 不建议多个实例共享同一个可写工作区；扩容前应验证 Session、SQLite / JSONL 和文件锁语义。
