# YPrompt Backend 后端项目文档

## 项目概述

YPrompt Backend 是一个基于 Sanic 的高性能异步后端服务，为 YPrompt 提示词生成器提供完整的数据支持。采用**零配置启动**设计，默认使用SQLite + 本地认证，无需任何配置即可快速部署。同时支持Linux.do OAuth和MySQL，灵活适应公共和私有部署场景。

**核心特性**:
- ✅ **零配置启动**: 默认SQLite + 本地认证，自动初始化数据库
- 🔐 **双认证支持**: Linux.do OAuth 2.0 + 本地用户名密码
- 💾 **双数据库支持**: SQLite（默认）+ MySQL（可选）
- 🔒 **安全加密**: bcrypt密码哈希（12轮salt）
- 📝 **完整CRUD**: 提示词增删改查 + 版本管理
- 🏷️ **标签系统**: 自动分类和统计
- 🔄 **版本控制**: 语义化版本 + 完整快照 + 一键回滚
- 🚀 **高性能**: 异步设计 + 连接池 + 缓存优化

## 技术栈

### 核心框架
- **Web框架**: Sanic 23.12.1 (异步高性能)
- **扩展**: Sanic-Ext 23.12.0 (OpenAPI文档支持)
- **CORS**: Sanic-Cors 2.2.0
- **异步运行时**: uvloop 0.19.0

### 数据层
- **数据库**: SQLite 3 (默认) / MySQL 8.0+ (可选)
- **SQLite驱动**: aiosqlite 0.19.0
- **MySQL ORM**: ezmysql 0.9.0 (轻量级异步ORM)
- **MySQL驱动**: PyMySQL 1.1.0 + aiomysql 0.2.0

### 认证与安全
- **JWT**: PyJWT 2.8.0
- **OAuth**: Linux.do OAuth 2.0
- **密码加密**: bcrypt 4.0.1
- **加密**: cryptography 41.0.7

### 工具库
- **HTTP客户端**: requests 2.31.0 (Linux.do API) + httpx 0.25.2 (异步)
- **JSON**: ujson 5.9.0 (高性能)
- **配置管理**: python-dotenv 1.0.0

## 项目结构

```
backend/
├── apps/                       # 应用主目录
│   ├── __init__.py            # 应用初始化、蓝图自动注册
│   │
│   ├── modules/               # 业务模块（自动发现蓝图）
│   │   ├── auth/             # 认证模块
│   │   │   ├── __init__.py
│   │   │   ├── models.py     # OpenAPI数据模型
│   │   │   ├── services.py   # 认证业务逻辑
│   │   │   └── views.py      # 认证API路由
│   │   │
│   │   ├── prompts/          # 提示词模块
│   │   │   ├── __init__.py
│   │   │   ├── models.py     # 提示词数据模型
│   │   │   ├── services.py   # 提示词业务逻辑
│   │   │   └── views.py      # 提示词API路由
│   │   │
│   │   ├── tags/             # 标签模块
│   │   │   ├── __init__.py
│   │   │   ├── services.py   # 标签业务逻辑
│   │   │   └── views.py      # 标签API路由
│   │   │
│   │   └── versions/         # 版本管理模块
│   │       ├── __init__.py
│   │       ├── models.py     # 版本数据模型
│   │       ├── services.py   # 版本业务逻辑
│   │       └── views.py      # 版本API路由
│   │
│   └── utils/                # 工具类
│       ├── auth_middleware.py  # JWT认证中间件
│       ├── db_adapter.py       # 数据库适配器（SQLite/MySQL）
│       ├── db_utils.py         # 数据库连接管理
│       ├── linux_do_oauth.py   # Linux.do OAuth封装
│       ├── password_utils.py   # 密码工具（验证、哈希）
│       ├── http_utils.py       # HTTP工具
│       └── jwt_utils.py        # JWT工具类
│
├── config/                     # 配置文件
│   ├── __init__.py
│   ├── settings.py            # 配置加载器
│   ├── base.py                # 基础配置
│   ├── dev.py                 # 开发环境配置
│   ├── prd.py                 # 生产环境配置
│   └── test.py                # 测试环境配置
│
├── migrations/                # 数据库脚本
│   └── init_sqlite.sql       # SQLite初始化脚本
│
│
├── ../data/                   # 数据目录（项目根目录下）
│   ├── yprompt.db            # SQLite数据库文件（自动生成）
│   └── logs/backend/         # 后端日志目录
│       ├── info.log          # 信息日志
│       └── error.log         # 错误日志
│
├── requirements.txt          # Python依赖
├── run.py                    # 启动入口
└── README.md                 # 项目说明
```

## 快速开始

### 零配置启动（推荐）

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 直接启动（无需任何配置）
python run.py

# ✅ 自动完成：
# - 创建 ../data/yprompt.db 数据库
# - 初始化所有表结构
# - 创建默认管理员账号：admin / admin123

# 访问 API 文档
http://localhost:8888/docs
```

### 其他启动方式

```bash
# 开发模式（自动重载）
python run.py

# 生产模式启动（多worker）
python run.py --workers=4

# 或使用 Sanic CLI
sanic run.app --host=0.0.0.0 --port=8888 --dev

# 访问API文档
# http://localhost:8888/docs
```

## 核心模块

### 1. 认证模块 (apps/modules/auth)

**功能**: 双认证方式支持、JWT Token 管理

#### 核心特性
- 🔐 **双认证支持**: Linux.do OAuth 2.0 + 本地用户名密码
- 🔒 **密码安全**: bcrypt加密，12轮salt
- 🎯 **灵活配置**: 根据配置动态启用认证方式
- ⚡ **性能优化**: 老用户登录只更新时间，不调用外部API

#### API端点
```
# Linux.do OAuth
POST   /api/auth/linux-do/login    # Linux.do code登录
GET    /api/auth/config            # 获取认证配置（包含CLIENT_ID）

