> 注：当前项目为 Stirling-PDF 应用

# Stirling-PDF

本案例是将 Stirling-PDF 快速创建并部署到函数计算（FC）。Stirling-PDF 是一个本地托管的开源 Web 应用程序，允许用户对 PDF 文件执行合并、拆分、加密等多种操作，用户可以利用 Stirling-PDF 丰富的功能，高效处理 PDF 文件。
所有文件和 PDF 要么完全存在于客户端，要么仅在任务执行期间驻留在服务器内存中，或者仅为执行任务而临时存在于文件中。用户下载的任何文件在那时都将从服务器中删除。

- [Stirling-PDF 应用代码](https://github.com/Qihoo360/fc-templates/tree/main/applications/file-processor/stirling-pdf/src)

## 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

| 服务/业务 |
| --------- |
| 函数计算  |

## 部署 & 体验

- 通过 智汇云官网 -> 产品列表 -> Serverless开发 -> 函数计算 FC，部署该应用。

## 案例介绍

![image-20240730195524608](./stirling-pdf/images/stirling-home-dark.png)

## 使用流程

### 📖 文档

- **Developer API**: 对于那些希望使用 Stirling-PDFs 后端 API, 通过他们自己的自定义脚本链接来编辑 PDFs 的人，你可以导航到你的 stirling-pdf 实例的 `/swagger-ui/index.html` 来获取你版本的文档（或者通过点击Stirling-PDF设置中的API按钮）。
- [用户手册](https://github.com/Stirling-Tools/Stirling-Tools.github.io)
- [FAQ](https://github.com/Stirling-Tools/Stirling-PDF#FAQ)

### PDF 功能

#### 页面操作

- 查看和修改 PDF - 查看多页 PDF，支持自定义查看、排序和搜索功能。还有页面编辑功能，如注释、绘图以及添加文本和图像。（使用 PDF.js，搭配 Joxit 和 Liberation 字体）
- 完全交互式 GUI，用于合并/拆分/旋转/移动 PDF 和其页面
- 将多个 PDF 合并成一个文件
- 在指定页码处将 PDF 拆分为多个文件或提取所有页面作为单独文件
- 重新组织 PDF 页面的顺序
- 按 90 度增量旋转 PDF
- 删除页面
- 多页布局（将 PDF 格式化为多页页面）
- 按设定百分比缩放页面内容
- 调整对比度
- 裁剪 PDF
- 自动拆分 PDF（使用物理扫描的页面分隔符）
- 提取页面
- 将 PDF 转换为单页文件

#### 转换操作

- 将 PDF 转换为图像，或将图像转换为 PDF
- 将任何常见文件转换为 PDF（使用 LibreOffice）
- 将 PDF 转换为 Word/PowerPoint/其他格式（使用 LibreOffice）
- 将 HTML 转换为 PDF
- URL 转换为 PDF
- Markdown 转换为 PDF

#### 安全与权限

- 添加和移除密码
- 更改/设置 PDF 权限
- 添加水印
- 认证/签署 PDF
- 清理 PDF
- 自动编辑文本

#### 其他操作

- 添加/生成/书写签名
- 修复 PDF
- 检测并删除空白页
- 比较两个 PDF 并显示文本差异
- 向 PDF 添加图像
- 压缩 PDF 以减少文件大小（使用 OCRMyPDF）
- 从 PDF 中提取图像
- 从扫描中提取图像
- 添加页码
- 通过检测 PDF 头部文本自动重命名文件
- 对 PDF 进行 OCR 处理（使用 OCRMyPDF）
- PDF/A 转换（使用 OCRMyPDF）
- 编辑元数据
- 平面化 PDF
- 获取 PDF 的所有信息以查看或导出为 JSON

有关任务和使用技术的概述，请查看 [Endpoint-groups](https://github.com/Stirling-Tools/Stirling-PDF/blob/main/Endpoint-groups.md)。
应用程序演示可在 [此处](https://stirlingpdf.io) 查看。
