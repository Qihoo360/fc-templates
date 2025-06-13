> 注：当前项目为 RagFlow 应用

# RagFlow

![RagFlow](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/ragflow/src/ragflow/images/ragflow.png?raw=true)
本案例是将 RagFlow 快速创建并部署到函数计算（FC）。RagFlow 是一款基于深度文档理解构建的开源 RAG（Retrieval-Augmented Generation）引擎。RAGFlow 可以为各种规模的企业及个人提供一套精简的 RAG 工作流程，结合大语言模型（LLM）针对用户各类不同的复杂格式数据提供可靠的问答以及有理有据的引用。

- [RagFlow 应用代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/artificial-intelligence/ragflow/src)

## 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

| 服务/业务 |
| --------- |
| 函数计算  |

## 部署 & 体验

- 通过 智汇云官网 -> 产品列表 -> Serverless开发 -> 函数计算 FC，部署该应用。

## 案例介绍

![2f6baa3e-1092-4f11-866d-36f6a9d075e5](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/ragflow/src/ragflow/images/2f6baa3e-1092-4f11-866d-36f6a9d075e5.png?raw=true)
![504bbbf1-c9f7-4d83-8cc5-e9cb63c26db6](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/ragflow/src/ragflow/images/504bbbf1-c9f7-4d83-8cc5-e9cb63c26db6.gif?raw=true)


## 使用流程

### 📖 文档

- [RagFlow 文档](https://docs.RagFlowai.com/)
- [RagFlow 开源项目地址](https://github.com/RagFlowAI/RagFlow)

### 📝 前提条件

- CPU >= 4 核
- RAM >= 16 GB
- Disk >= 50 GB

## 🌟 主要功能

### 🍭 **"Quality in, quality out"**

- 基于[深度文档理解](https://github.com/infiniflow/ragflow/blob/main/deepdoc/README.md)，能够从各类复杂格式的非结构化数据中提取真知灼见。
- 真正在无限上下文（token）的场景下快速完成大海捞针测试。

### 🍱 **基于模板的文本切片**

- 不仅仅是智能，更重要的是可控可解释。
- 多种文本模板可供选择

### 🌱 **有理有据、最大程度降低幻觉（hallucination）**

- 文本切片过程可视化，支持手动调整。
- 有理有据：答案提供关键引用的快照并支持追根溯源。

### 🍔 **兼容各类异构数据源**

- 支持丰富的文件类型，包括 Word 文档、PPT、excel 表格、txt 文件、图片、PDF、影印件、复印件、结构化数据、网页等。

### 🛀 **全程无忧、自动化的 RAG 工作流**

- 全面优化的 RAG 工作流可以支持从个人应用乃至超大型企业的各类生态系统。
- 大语言模型 LLM 以及向量模型均支持配置。
- 基于多路召回、融合重排序。
- 提供易用的 API，可以轻松集成到各类企业系统。

### 🔎 系统架构

![317212466-d6ac5664-c237-4200-a7c2-a4a00691b485](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/ragflow/src/ragflow/images/317212466-d6ac5664-c237-4200-a7c2-a4a00691b485.png?raw=true)