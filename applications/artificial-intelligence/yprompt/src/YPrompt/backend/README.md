# YPrompt Backend

提示词管理系统后端服务，基于 Sanic 异步框架。

## 快速开始

### 1. 安装依赖

```bash
cd yprompt-backend
pip install -r requirements.txt
```

### 2. 配置数据库

**默认使用 SQLite（推荐，零配置）**

默认配置已经设置为 SQLite，无需任何修改，启动后会自动创建 `data/yprompt.db` 数据库文件并初始化表结构。

**切换到 MySQL（可选）**

如果需要使用 MySQL，修改 `config/dev.py`：

```python
# 数据库类型
DB_TYPE = 'mysql'  # 改为 mysql

# MySQL配置
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASS = 'your_password'
DB_NAME = 'yprompt'
DB_PORT = 3306
```

然后手动创建数据库并导入初始化脚本：

```bash
mysql -u root -p -e "CREATE DATABASE yprompt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p yprompt < migrations/init_database.sql
```

### 3. 启动服务

```bash
python run.py
```

服务启动后访问：
- **API 地址**: http://localhost:8888
- **API 文档**: http://localhost:8888/docs

## 默认管理员账号

系统首次初始化时会自动创建管理员账号，账号信息可在配置文件中自定义。

**默认配置** (`config/dev.py`)：

```python
DEFAULT_ADMIN_USERNAME = 'admin'
DEFAULT_ADMIN_PASSWORD = 'admin123'
DEFAULT_ADMIN_NAME = '管理员'
```

**自定义管理员账号**：

在首次启动前修改 `config/dev.py`：

```python
# 自定义管理员账号
DEFAULT_ADMIN_USERNAME = 'myadmin'      # 自定义用户名
DEFAULT_ADMIN_PASSWORD = 'MySecure123'  # 自定义密码
DEFAULT_ADMIN_NAME = '系统管理员'        # 自定义显示名称
```

**⚠️ 重要提示**：
- 仅在**首次初始化数据库**时生效
- 如果数据库已存在，修改配置不会更新已有账号
- 建议首次登录后立即修改密码

## 认证方式

系统支持双认证模式：

### 1. Linux.do OAuth（可选）

如需启用 Linux.do OAuth 登录，配置 `config/dev.py`：

```python
LINUX_DO_CLIENT_ID = 'your_client_id'
LINUX_DO_CLIENT_SECRET = 'your_client_secret'
LINUX_DO_REDIRECT_URI = 'http://localhost:5173/auth/callback'
```

申请地址：https://linux.do

### 2. 本地用户名密码（始终可用）

适用于私有部署，无需外部 OAuth 服务。

## 数据库配置详解

### SQLite（默认）

**优点**：
- ✅ 零配置，开箱即用
- ✅ 单文件存储，易于备份
- ✅ 适合个人使用和小团队
- ✅ 自动初始化数据库表

**配置**：

```python
# config/dev.py
DB_TYPE = 'sqlite'
SQLITE_DB_PATH = 'data/yprompt.db'  # 可自定义路径
```

**数据库文件位置**：`yprompt-backend/data/yprompt.db`

### MySQL（可选）

**优点**：
- ✅ 高并发性能
- ✅ 适合生产环境
- ✅ 支持多用户同时访问

**配置**：

```python
# config/dev.py
DB_TYPE = 'mysql'
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASS = 'password'
DB_NAME = 'yprompt'
DB_PORT = 3306
```

**手动初始化**：

```bash
mysql -u root -p < migrations/init_database.sql
```

## 配置文件

- `config/base.py` - 基础配置
- `config/dev.py` - 开发环境配置（默认加载）
- `config/prd.py` - 生产环境配置

## 项目结构

```
yprompt-backend/
├── apps/                   # 应用代码
│   ├── modules/           # 业务模块
│   │   ├── auth/         # 认证模块
│   │   ├── prompts/      # 提示词管理
│   │   ├── tags/         # 标签管理
│   │   └── versions/     # 版本管理
│   └── utils/             # 工具类
│       ├── db_adapter.py  # 数据库适配器
│       ├── db_utils.py    # 数据库工具
│       ├── jwt_utils.py   # JWT工具
│       └── password_utils.py  # 密码工具
├── config/                # 配置文件
├── migrations/            # 数据库脚本
│   ├── init_database.sql # MySQL初始化脚本
│   └── init_sqlite.sql   # SQLite初始化脚本（自动）
├── data/                  # 数据目录（SQLite）
│   └── yprompt.db        # SQLite数据库文件
├── logs/                  # 日志目录
├── requirements.txt       # Python依赖
└── run.py                # 启动入口
```

