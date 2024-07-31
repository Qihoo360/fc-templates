# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

### pandas-ai-server/.env

```sh
# Database
POSTGRES_URL=postgresql+asyncpg://pandasai:password123@postgresql:5432/pandasai-db
TEST_POSTGRES_URL=postgresql+asyncpg://pandasai:password123@postgresql:5432/pandasai-db
# PANDASAI_API_KEY=
# OPENAI_API_KEY= use only in case you want to use OpenAI else use PANDASAI_API_KEY
OPENAI_API_BASE=xxx
OPENAI_API_KEY=xxx

# Environment
ENVIRONMENT=development
DEBUG=1
SHOW_SQL_ALCHEMY_QUERIES=0
```

# 应用介绍

本案例是将 pandas-ai-server ，快速创建并部署到函数计算 FC 。

PandasAI 是一个 Python 库，可以轻松地用自然语言向数据提出问题。
除了查询之外，PandasAI 还提供通过图形可视化数据、通过解决缺失值清理数据集以及通过特征生成提高数据质量的功能，使其成为数据科学家和分析师的综合工具。

通过 Serverless 开发平台，您只需要几步，就可以体验 pandas-ai-server 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/main/applications/artificial-intelligence/pandas-ai-server/src)

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。
