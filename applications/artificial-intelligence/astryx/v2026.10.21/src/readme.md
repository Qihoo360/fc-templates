# 应用介绍

本案例是将 [Astryx](https://github.com/facebook/astryx)，快速创建并部署到函数计算 FC。

Astryx 是 Meta 开源的 React 设计系统，提供一套可主题化、无障碍（a11y）的 React 组件库。本案例部署的是它的**完整官方文档站**，包含四个入口：

| 入口 | 路径 | 说明 |
| --- | --- | --- |
| 文档站 | `/` | 700+ 组件的 API 文档、设计原则、主题与模板说明 |
| Storybook | `/storybook/` | 组件浏览器，可切换 8 套主题、明暗模式与 RTL 方向 |
| 交互沙盒 | `/sandbox/` | 真实运行组件的交互式 Playground |
| MCP 服务 | `/mcp` | Model Context Protocol 服务，供 AI Agent 查询组件文档 |

* [官方网站](https://astryx.atmeta.com/)
* [GitHub 仓库](https://github.com/facebook/astryx)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。
* 部署完成后，打开函数详情页的「域名」访问上述四个入口。

## MCP 令牌

部署时必须填写 **MCP 访问令牌**（`MCP_TOKEN`）：

* 该令牌是 `/mcp` 的唯一凭证，**留空会导致实例启动失败**。
* 令牌在部署时自动随机生成，如需自定义请在「MCP 服务 → MCP 访问令牌」中填写。
* 调用时通过 `Authorization` 请求头传递，未携带或错误一律返回 `401`。

```sh
# 列出可用 MCP 工具（search / get）
curl -X POST \
  -H "Authorization: Bearer <你的 MCP_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  https://<函数域名>/mcp
```

MCP 服务提供两个工具：

* `search`：按自然语言检索组件、文档主题与页面模板。
* `get`：获取指定组件 / 主题 / 模板的完整文档（props、用法、示例代码）。

在支持 MCP 的客户端（如 Claude Code）中配置：

```json
{
  "mcpServers": {
    "astryx": {
      "type": "http",
      "url": "https://<函数域名>/mcp",
      "headers": { "Authorization": "Bearer <你的 MCP_TOKEN>" }
    }
  }
}
```

# 注意事项

* **无持久化存储**：Astryx 文档站是无状态的只读服务，无需挂载存储卷。
* **规格建议**：Next.js 生产服务常驻内存约 600MB～1GB，默认已按 2 核 / 4096MB 部署；如访问量较大建议上调至 8192MB。
* **网络限制**：函数触发器默认关闭公网访问，因此文档站引用的 Google Fonts 与 Vercel Analytics 等外部资源不会加载，页面会自动回退到系统字体，不影响功能使用。
