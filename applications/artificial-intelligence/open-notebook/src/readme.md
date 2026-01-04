# 应用介绍

本案例是将 open-notebook，快速创建并部署到函数计算 FC 。

open-notebook 是注重隐私的 AI 笔记工具，旨在作为 Google Notebook LM 的替代品，提供更灵活的功能和更强的自定义能力。

通过 Serverless 开发平台，您只需要几步，就可以体验 open-notebook，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/ArtificialIntelligence/open-notebook/src)

* [官方网站](https://www.open-notebook.ai/)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

**注意：**目前只支持 http 触发器访问，不支持 https。

## 使用

应用部署成功后访问 open-notebook-frontend http 触发器地址（暂不支持 https 触发器访问）。

**配置模型：**

![image-20260104175702273](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/open-notebook/src/images/image-20260104175702273.png?raw=true)



**创建 notebook：**

![image-20260104180019742](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/open-notebook/src/images/image-20260104180019742.png?raw=true)


**点击创建的 notebook，点击 Add Source 创建 source**

![image-20260104180618849](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/open-notebook/src/images/image-20260104180618849.png?raw=true)


![image-20260104180727187](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/open-notebook/src/images/image-20260104180727187.png?raw=true)


**Chat：**

![image-20260104180942402](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/artificial-intelligence/open-notebook/src/images/image-20260104180942402.png?raw=true)



