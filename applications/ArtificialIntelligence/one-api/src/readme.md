# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

*   函数计算

# 部署 & 体验

*   通过 [Serverless 应用中心](https://console.zyun.qihoo.net/fc) ,部署该应用。

## 配置依赖

### one-api/.env

```sh
PORT=8080
DEBUG=true
#HTTPS_PROXY=http://localhost:7890

#SQL_DSN="xxx"  # 修改此行，或注释掉以使用 SQLite 作为数据库
#REDIS_CONN_STRING=redis://redis
#SESSION_SECRET=random_string  # 修改为随机字符串
#TZ=Asia/Shanghai
```

# 应用介绍

本案例是将 one-api ，快速创建并部署到函数计算 FC 。

通过标准的 OpenAI API 格式访问所有的大模型，开箱即用

通过 Serverless 开发平台，您只需要几步，就可以体验 one-api 框架，并享受 Serverless 架构带来的降本提效的技术红利

*   [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/one-api/src)

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。
