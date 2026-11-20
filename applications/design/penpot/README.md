# Penpot 2.19.3 AppMkt 单容器适配

Penpot Frontend、Backend、Admin Console 由一张 combined 镜像在同一个 FC 函数内运行；Polefs 挂载到 `/data`，应用家目录为 `/data/penpot/`，日志写入 `/data/penpot/logs/`。Frontend/Nginx 对外监听 8080，Backend 和 Admin Console 只监听容器回环地址 6060/3000。

- 模板：[`publish.yaml`](publish.yaml)
- FC 资源：[`src/s.yaml`](src/s.yaml)
- 部署说明：[`src/readme.md`](src/readme.md)
- 镜像引用：[`src/combined/Dockerfile`](src/combined/Dockerfile)
- 适配文档：[`app-adapter/docs/changes/penpot-2.19.3-q1/`](../../../../app-adapter/docs/changes/penpot-2.19.3-q1/)

当前版本按单容器方式部署，实际运行能力需结合目标 FC 环境完成验收。`PENPOT_PUBLIC_URI` 由容器从 `K_LATEST_TRIGGER_IDC` 自动派生。Redis 的 `neuralredis` 注入问题属于 app-store 平台阻塞，本模板不修改 app-store。


本轮2.19.3为本地候选，薄Dockerfile引用 `penpot-appmkt:2.19.3-r1-rc1`。尚未推送该镜像或登记平台版本；当前模板的静态/渲染校验不代表平台可拉取、FC/Polefs验收或正式发布。发布前必须引用实际已发布、回读验证的镜像，重新执行镜像契约检查。源码与构建实现位于 `apps/penpot`，过程与验收真源为 `app-adapter/docs/changes/penpot-2.19.3-q1/`。本轮不包含服务端导出、MCP、邮件和外部身份服务。
