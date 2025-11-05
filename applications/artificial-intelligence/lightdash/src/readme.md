# 应用介绍

本案例展示了如何快速将 **Lightdash 数据可视化平台** 部署到函数计算 FC 或自有服务器环境中。

Lightdash 是一款开源的 **数据可视化与 BI 平台**，能够帮助企业轻松地将数据仓库中的数据转换为可视化报表和仪表盘，实现数据探索与分析。

Lightdash 支持与多种数据仓库兼容（如 **Snowflake、BigQuery、PostgreSQL、Databricks** 等），开发者可以通过 SQL 或现成的模型（dbt）快速构建数据分析项目。

* [官方 GitHub 仓库](https://github.com/lightdash/lightdash)
* [官方文档](https://docs.lightdash.com/)

---

# 前期准备

使用 Lightdash，您需要开通以下服务或具备以下条件：

* 函数计算（Function Compute, FC）或自有服务器
* 网络访问权限（确保 Lightdash 可访问数据库和外部资源）
* 数据仓库账号（如 PostgreSQL、Snowflake 等，用于存储分析数据）
* 可选：Prometheus + Grafana（用于监控指标）

---

# 部署 & 体验

## 1. 部署服务
- 通过 智汇云官网 -> 产品列表 -> Serverless开发 -> 函数计算 FC，部署该应用。
---

## 2. 验证服务

访问浏览器：

```
http://xxx
```

如果可以看到 Lightdash 登录页面，说明服务已经启动成功。

> ⚙️ **默认账号**：
>
> * 用户名：`admin@example.com`
> * 密码：`password`

登录后即可连接你的数据仓库，开始创建报表与仪表盘。

---

# 示例：创建报表

1. 连接数据仓库（选择 PostgreSQL、Snowflake 等）
2. 选择目标表或模型（支持 dbt 项目）
3. 创建新的图表，例如：

   * 折线图显示每日销售趋势
   * 条形图显示各产品类别销量
4. 将图表添加到仪表盘，支持实时刷新和过滤条件

---

# 主要功能

* 📊 **数据可视化与仪表盘**：折线图、条形图、饼图、表格等多种图表
* 🔄 **实时数据探索**：直接查询数据仓库，支持 SQL 与模型构建
* 🧩 **开源可扩展**：可自定义插件和 SQL 查询逻辑
* 🧠 **与 dbt 集成**：可直接使用 dbt 模型定义指标和维度
* 🔒 **权限控制**：支持团队和项目权限管理
* 📈 **监控与分析**：结合 Prometheus、Grafana 实现系统和指标监控
