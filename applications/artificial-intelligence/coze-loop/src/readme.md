# 应用介绍

本案例是将 cozeloop，快速创建并部署到函数计算 FC 。

[Coze Loop ](https://www.coze.cn/loop)是一个面向开发者，专注于 AI Agent 开发与运维的平台级解决方案。 它可以解决 AI Agent 开发过程中面临的各种挑战，提供从开发、调试、评估、到监控的全生命周期管理能力。

通过 Serverless 开发平台，您只需要几步，就可以体验 cozeloop，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/ArtificialIntelligence/coze-loop/src)

* [官方网站](https://www.coze.cn/loop)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

mysql

redis

s3

clickhouse

RocketMQ

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 配置

### 模型配置

- api_key：火山方舟 API Key。中国境内用户参考[火山方舟文档](https://www.volcengine.com/docs/82379/1541594)；非中国境内的用户可参考[BytePlus ModelArk 文档](https://docs.byteplus.com/en/docs/ModelArk/1361424?utm_source=github&utm_medium=readme&utm_campaign=coze_open_source)。
- model：火山方舟模型接入点的 Endpoint ID。中国境内用户参考[火山方舟文档](https://www.volcengine.com/docs/82379/1099522)；非中国境内的用户可参考[BytePlus ModelArk 文档](https://docs.byteplus.com/en/docs/ModelArk/1099522?utm_source=github&utm_medium=readme&utm_campaign=coze_open_source)。



## 使用

1. 根据页面提示注册账号，并登录 Coze Loop 。
2. 在左侧导航栏中单击 Playground
3. 在模型配置区域查看模型列表，确认可选模型是否和步骤二中配置的模型完全一致。
4. 选择任意一个模型，在右侧预览与调试区域展开对话。
![image-20250812205229630](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/bisheng/src/images/image-20250812205229630.png?raw=true)
