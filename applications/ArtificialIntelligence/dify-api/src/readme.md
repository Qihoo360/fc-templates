# 应用介绍

本案例是将 dify ，快速创建并部署到函数计算 FC 。

Dify 是一款开源的大语言模型(LLM) 应用开发平台。它融合了后端即服务（Backend as Service）和 LLMOps 的理念，使开发者可以快速搭建生产级的生成式 AI 应用。即使你是非技术人员，也能参与到 AI 应用的定义和数据运营过程中。
由于 Dify 内置了构建 LLM 应用所需的关键技术栈，包括对数百个模型的支持、直观的 Prompt 编排界面、高质量的 RAG 引擎、稳健的 Agent 框架、灵活的流程编排，并同时提供了一套易用的界面和 API。这为开发者节省了许多重复造轮子的时间，使其可以专注在创新和业务需求上。

通过 Serverless 开发平台，您只需要几步，就可以体验 dify 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/dify-api/src)

* [官方网站](https://dify.ai)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

###  依赖部署
Clone Dify 代码：
```
git clone https://github.com/langgenius/dify.git
git checkout f83ed19dfe14516304be4092aba9435fe89a68e2
```
在启用业务服务之前，我们需要先部署 PostgresSQL / Redis / Weaviate（如果本地没有的话），可以通过以下命令启动
```
cd docker
cp middleware.env.example middleware.env
docker compose -f docker-compose.middleware.yaml up -d
```

### 自定义域名
dify-api和dify-web需使用同一个自定义域名
路由配置：
![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/dify-api/src/images/dify1.png?raw=true)

### dify-api/.env

```sh
# 您可能需要自定义本文件中的以下参数来适应您的运行环境。

# SECRET_KEY
# 说明：一个用于安全地签名会话 cookie 并在数据库上加密敏感信息的密钥。初次启动需要设置改变量。可以运行openssl rand -base64 42生成一个强密钥
# 示例：SECRET_KEY=xxx

# CONSOLE_API_URL
# 说明：控制台 API 后端 URL，用于拼接授权回调，需配置为自定义域名https地址
# 示例：CONSOLE_API_URL=http://127.0.0.1:5001

# SERVICE_API_URL
# 说明：Service API URL，用于给前端展示 Service API Base URL，需配置为自定义域名https地址
# 示例：SERVICE_API_URL=http://127.0.0.1:5001

# CELERY_BROKER_URL
# 说明：Celery broker地址
# 示例：CELERY_BROKER_URL=redis://:difyai123456@localhost:6379/1

# REDIS_HOST
# 说明：redis地址 用于缓存以及对话时的 pub/sub
# 示例：REDIS_HOST=localhost

# DB_HOST
# 说明：postgres地址
# 示例：DB_HOST=localhost

# S3_ENDPOINT
# S3_BUCKET_NAME
# S3_ACCESS_KEY
# S3_SECRET_KEY
# S3_REGION
# 说明：S3存储相关配置
# 示例：
# S3_ENDPOINT=https://your-bucket-name.storage.s3.clooudflare.com
# S3_BUCKET_NAME=your-bucket-name
# S3_ACCESS_KEY=your-access-key
# S3_SECRET_KEY=your-secret-key
# S3_REGION=your-region


# WEAVIATE_ENDPOINT
# 说明：向量数据库Weaviate端点地址
#示例：WEAVIATE_ENDPOINT=http://localhost:8080

# CODE_EXECUTION_ENDPOINT
# 说明：代码执行服务端点地址
# 示例：CODE_EXECUTION_ENDPOINT=http://127.0.0.1:8194

```

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 请求效果

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/dify-api/src/images/dify2.png?raw=true)
