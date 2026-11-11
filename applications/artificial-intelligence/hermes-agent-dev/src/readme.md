# 应用介绍

本案例是将 Hermes-Agent ，快速创建并部署到函数计算 FC 。

它不是绑在 IDE 或围绕单个 API 的聊天机器人包装器的编码副驾驶。这是一个自主代理，运行时间越长，能力就越强。无论你把它放在哪里，它都存在—— 5 美元的 VPS、GPU 集群或无服务器基础设施，闲置时几乎不收费。当它在云虚拟机上工作时，从「推推」与它交谈，你永远不会 SSH 自己。它没有绑定到你的笔记本电脑。

* [官方网站](https://hermes-agent.nousresearch.com/docs)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## Codex / Claude Code CLI：共享 Hermes 模型（待发布候选）

两个真实 CLI 使用 Hermes 当前生效的模型、API Key 和服务端点，不新增独立输入。
每次启动时经既有 provider/Secret 解析器读取当前 profile 的配置，按原生 CLI 协议注入
该进程；Key 不写入命令参数或第二份持久认证配置。修改 Hermes 模型/Key 后，新任务
使用新配置，已经运行的任务保留自己的快照。

CLI 原有的权限、插件、MCP、会话和 HOME 保留；受管模型/认证字段由 Hermes 决定。
不要在命令行另传 --model；需要换模型时更新 Hermes 的配置。
仓库和报告使用 `/data/hermes-agent/`，既有 CLI 会话继续使用 profile HOME。

共享模型服务须支持 Codex Responses 和 Claude Code Messages 协议；相同 Key
不能替代真实协议和工具调用验收。Codex namespace 沙箱能力需单独核验，不自动放开权限。
当前镜像引用保持旧值，本节只描述待发布能力，不代表当前市场实例已接入。
