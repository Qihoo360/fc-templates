# Toonflow AppMkt 适配

Toonflow v2.0.10 是一个开源 AI 短剧、漫剧和视频创作平台。本模板使用单个 FC 自定义容器、Basic Auth 和 Polefs 保存服务器工作区数据。

## 运行边界

- Web UI/API 监听容器端口 3000。
- Polefs 挂载到 `/data`，应用数据目录为 `/data/toonflow`。
- 首期固定单实例，桌面端、移动端、设备互联和外部浏览器能力不在本模板支持范围。
- `/healthz` 用于进程探针；业务访问需要 Basic Auth。

## 必填配置

- `TOONFLOW_AUTH_USERNAME`：Basic Auth 用户名。
- `TOONFLOW_AUTH_PASSWORD`：至少 16 位的 Secret 密码。
- `POLEFS_VOLUME`：持久化卷名称。

模型和媒体供应商由 Toonflow 页面写入持久化设置；真实模型调用需由部署者在运行环境中单独验证。模板不写入模型 Key。
