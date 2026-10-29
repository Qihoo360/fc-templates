# Penpot 2.18.3 AppMkt 单容器适配

Penpot Frontend、Backend、Admin Console 由一张 combined 镜像在同一个 FC 函数内运行；Polefs 挂载到 `/data`，应用家目录为 `/data/penpot/`，日志写入 `/data/penpot/logs/`。Frontend/Nginx 对外监听 8080，Backend 和 Admin Console 只监听容器回环地址 6060/3000。

- 模板：[`publish.yaml`](publish.yaml)
- FC 资源：[`src/s.yaml`](src/s.yaml)
- 部署说明：[`src/readme.md`](src/readme.md)
- 镜像引用：[`src/combined/Dockerfile`](src/combined/Dockerfile)
- 适配文档：[`app-adapter/docs/changes/penpot-single-container-2.18.3/`](../../../../app-adapter/docs/changes/penpot-single-container-2.18.3/)

当前仅供隔离 dev 验证，不代表真实平台部署或正式上线已通过。`PENPOT_PUBLIC_URI` 由容器从 `K_LATEST_TRIGGER_IDC` 自动派生。Redis 的 `neuralredis` 注入问题属于 app-store 平台阻塞，本模板不修改 app-store。
