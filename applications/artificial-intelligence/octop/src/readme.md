# Octop v1.0.3b1 Web 应用

本模板是候选适配，尚未通过 AppMkt 上线验收。应用源码与启动/镜像实现位于独立 Octop 仓库；模板只引用已发布制品及声明 FC、模型和 Polefs 资源。

## 运行方式

- 单容器 Web Dashboard + FastAPI，监听 `0.0.0.0:8088`。
- 健康接口 `/api/health`；返回 200 不代替登录、模型或持久化验收。
- `HOME=OCTOP_HOME=/data/octop`；Polefs 挂载 `/data`，SQLite 位于 `/data/octop/octop.db`。
- 使用单实例，部署用户必须填写管理员用户名、强管理员初始密码和模型 API Key。管理员密码仅首次建账号生效，重启不重置已存在用户；密码和模型 Key 均作为 Secret 注入。
- 非 root 用户 UID/GID 1000，挂载卷需要对应的可写权限；不得为启动而覆盖生产数据或全卷放宽权限。

## 模型映射

| AppMkt 参数/输出 | Octop 环境变量 |
|---|---|
| OPENAI_URL | OPENAI_BASE_URL |
| OPENAI_MODELNAME | OPENAI_MODEL_NAME |
| OPENAI_API_KEY | OPENAI_API_KEY |

`OCTOP_APPMKT_MODE=1` 通过现有加密仓库同步平台受管 Provider。管理员用户名、管理员初始密码和 `OPENAI_API_KEY` 由部署用户填写；模型地址和模型名按模板参数传入。三项模型配置缺失、URL 不合法或 Provider 名称与用户自建配置冲突时明确失败，不假装已接入模型。

## 本阶段非目标

不承诺浏览器自动化、远程桌面、Terminal Shell、Docker/Podman 宿主控制、移动设备、本地 OCR/嵌入模型或多实例。管理页面可见不表示这些能力已支持或已隔离；需另行完成用户策略和平台权限验收。无需将 Redis、PostgreSQL、S3 或向量库作为此单容器版本的必选资源。

## 上线前必验

镜像 amd64 构建、健康、UI 登录、错误凭据、Agent/线程、真实 AINative 流式对话、工具、文件写入与重启恢复、真实 Polefs 文件锁/WAL、FC WebSocket/协议兼容。没有真实模型和 FC 验收证据不得上架。

原始版本为用户指定 beta `v1.0.3b1`，不是最新稳定版本声明。过程记录统一维护在相邻 `app-adapter/docs/changes/octop-1.0.3b1/`，其 Spec、Plan、Acceptance 和 Verification 是本次验收依据。
