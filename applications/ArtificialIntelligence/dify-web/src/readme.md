# 应用介绍

本案例是将 dify ，快速创建并部署到函数计算 FC 。

Dify 是一款开源的大语言模型(LLM) 应用开发平台。它融合了后端即服务（Backend as Service）和 LLMOps 的理念，使开发者可以快速搭建生产级的生成式 AI 应用。即使你是非技术人员，也能参与到 AI 应用的定义和数据运营过程中。
由于 Dify 内置了构建 LLM 应用所需的关键技术栈，包括对数百个模型的支持、直观的 Prompt 编排界面、高质量的 RAG 引擎、稳健的 Agent 框架、灵活的流程编排，并同时提供了一套易用的界面和 API。这为开发者节省了许多重复造轮子的时间，使其可以专注在创新和业务需求上。

通过 Serverless 开发平台，您只需要几步，就可以体验 dify 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/dify-web/src)

* [官方网站](https://dify.ai)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

### 自定义域名
dify-api和dify-web需使用同一个自定义域名
路由配置：
![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/dify-web/src/images/dify1.png?raw=true)

### dify-web/.env

```sh
# 您可能需要自定义本文件中的以下参数来适应您的运行环境。

# NEXT_PUBLIC_API_PREFIX
# 说明：控制台 API 后端 URL，需配置为自定义域名https地址
# 示例：NEXT_PUBLIC_API_PREFIX=http://localhost:5001/console/api

# NEXT_PUBLIC_PUBLIC_API_PREFIX
# 说明：Service API URL，需配置为自定义域名https地址
# 示例：NEXT_PUBLIC_PUBLIC_API_PREFIX=http://localhost:5001/api

```

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 请求效果

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/dify-web/src/images/dify2.png?raw=true)

## 创建工作流应用
![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/dify-web/src/images/dify3.png?raw=true)

## 发布并运行
![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/dify-web/src/images/dify4.png?raw=true)

