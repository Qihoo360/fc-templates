# Penpot 2.18.3 单容器 AppMkt 适配

**状态：单容器适配草案，尚未完成真实 FC 部署验收。**

## 架构

```text
公网 HTTPS 入口 → FC combined 函数 → Frontend/Nginx :8080
                                      ├── 127.0.0.1:6060 Backend
                                      └── 127.0.0.1:3000 Admin Console
```

一个 FC 函数同时运行三个进程，由 Supervisor 管理。Frontend/Nginx 是唯一公网入口，Backend 和 Admin Console 不创建独立函数，也不使用跨资源 `httpTriggerUrl`。

## 版本和镜像

应用版本固定为 Penpot 2.18.3。`src/combined/Dockerfile` 只引用已经构建的 combined 镜像；combined Dockerfile、Supervisor 配置和启动编排在独立 Penpot 源码仓库维护，不复制到 `fc-templates`。

## 部署前准备

1. 准备 Penpot 专属 dev 模板/版本/实例、区域、VPC 和资源组。
2. 确认 FC 注入的 `K_LATEST_TRIGGER_IDC` 是稳定触发器主机名；容器启动时会自动派生 `https://<K_LATEST_TRIGGER_IDC>` 作为 `PENPOT_PUBLIC_URI`。
3. 准备独立 PostgreSQL、Redis/Valkey 和 AppMkt OBS；确认网络、权限、数据库迁移和对象存储可达。
4. 确认 combined 镜像已构建、推送到模板引用的 Harbor 地址，并固定 linux/amd64 架构和 digest。
5. `PENPOT_SECRET_KEY` 使用持久随机 secret；升级时保持不变。

## 环境变量关系

```yaml
K_LATEST_TRIGGER_IDC: presenton-o49c7-000bkb0c4t.beijing-idc.fc.zyunapp.cn
PENPOT_PUBLIC_URI: https://presenton-o49c7-000bkb0c4t.beijing-idc.fc.zyunapp.cn
PENPOT_INTERNAL_URI: http://127.0.0.1:8080
PENPOT_BACKEND_URI: http://127.0.0.1:6060
PENPOT_ADMIN_CONSOLE_URI: http://127.0.0.1:3000
```

`PENPOT_PUBLIC_URI` 仍是用户访问、邮件链接、登录回调和 Cookie 安全策略使用的正式 HTTPS 地址。它由 combined 容器从 `K_LATEST_TRIGGER_IDC` 派生，不再作为 publish 参数填写。

## 资源配置

单资源默认配置为 6 vCPU、10 GiB 内存、2 GiB 临时磁盘，min=max=1。实际规格和费用需要 dev 验证，不能把默认值当作容量结论。

Frontend、Backend、Admin Console 的数据库和主密钥配置在同一容器环境中可见；Supervisor 为三个进程设置相同的运行环境。Backend 仍负责 PostgreSQL、Redis/Valkey 和 OBS 连接，Frontend 通过回环 HTTP 访问 Backend/Admin Console。

## 功能边界

首期不提供 Exporter 服务端导出、MCP、SMTP、OAuth/LDAP 和独立远程媒体处理。默认关闭注册；仅在隔离 dev 中显式开启，用于创建测试账号，验证后关闭。

Redis 自动创建的 `neuralredis` 错误来自 app-store 动态注入。本模板遵守工作区规则不修改 app-store，因此真实 Redis 创建在平台修复前保持 BLOCKED。

## 验证命令

模板侧只保存配置和镜像引用，不保存运行时源码。单容器镜像的构建、Supervisor、启动顺序和容器测试在独立 Penpot 源码仓库执行；适配文档和验证工具在 `app-adapter` 执行。

必须分别记录本地镜像、模板渲染、FC dev、数据库/缓存/OBS、登录、保存、协作和重启恢复结果。页面 HTTP 200、容器启动成功或单个健康接口通过都不能代替完整验收。
