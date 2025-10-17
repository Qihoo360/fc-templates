
# 应用介绍

本案例是将 **RudderStack 数据管道平台** 快速创建并部署到函数计算 FC 或自有服务器环境中。

RudderStack 是一款开源的 **客户数据收集与路由系统（CDP，Customer Data Platform）**，能够帮助企业轻松地从各种数据源（前端、后端、移动端等）采集事件数据，并将数据同步到多个目标端（如数据仓库、BI 平台、营销系统等）。

RudderStack 提供了兼容 Segment 的 API 接口，开发者可以使用统一的数据上报格式，无需修改现有代码，即可实现从采集到分发的全链路数据打通。

* [官方 GitHub 仓库](https://github.com/rudderlabs/rudder-server)
* [官方文档](https://www.rudderstack.com/docs/)
---

# 前期准备

使用该项目，您需要开通以下服务或具备以下条件：

* 函数计算（Function Compute, FC）或自有服务器
* Docker 环境（推荐 Docker Compose）
* 网络访问权限（确保 RudderStack 可访问外部目的端）
* 可选：PostgreSQL 数据库（用于 RudderStack 后端存储）
* 可选：Prometheus + Grafana（用于指标监控）

---

# 部署 & 体验

## 1. 部署服务

## 2. 验证服务

运行以下命令，验证 RudderStack 是否正常接收事件：

```bash
curl --location -g 'http://127.0.0.1:8080/v1/identify' \
--header 'Content-Type: application/json' \
--data '{
  "userId": "user12345",
  "anonymousId": "anon-id-new",
  "context": {
    "traits": {
       "trait1": "new-val"
    },
    "ip": "14.5.67.21",
    "library": {
        "name": "http"
    }
  },
  "timestamp": "2025-02-02T00:23:09.544Z"
}'
```

如果返回 `200 OK`，说明 RudderStack 服务正常工作。

> ⚙️ **无需鉴权**：默认情况下，RudderStack 接口无需认证。
> 若配置了 **WRITE_KEY**，则需在请求头中添加：
>
> ```
> Authorization: Basic <WRITE_KEY>
> ```

---

## 示例：上报事件

```bash
curl --location -g 'http://127.0.0.1:8080/v1/track' \
--header 'Content-Type: application/json' \
--data '{
  "userId": "user12345",
  "event": "User Signup",
  "properties": {
    "plan": "pro",
    "method": "email"
  }
}'
```

---

# 主要功能

* 📡 **多源数据接入**：支持前端、后端、移动端数据上报
* 🔄 **灵活数据路由**：可同时将事件推送至多个目标系统
* 🧩 **实时数据处理**：支持事件过滤、映射与转换
* 🧠 **开源可扩展**：完全开源，可自定义插件与处理逻辑
* 🔒 **安全合规**：支持匿名化、数据脱敏与权限隔离
* 📊 **监控与可视化**：可结合 Prometheus、Grafana 实现实时监控

---

# 示例架构图

![rudderstack-architecture](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/rudderstack/src/images/rudder-server-architecture.png?raw=true)

