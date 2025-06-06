# 应用规范 (schema)

该目录包含应用关键的文件 `publish.yaml` 和 `s.yaml` 的规范设计。这些规范可以在需要的地方引用，确保配置文件符合标准。

## VSCode 编辑器引入 schemas

首先，安装 [`yaml-language` 插件][plugin] ，可以远程加载任意 json-schema 文件。通过这种方式，可以确保配置文件符合规范，同时提高开发效率。

- `s.yaml`
    在 `s.yaml` 文件顶部引入如下内容。这将启用 VSCode 自动加载和验证 `s.yaml` 配置文件的功能。

    ```yaml
    # yaml-language-server: $schema=https://raw.githubusercontent.com/Qihoo360/fc-templates/refs/heads/feature/main/schemas/s-schema.json

    edition: 3.0.0
    name: app
    access: default
    ....
    ````

- `publish.yaml`
    在 `publish.yaml` 文件顶部引入如下内容。

    ```yaml
    # yaml-language-server: $schema=https://raw.githubusercontent.com/Qihoo360/fc-templates/refs/heads/feature/main/schemas/publish-schema.json

    Edition: "3.0.0"
    Type: Project
    Name: app
    ....
    ````


[plugin]: https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml