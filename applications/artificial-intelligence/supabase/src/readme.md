# 应用介绍

本案例是将 [supabase](https://supabase.com) ，快速创建并部署到`函数计算 FC` 。

Supabase 是一个开源的 `Firebase` 替代品，基于 `PostgreSQL` 数据库构建，提供了一系列开发者工具和功能。它包含实时数据库、身份认证、存储、API 自动生成（通过 PostgREST）和边缘函数等核心服务。 `Supabase` 的优势在于完全开源、可自托管，同时提供云托管服务，支持灵活的扩展和定制。  

其数据库采用 PostgreSQL，支持 SQL 查询和实时订阅；身份认证集成多种登录方式（如 OAuth、Magic Link）；存储服务允许管理文件并生成 CDN 链接。Supabase 还提供客户端库（JavaScript/Flutter 等），简化开发流程。  

社区活跃，文档完善，适合需要高性能、可扩展后端的项目。既适合小规模应用快速搭建，也支持企业级需求，是现代化全栈开发的优选之一。

* [应用代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/artificial-intelligence/supabase/)

## 前期准备

使用该项目时，您需要有开通以下服务并拥有对应权限：

* 函数计算

## 部署 & 体验

* 根据路径 `智汇云官网 -> 产品列表 -> Serverless开发 -> 函数计算 FC` 部署该应用。

### 资源规格

- CPU >= 4 核
- RAM >= 16 GB
- Disk >= 50 GB

### 依赖部署 (TODO)

#### Postgres

## 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器 URL 。
此时，使用浏览器或者 `curl` 工具， 就可以对触发器 URL 进行请求。

## 部署完成示例

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/supabase/src/supabase_console.png)
