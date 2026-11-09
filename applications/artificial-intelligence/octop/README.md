# Octop AppMkt 候选适配

基线：TencentCloud/Octop `v1.0.3b1` / `890111b7879665840414ca28ab168b05b0db0921`，MIT。

[部署和限制](src/readme.md)。过程文档维护于独立 `app-adapter` 仓库的 `docs/changes/octop-1.0.3b1/`。

候选镜像：`harbor.qihoo.net/wfwqjs-eventing-zevent-pub/octop:1.0.3b1-appmkt.1`。2026-11-04 已构建并推送，架构 `linux/amd64`，远端索引 Digest：`sha256:698406e8ec83454452e81138021470a9f135d9fedbf22b7bb5c50021f18a5dd3`。新镜像本地业务验证30/30通过；真实模型、FC/Polefs及安全/上线审核仍待完成，不能据此上架。

本模板不包含 Octop 应用源码、启动编排实现或构建产物；只维护模板、镜像引用、说明和必要模板测试。

部署时必须由用户填写管理员用户名、管理员初始密码和模型 API Key；密码和 Key 使用 Secret 参数，不写入镜像或普通日志。
