> 注：当前项目为 n8n 应用

# n8n

n8n 是一个工作流自动化平台，为技术团队提供了代码的灵活性和无代码的速度。凭借 400 多个集成、原生 AI 功能和公平代码许可，n8n 让您能够构建强大的自动化流程，同时完全控制您的数据和部署。

- [n8n 应用代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/artificial-intelligence/n8n232/src)

## 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

| 服务/业务 |
| --------- |
| 函数计算  |

## 部署 & 体验

- 通过 智汇云官网 -> 产品列表 -> Serverless 开发 -> 函数计算 FC，部署该应用。

## 案例介绍

![image-20240806155157782](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/n8n232/src/n8n/assets/n8n-screenshot-readme.png?raw=true)

![image-202408061552222](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/n8n232/src/n8n/assets/n8n-screenshot.png?raw=true)

## 使用流程

### 📌 配置

> 请在开始使用之前进行如下设置。否则，请先备份 **n8n** 内的相关配置，再进行变量更新。

- 应用启动成功以后，跳转到 **函数计算** 页面修改环境变量，主要涉及添加如下环境变量：

  - `N8N_EDITOR_BASE_URL`: n8n 应用在函数计算实例的 `https` 触发器地址
  - `N8N_HOST`: n8n 应用在函数计算实例的 host

### 📖 文档

- [n8n 使用手册](https://docs.n8n.io/)

### 👋 特点

- **按需编写代码**：使用 JavaScript/Python 编写代码，添加 npm 包，或使用可视化界面
- **原生 AI 平台**：基于 LangChain 构建 AI 代理工作流，使用您自己的数据和模型
- **完全控制**：使用我们的公平代码许可自托管，或使用我们的云服务
- **企业级**：高级权限、SSO 和隔离部署
- **活跃社区**：400 多个集成和 900 多个即用模板
