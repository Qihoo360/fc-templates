# 应用介绍

本案例是将 PyMuPDF，快速创建并部署到函数计算 FC 。

PyMuPDF是一个强大的Python库，用于处理PDF和其他图形文件格式。

通过 Serverless 开发平台，您只需要几步，就可以体验 PyMuPDF 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/main/applications/file-processor/pymupdf/src)

* [官方网站](https://pymupdf.io/)

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

我们为 PyMuPDF 配置了专门的目录 /tmp/output ，只需将此目录挂载到 NAS 上，PyMuPDF 就会将转换生成的文件保存到此目录

## 使用 PyMuPDF

![image-20241224120814479](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/file-processor/pymupdf/src/images/image-20241224120814479.png?raw=true)

* 在页面上 file 窗口内上传文件：

![image-20241224120854702](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/file-processor/pymupdf/src/images/image-20241224120854702.png?raw=true)

* 击 Submit 提交后即可开始文件转换，右侧 output 窗口内会显示进度，转换完成后可下载输出文件：

![image-20241224120929473](https://github.com/Qihoo360/fc-templates/blob/feature/main/applications/file-processor/pymupdf/src/images/image-20241224120929473.png?raw=true)
