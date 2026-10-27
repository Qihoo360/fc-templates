# Penpot 2.18.3 — AppMkt MVP 草案

**状态：三张源码/适配镜像已完成本地构建，尚未AppMkt部署或正式上架。不要直接作为正式版发布。**

## 功能范围

本适配目标为 Frontend、Backend、Admin Console 三个 FC 资源，依赖 AppMkt 的 PostgreSQL、Valkey/Redis、AppMkt OBS 组件；不是 Docker-in-Docker，也不把数据库放进应用容器。

第一期不含 Exporter、MCP、远程媒体处理、SMTP、OAuth/LDAP。编辑、保存、登录、协作和本地基础资源处理均需真实 dev 验证，尚不能声称可用。无 Exporter 时 `/api/export` 明确返回503，服务端PNG/PDF/SVG导出和依赖Exporter的缩略图不提供支持；这不是全功能 Penpot。

前期提出的单容器方案改为复用公司 Harbor 中的三张 Penpot 2.18.3 镜像及现有多资源 FC 写法；避免复制不同基础镜像的 Java/Node/Nginx。**部署前需要确认采用三资源方式及费用**。如果平台只允许单容器，本草案不能直接用，需要重新评审打包方式。

## 版本来源

2026-10-23 官方 latest 发布重定向确认稳定版为 **2.18.3**，源码Tag Commit：`ff7a66f51938b2293260ea27a64e2c4e0833b5e3`。不使用本地 develop 或 2.19.0-RC1。

- 官方发布：`https://github.com/penpot/penpot/releases/tag/2.18.3`
- 官方Compose：`https://github.com/penpot/penpot/blob/2.18.3/docker/images/docker-compose.yaml`
- 官方配置/升级：该Tag的 `docs/technical-guide/configuration.md`、`docs/technical-guide/getting-started/docker.md`。

三个Dockerfile分别引用公司 Harbor 的 `penpot/frontend:2.18.3.0`、`penpot/backend:2.18.3.0`、`penpot/admin-console:2.18.3.0`。Frontend和Backend来自公司 `penpot.git` 的 2.18.3 基线；Admin Console是官方2.18.3镜像导入Harbor。三张镜像固定为linux/amd64，部署前仍须在AppMkt构建环境实证可拉取。

## 部署前必须准备

1. **Penpot专属dev**模板/版本/实例，不复用Hermes的131/88/7748。
2. 区域/VPC、三个函数间的内网HTTP与WebSocket通路；backend/admin不直接开放公网。
3. Frontend 开启公网 HTTP 触发器；模板方案二会自动使用其生成的 HTTPS 访问地址作为 `PENPOT_PUBLIC_URI`，所有服务共享该值。该方案依赖 FC 输出地址稳定且满足 Penpot 根 Origin 校验，暂用于 dev 验证。
4. 独立PostgreSQL数据库和账号，确认版本、`uuid-ossp`扩展及迁移权限。官方Compose参考PostgreSQL15，不代表平台组件已通过兼容测试。
5. Valkey/Redis兼容端点、端口、ACL用户名（如适用）和密码；使用专属实例和支持SELECT的非cluster逻辑库。仅换一个逻辑库不一定隔离Pub/Sub消息，不与生产混用。
6. AppMkt OBS对象存储：每个Penpot实例使用独立Bucket，Backend FC通过S3 API读写对象；Frontend和Backend不共享文件卷。确认S3 Endpoint、Region、Bucket、AK/SK和VPC可达性。
7. 随机且持久的 `PENPOT_SECRET_KEY`，backend/admin共用，升级不可变化。值通过平台secret输入，不进镜像/Git/日志。可由操作者在安全终端生成URL-safe随机值，至少64字符。
8. 平台构建环境能拉取公司Harbor三张镜像；已确认源码镜像Tag、架构和授权后再使用，不能猜测镜像可达。

`publish.yaml` 通过 `x-restype: postgresql/redis/s3` 复用已有组件。Valkey目前沿用平台Redis资源类型，不新增平台枚举；普通模式支持用户名为空的密码认证和ACL用户名密码认证，Redis URI在运行时编码，不直接字符串拼接密码。

### 输入与安全约束

模板沿用平台 `{{参数}}` 字符串渲染。为防单引号YAML插值破坏，参数会拒绝单引号、换行和花括号；若现有组件自动生成的凭证不符合规则，**先停止并确认平台支持的安全转义方式，不自动更换组件密码**。

数据库默认TLS模式require（加密但不核验服务端身份）；verify-full需预先配置可信CA。不能为了通而自动降级。缓存默认内网Redis协议，不自动发送到公网；TLS-only Valkey组件不在当前草案能力内，须先扩展并验证。

后台资源地址使用仓库既有 `${resources.<name>.output.httpTriggerUrl}` 写法。需要确认实际平台输出是裸主机还是已含协议，避免出现 `http://https://...`。入口校验会拒绝这种无效地址，不能静默降级。

当前固定每服务min=max=1，合计约6 vCPU/10GiB内存配额（非压测结论），另有数据库缓存与存储费用。真实容量和费用在部署前确认。

### 自动访问入口（方案二，未通过真实部署验证）

`publish.yaml` 不再要求用户填写 `PENPOT_PUBLIC_URI`。三个服务的环境变量及 Admin Console 的 `PENPOT_INTERNAL_URI` 直接使用：

