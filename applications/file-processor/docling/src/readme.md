# 应用介绍

本案例是将 docling，快速创建并部署到函数计算 FC 。

一个利用人工智能技术进行高精度PDF文档转换并维护复杂布局结构完整性的工具。

通过 Serverless 开发平台，您只需要几步，就可以体验 docling 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/docling/src)

* [官方网站](https://ds4sd.github.io/docling/)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

nas

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。 此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## NAS 配置

我们为 docling 配置了专门的目录 /mnt/docling/output ，只需将此目录挂载到 NAS 上，docling 就会将转换生成的文件保存到此目录

## 使用docling

![image-20241223221943174](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/docling/images/image-20241223221943174.png?raw=true)

* 在页面上 file 窗口内上传文件：

![image-20241223222200258](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/docling/images/image-20241223222200258.png?raw=true)

* 在 from 文本框内输入上传的文件的类型， 在 to 文本框内输入转换后的文件类型。from 文本框为空时，则默认为自动检测输入文件类型； to 文本框为空时， 则默认转换为 markdown 文件

* 击 Submit 提交后即可开始文件转换，右侧 output 窗口内会显示进度：

![image-20241223222808878](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/docling/images/image-20241223222808878.png?raw=true)

* 转换完成后可下载输出文件：

![image-20241223222925789](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/docling/images/image-20241223222925789.png?raw=true)
