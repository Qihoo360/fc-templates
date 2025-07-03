## 应用市场主要流程与阶段

- 适配应用
  - 设计应用配置
  - 组件适配为函数
  - 生成 patch 补丁文件
- 上架应用
  - 创建中间件配置
  - 创建应用配置
  - 创建函数配置
    - 函数常规配置
    - 引用中间件、应用配置
    - 上传 patch 文件
  - 发布应用
- 部署应用
  - 下载应用源码包
  - 预处理应用源码
  - 构建编译应用组件
  - 部署应用的函数

## 应用上架流程

```mermaid
sequenceDiagram
    actor developer as 研发
    participant console as 控制台
    participant appstore as 应用商店 API
    participant github as GitHub（公共仓库）

    rect rgb(40, 185, 151)
      Note over developer: Setp 1: 应用适配
    end

    autonumber 1
    developer->>developer: 拆解应用启用方式 [ENV,Conf]
    developer->>developer: 拆解应用组件适配函数部署
    developer->>developer: [可选] 修订源码适配配置注入
    developer->>developer: 工具生成 patch.diff 补丁文件

    rect rgb(40, 185, 151)
      Note over developer,appstore: Setp 2: 创建控件
    end

    autonumber 1
    developer->>console: 定义中间件控件 [redis,mysql,ES etc..]
    console->>appstore: 创建控件 [redis,mysql,ES etc..]
    appstore->>console: 创建成功
    console->>developer: 创建控件完成

    rect rgb(40, 185, 151)
      Note over developer,appstore: Setp 3: 创建应用
    end

    autonumber 1
    developer->>console: 创建应用
    Note right of developer: 应用适配阶段生成的 patch.diff
    developer->>console: **上传 patch.diff 补丁文件**
    developer->>console: **编辑应用配置** <br>1. 引用 [redis] 控件 <br>2. 引用 [mysql] 控件
    console->>appstore: 引用控件 [redis,mysql]
    appstore->>console: 返回控件配置
    developer->>console: **编辑函数配置**<br>1. 引用控件 <br>2. 引用应用配置
    appstore->>console: 返回[控件配置, 应用配置]
    console->>developer: 创建完成

    rect rgb(40, 185, 151)
      Note over developer,github: Setp 4: 上架应用
    end
    autonumber 1
    developer->>console: 上架应用
    console->>appstore: 上架应用
    appstore->>github: 认证授权
    github-->>appstore: 返回 TOKEN
    appstore->>appstore: 生成应用上下文 <br> [publish.yaml, s.yaml， patch.diff]
    appstore->>github: 推送仓库 <br> [publish.yaml, s.yaml， patch.diff]
    github->>appstore: 推送成功
    appstore-->>console: 上架成功
    console-->>developer: 上架完成
```

## 应用使用流程

```mermaid
sequenceDiagram
    actor developer as 用户
    participant console as 控制台
    participant appstore as 应用商店 API
    participant github as GitHub（公共仓库）

    rect rgb(40, 185, 151)
      Note over developer: Setp 1: 应用适配
    end

    autonumber 1
    developer->>developer: 拆解应用启用方式 [ENV,Conf]
    developer->>developer: 拆解应用组件适配函数部署
    developer->>developer: [可选] 修订源码适配配置注入
    developer->>developer: 工具生成 patch.diff 补丁文件

    rect rgb(40, 185, 151)
      Note over developer,appstore: Setp 2: 创建控件
    end

    autonumber 1
    developer->>console: 定义中间件控件 [redis,mysql,ES etc..]
    console->>appstore: 创建控件 [redis,mysql,ES etc..]
    appstore->>console: 创建成功
    console->>developer: 创建控件完成

    rect rgb(40, 185, 151)
      Note over developer,appstore: Setp 3: 创建应用
    end

    autonumber 1
    developer->>console: 创建应用
    Note right of developer: 应用适配阶段生成的 patch.diff
    developer->>console: **上传 patch.diff 补丁文件**
    developer->>console: **编辑应用配置** <br>1. 引用 [redis] 控件 <br>2. 引用 [mysql] 控件
    console->>appstore: 引用控件 [redis,mysql]
    appstore->>console: 返回控件配置
    developer->>console: **编辑函数配置**<br>1. 引用控件 <br>2. 引用应用配置
    appstore->>console: 返回[控件配置, 应用配置]
    console->>developer: 创建完成

    rect rgb(40, 185, 151)
      Note over developer,github: Setp 4: 上架应用
    end
    autonumber 1
    developer->>console: 上架应用
    console->>appstore: 上架应用
    appstore->>github: 认证授权
    github-->>appstore: 返回 TOKEN
    appstore->>appstore: 生成应用上下文 <br> [publish.yaml, s.yaml， patch.diff]
    appstore->>github: 推送仓库 <br> [publish.yaml, s.yaml， patch.diff]
    github->>appstore: 推送成功
    appstore-->>console: 上架成功
    console-->>developer: 上架完成
```

