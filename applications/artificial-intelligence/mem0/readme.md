# Mem0

Mem0 是一个基于 LLM 大语言模型的开源记忆管理系统。它提供了强大的记忆存储和检索功能，支持向量存储和图存储，能够无缝集成到 AI 应用和智能代理中。Mem0 开箱即用，模型中立，支持多种后端存储，是构建有记忆能力的智能应用的理想选择。

![Mem0 Logo](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/mem0/src/images/mem0-bg.png?raw=true)

## 前期准备

使用该项目，您需要准备以下服务：

| 服务/业务 | 用途 |
| --------- | ---- |
| Redis | 向量存储 |
| Neo4j | 图存储（可选） |
| OpenAI API 密钥 | LLM 和嵌入模型 |

## 部署 & 体验

- 通过 智汇云官网 -> 产品列表 -> Serverless开发 -> 函数计算 FC，部署该应用。

## 配置依赖

### 依赖部署

该应用依赖服务：

- Redis
- Neo4j
- OpenAI API 密钥

### API 服务访问

部署完成后，可通过以下地址访问 API 文档：

```
http://localhost:8000/docs
```

## 架构介绍

![架构图](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/mem0/src/images/stateless-vs-stateful-agent.png?raw=true)

Mem0 采用模块化设计，主要包含以下组件：

- **向量存储**：使用 Redis 实现高效的语义搜索
- **图存储**：使用 Neo4j 存储记忆之间的复杂关系
- **LLM 接口**：支持各种大语言模型
- **嵌入模型**：将文本转化为向量表示
- **历史记录**：追踪记忆的变更历史
- **REST API**：提供易用的 HTTP 接口

## 核心功能

### 记忆管理

- **添加记忆**：存储对话消息和相关元数据
- **检索记忆**：支持语义搜索和精确查询
- **更新记忆**：修改已存储的记忆
- **删除记忆**：移除不再需要的记忆

### 高级特性

- **语义搜索**：基于向量相似度的智能搜索
- **关系追踪**：通过图存储记录记忆之间的关联
- **版本控制**：记忆的完整修改历史
- **多维过滤**：基于用户 ID、代理 ID 等过滤结果

## 使用示例

### 添加记忆

```bash
curl -X POST "http://localhost:8000/memories" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "我喜欢看科幻电影"},
      {"role": "assistant", "content": "有什么特定的科幻电影类型你更喜欢吗？"}
    ],
    "user_id": "user123",
    "agent_id": "agent456",
    "metadata": {"category": "preferences", "priority": "medium"}
  }'
```

### 搜索记忆

```bash
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "用户喜欢什么类型的电影？",
    "user_id": "user123"
  }'
```

## 配置参数

Mem0 支持通过环境变量或配置 API 进行灵活配置：

```python
DEFAULT_CONFIG = {
  "version": "v1.1",
  "vector_store": {
    "provider": "redis",
    "config": {
      "collection_name": "mem0",
      "embedding_model_dims": 1536,
      "redis_url": "redis://:mypassword@localhost:6379"
    }
  },
  "graph_store": {
    "provider": "neo4j",
    "config": {
      "url": "bolt://neo4j:7687", 
      "username": "neo4j", 
      "password": "mem0graph", 
      "database": "neo4j"
    }
  },
  "llm": {
    "provider": "openai", 
    "config": {
      "api_key": "YOUR_OPENAI_API_KEY", 
      "temperature": 0.2, 
      "model": "gpt-4o",
      "max_tokens": 2000
    }
  },
  "embedder": {
    "provider": "openai", 
    "config": {
      "api_key": "YOUR_OPENAI_API_KEY", 
      "model": "text-embedding-3-small",
      "max_tokens": 2000
    }
  },
  "history_db_path": "/app/history/history.db"
}
```

## 特点

- **开箱即用**：简单配置后即可快速部署和使用
- **模型中立**：支持多种 LLM 和嵌入模型，易于扩展
- **灵活存储**：支持 Redis 向量存储和 Neo4j 图存储
- **完整 API**：提供全面的 REST API，易于与其他系统集成
- **历史追踪**：支持记忆的版本控制和变更记录
- **多维度组织**：通过用户 ID、代理 ID 和自定义元数据组织记忆

## 文档

- [Mem0 API 文档](http://localhost:8000/docs)
- [完整使用文档](https://docs.mem0.ai/)
- [开发者指南](https://docs.mem0.ai/developer-guide)

## 用例

- **智能助手**：为聊天机器人提供长期记忆
- **知识管理**：构建个性化知识库
- **用户偏好追踪**：记录和利用用户偏好和习惯
- **上下文管理**：在复杂对话中保持上下文连贯
- **多回合推理**：支持需要历史信息的复杂推理任务

## 贡献

欢迎通过以下方式参与 Mem0 项目：

- 提交 Issue 报告 Bug 或提出新功能
- 提交 Pull Request 贡献代码
- 完善文档和示例

## 许可证

Mem0 采用 [MIT 许可证](LICENSE)。