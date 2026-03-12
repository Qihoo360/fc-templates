# 应用介绍

本案例是将 bisheng，快速创建并部署到函数计算 FC 。

BISHENG 是一款 **开源** LLM应用开发平台，专攻**办公场景**， 已有大量行业头部组织及世界500强企业在使用。

通过 Serverless 开发平台，您只需要几步，就可以体验 bisheng，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/artificial-intelligence/bisheng/src)

* [官方网站](https://dataelem.feishu.cn/wiki/ZxW6wZyAJicX4WkG0NqcWsbynde)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

mysql

redis

elasticsearch

milvus

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 配置

### Elasticsearch配置

需要预先添加授权索引：
- mid_user_interact_dtl
- mid_user_increment
- base_telemetry_events
- mid_app_increment
- mid_knowledge_increment

### Mysql配置

- 确认是否把集群地址添加到白名单

## 使用

应用部署成功后访问 bisheng-frontend 触发器地址进行注册和登陆。

添加模型：

![image-20250605182322296](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/bisheng/src/images/image-20250605182322296.png?raw=true)


添加应用：

![image-20250605182522522](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/bisheng/src/images/image-20250605182522522.png?raw=true)


使用应用：



![image-20250605182010618](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/bisheng/src/images/image-20250605182010618.png?raw=true)