## 应用部署流程

## 原始工作流程

> CHANGELOG:
> - 添加颜色区分任务系统的构建阶段
> - 添加关键流程描述
> - 添加 patch 处理流程

```mermaid
sequenceDiagram
    actor User as APPMKT 用户
    participant Console as APPMKT 控制台
    participant S3 as S3
    participant AppStore as AppStore API
    participant TaskSystem as 任务系统（Build）
    participant GitHub as GitHub
    participant Hulk as  Hulk 平台
    participant CM as CM API

		Note over User, CM: 应用模板列表
    User->>Console: 应用商店
    alt 已存在应用
    Console->>AppStore: 查询应用列表
    AppStore-->>Console: 应用列表
    Console-->>User: 应用列表
    else 未创建应用
    Console->>AppStore: 查询应用模板列表
    AppStore-->>Console: 应用模板列表
    Console->>GitHub: 下载资源、图片
    GitHub-->>Console: 应用资源
    Console-->>User: 应用模板列表
    end

    Note over User, CM: 创建应用
    autonumber 1
    User->>Console: 创建应用

    Console->>AppStore: 创建应用实例
    Note right of Console: formData 格式传参 <br>（包含函数和应用参数）
    AppStore-->>AppStore: Create tekton 资源
    AppStore->>TaskSystem: 发布任务(重新部署)+回调地址
    AppStore-->>Console: 应用实例创建成功(202)
    Console-->>User: 应用实例创建结果

    Note over User,CM: 任务系统执行任务
    rect rgb(193, 247, 231)
      Note over AppStore,GitHub: Step 1: 构建阶段
      alt 下载应用源码包
        TaskSystem->>GitHub: 请求应用源码包
        GitHub-->>TaskSystem: 返回应用源码包
        TaskSystem-->>AppStore: 回调上报任务状态 (源码下载)
      end

      Note left of TaskSystem: 驱动 sdev 工具
      alt s init
        TaskSystem-->>TaskSystem: 解析 formData, 完善 s.yaml（Dev工具）
        TaskSystem-->>AppStore: 回调上报任务状态 (s init)
      end

      alt 源码处理(template-substitution)
        Note left of TaskSystem: 源码补丁
        TaskSystem-->>TaskSystem: 解析 s.yaml ，处理 patch 文件列表，进行打补丁

        Note left of TaskSystem: 渲染 s.yaml (publish.yaml == formData) ?
        TaskSystem-->>TaskSystem: 解析 formData，生成 parmas.yaml 文件, 完善code源码的渲染<br>(template-substitution --params parmas.yaml -spec s.yaml)

        TaskSystem-->>AppStore: 回调上报任务状态(template-substitution脚本执行)
      end

      alt 打包参数和code渲染完后的源码
        TaskSystem->>S3: zip 包上传
        Note left of TaskSystem: 完整 s.yaml, 合并以后的 code, 不包含 s.yaml 等模板文件
        S3-->>TaskSystem: zip 包上传成功，生成 zip URL
        TaskSystem-->>AppStore: 回调上报任务状态(zip上传)
      end
    end

    Note over TaskSystem,CM: Step 2: 部署阶段
    alt s deploy，依次创建函数（Dev工具）
      TaskSystem->>CM: 创建函数
      CM-->>CM: 执行函数创建任务
      CM-->>TaskSystem: 返回创建状态
    end
    TaskSystem-->>AppStore: 回调上报任务状态(s deploy)

    Note over User,CM: AppStore获取应用状态，通过Dev间接与CM交互
    AppStore->>AppStore: 获取应用的资源状态(轮询 Dev工具查询状态)

    Note over User,CM: 应用列表，appStore 与页面 tab 长连
    User->>Console: 查看应用列表/详情
    Console->>AppStore: 获取应用信息(appStore 与页面 tab 长连)
    AppStore-->>Console: 响应应用信息
    Console-->>User: 展示应用信息
```