# 本地认证
POST   /api/auth/local/login       # 用户名密码登录
POST   /api/auth/local/register    # 用户注册

# 通用接口
POST   /api/auth/refresh           # 刷新Token
GET    /api/auth/userinfo          # 获取用户信息
POST   /api/auth/logout            # 登出
```

#### Linux.do OAuth 登录流程

```python
@auth.post('/linux-do/login')
async def linux_do_login(request):
    # 1. 接收Linux.do授权码(code)
    code = request.json.get('code')
    
    # 2. 通过code获取用户信息
    oauth = LinuxDoOAuth()
    user_info = oauth.get_user_by_code(code)  # 包含get_access_token + get_user_info
    
    # 3. 创建或更新用户
    auth_service = AuthService(request.app.ctx.db)
    linux_do_id = str(user_info['id'])
    user = await auth_service.get_user_by_linux_do_id(linux_do_id)
    
    if user:
        # 老用户：仅更新登录时间
        await auth_service.update_last_login_time(user['id'])
    else:
        # 新用户：创建用户
        user = await auth_service.create_or_update_user_from_linux_do(user_info)
    
    # 4. 生成JWT Token (7天有效期)
    token = JWTUtil.generate_token(user['id'], user['linux_do_id'], expire_hours=24*7)
    
    # 5. 返回Token和用户信息
    return json({'code': 200, 'data': {'token': token, 'user': user}})
```

#### 本地用户名密码登录流程

```python
@auth.post('/local/login')
async def local_login(request):
    # 1. 获取用户名密码
    username = request.json.get('username')
    password = request.json.get('password')
    
    # 2. 验证用户名密码
    auth_service = AuthService(request.app.ctx.db)
    user = await auth_service.verify_local_user(username, password)
    
    if not user:
        return json({'code': 400, 'message': '用户名或密码错误'})
    
    # 3. 生成JWT Token
    token = JWTUtil.generate_token(user['id'], username, expire_hours=24*7)
    
    # 4. 返回Token和用户信息
    return json({'code': 200, 'data': {'token': token, 'user': user}})
