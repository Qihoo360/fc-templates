# 应用介绍

本案例是将 coze-studio，快速创建并部署到函数计算 FC 。

[Coze Studio](https://www.coze.cn/home) 是一站式 AI Agent 开发工具。提供各类最新大模型和工具、多种开发模式和框架，从开发到部署，为你提供最便捷的 AI Agent 开发环境。

通过 Serverless 开发平台，您只需要几步，就可以体验 cozeloop，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/ArtificialIntelligence/coze-studio/src)

* [官方网站](https://www.coze.cn/studio)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

mysql

redis

s3/minio

nsq/rmq/kafka

Elasticsearch

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 配置

### Elasticsearch配置

- 需安装 analysis-smartcn 插件（若使用hulk的Elasticsearch可联系运维安装）
- 需手动创建索引 project_draft 和 coze_resource （若使用hulk的Elasticsearch可联系运维创建索引）

### 模型配置

在函数挂载的PoleFS文件系统上面配置模型。具体配置方式参考 https://github.com/coze-dev/coze-studio/wiki/2.-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B  。 PoleFS文件系统中的model目录对应到链接中的 backend/conf/model 目录。

![image-20250819152215415](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/coze-studio/src/images/image-20250819152215415.png?raw=true)



## 使用

1. 根据页面提示注册账号，并登录 Coze studio。

2. 进入coze Studio首页之后，点击右上角【创建】按钮，之后在智能体选项点击【创建】按钮，即可创建智能体，如下图所示：

   ![image-20250819153118278](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/coze-studio/src/images/image-20250819153118278.png?raw=true)

3.  创建智能体后即可开始调试：

   ![image-20250819153249423](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/coze-studio/src/images/image-20250819153249423.png?raw=true)