```yaml
PENPOT_PUBLIC_URI: 'https://${resources.penpotFrontend.output.httpTriggerUrl}'
```

沿用现有模板对 `httpTriggerUrl` 为裸主机名的约定，并要求该 Frontend 入口支持 HTTPS 根路径访问；不修改现有启动脚本的 HTTPS/根 Origin 校验。如果实际输出自带协议、包含子路径或不支持 HTTPS，需要调整适配，不能直接宣称兼容。

**已知部署风险：** Frontend 引用了自身 output，同时 Admin/Backend 引用 Frontend、Frontend 又引用 Admin/Backend，存在自引用和跨资源循环引用。此方案不是二阶段回填；只有部署引擎支持这种引用解析才能部署。静态模板测试仅验证配置形态，不能证明引用可解析。若部署时报告循环依赖、未解析 output 或环境变量为空，应改用部署后回填方案。

## 三服务关系

```text
Frontend 公网HTTP触发器 → Frontend(8080)
                         ├── Backend(6060) → PostgreSQL / Valkey / AppMkt OBS
                         └── Admin Console(3000) → 同一PostgreSQL / 主密钥
Backend通过S3 API访问对象存储，Frontend与Backend不共享文件卷。
```

Admin Console是独立官方服务，不是假设后端内置。由于它依赖内部Frontend回调，`PENPOT_INTERNAL_URI` 指向 Frontend 自动生成的 HTTPS 触发器地址，须验证从函数内可达并完成真实会话流程。任何VPC/代理不通都阻断部署验收。

前端保留官方WebSocket、资产内部转发和安全头，仅增加：Exporter明确503、调试页面404、FC终止TLS后的HTTPS scheme修正、`/appmkt-health`前端存活标识。

**`/appmkt-health`只证明前端进程响应；依赖检查使用官方 `/readyz`（代理到后端，会查询数据库）。两者都不等于缓存、用户登录或编辑保存已通过。**

## 本地验证（不访问真实资源）

测试依赖：Python3.11+、PyYAML、jsonschema；用独立测试环境或已有开发环境，不在应用生产容器安装测试依赖。版本范围见 `tests/requirements.txt`。

```bash
python3 -m unittest discover -s tests -v
bash -n src/frontend/entrypoint.sh
```

命令工作目录为此应用模板目录。测试读取实际配置，按平台schema校验；平台扩展 `type: secret` 在标准JSON-Schema验证时只归一化为string，原文件secret标记另行断言。不修改平台schema。

包括：参数合法性/特殊字符、PostgreSQL/Valkey/OBS字段映射、Redis URI编码、S3 Endpoint/Bucket/Region校验、secret缺失阻断、注册关闭/显式dev开启、三资源依赖无环、S3仅注入Backend和主密钥一致性。

这些测试不等于真实 `s preview`。还必须使用平台Serverless Devs/ZFC工具验证输出依赖解析、区域规格/ACL/OBS配置和敏感字段脱敏，当前尚未执行。

## 构建和镜像同步

先确认公司Harbor三张镜像可访问和目标架构。三个 `src/<service>/Dockerfile` 可分别作为构建上下文，保留Penpot运行时，前后端仅加启动配置。真实构建命令由操作者确认仓库和Tag后执行，**本仓库没有自动构建推送脚本，不会因看文档而部署**。

后端Python入口 `--check-config` 只做验证，不连接DB、OBS、不写文件、不迁移；正常启动校验S3配置后执行官方 `/opt/penpot/backend/run.sh`。容器启动后的数据库迁移由Penpot负责，不在适配器中另写迁移SQL。

生产数据不得用作首次测试。后端重部署可能自动执行迁移；旧镜像回退不保证能读迁移后的DB，备份/恢复验证是独立上线门禁。

## 首个用户与注册

`APPMKT_ALLOW_REGISTRATION` 默认false。首个测试用户要么由运维按官方受支持管理流程创建，要么在**隔离dev**显式设置true临时开注册（同时跳过邮件验证，因MVP不接SMTP）。

不自动创建管理员、用户或默认密码。true不适用于公开生产实例；创建测试账号后关闭。禁用PREPL是默认策略，不为初始化账号擅自打开调试服务或管理端口。

## Dev验收及上架门禁

- 三镜像真实构建成功，版本/启动命令/架构核对。
- 平台preview、资源网络和OBS权限正确，日志无凭证。
- `/readyz`返回数据库就绪，Valkey认证及Pub/Sub正常。
- 真正注册/登录、创建项目和文件、编辑保存、刷新后仍在。
- 上传图片后读回，重启后资产和项目保留；不会只查容器临时文件。
- 两个独立浏览器会话同时编辑，WebSocket成功且数据一致。
- 未授权用户不能读别的团队或资产；Admin Console鉴权符合预期。
- 公共URI、Cookie和TLS卸载正确，不跳转到localhost或内部服务地址。
- Exporter路径返回503且说明能力缺失；不能用不支持导出的MVP冒充全功能正式版。
- 迁移/备份/恢复有证据，产品负责人接受MVP范围，再人工批准正式发布。

本草案不包含生产上架动作，也不复用Hermes专用 `appmkt_verify.py` 全套规则（其 `/gateway/health`、Bearer Key、模型对话等不适用Penpot）。本次用静态配置/入口行为测试，后续dev用Penpot专属业务清单执行。
