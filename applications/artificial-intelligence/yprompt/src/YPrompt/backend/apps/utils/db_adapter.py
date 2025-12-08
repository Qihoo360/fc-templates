#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
数据库适配器
支持 SQLite 和 MySQL 双数据库
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from sanic.log import logger


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
    async def get(self, sql: str, params: Optional[List] = None) -> Optional[Dict]:
        """查询单条记录"""
        pass
    
    @abstractmethod
    async def query(self, sql: str, params: Optional[List] = None) -> List[Dict]:
        """查询多条记录"""
        pass
    
    @abstractmethod
    async def execute(self, sql: str, params: Optional[List] = None):
        """执行SQL"""
        pass
    
    @abstractmethod
    async def table_insert(self, table: str, data: Dict) -> int:
        """插入数据"""
        pass
    
    @abstractmethod
    async def table_update(self, table: str, data: Dict, where: str):
        """更新数据"""
        pass
    
    @abstractmethod
    def transaction(self):
        """事务"""
        pass


class MySQLAdapter(DatabaseAdapter):
    """MySQL适配器 (使用ezmysql)"""
    
    def __init__(self, config: Dict):
        from ezmysql import ConnectionAsync
        
        self.db = ConnectionAsync(
            config['host'],
            config['database'],
            config['user'],
            config['password'],
            port=config.get('port', 3306),
            minsize=config.get('minsize', 3),
            maxsize=config.get('maxsize', 10),
            pool_recycle=config.get('pool_recycle', 3600),
            autocommit=True,
            charset='utf8mb4'
        )
        logger.info(f"✅ MySQL连接池创建成功: {config['host']}/{config['database']}")
    
    async def connect(self):
        """MySQL使用连接池，无需显式连接"""
        pass
    
    async def close(self):
        """关闭连接池"""
        if self.db:
            self.db.close()
            logger.info("✅ MySQL连接池已关闭")
    
    async def get(self, sql: str, params: Optional[List] = None) -> Optional[Dict]:
        """查询单条记录"""
        if params:
            return await self.db.get(sql, params)
        return await self.db.get(sql)
    
    async def query(self, sql: str, params: Optional[List] = None) -> List[Dict]:
        """查询多条记录"""
        if params:
            return await self.db.query(sql, params)
        return await self.db.query(sql)
    
    async def execute(self, sql: str, params: Optional[List] = None):
        """执行SQL"""
        if params:
            await self.db.execute(sql, params)
        else:
            await self.db.execute(sql)
    
    async def table_insert(self, table: str, data: Dict) -> int:
        """插入数据"""
        return await self.db.table_insert(table, data)
    
    async def table_update(self, table: str, data: Dict, where: str):
        """更新数据"""
        await self.db.table_update(table, data, where)
    
    def transaction(self):
        """事务（ezmysql支持）"""
        return self.db.transaction()


