# 应用介绍

本案例是将 loki ，快速创建并部署到函数计算 FC 。

Loki 是一个受Prometheus启发的水平可扩展、高可用、多租户日志聚合系统。它的设计非常经济高效且易于操作。它不索引日志的内容，而是为每个日志流建立一组标签。

通过 Serverless 开发平台，您只需要几步，就可以体验 loki 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/data-processor/loki/src)

* [官方网站](https://loki.com/)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。


grafana默认已开启多租户模式auth_enabled: true
添加loki数据源时，需配置Header: X-Scope-OrgID Value: docker


## 效果
![loki](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/data-processor/loki/src/images/loki-1.png?raw=true)

![grafana](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/data-processor/loki/src/images/grafana.png?raw=true)
