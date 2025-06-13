# 应用介绍

本案例是将 bisheng，快速创建并部署到函数计算 FC 。

BISHENG 是一款 **开源** LLM应用开发平台，专攻**办公场景**， 已有大量行业头部组织及世界500强企业在使用。

通过 Serverless 开发平台，您只需要几步，就可以体验 bisheng，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/bisheng/src)

* [官方网站](https://dataelem.feishu.cn/wiki/ZxW6wZyAJicX4WkG0NqcWsbynde)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

mysql

redis

elasticsearch

minio

milvus

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## 配置

### 密码加密
mysql和redis的密码加密规则如下：

```python
1. 需要系统中有python3环境
2. 需要在python3中安装cryptography模块，可执行：pip3 install cryptography -i https://pypi.tuna.tsinghua.edu.cn/simple
3. 将以下python代码贴入一个文件，例如名为passwd.py的文件，将password_original后的1234修改为想要加密的密码：
from cryptography.fernet import Fernet
secret_key = 'TI31VYJ-ldAq-FXo5QNPKV_lqGTFfp-MIdbK2Hm5F1E='
def encrypt_token(token: str):
    return Fernet(secret_key).encrypt(token.encode()).decode()
password_original = "1234"
print(encrypt_token(password_original))
4. 执行python3 passwd.py命令即可显示加密后的密码
```

### mysql连接地址配置

连接地址格式如下所示，当前加密串的密码是1234

 "mysql+pymysql://root:gAAAAABlp4b4c59FeVGF_OQRVf6NOUIGdxq8246EBD-b0hdK_jVKRs1x4PoAn0A6C5S6IiFKmWn0Nm5eBUWu-7jxcqw6TiVjQA==@mysql:3306/bisheng?charset=utf8mb4"

### redis连接地址配置

地址格式：redis://[[username]:[password]]@localhost:6379/0

若没有username， redis url 设置为 redis://redis-k8s.functions:6379/1 ， celery redis url 设置为 redis://redis-k8s.functions:6379/2



## 使用

应用部署成功后访问 bisheng-frontend 触发器地址进行注册和登陆。

添加模型：

![image-20250605182322296](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/bisheng/src/images/image-20250605182322296.png?raw=true)


添加应用：

![image-20250605182522522](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/bisheng/src/images/image-20250605182522522.png?raw=true)


使用应用：



![image-20250605182010618](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/bisheng/src/images/image-20250605182010618.png?raw=true)