class SQLiteAdapter(DatabaseAdapter):
    """SQLite适配器 (使用aiosqlite)"""
    
    def __init__(self, config: Dict):
        import os
        
        self.db_path = config['path']
        self.db = None
        
        # 确保数据库目录存在
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
            logger.info(f"✅ 创建数据库目录: {db_dir}")
    
    async def connect(self):
        """建立SQLite连接"""
        import aiosqlite
        
        self.db = await aiosqlite.connect(self.db_path)
        
        # 设置Row Factory，返回字典格式
        self.db.row_factory = aiosqlite.Row
        
        # 启用外键约束
        await self.db.execute('PRAGMA foreign_keys = ON')
        await self.db.commit()
        
        logger.info(f"✅ SQLite连接成功: {self.db_path}")
    
    async def close(self):
        """关闭连接"""
        if self.db:
            await self.db.close()
            logger.info("✅ SQLite连接已关闭")
    
    async def get(self, sql: str, params: Optional[List] = None) -> Optional[Dict]:
        """查询单条记录"""
        async with self.db.execute(sql, params or []) as cursor:
            row = await cursor.fetchone()
            if row:
                # aiosqlite.Row 转为字典
                return dict(row)
            return None
    
    async def query(self, sql: str, params: Optional[List] = None) -> List[Dict]:
        """查询多条记录"""
        async with self.db.execute(sql, params or []) as cursor:
            rows = await cursor.fetchall()
            # 转为字典列表
            return [dict(row) for row in rows]
    
    async def execute(self, sql: str, params: Optional[List] = None):
        """执行SQL"""
        await self.db.execute(sql, params or [])
        await self.db.commit()
    
    async def table_insert(self, table: str, data: Dict) -> int:
        """插入数据"""
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        sql = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        
        cursor = await self.db.execute(sql, list(data.values()))
        await self.db.commit()
        return cursor.lastrowid
    
    async def table_update(self, table: str, data: Dict, where: str):
        """更新数据"""
        set_clause = ', '.join([f"{k} = ?" for k in data.keys()])
        sql = f"UPDATE {table} SET {set_clause} WHERE {where}"
        
        await self.db.execute(sql, list(data.values()))
        await self.db.commit()
    
    def transaction(self):
        """事务（SQLite自动提交模式下使用begin/commit）"""
        # 返回数据库连接对象，可以使用 async with db.transaction() 控制事务
        return self.db


async def create_database_adapter(db_type: str, config: Dict, app_config: Dict = None) -> DatabaseAdapter:
    """
    创建数据库适配器
    
    Args:
        db_type: 数据库类型 'sqlite' 或 'mysql'
        config: 数据库配置
        app_config: 应用配置（可选，用于获取默认管理员账号等配置）
        
    Returns:
        DatabaseAdapter: 数据库适配器实例
    """
    if db_type == 'sqlite':
        adapter = SQLiteAdapter(config)
        await adapter.connect()
        
        # 检查是否需要初始化数据库
        await _initialize_sqlite_if_needed(adapter, app_config)
        
        return adapter
    elif db_type == 'mysql':
        adapter = MySQLAdapter(config)
        await adapter.connect()
        return adapter
    else:
        raise ValueError(f"不支持的数据库类型: {db_type}")


async def _initialize_sqlite_if_needed(adapter: SQLiteAdapter, config: Dict = None):
    """
    检查并初始化SQLite数据库
    如果users表不存在，则执行初始化脚本
    
    Args:
        adapter: SQLite适配器
        config: 应用配置（用于获取默认管理员账号配置）
    """
    try:
        # 检查users表是否存在
        result = await adapter.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        
        if not result:
            logger.info("📦 SQLite数据库为空，开始初始化...")
            
            # 读取初始化脚本
            import os
            script_path = os.path.join(
                os.path.dirname(__file__),
                '../../migrations/init_sqlite.sql'
            )
            
            if os.path.exists(script_path):
                with open(script_path, 'r', encoding='utf-8') as f:
                    sql_script = f.read()
                
                # 执行初始化脚本（不包含默认管理员账号）
                import aiosqlite
                async with aiosqlite.connect(adapter.db_path) as db:
                    await db.executescript(sql_script)
                    await db.commit()
                
                logger.info("✅ SQLite表结构初始化完成")
                
                # 创建默认管理员账号（从配置读取）
                await _create_default_admin(adapter, config)
                
            else:
                logger.warning(f"⚠️  未找到SQLite初始化脚本: {script_path}")
        else:
            logger.info("✅ SQLite数据库已存在，跳过表结构初始化")
            # 数据库已存在，但仍然需要检查并同步管理员账号
            await _sync_admin_account(adapter, config)
            
    except Exception as e:
        logger.error(f"❌ SQLite数据库初始化检查失败: {e}")
        raise


