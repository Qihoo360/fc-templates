# 应用介绍

本案例是将 speakr ，快速创建并部署到函数计算 FC 。

一款基于AI的会议助手，能够把我们会议录音转成文字、生成摘要，还能让我们通过聊天方式进行内容问答。

通过 Serverless 开发平台，您只需要几步，就可以体验 speakr 框架，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/artificial-intelligence/speakr/src)

* [官方网站](https://github.com/murtaza-nasir/speakr)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

llm api

transcription模型api

# 应用的使用说明



登录后，将文件拖到空白区域或点击 + New Recording 按钮上传音频文件

![image-20250522192731403](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/speakr/src/images/image-20250522192731403.png?raw=true)


上传完成后在 `Transcription` 区域可以看到从音频文件识别出来的文本内容，在 `Summary` 区域可以看到生成的摘要，在 `Chat with Transcript` 区域可以根据识别出来的文本进行问答。

![image-20250523141529453](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/speakr/src/images/image-20250523141529453.png?raw=true)
