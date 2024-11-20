# 应用介绍

本案例是将 fastgpt，快速创建并部署到函数计算 FC 。

FastGPT 是一个基于 LLM 大语言模型的知识库问答系统，提供开箱即用的数据处理、模型调用等能力。同时可以通过 Flow 可视化进行工作流编排，从而实现复杂的问答场景！

通过 Serverless 开发平台，您只需要几步，就可以体验 fastgpt 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/fastgpt/src)

* [官方网站](https://tryfastgpt.ai/)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

[one-api](http://oneapi-apimarket-00028l00jv.cn-north-cu-1-vpc.fc.zyunapp.com)

fastgpt sandbox

mongodb

milvus

# 应用的使用说明

## 配置

初始登陆用户名/密码：root/123456

部署函数时配置以下环境变量：

\# oneapi 地址，可以使用 oneapi 来实现多模型接入

ONEAPI_URL=<https://xxxx.cloud.sealos.io/openai/v1>

\# 通用key。可以是 openai 的也可以是 oneapi 的。

\# 此处逻辑：优先走 ONEAPI_URL，如果填写了 ONEAPI_URL，key 也需要是 ONEAPI 的 key

CHAT_API_KEY=sk-xxxx

\# mongo 数据库连接参数，本地开发连接远程数据库时，可能需要增加 directConnection=true 参数，才能连接上。

MONGODB_URI=mongodb://username:password@0.0.0.0:27017/fastgpt?authSource=admin

\# milvus 向量库连接参数

MILVUS_ADDRESS=<https://in03-78bd7f60e6e2a7c.api.gcp-us-west1.zillizcloud.com>

MILVUS_TOKEN=133964348b00b4b4e4b51bef680a61350950385c8c64a3ec16b1ab92d3c67dcc4e0370fb9dd15791bcd6dadaf765e98a98735d0d

\# code sandbox url

SANDBOX_URL=<http://localhost:3001>

## 使用

![image-20241119152038048](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/fastgpt/src/images/image-20241119152038048.png?raw=true)
