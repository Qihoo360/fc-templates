# Octop AppMkt 候选适配

基线：TencentCloud/Octop `v1.0.3b1` / `890111b7879665840414ca28ab168b05b0db0921`，MIT。

[部署和限制](src/readme.md)。过程文档维护于独立 `app-adapter` 仓库的 `docs/changes/octop-1.0.3b1/`。

候选镜像：`harbor.qihoo.net/wfwqjs-eventing-zevent-pub/octop:1.0.3b1-appmkt.1`。该引用只有在独立源码镜像通过本地验证、实际发布并记录 digest 后才可用于部署。目前不宣称已经发布或允许上架。

本模板不包含 Octop 应用源码、启动编排实现或构建产物；只维护模板、镜像引用、说明和必要模板测试。

部署时必须由用户填写管理员用户名、管理员初始密码和模型 API Key；密码和 Key 使用 Secret 参数，不写入镜像或普通日志。
