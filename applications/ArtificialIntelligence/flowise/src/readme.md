> 注：当前项目为 flowise 应用

# Flowise

![flowise](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/flowise/src/flowise/images/flowise.png?raw=true)
本案例是将 Flowise 快速创建并部署到函数计算（FC）。Flowise 是一个开源项目，提供可视化工具，通过拖拽 UI 轻松构建自定义 LLM 流程，它的优势在于简化了 AI 模型的设计和运行过程。

- [Flowise 应用代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/flowise/src)

## 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

| 服务/业务 |
| --------- |
| 函数计算  |

## 部署 & 体验

- 通过 智汇云官网 -> 产品列表 -> Serverless开发 -> 函数计算 FC，部署该应用。

## 案例介绍

**拖放界面构建定制化的LLM流程**

![flowise](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/flowise/src/flowise/images/flowise.gif?raw=true)
![image-20240730180936849](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/flowise/src/flowise/images/image-20240730180936849.png?raw=true)
![image-20240730181011132](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/flowise/src/flowise/images/image-20240730181011132.png?raw=true)
![image-20240730181126230](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/ArtificialIntelligence/flowise/src/flowise/images/image-20240730181126230.png?raw=true)

## 使用流程

### 📖 文档

[Flowise 文档](https://docs.flowiseai.com/)
[Flowise 开源项目地址](https://github.com/FlowiseAI/Flowise)

### 🔒 认证

要启用应用程序级身份验证，在创建部署应用之前设置`configfile`，下载`.env.example` 文件进行变量设置， *认证*主要涉及的变量是`FLOWISE_USERNAME` 和 `FLOWISE_PASSWORD`：

```bash
FLOWISE_USERNAME=user
FLOWISE_PASSWORD=1234
```

### 🌱 环境变量

Flowise 支持不同的环境变量来配置您的实例。您可以通过设置 `configfile` 修改`.env.example`文件指定以下变量。阅读[更多信息](https://docs.flowiseai.com/environment-variables)

| 变量名                       | 描述                                                         | 类型                                            | 默认值                              |
| ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------- | ----------------------------------- |
| PORT                         | Flowise 运行的 HTTP 端口                                     | 数字                                            | 8080                                |
| FLOWISE_USERNAME             | 登录用户名                                                   | 字符串                                          |                                     |
| FLOWISE_PASSWORD             | 登录密码                                                     | 字符串                                          |                                     |
| FLOWISE_FILE_SIZE_LIMIT      | 上传文件大小限制                                             | 字符串                                          | 50mb                                |
| DISABLE_CHATFLOW_REUSE       | 强制为每次调用创建一个新的 ChatFlow，而不是重用缓存中的现有 ChatFlow | 布尔值                                          |                                     |
| DEBUG                        | 打印组件的日志                                               | 布尔值                                          |                                     |
| LOG_PATH                     | 存储日志文件的位置                                           | 字符串                                          | `your-path/Flowise/logs`            |
| LOG_LEVEL                    | 日志的不同级别                                               | 枚举字符串: `error`, `info`, `verbose`, `debug` | `info`                              |
| APIKEY_PATH                  | 存储 API 密钥的位置                                          | 字符串                                          | `your-path/Flowise/packages/server` |
| TOOL_FUNCTION_BUILTIN_DEP    | 用于工具函数的 NodeJS 内置模块                               | 字符串                                          |                                     |
| TOOL_FUNCTION_EXTERNAL_DEP   | 用于工具函数的外部模块                                       | 字符串                                          |                                     |
| DATABASE_TYPE                | 存储 flowise 数据的数据库类型                                | 枚举字符串: `sqlite`, `mysql`, `postgres`       | `sqlite`                            |
| DATABASE_PATH                | 数据库保存的位置（当 DATABASE_TYPE 是 sqlite 时）            | 字符串                                          | `your-home-dir/.flowise`            |
| DATABASE_HOST                | 主机 URL 或 IP 地址（当 DATABASE_TYPE 不是 sqlite 时）       | 字符串                                          |                                     |
| DATABASE_PORT                | 数据库端口（当 DATABASE_TYPE 不是 sqlite 时）                | 字符串                                          |                                     |
| DATABASE_USERNAME            | 数据库用户名（当 DATABASE_TYPE 不是 sqlite 时）              | 字符串                                          |                                     |
| DATABASE_PASSWORD            | 数据库密码（当 DATABASE_TYPE 不是 sqlite 时）                | 字符串                                          |                                     |
| DATABASE_NAME                | 数据库名称（当 DATABASE_TYPE 不是 sqlite 时）                | 字符串                                          |                                     |
| SECRETKEY_PATH               | 保存加密密钥（用于加密/解密凭据）的位置                      | 字符串                                          | `your-path/Flowise/packages/server` |
| FLOWISE_SECRETKEY_OVERWRITE  | 加密密钥用于替代存储在 SECRETKEY_PATH 中的密钥               | 字符串                                          |                                     |
| DISABLE_FLOWISE_TELEMETRY    | 关闭遥测                                                     | 字符串                                          |                                     |
| MODEL_LIST_CONFIG_JSON       | 加载模型的位置                                               | 字符                                            | `/your_model_list_config_file_path` |
| STORAGE_TYPE                 | 上传文件的存储类型                                           | 枚举字符串: `local`, `s3`                       | `local`                             |
| BLOB_STORAGE_PATH            | 上传文件存储的本地文件夹路径, 当`STORAGE_TYPE`是`local`      | 字符串                                          | `your-home-dir/.flowise/storage`    |
| S3_STORAGE_BUCKET_NAME       | S3 存储文件夹路径, 当`STORAGE_TYPE`是`s3`                    | 字符串                                          |                                     |
| S3_STORAGE_ACCESS_KEY_ID     | AWS 访问密钥 (Access Key)                                    | 字符串                                          |                                     |
| S3_STORAGE_SECRET_ACCESS_KEY | AWS 密钥 (Secret Key)                                        | 字符串                                          |                                     |
| S3_STORAGE_REGION            | S3 存储地区                                                  | 字符串                                          |                                     |
