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

我们为 docling 配置了专门的目录 /mnt/webhook，只需将此目录挂载到 NAS 上，再将 webhook 配置文件上传到 NAS 对应目录，就可以配置 docling 相关的  API ，通过调用这些 API ，便可以实现 docling 提供的功能。若要将 /mnt/webhook 修改为别的目录，则需对应修改代码中的 Dockerfile 文件并重新部署。

webhook 配置文件 hooks.json 示例如下：

```json
[
  {
    "id": "docling-webhook",
    "execute-command": "/mnt/webhook/docling/docling-webhook.sh",
    "command-working-directory": "/mnt/webhook/docling",
    "pass-arguments-to-command": [
      {
        "source": "payload",
        "name": "docling-args.from"
      },
      {
        "source": "payload",
        "name": "docling-args.to"
      },
      {
        "source": "payload",
        "name": "docling-args.output"
      },
      {
        "source": "payload",
        "name": "docling-args.file"
      }
    ]
  }
]
```

execute-command 中的 docling-webhook.sh 内容为：

```shell
#!/bin/bash

echo -e "\n excuting cmd [$0 $*] \n"

docling $*

# docling https://arxiv.org/pdf/2408.09869
# python /root/docling/minimal.py
```

执行以下 curl 命令即可在云端执行 docling 命令：

```shell
curl -H 'Content-Type: application/json' -X POST "<YOUR FUNCTION URL>/hooks/docling-webhook" -d '{"docling-args": {"from": "--from pdf", "to": "--to md", "output": "--output /mnt/webhook/docling/output","file": "https://arxiv.org/pdf/2408.09869"}}'
```

其中：\<YOUR FUNCTION URL> 需替换为部署 docling 函数生成的 uri 。docling-webhook 为 hooks.json 中的 id 字段值。-d 参数中的 json 字符串中包含的是传递给 hooks.json 中 execute-command 命令的参数。webhook 收到此请求以后，根据 hooks.json 中 pass-arguments-to-command 的值，依次从 HTTP body 中获取 docling-args.from ， docling-args.to ， docling-args.output， docling-args.file 传递给 docling-webhook.sh。此示例中最终执行的命令为：

```shell
docling --from pdf --to md --output /mnt/webhook/docling/output https://arxiv.org/pdf/2408.09869
```

执行成功后会在 --output 参数指定的目录（此处/mnt/webhook/docling/output）下生成转换后的和输入文件名同名的md文件。



hooks.json 配置方式参考： [webhook/docs at master · adnanh/webhook · GitHub](https://github.com/adnanh/webhook/tree/master/docs)



**注意：** 

- 修改 hooks.json 文件后需重新部署函数才会生效。
- execute-command 的脚本上传到 NAS 后执行时可能会提示没有权限，使用 NAS 客户端工具登陆后使用 chmod +x 添加可执行权限即可

