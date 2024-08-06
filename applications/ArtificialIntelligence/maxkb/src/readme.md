> 注：当前项目为 MaxKB 应用

# MaxKB

MaxKB（Max Knowledge Base）是一个基于 LLM 大语言模型的开源知识库问答系统。它开箱即用，模型中立，支持灵活编排，能够快速嵌入到第三方业务系统中。MaxKB 提供高效的知识管理和检索功能，支持多种文档格式和分类标签，帮助用户轻松组织和查找信息。其直观的用户界面和强大的全文搜索能力，使其成为企业和个人知识管理的理想选择。通过 MaxKB，用户可以构建一个智能化的知识库系统，以满足各种复杂的知识管理需求。

- [MaxKB 应用代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/maxkb/src)

## 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

| 服务/业务 |
| --------- |
| 函数计算  |

## 部署 & 体验

- 通过 [Serverless 应用中心](https://console.zyun.qihoo.net/fc), 部署该应用。

## 案例介绍

![image-20240806155157782](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/maxkb/src/maxkb/images/image-20240806155157782.png)

![image-20240806155228551](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/maxkb/src/maxkb/images/image-20240806155228551.png)

![image-20240806155255612](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/maxkb/src/maxkb/images/image-20240806155255612.png)

![image-20240806155313528](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/maxkb/src/maxkb/images/image-20240806155313528.png)

![image-20240806155355973](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/maxkb/src/maxkb/images/image-20240806155355973.png)

## 使用流程

### ❗初始信息

- **用户名：`admin`**
- **密码：`MaxKB@123..`**

### 📖 文档

- [MaxKB 官网](https://maxkb.cn/)
- [MaxKB 使用手册](https://maxkb.cn/docs/)

### 👋 特点

- **开箱即用**：支持直接上传文档、自动爬取在线文档，支持文本自动拆分、向量化、RAG（检索增强生成），智能问答交互体验好；
- **模型中立**：支持对接各种大语言模型，包括本地私有大模型（Llama 3 / Qwen 2 等）、国内公共大模型（通义千问 / 智谱 AI / 百度千帆 / Kimi / DeepSeek 等）和国外公共大模型（OpenAI / Azure OpenAI / Gemini 等）；
- **灵活编排**：内置强大的工作流引擎，支持编排 AI 工作过程，满足复杂业务场景下的需求；
- **无缝嵌入**：支持零编码快速嵌入到第三方业务系统，让已有系统快速拥有智能问答能力，提高用户满意度。