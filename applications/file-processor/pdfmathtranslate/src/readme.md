# 应用介绍

本案例是将 pdfmathtranslate ，快速创建并部署到函数计算 FC 。

完整保留排版的 PDF 文档全文双语翻译，提供图形化交互界面，支持 Google/DeepL/Azure/Ollama/OpenAI 服务

通过 Serverless 开发平台，您只需要几步，就可以体验 pdfmathtranslate 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/file-processor/pdfmathtranslate/src)

* [官方网站](https://github.com/Byaidu/PDFMathTranslate)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

参考https://github.com/opendatalab/MinerU/blob/master/docs/how_to_download_models_zh_cn.md
方法二 从 ModelScope 下载模型
然后复制hub目录到nas卷根目录


# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 效果

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/pdfmathtranslate/src/images/pdfmathtranslate1.png?raw=true)

目前仅支持google翻译

![image.png](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/file-processor/pdfmathtranslate/src/images/pdfmathtranslate2.png?raw=true)

