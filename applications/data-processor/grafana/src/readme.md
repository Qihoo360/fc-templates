# 应用介绍

本案例是将 grafana ，快速创建并部署到函数计算 FC 。

开放且可组合的可观测性和数据可视化平台。可视化来自 Prometheus、Loki、Elasticsearch、InfluxDB、Postgres 等多个来源的指标、日志和跟踪。

通过 Serverless 开发平台，您只需要几步，就可以体验 grafana 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/data-processor/grafana/src)

* [官方网站](https://grafana.com/)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

### grafana/conf/sample.ini

```sh
# 您可能需要自定义本文件中的以下参数来适应您的运行环境。

# type
# 说明：[database]配置字段，数据库类型，"mysql", "postgres" 或者 "sqlite3"，选择一个
# 示例：type = mysql


# url
# 说明：[database]配置字段，数据库连接地址
# 示例：url = mysql://user:secret@host:port/database

```

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 效果
![grafana](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/data-processor/grafana/src/images/grafana.png?raw=true)
