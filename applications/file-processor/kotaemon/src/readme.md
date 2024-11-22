# 应用介绍

本案例是将 kotaemon ，快速创建并部署到函数计算 FC 。

一个能让你与文档进行对话的开源工具，基于 RAG 技术实现与文档的交互式对话，支持多模态检索，可以处理文本、图表和表格等不同类型的数据。

通过 Serverless 开发平台，您只需要几步，就可以体验 kotaemon 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/kotaemon/src)

* [官方网站](https://cinnamon.github.io/kotaemon/)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

one-api

# 应用的使用说明

## 配置

注意：首次进入页面时必须选择对应的模型，如要使用的是 OpenAI/OneAPI ，则先选择 OpenAI API ，
再点击 I am an advance user. Skip this 进行登录（如下图所示），否则登录后聊天窗口中点击 Send 没反应，后台会报错。

![image-20241122141122254](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/kotaemon/src/images/image-20241122141122254.png?raw=true)

初始登陆用户名/密码：admin/admin

在 Resources 中配置 LLM：

![image-20241114141342639](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/kotaemon/src/images/image-20241114141342639.png?raw=true)

在 Resources 中配置 Embeddings：

![image-20241114141508266](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/kotaemon/src/images/image-20241114141508266.png?raw=true)

Retrieval settings 中取消勾选 Use reranking（若在 Resources 中配置了可用的 reranking 则无需取消勾选）:

![image-20241114152135733](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/kotaemon/src/images/image-20241114152135733.png?raw=true)

## 使用

上传文件：

![image-20241114152249437](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/kotaemon/src/images/image-20241114152249437.png?raw=true)

chat：

![image-20241114152344973](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/kotaemon/src/images/image-20241114152344973.png?raw=true)
