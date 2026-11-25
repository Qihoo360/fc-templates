# Toonflow v2.0.10 Appmkt 模板

提供原生多租户 Toonflow 网页创作入口。首次启动自动创建管理员、关闭公开注册，并将 `OPENAI_URL`、`OPENAI_MODELNAME`、`OPENAI_API_KEY` 初始化为加密的 `APIMKT` 供应商和发布路由。前端空选择使用首个目录模型；新装目录仅有 APIMKT，用户后续项目/会话模型选择由上游保存。已有管理员、供应商、模型、禁用路由及注册设置优先，旧 ENV 不覆盖用户配置；损坏配置阻止启动。

部署参数包括管理员用户名（默认 admin）、初始密码、三个模型参数、持久卷及挂载用户。密码和 API Key 使用敏感参数，无默认值。MySQL 模式另外需要 `TOONFLOW_MULTI_TENANT_SECRET`；默认 SQLite 不需要。模型地址保留 gateway 路径，仅无路径地址补 `/v1`，不能包含用户名、密码、查询串或 fragment。

公共 HTTP 端口为 `10888`，内部 `3000` 仅监听 loopback。应用以 `bun` 运行；平台挂载必须允许该用户读写 `/home/appmkt`，保持单实例常驻。所有应用数据在 `/home/appmkt/toonflow`。备份整个 `/home/appmkt`，必须包含数据库、工作区和 `multiTenant/modelSecret.key`；丢失密钥将无法解密模型配置。

维护使用容器内命令，所有命令要求管理员认证，不新增公网管理 HTTP 入口：

```bash
# 将受保护的 JSON 文件经 stdin 传入；不要把凭据写进命令行、版本库或日志。
docker exec -i CONTAINER bun /app/docker/scripts/admin.ts < /secure/maintenance.json
```

JSON 包含 `command`、`adminUserName`、`adminPassword`。也可从受控容器环境 `TOONFLOW_MAINTENANCE_USERNAME` / `TOONFLOW_MAINTENANCE_PASSWORD` 读取管理员凭据；优先使用 stdin。命令：`status`、`model-status`、`users`、`create-user`（`userName`、`password`）、`disable-user`（`id`、布尔 `disabled`）、`reset-password`（`id`、`password`）、`rotate-admin`（`password`）。不支持的命令非零退出；失败仅输出 `maintenance failed`。输出敏感字段脱敏。管理员轮换当前仅支持 SQLite，事务内更新密码并撤销管理员会话；MySQL 需外部受控维护。模型配置通过上游原生加密存储管理；本 CLI 仅提供 `model-status`，没有模型修改子命令。

升级前停服务并备份卷；升级使用固定镜像 Digest。回退使用已验证旧 Digest 和相应备份，不能假定跨版本数据库可逆。不要删除卷来修复启动错误。模板的一个 FROM-only Dockerfile 对应一个 HTTP 函数；最终 Digest 以验证/交付报告为准。候选阶段不能直接用于市场发布。

本地验证经 `just --justfile applications/toonflow/v2.0.10/justfile check/test-config/test/test-extra/template-check/verify` 执行。浏览器在独立 Runner，证据绑定应用 Image ID 和 Runner 指纹；模型请求使用受控兼容服务。真实 Appmkt 部署、外部模型服务和平台 NAS 权限尚未实测，不能用本地验证推定平台验收。
