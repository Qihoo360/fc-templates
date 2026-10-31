# 应用介绍

Penpot 是一款开源的网页设计和原型协作工具，支持团队在浏览器中创建界面设计、原型和设计系统，并进行多人协作。

本案例将 Penpot 2.18.3 部署到函数计算 FC。Frontend、Backend 和 Admin Console 由一个 combined 容器运行，Frontend/Nginx 提供统一的网页访问入口。

- 官方网站：https://penpot.app/
- 官方项目：https://github.com/penpot/penpot
- 当前版本：2.18.3

# 前期准备

使用该项目前，需要准备以下资源和权限：

- 函数计算 FC 创建函数和 HTTP 触发器的权限；
- 一个稳定的 HTTPS 访问入口；容器从 FC 注入的 `K_LATEST_TRIGGER_IDC` 自动生成 `PENPOT_PUBLIC_URI`；
- 独立的 PostgreSQL 数据库、账号和数据库权限；
- 独立的 Redis/Valkey 实例；
- AppMkt OBS/S3 对象存储及访问凭据；
- Polefs 持久化卷，挂载到容器 `/data`；
- 至少 64 个字符的持久 `PENPOT_SECRET_KEY`，升级和重新部署时保持不变。

PostgreSQL 需要允许 Penpot 使用的账号执行 Admin Console 数据库迁移。Admin Console 启动时会通过 Drizzle ORM 创建和更新迁移表；数据库账号还需要根据实际数据库 TLS 能力配置 `POSTGRES_SSL_MODE`。

# 部署与体验

通过智汇云官网进入“产品列表 → Serverless 开发 → 函数计算 FC”，选择 Penpot 应用进行部署。

部署完成后，使用 FC HTTP 触发器地址访问 Penpot。容器启动时会把：

```text
K_LATEST_TRIGGER_IDC
```

转换为：

```text
PENPOT_PUBLIC_URI=https://<K_LATEST_TRIGGER_IDC>
```

例如：

```text
K_LATEST_TRIGGER_IDC=penpot-example-000c7x0c71.beijing-idc.fc.zyunapp.cn
PENPOT_PUBLIC_URI=https://penpot-example-000c7x0c71.beijing-idc.fc.zyunapp.cn
```

首次使用时可按需开启注册完成账号初始化，创建账号后建议关闭注册，再验证登录、创建项目、编辑保存和刷新恢复。

# 单容器架构

```text
FC HTTP Trigger → Frontend/Nginx :8080
                    ├── 127.0.0.1:6060 Backend
                    └── 127.0.0.1:3000 Admin Console
```

一个 FC 函数内由 Supervisor 管理三个进程：

- Frontend/Nginx：唯一公网入口，监听 8080；
- Backend：监听 6060，负责 API、数据库、缓存和对象存储；
- Admin Console：监听 3000，负责管理控制台和数据库迁移。

组件之间使用容器回环地址通信，不使用多个 FC 资源之间的 `httpTriggerUrl` 引用。

# 持久化、对象存储和日志

Polefs 挂载到：

```text
/data
```

应用持久化家目录为：

```text
/data/penpot/
```

Supervisor 和三个进程的日志写入：

```text
/data/penpot/logs/
```

主要日志文件包括：

```text
supervisord.log
backend.stdout.log
backend.stderr.log
admin-console.stdout.log
admin-console.stderr.log
frontend.stdout.log
frontend.stderr.log
```

对象存储使用 AppMkt OBS/S3。Penpot 原生使用 `S3_ENDPOINT`、`S3_BUCKET`、`S3_REGION`、`S3_AK` 和 `S3_SK`；`S3_HOST`、`S3_PORT` 是 AppMkt 资源元数据，不是 Penpot 原生连接配置。

# 当前限制

当前版本的功能边界如下：

- 不提供 Exporter 服务端导出；
- 不提供 MCP；
- 不提供 SMTP、OAuth/LDAP；
- 不提供独立远程媒体处理；
- 默认关闭注册；
- Redis 自动创建依赖平台资源能力，`neuralredis` 相关问题属于 app-store 平台阻塞；
- PostgreSQL、Redis/Valkey、OBS、WebSocket、登录、协作和重启恢复需要在目标 FC 环境中完成验证。

# 验证状态

模板侧保存 `publish.yaml`、`s.yaml`、combined 镜像引用 Dockerfile、版本和部署说明。应用源码、combined Dockerfile、Supervisor 配置和启动编排在独立 Penpot 源码仓库维护。

本地结构检查、模板 Schema 检查和 combined 镜像构建可以作为配置验证依据，但不能替代真实 FC 部署。正式上线前需要验证：

- 三个进程均进入 RUNNING；
- Frontend API 代理正常；
- Admin Console 数据库迁移完成；
- 登录、项目创建、编辑保存和刷新恢复正常；
- Polefs 日志和持久化数据在重启后可读；
- PostgreSQL、Redis/Valkey 和 OBS 连接正常。
