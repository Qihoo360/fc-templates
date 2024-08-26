# 360智汇云函数计算：FC 案例

![图片alt](https://serverless-article-picture.oss-cn-hangzhou.aliyuncs.com/1638188206727_20211129121647053051.png)

<p align="center"><b> 中文 | <a href="./readme_en.md"> English </a>  </b></p>

## 本地快速体验

通过该应用，您可以简单快速的创建一个 FC 案例到360智汇云函数计算服务。

- 下载命令行工具：`npm install -g @serverless-devs/s`
- 初始化一个模版项目：`s init start-fc-http-python3`
- 进入项目后部署项目：`cd start-fc && s deploy`

## 包含内容
- built-in-runtime 案例（内置运行时）
  - event-function （事件函数）
    - golang
      - golang1.20
        - [fc-build-in-event-golang1.20](built-in-runtime/event-function/golang/golang1.20/fc-build-in-event-golang1.20/)
  - http-function（HTTP 函数）
    - golang
      - golang1.20
        - [fc-build-in-http-golang1.20](built-in-runtime/http-function/golang/golang1.20/fc-build-in-http-golang1.20/)
- custom-runtime 案例（自定义运行时）
  - event-function（事件函数）
    - golang
      - golang1.20
        - [fc-custom-event-golang1.20](custom-runtime/event-function/golang/golang1.20/fc-custom-event-golang1.20/)
  - http-function（HTTP 函数）
    - golang
      - golang1.20
        - [fc-custom-http-golang1.20](custom-runtime//http-function/golang/golang1.20/fc-custom-http-golang1.20/)
- Custom Container 案例（自定义容器镜像运行时）

---

> - 360智汇云函数计算FC交流群：
<BR>
<img src="./assets/tuitui-feedback-group.gif" alt="描述文字" width="100" height="100">
> - Serverless Devs 项目：https://www.github.com/serverless-devs/serverless-devs
> - Serverless Devs 文档：https://docs.serverless-devs.com
> - Serverless Devs 钉钉交流群：33947367
