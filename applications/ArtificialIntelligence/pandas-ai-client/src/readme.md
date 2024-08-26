# 应用介绍

本案例是将 pandas-ai-client ，快速创建并部署到函数计算 FC 。

PandasAI 是一个 Python 库，可以轻松地用自然语言向数据提出问题。
除了查询之外，PandasAI 还提供通过图形可视化数据、通过解决缺失值清理数据集以及通过特征生成提高数据质量的功能，使其成为数据科学家和分析师的综合工具。

通过 Serverless 开发平台，您只需要几步，就可以体验 pandas-ai-client 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/pandas-ai-client/src)

* [官方网站](https://pandas-ai.com)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

### pandas-ai-client/.env

```sh
# 您可能需要自定义本文件中的以下参数来适应您的运行环境。
# NEXT_PUBLIC_API_URL
# 说明:配置后端服务器pandas-ai-server地址
# 示例:NEXT_PUBLIC_API_URL='http://localhost:8000/'

# THE URL OF YOUR CLIENT
NEXT_PUBLIC_API_URL='http://localhost:8000/'

# ENVIRONMENT
NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN="development"

# ANALYTICS
NEXT_PUBLIC_MIXPANEL_TOKEN="04a81d58ade99299e19e5a89fe84c670"
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-SD7MBGS6J9"

# SUPPORT CHAT
NEXT_PUBLIC_INTERCOM_APP_ID="jzfk3qc5"

# ENV
NODE_ENV="development"
```

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 请求效果

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/pandas-ai-client/src/images/pandas-ai-client-20240730203453.png?raw=true)
