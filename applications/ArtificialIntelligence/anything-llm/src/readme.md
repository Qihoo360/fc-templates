# 应用介绍

本案例是将 anything-llm ，快速创建并部署到函数计算 FC 。

这是一个全栈应用程序，可以将任何文档、资源（如网址链接、音频、视频）或内容片段转换为上下文，以便任何大语言模型（LLM）在聊天期间作为参考使用。此应用程序允许您选择使用哪个LLM或向量数据库，同时支持多用户管理并设置不同权限。

通过 Serverless 开发平台，您只需要几步，就可以体验 anything-llm 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/anything-llm/src)

* [官方网站](https://anythingllm.com)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

无

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 设置LLM 提供商

Base URL设置为api地址，例如：<https://oneapi-public.cn-north-cu-1-vpc.fc.zyunapp.com/v1>

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/anything-llm/src/images/anything-llm设置20240801091213.png?raw=true)

## 设置User

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/anything-llm/src/images/anything-llm-usersetup20240801091605.png?raw=true)

## 设置survey

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/anything-llm/src/images/anything-llm-SkipSurvey-20240801091923.png?raw=true)

## workspace 聊天

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/anything-llm/src/images/workspace聊天.png?raw=true)
