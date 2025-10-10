# 应用介绍

本案例是将 **SQLBot** 快速创建并部署到函数计算 FC。

SQLBot 是一款基于 AI 的智能数据查询助手，能够让您通过自然语言与数据库交互。
用户只需输入一句话（例如 “查看上个月的销售额”），SQLBot 即可自动生成 SQL 查询语句，执行并返回结果。
同时支持结果可视化展示、查询历史记录管理、以及多数据库连接管理等功能。

通过 Serverless 开发平台，您只需要几步，就可以体验 SQLBot 框架，并享受 Serverless 架构带来的降本提效的技术红利。

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/artificial-intelligence/sql-bot/src/code/sql-bot)
* [官方网站](https://github.com/dataease/SQLBot)

---

# 前期准备

使用该项目，您需要开通以下服务并拥有对应权限：

* 函数计算（Function Compute, FC）
* 数据库（PostgreSQL）
* 对应数据库的访问凭证（Host、Port、User、Password）

---

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 -> 函数计算 FC，部署该应用。

---

## 配置依赖

在部署前，您需要配置以下依赖项：

* **数据库连接信息**：包括地址、端口、用户名、密码、数据库名称
* **LLM API**：用于自然语言转 SQL 的模型接口
* **认证信息（可选）**：如 JWT Secret、管理员账号等

---

# 应用的使用说明

默认登陆的账号和密码为：
> 用户名：admin
> 默认密码：SQLBot@123456

登录系统后，进入 SQLBot 主界面。

您可以在页面顶部的输入框中直接输入自然语言问题，例如：

> “查看最近 7 天的订单量趋势”
> “统计每个地区的销售额”
> “删除无效用户数据”

系统将自动识别意图，生成 SQL 查询，并在页面中展示执行结果。
如果是可视化查询，还会自动生成图表展示数据趋势。

![image-20250523141529453](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/artificial-intelligence/sql-bot/src/images/data.png?raw=true)

---

## 主要功能

* 🧠 **自然语言转 SQL**：无需手写 SQL，即可完成数据查询
* 🗃️ **多数据库支持**：支持 MySQL、PostgreSQL、SQLServer 等
* 📊 **可视化展示**：自动生成图表、表格
* 🔒 **安全隔离**：支持用户权限与数据库访问控制
* 🧾 **查询历史**：保留查询记录，便于复用与审计
* ⚙️ **Serverless 部署**：轻量、弹性、高可用