```

#### Linux.do OAuth工具 (utils/linux_do_oauth.py)

```python
class LinuxDoOAuth:
    AUTH_URL = 'https://connect.linux.do/oauth2/authorize'
    TOKEN_URL = 'https://connect.linux.do/oauth2/token'
    USER_INFO_URL = 'https://connect.linux.do/api/user'
    
    def get_authorization_url(self, state=None):
        """生成授权URL"""
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': 'user'
        }
        return f'{self.AUTH_URL}?{query_string}'
    
    def get_access_token(self, code):
        """通过授权码获取访问令牌"""
        response = requests.post(self.TOKEN_URL, data={
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'redirect_uri': self.redirect_uri,
            'grant_type': 'authorization_code'
        })
        return response.json()['access_token']
    
    def get_user_info(self, access_token):
        """获取用户信息"""
        response = requests.get(
            self.USER_INFO_URL,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        return response.json()
    
    def get_user_by_code(self, code):
        """一步完成：通过授权码获取用户信息"""
        token_data = self.get_access_token(code)
        return self.get_user_info(token_data['access_token'])
    
    @staticmethod
    def is_configured():
        """检查是否已配置"""
        return all([
            Config.LINUX_DO_CLIENT_ID,
            Config.LINUX_DO_CLIENT_SECRET,
            Config.LINUX_DO_REDIRECT_URI
        ])
```

#### 核心服务 (services.py)

```python
class AuthService:
    # Linux.do OAuth
    async def create_or_update_user_from_linux_do(user_info)  # 从Linux.do创建用户
    async def get_user_by_linux_do_id(linux_do_id)           # 根据linux_do_id查询
    
    # 本地认证
    async def create_local_user(username, password, name)     # 创建本地用户
    async def verify_local_user(username, password)           # 验证用户名密码
    
    # 通用
    async def get_user_by_id(user_id)          # 根据ID查询
    async def update_last_login_time(user_id)  # 更新登录时间
```

#### 密码工具 (utils/password_utils.py)

```python
class PasswordUtil:
    @staticmethod
    def hash_password(password: str) -> str:
        """生成密码哈希（bcrypt, 12轮）"""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """验证密码"""
        password_bytes = password.encode('utf-8')
        hash_bytes = password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """验证密码强度（至少8字符，包含字母和数字）"""
        if len(password) < 8:
            return False, '密码至少需要8个字符'
        if not re.search(r'[A-Za-z]', password):
            return False, '密码必须包含字母'
        if not re.search(r'\d', password):
            return False, '密码必须包含数字'
        return True, ''
```

#### 认证中间件 (utils/auth_middleware.py)

```python
@auth_required
async def protected_route(request):
    """需要登录才能访问的接口"""
    user_id = request.ctx.user_id  # 从上下文获取用户ID
    open_id = request.ctx.open_id  # 从上下文获取open_id
    # 业务逻辑...
```

**装饰器类型**:
- `@auth_required` - 强制登录
- `@optional_auth` - 可选登录
- `@admin_required` - 需要管理员权限

### 2. 提示词模块 (apps/modules/prompts)

**功能**: 提示词的完整生命周期管理

#### 核心功能
- 创建、编辑、删除提示词
- 收藏/取消收藏
- 公开/私有设置
- 查看统计（查看次数、使用次数）
- 按标签筛选
- 分页查询

#### API端点
```
POST   /api/prompts/           # 创建提示词
GET    /api/prompts/           # 获取列表（支持分页、筛选）
GET    /api/prompts/{id}       # 获取详情
PUT    /api/prompts/{id}       # 更新提示词
DELETE /api/prompts/{id}       # 删除提示词
POST   /api/prompts/{id}/favorite    # 收藏/取消收藏
POST   /api/prompts/{id}/increment_view   # 增加查看次数
POST   /api/prompts/{id}/use   # 记录使用
```

#### 数据模型

```python
# 提示词表字段
prompts:
  - id, user_id, title, description
  - requirement_report           # 需求报告
  - thinking_points              # 关键指令(JSON数组)
  - initial_prompt              # 初始提示词
  - advice                      # 优化建议(JSON数组)
  - final_prompt                # 最终提示词
  - language                    # 语言 zh/en
  - format                      # 格式 markdown/xml
  - prompt_type                 # 类型 system/user
  - is_favorite, is_public
  - view_count, use_count
  - tags                        # 标签(逗号分隔)
  - current_version             # 当前版本号
  - total_versions              # 总版本数
  - last_version_time           # 最后版本时间
  - create_time, update_time
```

#### 核心服务 (services.py)

```python
class PromptService:
    async def create_prompt(user_id, data):
        """创建提示词"""
        # 处理数组字段(转为JSON字符串)
        thinking_points = json.dumps(data.get('thinking_points', []))
        advice = json.dumps(data.get('advice', []))
        tags = ','.join(data.get('tags', []))
        
        # 插入数据库
        prompt_id = await db.table_insert('prompts', fields)
        
        # 更新标签统计
        await self._update_tags(user_id, tags_list)
        
        return prompt_id
    
    async def get_prompts_list(user_id, page, limit, keyword, tag, is_favorite):
        """获取提示词列表（分页）"""
        # 构建查询条件
        # 支持关键词搜索、标签筛选、收藏筛选
        # 分页返回
    
    async def update_prompt(prompt_id, user_id, data):
        """更新提示词"""
    
    async def delete_prompt(prompt_id, user_id):
        """删除提示词（级联删除版本）"""
    
    async def toggle_favorite(prompt_id, user_id, is_favorite):
        """收藏/取消收藏"""
```

### 3. 版本管理模块 (apps/modules/versions)

**功能**: 提示词版本控制和历史管理

#### 核心特性
- 📜 **语义化版本**: 支持 `major.minor.patch` 格式
- 🏷️ **版本标签**: draft, beta, stable, production
- 🔄 **版本回滚**: 一键恢复到任意历史版本
- 📊 **版本对比**: 显示版本之间的差异
- 💾 **完整快照**: 每个版本保存完整内容

#### API端点
```
POST   /api/versions/{prompt_id}        # 创建新版本
GET    /api/versions/{prompt_id}        # 获取版本列表
GET    /api/versions/{prompt_id}/{version}  # 获取版本详情
POST   /api/versions/{prompt_id}/{version}/rollback  # 回滚版本
GET    /api/versions/{prompt_id}/compare  # 对比两个版本
DELETE /api/versions/{prompt_id}/{version}  # 删除版本
```

#### 数据模型

```python
# 版本表字段
prompt_versions:
  - id, prompt_id
  - version_number              # 版本号 (1.2.3)
  - version_type               # manual/auto/rollback/import
  - version_tag                # draft/beta/stable/production
  
  # 完整内容快照
  - title, description
  - requirement_report
  - thinking_points
  - initial_prompt
  - advice
  - final_prompt
  - language, format, tags
  
  # 版本元数据
  - change_log                 # 变更日志（详细）
  - change_summary             # 变更摘要（简短）
  - change_type                # major/minor/patch
  - created_by                 # 创建者ID
  - parent_version_id          # 父版本ID
  
  # 统计
  - use_count                  # 使用次数
  - rollback_count             # 被回滚次数
  - content_size               # 内容大小
  
  # 标记
  - is_auto_save               # 是否自动保存
  - is_deleted                 # 软删除
  - create_time
```

#### 核心服务

```python
class VersionService:
    async def create_version(prompt_id, user_id, data):
        """创建新版本"""
        # 1. 验证版本号唯一性
        # 2. 保存完整内容快照
        # 3. 更新主表的current_version和total_versions
        # 4. 计算content_size
    
    async def get_versions(prompt_id, user_id):
        """获取版本列表"""
        # 按版本号降序排列
    
    async def rollback_to_version(prompt_id, version_number, user_id):
        """回滚到指定版本"""
        # 1. 获取目标版本内容
        # 2. 创建新版本（version_type=rollback）
        # 3. 更新主表内容
        # 4. 增加rollback_count
    
    async def compare_versions(prompt_id, v1, v2):
        """对比两个版本"""
        # 返回差异对比
```

### 4. 标签模块 (apps/modules/tags)

**功能**: 标签管理和统计

#### API端点
```
GET    /api/tags/              # 获取用户标签列表
GET    /api/tags/popular       # 获取热门标签
GET    /api/tags/{tag}/prompts # 获取标签下的提示词
POST   /api/tags/              # 创建标签
DELETE /api/tags/{id}          # 删除标签
```

#### 数据模型

```python
# 标签表
prompt_tags:
  - id
  - tag_name               # 标签名称
  - user_id                # 用户ID（标签归属）
  - use_count              # 使用次数
  - create_time
  
  UNIQUE KEY (user_id, tag_name)  # 用户内标签唯一
```

## 数据库设计

### 核心表结构

#### 1. users (用户表)

```sql
CREATE TABLE `users` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `open_id` VARCHAR(64) UNIQUE NOT NULL,    -- 飞书用户ID
  `union_id` VARCHAR(64),                   -- 飞书Union ID
  `name` VARCHAR(100) NOT NULL,             -- 用户名
  `avatar` VARCHAR(255),                    -- 头像URL
  `email` VARCHAR(100),                     -- 邮箱
  `mobile` VARCHAR(20),                     -- 手机号
  `is_active` TINYINT(1) DEFAULT 1,         -- 是否激活
  `last_login_time` DATETIME,               -- 最后登录时间
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_open_id` (`open_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2. prompts (提示词表)

```sql
CREATE TABLE `prompts` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `title` VARCHAR(200) NOT NULL,            -- 标题
  `description` TEXT,                       -- 描述
  `requirement_report` TEXT,                -- 需求报告
  `thinking_points` TEXT,                   -- 关键指令(JSON)
  `initial_prompt` TEXT,                    -- 初始提示词
  `advice` TEXT,                            -- 优化建议(JSON)
  `final_prompt` TEXT,                      -- 最终提示词
  `language` VARCHAR(10) DEFAULT 'zh',      -- 语言
  `format` VARCHAR(10) DEFAULT 'markdown',  -- 格式
  `prompt_type` VARCHAR(10) DEFAULT 'system', -- system/user
  `is_favorite` TINYINT(1) DEFAULT 0,       -- 是否收藏
  `is_public` TINYINT(1) DEFAULT 0,         -- 是否公开
  `view_count` INT(11) DEFAULT 0,           -- 查看次数
  `use_count` INT(11) DEFAULT 0,            -- 使用次数
  `tags` VARCHAR(500),                      -- 标签(逗号分隔)
  `current_version` VARCHAR(20) DEFAULT '1.0.0',
  `total_versions` INT(11) DEFAULT 1,
  `last_version_time` DATETIME,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_favorite` (`is_favorite`),
  KEY `idx_create_time` (`create_time`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3. prompt_versions (版本表)

```sql
CREATE TABLE `prompt_versions` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `prompt_id` INT(11) NOT NULL,
  `version_number` VARCHAR(20) NOT NULL,    -- 版本号
  `version_type` VARCHAR(10) DEFAULT 'manual',
  `version_tag` VARCHAR(50),
  
  -- 完整内容快照
  `title` VARCHAR(200),
  `description` TEXT,
  `requirement_report` TEXT,
  `thinking_points` TEXT,
  `initial_prompt` TEXT,
  `advice` TEXT,
  `final_prompt` TEXT NOT NULL,
  `language` VARCHAR(10),
  `format` VARCHAR(10),
  `tags` VARCHAR(500),
  
  -- 版本元数据
  `change_log` TEXT,
  `change_summary` VARCHAR(500),
  `change_type` VARCHAR(10) DEFAULT 'patch',
  `created_by` INT(11),
  `parent_version_id` INT(11),
  
  -- 统计
  `use_count` INT(11) DEFAULT 0,
  `rollback_count` INT(11) DEFAULT 0,
  `content_size` INT(11) DEFAULT 0,
  
  -- 标记
  `is_auto_save` TINYINT(1) DEFAULT 0,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY `uk_prompt_version` (`prompt_id`, `version_number`),
  FOREIGN KEY (`prompt_id`) REFERENCES `prompts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4. prompt_tags (标签表)

```sql
CREATE TABLE `prompt_tags` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `tag_name` VARCHAR(50) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `use_count` INT(11) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY `uk_user_tag` (`user_id`, `tag_name`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5. prompt_shares (分享表)

```sql
CREATE TABLE `prompt_shares` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `prompt_id` INT(11) NOT NULL,
  `share_code` VARCHAR(32) UNIQUE NOT NULL,
  `expire_time` DATETIME,
  `view_count` INT(11) DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  KEY `idx_share_code` (`share_code`),
  FOREIGN KEY (`prompt_id`) REFERENCES `prompts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 开发规范

### 项目架构

采用 **三层架构** + **蓝图模块化**：

```
Controller (views.py)  ← API路由和请求处理
    ↓
Service (services.py)  ← 业务逻辑
    ↓
Model (ezmysql)       ← 数据访问
```

### 蓝图自动发现机制

系统使用**自动发现机制**注册蓝图：

1. 扫描 `apps/modules/` 目录下的所有模块
2. 导入 `views.py` 文件
3. 查找与模块名相同的 Blueprint 变量
4. 自动注册到 Sanic 应用

```python
# apps/modules/your_module/views.py
from sanic import Blueprint

your_module = Blueprint('your_module', url_prefix='/api/your_module')
# 变量名必须与模块名相同，系统会自动发现并注册

@your_module.get('/')
async def index(request):
    return json({'message': 'Hello'})
```

### 添加新模块

#### 1. 创建模块目录

```bash
mkdir apps/modules/your_module
cd apps/modules/your_module
touch __init__.py models.py services.py views.py
```

#### 2. 定义数据模型 (models.py)

```python
from sanic_ext import openapi

@openapi.component
class YourModel:
    field1: str = openapi.String(description="字段1", required=True)
    field2: int = openapi.Integer(description="字段2")
```

#### 3. 实现业务逻辑 (services.py)

```python
from sanic.log import logger

class YourService:
    def __init__(self, db):
        self.db = db
    
    async def get_data(self, id):
        """获取数据"""
        try:
            sql = f"SELECT * FROM your_table WHERE id = {id}"
            data = await self.db.get(sql)
            return data
        except Exception as e:
            logger.error(f'❌ 查询失败: {e}')
            raise
    
    async def create_data(self, data):
        """创建数据"""
        try:
            data_id = await self.db.table_insert('your_table', data)
            logger.info(f'✅ 创建成功: id={data_id}')
            return data_id
        except Exception as e:
            logger.error(f'❌ 创建失败: {e}')
            raise
```

#### 4. 定义API路由 (views.py)

```python
from sanic import Blueprint
from sanic.response import json
from sanic_ext import openapi
from apps.utils.auth_middleware import auth_required
from .services import YourService
from .models import YourModel

# 变量名必须与模块名相同
your_module = Blueprint('your_module', url_prefix='/api/your_module')

@your_module.get('/<id:int>')
@auth_required
@openapi.summary("获取数据")
@openapi.response(200, {"application/json": YourModel})
async def get_data(request, id):
    """获取数据接口"""
    try:
        service = YourService(request.app.ctx.db)
        data = await service.get_data(id)
        
        if not data:
            return json({'code': 404, 'message': '数据不存在'})
        
        return json({'code': 200, 'data': data})
    except Exception as e:
        return json({'code': 500, 'message': f'服务器错误: {str(e)}'})

@your_module.post('/')
@auth_required
@openapi.summary("创建数据")
@openapi.body({"application/json": YourModel})
async def create_data(request):
    """创建数据接口"""
    try:
        user_id = request.ctx.user_id
        data = request.json
        
        service = YourService(request.app.ctx.db)
        data_id = await service.create_data(data)
        
        return json({'code': 200, 'data': {'id': data_id}})
    except Exception as e:
        return json({'code': 500, 'message': f'服务器错误: {str(e)}'})
```

### 数据库操作

#### 基本查询

```python
# 获取单条记录
user = await db.get("SELECT * FROM users WHERE id = 1")

# 获取多条记录
users = await db.query("SELECT * FROM users WHERE is_active = 1")

# 执行SQL
await db.execute("UPDATE users SET name = '张三' WHERE id = 1")

# 插入数据
user_id = await db.table_insert('users', {
    'name': '张三',
    'email': 'zhangsan@example.com',
    'open_id': 'xxx'
})

# 更新数据
await db.table_update('users', {'name': '李四'}, "id = 1")
```

#### 事务处理

```python
async with db.transaction():
    await db.execute("UPDATE account SET balance = balance - 100 WHERE id = 1")
    await db.execute("UPDATE account SET balance = balance + 100 WHERE id = 2")
```

#### 参数化查询（推荐）

```python
# 使用参数化查询防止SQL注入
sql = "SELECT * FROM users WHERE open_id = ?"
user = await db.get(sql, [open_id])

# 多个参数
sql = "SELECT * FROM prompts WHERE user_id = ? AND is_favorite = ?"
prompts = await db.query(sql, [user_id, 1])
```

### 认证中间件使用

```python
from apps.utils.auth_middleware import auth_required, optional_auth, admin_required

# 强制登录
@your_bp.get('/protected')
@auth_required
async def protected_route(request):
    user_id = request.ctx.user_id
    open_id = request.ctx.open_id
    return json({'user_id': user_id})

# 可选登录
@your_bp.get('/public')
@optional_auth
async def public_route(request):
    user_id = request.ctx.user_id  # 可能为None
    if user_id:
        # 已登录逻辑
    else:
        # 未登录逻辑

# 管理员权限
@your_bp.get('/admin')
@auth_required
@admin_required
async def admin_route(request):
    # 只有管理员能访问
```

### 日志记录

```python
from sanic.log import logger

# 信息日志
logger.info(f"✅ 用户登录成功: user_id={user_id}")

# 错误日志
logger.error(f"❌ 数据库查询失败: {e}")

# 警告日志
logger.warning(f"⚠️  Token即将过期: user_id={user_id}")

# 调试日志
logger.debug(f"🔍 调试信息: {data}")
```

### 错误处理

```python
@your_bp.get('/data')
async def get_data(request):
    try:
        # 业务逻辑
        data = await service.get_data()
        return json({'code': 200, 'data': data})
        
    except ValueError as e:
        # 参数错误
        logger.warning(f'⚠️  参数错误: {e}')
        return json({'code': 400, 'message': str(e)})
        
    except PermissionError as e:
        # 权限错误
        logger.warning(f'⚠️  权限不足: {e}')
        return json({'code': 403, 'message': '权限不足'})
        
    except Exception as e:
        # 服务器错误
        logger.error(f'❌ 服务器错误: {e}', exc_info=True)
        return json({'code': 500, 'message': '服务器错误'})
```

## 环境配置

### 开发环境配置

编辑 `config/dev.py`:

```python
class Config:
    # ==========================================
    # 数据库配置
    # ==========================================
    # 数据库类型: 'sqlite' 或 'mysql'
    DB_TYPE = 'sqlite'  # 默认使用SQLite
    
    # SQLite配置
    SQLITE_DB_PATH = 'data/yprompt.db'
    
    # MySQL配置（如果使用MySQL，将DB_TYPE改为'mysql'并配置以下参数）
    DB_HOST = 'localhost'
    DB_USER = 'root'
    DB_PASS = ''
    DB_NAME = 'yprompt'
    DB_PORT = 3306
    
    # ==========================================
    # JWT配置
    # ==========================================
    SECRET_KEY = 'yprompt-dev-secret-key-change-in-production'
    
    # ==========================================
    # Linux.do OAuth配置（可选）
    # ==========================================
    # 如果需要Linux.do OAuth，请填写以下配置
    # 申请地址: https://linux.do
    LINUX_DO_CLIENT_ID = ''
    LINUX_DO_CLIENT_SECRET = ''
    LINUX_DO_REDIRECT_URI = 'http://localhost:5173/auth/callback'
    
    # ==========================================
    # 默认管理员账号配置
    # ==========================================
    DEFAULT_ADMIN_USERNAME = 'admin'
    DEFAULT_ADMIN_PASSWORD = 'admin123'
    DEFAULT_ADMIN_NAME = '管理员'
    
    # ==========================================
    # 服务器配置
    # ==========================================
    DEBUG = True
    WORKERS = 1
    ACCESS_LOG = True
```

### 生产环境配置

编辑 `config/prd.py`:

```python
import os

class Config:
    # 数据库配置
    DB_TYPE = 'sqlite'  # 或 'mysql'
    SQLITE_DB_PATH = 'data/yprompt.db'
    
    # JWT配置（使用环境变量）
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    # Linux.do OAuth配置
    LINUX_DO_CLIENT_ID = os.getenv('LINUX_DO_CLIENT_ID', '')
    LINUX_DO_CLIENT_SECRET = os.getenv('LINUX_DO_CLIENT_SECRET', '')
    LINUX_DO_REDIRECT_URI = os.getenv('LINUX_DO_REDIRECT_URI', 'https://yourdomain.com/auth/callback')
    
    # 默认管理员账号
    DEFAULT_ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
    DEFAULT_ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'change-me')
    DEFAULT_ADMIN_NAME = '管理员'
    
    # 服务器配置
    DEBUG = False
    WORKERS = 4  # 根据CPU核心数调整
    ACCESS_LOG = True
```

### 数据库初始化

#### SQLite（默认）

SQLite 数据库会**自动初始化**，无需手动操作：

1. 首次启动时自动创建 `data/yprompt.db`
2. 自动执行 `migrations/init_sqlite.sql` 初始化表结构
3. 自动创建默认管理员账号（从配置读取）

如果需要重新初始化：

```bash
# 删除数据库文件
rm data/yprompt.db

# 重启服务，自动重新初始化
python run.py
```

#### MySQL（可选）

如果使用 MySQL，需要手动初始化：

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE yprompt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 导入初始化脚本（需要自行转换SQLite脚本为MySQL语法）
# MySQL和SQLite语法差异较大，建议使用SQLite
```

### 数据库配置说明

#### 切换数据库类型

```python
# config/dev.py

# 使用SQLite（推荐）
DB_TYPE = 'sqlite'
SQLITE_DB_PATH = 'data/yprompt.db'

# 使用MySQL
DB_TYPE = 'mysql'
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASS = 'password'
DB_NAME = 'yprompt'
DB_PORT = 3306
```

#### 数据库适配器

系统使用适配器模式支持双数据库，通过 `db_adapter.py` 统一接口：

```python
# apps/utils/db_adapter.py

class DatabaseAdapter(ABC):
    """数据库适配器基类"""
    async def get(self, sql, params): pass
    async def query(self, sql, params): pass
    async def execute(self, sql, params): pass
    async def table_insert(self, table, data): pass
    async def table_update(self, table, data, where): pass

class SQLiteAdapter(DatabaseAdapter):
    """SQLite实现"""
    # 使用 aiosqlite
    # 自动初始化数据库和表结构
    # 使用 ? 占位符

class MySQLAdapter(DatabaseAdapter):
    """MySQL实现"""
    # 使用 ezmysql
    # 使用连接池
```

#### Linux.do OAuth 配置

1. 访问 https://connect.linux.do 创建应用
2. 获取 `Client ID` 和 `Client Secret`
3. 配置回调地址：
   - 开发环境: `http://localhost:5173/auth/callback`
   - 生产环境: `https://yourdomain.com/auth/callback`
4. 填写到 `config/dev.py` 或环境变量

**重要**：必须在 `config/settings.py` 中添加配置项，否则无法加载：

```python
# config/settings.py
class Config(BaseConfig):
    # Linux.do OAuth配置
    LINUX_DO_CLIENT_ID = cf.LINUX_DO_CLIENT_ID if hasattr(cf, 'LINUX_DO_CLIENT_ID') else ''
    LINUX_DO_CLIENT_SECRET = cf.LINUX_DO_CLIENT_SECRET if hasattr(cf, 'LINUX_DO_CLIENT_SECRET') else ''
    LINUX_DO_REDIRECT_URI = cf.LINUX_DO_REDIRECT_URI if hasattr(cf, 'LINUX_DO_REDIRECT_URI') else ''
```

## API文档

启动服务后访问:
- **Swagger UI**: http://localhost:8888/docs
- **OpenAPI JSON**: http://localhost:8888/openapi.json

## ✅ 已完成的重大改造

### 1. 认证系统 - Linux.do OAuth + 本地认证

**当前方案**: 飞书 OAuth 2.0 + JWT

**目标方案**: linux.do OAuth + JWT

#### 需要改造的文件

**1. OAuth工具类**

```python
# apps/utils/feishu_utils.py → apps/utils/linux_do_utils.py

class LinuxDoOAuth:
    """Linux.do OAuth认证类"""
    
    def __init__(self):
        self.client_id = Config.LINUX_DO_CLIENT_ID
        self.client_secret = Config.LINUX_DO_CLIENT_SECRET
        self.redirect_uri = Config.LINUX_DO_REDIRECT_URI
    
    def get_authorization_url(self):
        """获取授权URL"""
        return f"https://linux.do/oauth/authorize?client_id={self.client_id}&..."
    
    def get_access_token(self, code):
        """通过code获取access_token"""
        response = requests.post('https://linux.do/oauth/token', {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code'
        })
        return response.json()['access_token']
    
    def get_user_info(self, access_token):
        """获取用户信息"""
        response = requests.get('https://linux.do/api/user', 
            headers={'Authorization': f'Bearer {access_token}'})
        return response.json()
```

**2. 认证视图**

```python
# apps/modules/auth/views.py

@auth.post('/login')
async def login(request):
    """Linux.do登录"""
    code = request.json.get('code')
    
    # 1. 通过code获取access_token
    oauth = LinuxDoOAuth()
    access_token = oauth.get_access_token(code)
    
    # 2. 获取用户信息
    user_info = oauth.get_user_info(access_token)
    
    # 3. 创建或更新用户
    auth_service = AuthService(request.app.ctx.db)
    user = await auth_service.create_or_update_user_from_linux_do(user_info)
    
    # 4. 生成JWT Token
    token = JWTUtil.generate_token(user['id'], user['linux_do_id'])
    
    return json({'code': 200, 'data': {'token': token, 'user': user}})
```

**3. 认证服务**

```python
# apps/modules/auth/services.py

async def create_or_update_user_from_linux_do(self, user_info):
    """从Linux.do用户信息创建或更新用户"""
    linux_do_id = user_info.get('id')  # Linux.do用户ID
    
    # 查询用户是否存在
    sql = "SELECT * FROM users WHERE linux_do_id = ?"
    user = await self.db.get(sql, [linux_do_id])
    
    if user:
        # 更新用户信息
        await self.update_last_login_time(user['id'])
    else:
        # 创建新用户
        fields = {
            'linux_do_id': linux_do_id,
            'name': user_info.get('username'),
            'avatar': user_info.get('avatar_url'),
            'email': user_info.get('email'),
            'last_login_time': datetime.now()
        }
        user_id = await self.db.table_insert('users', fields)
        user = await self.get_user_by_id(user_id)
    
    return user
```

**4. 配置文件**

```python
# config/dev.py, config/prd.py

# Linux.do OAuth配置
LINUX_DO_CLIENT_ID = 'your_client_id'
LINUX_DO_CLIENT_SECRET = 'your_client_secret'
LINUX_DO_REDIRECT_URI = 'http://localhost:5173/auth/callback'
```

**5. 数据库迁移**

```sql
-- migrations/migrate_to_linux_do.sql

-- 1. 添加新字段
ALTER TABLE users ADD COLUMN linux_do_id VARCHAR(64);
ALTER TABLE users ADD INDEX idx_linux_do_id (linux_do_id);

-- 2. 数据迁移（如果需要保留飞书数据）
-- 将 open_id 复制到 linux_do_id
UPDATE users SET linux_do_id = open_id WHERE linux_do_id IS NULL;

-- 3. 可选：移除飞书字段
-- ALTER TABLE users DROP COLUMN union_id;
-- ALTER TABLE users DROP INDEX idx_open_id;
-- ALTER TABLE users DROP COLUMN open_id;
```

#### 改造步骤

1. 创建 `linux_do_utils.py`
2. 修改 `auth/views.py` 登录接口
3. 修改 `auth/services.py` 用户创建逻辑
4. 更新配置文件
5. 执行数据库迁移
6. 更新JWT生成逻辑（使用`linux_do_id`）
7. 前端配合调整

### 2. 数据库改造 - 支持 SQLite + MySQL

**当前方案**: 仅支持 MySQL (ezmysql)

**目标方案**: 同时支持 SQLite 和 MySQL，默认 SQLite

#### 改造方案

**1. 数据库适配器层**

```python
# apps/utils/db_adapter.py

from abc import ABC, abstractmethod

class DatabaseAdapter(ABC):
    """数据库适配器基类"""
    
    @abstractmethod
    async def connect(self):
        """建立连接"""
        pass
    
    @abstractmethod
    async def close(self):
        """关闭连接"""
        pass
    
    @abstractmethod
    async def get(self, sql, params=None):
        """查询单条记录"""
        pass
    
    @abstractmethod
    async def query(self, sql, params=None):
        """查询多条记录"""
        pass
    
    @abstractmethod
    async def execute(self, sql, params=None):
        """执行SQL"""
        pass
    
    @abstractmethod
    async def table_insert(self, table, data):
        """插入数据"""
        pass
    
    @abstractmethod
    async def table_update(self, table, data, where):
        """更新数据"""
        pass
    
    @abstractmethod
    def transaction(self):
        """事务"""
        pass


class MySQLAdapter(DatabaseAdapter):
    """MySQL适配器 (使用ezmysql)"""
    
    def __init__(self, config):
        from ezmysql import ConnectionAsync
        self.db = ConnectionAsync(
            config['host'],
            config['database'],
            config['user'],
            config['password'],
            minsize=3,
            maxsize=10,
            pool_recycle=3600,
            autocommit=True,
            charset='utf8mb4'
        )
    
    async def get(self, sql, params=None):
        if params:
            return await self.db.get(sql, params)
        return await self.db.get(sql)
    
    # 实现其他方法...


class SQLiteAdapter(DatabaseAdapter):
    """SQLite适配器 (使用aiosqlite)"""
    
    def __init__(self, config):
        import aiosqlite
        self.db_path = config['path']
        self.db = None
    
    async def connect(self):
        import aiosqlite
        self.db = await aiosqlite.connect(self.db_path)
        # 启用外键约束
        await self.db.execute('PRAGMA foreign_keys = ON')
    
    async def get(self, sql, params=None):
        # 替换参数占位符: ? → ?
        async with self.db.execute(sql, params or []) as cursor:
            row = await cursor.fetchone()
            if row:
                # 转换为字典
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, row))
            return None
    
    async def query(self, sql, params=None):
        async with self.db.execute(sql, params or []) as cursor:
            rows = await cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
    
    async def execute(self, sql, params=None):
        await self.db.execute(sql, params or [])
        await self.db.commit()
    
    async def table_insert(self, table, data):
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        sql = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        cursor = await self.db.execute(sql, list(data.values()))
        await self.db.commit()
        return cursor.lastrowid
    
    def transaction(self):
        # SQLite自动提交，使用begin/commit控制
        return self.db
    
    # 实现其他方法...
```

**2. 数据库工具更新**

```python
# apps/utils/db_utils.py

from apps.utils.db_adapter import MySQLAdapter, SQLiteAdapter

class DB:
    def __init__(self, app):
        self.app = app
        if app:
            self.init_app(app=app)
    
    def init_app(self, app):
        @app.listener('before_server_start')
        async def setup_db(app, loop):
            db_type = app.config.get('DB_TYPE', 'sqlite')
            
            if db_type == 'sqlite':
                # SQLite配置
                adapter = SQLiteAdapter({
                    'path': app.config.get('SQLITE_DB_PATH', 'data/yprompt.db')
                })
                await adapter.connect()
            else:
                # MySQL配置
                adapter = MySQLAdapter({
                    'host': app.config['DB_HOST'],
                    'database': app.config['DB_NAME'],
                    'user': app.config['DB_USER'],
                    'password': app.config['DB_PASS']
                })
            
            app.ctx.db = adapter
            logger.info(f"✅ 数据库连接成功: {db_type}")
        
        @app.listener('after_server_stop')
        async def close_db(app, loop):
            if hasattr(app.ctx, 'db'):
                await app.ctx.db.close()
```

**3. 配置文件更新**

```python
# config/base.py

# 数据库类型: sqlite 或 mysql
DB_TYPE = 'sqlite'

# SQLite配置
SQLITE_DB_PATH = '../data/yprompt.db'

# MySQL配置（保持现有）
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASS = ''
DB_NAME = 'yprompt'
DB_PORT = 3306
```

**4. SQLite初始化脚本**

```sql
-- migrations/yprompt_sqlite.sql

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_id VARCHAR(64) UNIQUE NOT NULL,
  union_id VARCHAR(64),
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(255),
  email VARCHAR(100),
  mobile VARCHAR(20),
  is_active INTEGER DEFAULT 1,
  last_login_time DATETIME,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_open_id ON users(open_id);

-- 提示词表
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  requirement_report TEXT,
  thinking_points TEXT,
  initial_prompt TEXT,
  advice TEXT,
  final_prompt TEXT,
  language VARCHAR(10) DEFAULT 'zh',
  format VARCHAR(10) DEFAULT 'markdown',
  prompt_type VARCHAR(10) DEFAULT 'system',
  is_favorite INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  tags VARCHAR(500),
  current_version VARCHAR(20) DEFAULT '1.0.0',
  total_versions INTEGER DEFAULT 1,
  last_version_time DATETIME,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 更新时间触发器（SQLite不支持ON UPDATE CURRENT_TIMESTAMP）
CREATE TRIGGER update_prompts_timestamp 
AFTER UPDATE ON prompts
FOR EACH ROW
BEGIN
  UPDATE prompts SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 其他表...
```

**5. 依赖更新**

```python
# requirements.txt

# 添加
aiosqlite==0.19.0          # SQLite异步支持

# 保留
ezmysql==0.9.0             # MySQL支持
PyMySQL==1.1.0
aiomysql==0.2.0
```

#### SQL兼容性注意事项

1. **数据类型映射**:
   - MySQL `TINYINT(1)` → SQLite `INTEGER`
   - MySQL `INT(11)` → SQLite `INTEGER`
   - MySQL `VARCHAR(N)` → SQLite `VARCHAR(N)` 或 `TEXT`
   - MySQL `DATETIME` → SQLite `DATETIME` 或 `TEXT`

2. **自动更新时间**:
   - MySQL: `ON UPDATE CURRENT_TIMESTAMP`
   - SQLite: 需要使用触发器

3. **外键约束**:
   - SQLite默认关闭: `PRAGMA foreign_keys = ON`

4. **参数化查询**:
   - 统一使用 `?` 占位符

5. **字符串拼接SQL → 参数化**:
```python
# 不推荐（SQL注入风险）
sql = f"SELECT * FROM users WHERE id = {user_id}"

# 推荐
sql = "SELECT * FROM users WHERE id = ?"
await db.get(sql, [user_id])
```

#### 改造优先级

1. ✅ **Phase 1**: 创建适配器层
2. ✅ **Phase 2**: 更新db_utils.py
3. ✅ **Phase 3**: SQLite初始化脚本
4. ⚠️ **Phase 4**: 修改所有Service层SQL（参数化）
5. ⚠️ **Phase 5**: 测试两种数据库
6. ✅ **Phase 6**: 更新文档

## 性能优化建议

1. **数据库优化**:
   - 添加合适的索引
   - 使用参数化查询
   - 连接池优化

2. **缓存**:
   - Redis缓存热点数据
   - 用户信息缓存
   - 提示词列表缓存

3. **多进程**:
   ```bash
   python run.py --workers=4  # 根据CPU核心数
   ```

4. **日志优化**:
   - 生产环境调整日志级别
   - 日志轮转

## 安全注意事项

1. **永远不要提交敏感信息到git**:
   - `config/dev.py`, `config/prd.py`
   - 数据库密码
   - API密钥

2. **生产环境必须修改**:
   - `SECRET_KEY` - JWT密钥
   - 飞书应用密钥
   - 数据库密码

3. **SQL注入防护**:
   - ✅ 使用参数化查询
   - ❌ 避免字符串拼接SQL

4. **CORS配置**:
   - 生产环境限制允许的域名

## 常见开发任务

### 修改数据库结构
1. 创建迁移SQL脚本 `migrations/xxx.sql`
2. 测试迁移脚本
3. 更新Service层代码
4. 更新OpenAPI模型

### 添加新的API端点
1. 在 `apps/modules/*/views.py` 添加路由
2. 在 `services.py` 实现业务逻辑
3. 在 `models.py` 定义OpenAPI模型
4. 测试API（Swagger UI）

### 修改认证逻辑
1. 修改 `apps/utils/auth_middleware.py`
2. 修改 `apps/modules/auth/views.py`
3. 修改 `apps/utils/jwt_utils.py`

## 项目特色

1. **蓝图自动发现** - 无需手动注册，自动扫描
2. **三层架构** - 清晰的职责分离
3. **性能优化** - 老用户登录不调用外部API
4. **OpenAPI文档** - 自动生成Swagger文档
5. **异步高性能** - Sanic异步框架

## 相关文档

- **根目录文档**: `/CLAUDE.md` - 前后端统一文档
- **前端文档**: `/yprompt/CLAUDE.md` - 前端详细文档
- **Sanic文档**: https://sanic.dev
- **ezmysql文档**: https://github.com/veelion/ezmysql

## 联系方式

如需帮助或反馈问题，请联系项目维护者。
