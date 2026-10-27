# OpenDots AI Native 适配

本目录是 OpenDots 的 AppMkt 模板适配，运行镜像由独立的 OpenDots 公司仓库构建：

- https://code.geelib.qihoo.net:11443/appmkt/OpenDots
- 上游项目：https://github.com/CopilotKit/OpenDots

## 当前适配范围

- 引用固定版本的 OpenDots AppMkt 镜像，不在模板仓库复制应用源码。
- 通过 AppMkt 的 `OPENAI_URL`、`OPENAI_MODELNAME`、`OPENAI_API_KEY` 参数接入模型资源，并映射为 OpenDots 的 `OPENAI_BASE_URL`、`OPENAI_MODEL`、`OPENAI_API_KEY`。
- 通过 `CPK_INTELLIGENCE_API_KEY` 接入 CopilotKit Intelligence。
- 通过 `OWNER_TOKEN` 保护对外 API。
- 通过 Polefs 持久化 `/data/opendots.sqlite`。
- 使用 `/health` 作为基础健康检查入口。
- 使用 `APP_PROXY_MODE=fc` 适配保留 Host 的 FC HTTPS 入口；可选 `APP_ORIGIN` 精确覆盖，不引用自身 Trigger 输出。
- 第一阶段固定单实例，避免 SQLite 在多实例下产生一致性问题。

当前镜像：`harbor.qihoo.net/wfwqjs-eventing-zevent-pub/opendots:v0.1.0.3`。

镜像 digest：`sha256:706b1128f577cc893367b7fbfcae3135b8be1aadbbf0aa6c9878ae99ab8599aa`。

## 部署说明与适配记录

详细部署说明见 [src/readme.md](src/readme.md)，模板测试位于 `tests/test_template.py`。

Spec、Plan、验收矩阵及验证报告统一维护在 [app-adapter 公司仓库](https://code.geelib.qihoo.net:11443/appmkt/app-adapter) 的 `docs/changes/opendots-0.1.0/`：

- `spec.md`：适配范围和版本基线。
- `plan.md`：实施计划及历史工作补录。
- `acceptance.md`：验收标准和状态。
- `local-validation.md`：本地验证结果和复核入口。
- `verification.md`：当前完整验收状态与后续阻塞。

该目录是过程记录的维护位置；本模板不重复保存 Spec 和验证报告。已有本地构建和健康检查结果，真实 AppMkt 部署、模型对话、Polefs 恢复和风险审查仍待完成。