async def _create_default_admin(adapter: SQLiteAdapter, config: Dict = None):
    """
    创建默认管理员账号（仅用于首次初始化）
    从配置文件读取默认账号信息
    
    Args:
        adapter: SQLite适配器
        config: 应用配置
    """
    try:
        # 从配置读取默认管理员账号信息
        admin_username = 'admin'
        admin_password = 'admin123'
        admin_name = '管理员'
        
        if config:
            admin_username = config.get('DEFAULT_ADMIN_USERNAME', 'admin')
            admin_password = config.get('DEFAULT_ADMIN_PASSWORD', 'admin123')
            admin_name = config.get('DEFAULT_ADMIN_NAME', '管理员')
        
        # 检查管理员账号是否已存在
        existing_admin = await adapter.get(
            "SELECT id FROM users WHERE username = ? AND auth_type = 'local'",
            [admin_username]
        )
        
        if existing_admin:
            logger.info(f"✅ 管理员账号已存在: {admin_username}")
            return
        
        # 生成密码哈希
        import bcrypt
        password_bytes = admin_password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        # 插入默认管理员账号
        await adapter.execute(
            """
            INSERT INTO users (username, password_hash, name, auth_type, is_admin, is_active)
            VALUES (?, ?, ?, 'local', 1, 1)
            """,
            [admin_username, password_hash, admin_name]
        )
        
        logger.info(f"✅ 默认管理员账号创建成功: {admin_username} / {admin_password}")

    except Exception as e:
        logger.error(f"❌ 创建默认管理员账号失败: {e}")
        raise


async def _sync_admin_account(adapter: SQLiteAdapter, config: Dict = None):
    """
    同步管理员账号（每次启动时执行）
    - 如果配置的管理员用户名对应的账号不存在，则创建
    - 如果存在，则更新密码（仅当密码哈希不匹配时）
    
    这样可以确保环境变量 ADMIN_USERNAME 和 ADMIN_PASSWORD 始终生效
    
    Args:
        adapter: SQLite适配器
        config: 应用配置
    """
    try:
        # 从配置读取管理员账号信息
        admin_username = 'admin'
        admin_password = 'admin123'
        admin_name = '管理员'
        
        if config:
            admin_username = config.get('DEFAULT_ADMIN_USERNAME', 'admin')
            admin_password = config.get('DEFAULT_ADMIN_PASSWORD', 'admin123')
            admin_name = config.get('DEFAULT_ADMIN_NAME', '管理员')
        
        # 生成密码哈希
        import bcrypt
        password_bytes = admin_password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        # 检查管理员账号是否已存在
        existing_admin = await adapter.get(
            "SELECT id, password_hash FROM users WHERE username = ? AND auth_type = 'local'",
            [admin_username]
        )
        
        if existing_admin:
            # 账号已存在，检查密码是否需要更新
            # 注意：由于bcrypt每次生成的salt不同，我们需要验证密码而不是直接比较哈希
            old_hash = existing_admin.get('password_hash', '')
            
            # 验证当前密码是否正确
            try:
                is_password_correct = bcrypt.checkpw(password_bytes, old_hash.encode('utf-8'))
            except:
                is_password_correct = False
            
            if not is_password_correct:
                # 密码不匹配，需要更新
                await adapter.execute(
                    "UPDATE users SET password_hash = ?, name = ? WHERE id = ?",
                    [password_hash, admin_name, existing_admin['id']]
                )
                logger.info(f"🔄 管理员账号密码已更新: {admin_username}")
            else:
                logger.info(f"✅ 管理员账号配置正确: {admin_username}")
        else:
            # 账号不存在，创建新账号
            await adapter.execute(
                """
                INSERT INTO users (username, password_hash, name, auth_type, is_admin, is_active)
                VALUES (?, ?, ?, 'local', 1, 1)
                """,
                [admin_username, password_hash, admin_name]
            )
            logger.info(f"✅ 管理员账号创建成功: {admin_username} / {admin_password}")
    
    except Exception as e:
        logger.error(f"❌ 同步管理员账号失败: {e}")
        raise