## API 文档

启动服务后访问 Swagger UI：http://localhost:8888/docs

主要 API 端点：

**认证相关**：
- `POST /api/auth/linux-do/login` - Linux.do OAuth 登录
- `POST /api/auth/local/login` - 本地用户名密码登录
- `POST /api/auth/local/register` - 注册本地用户
- `POST /api/auth/refresh` - 刷新 Token
- `GET /api/auth/userinfo` - 获取用户信息
- `GET /api/auth/config` - 获取认证配置

**提示词相关**：
- `POST /api/prompts` - 创建提示词
- `GET /api/prompts` - 获取提示词列表
- `GET /api/prompts/{id}` - 获取提示词详情
- `PUT /api/prompts/{id}` - 更新提示词
- `DELETE /api/prompts/{id}` - 删除提示词

## 开发说明

### 安装开发依赖

```bash
pip install -r requirements.txt
```

### 启动开发服务器（自动重载）

```bash
python run.py
```

### 数据库迁移

如果修改了数据库结构，需要：

1. 更新 `migrations/init_database.sql` (MySQL)
2. 更新 `migrations/init_sqlite.sql` (SQLite)
3. 删除现有数据库重新初始化，或手动执行迁移语句

### 切换数据库

只需修改 `config/dev.py` 中的 `DB_TYPE`，无需修改代码：

```python
DB_TYPE = 'sqlite'  # 或 'mysql'
```

## 生产部署

### 1. 修改配置

编辑 `config/prd.py`：

```python
# 使用环境变量
import os

DB_TYPE = os.getenv('DB_TYPE', 'sqlite')
SECRET_KEY = os.getenv('SECRET_KEY')  # 必须修改
LINUX_DO_CLIENT_SECRET = os.getenv('LINUX_DO_CLIENT_SECRET')

# 如果使用MySQL
DB_HOST = os.getenv('DB_HOST')
DB_PASS = os.getenv('DB_PASS')
```

### 2. 启动生产服务

```bash
# 使用生产配置
export SANIC_ENV=prd
python run.py --workers=4
```

### 3. 使用进程管理器

```bash
# Supervisor 或 systemd
# 参考项目文档配置
```

## 安全建议

1. **生产环境必须修改 SECRET_KEY**
2. **不要提交敏感配置到 Git**
3. **定期备份数据库**（SQLite 直接复制 `data/yprompt.db`）
4. **限制注册功能**（修改 `auth/views.py`）

## 常见问题

### Q: SQLite 数据库在哪里？
A: 默认在 `yprompt-backend/data/yprompt.db`

### Q: 如何备份 SQLite 数据库？
A: 直接复制 `data/yprompt.db` 文件即可

### Q: 如何重置数据库？
A: 删除 `data/yprompt.db` 文件，重启服务会自动重新初始化

### Q: 如何切换到 MySQL？
A: 修改 `config/dev.py` 的 `DB_TYPE = 'mysql'` 并配置数据库连接信息

### Q: 忘记管理员密码怎么办？
A: 
- **方法1（推荐）**: 删除数据库文件 `data/yprompt.db`，重启服务会自动重新初始化
- **方法2**: 修改配置文件中的密码，删除数据库，重新初始化
- **方法3**: 直接修改数据库 `users` 表的 `password_hash` 字段（需要 bcrypt 加密）

### Q: 如何修改默认管理员账号？
A: 首次启动前修改 `config/dev.py` 中的 `DEFAULT_ADMIN_USERNAME`、`DEFAULT_ADMIN_PASSWORD`、`DEFAULT_ADMIN_NAME` 配置

## 技术栈

- **Web 框架**: Sanic 23.12.1 (异步)
- **数据库**: SQLite (默认) / MySQL
- **认证**: JWT + bcrypt
- **文档**: OpenAPI/Swagger

## License

MIT

## 联系方式

如有问题或建议，欢迎提交 Issue。
