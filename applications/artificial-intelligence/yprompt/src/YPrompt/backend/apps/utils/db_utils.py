from sanic.log import logger
from apps.utils.db_adapter import create_database_adapter


class DB:
    """数据库工具类，支持SQLite和MySQL"""
    
    def __init__(self, app):
        self.app = app
        
        if app:
            self.init_app(app=app)
    
    def init_app(self, app):
        @app.listener('before_server_start')
        async def setup_db(app, loop):
            """
            服务启动前创建数据库连接
            根据配置自动选择SQLite或MySQL
            """
            db_type = app.config.get('DB_TYPE', 'sqlite')
            
            logger.info(f"📦 初始化数据库: {db_type}")
            
            if db_type == 'sqlite':
                # SQLite配置
                config = {
                    'path': app.config.get('SQLITE_DB_PATH', 'data/yprompt.db')
                }
                logger.info(f"📁 SQLite数据库路径: {config['path']}")
                
            elif db_type == 'mysql':
                # MySQL配置
                config = {
                    'host': app.config.get('DB_HOST'),
                    'database': app.config.get('DB_NAME'),
                    'user': app.config.get('DB_USER'),
                    'password': app.config.get('DB_PASS'),
                    'port': app.config.get('DB_PORT', 3306),
                    'minsize': 3,
                    'maxsize': 10,
                    'pool_recycle': 3600
                }
                logger.info(f"🔗 MySQL数据库: {config['host']}/{config['database']}")
                
            else:
                raise ValueError(f"不支持的数据库类型: {db_type}")
            
            # 创建数据库适配器（传递应用配置）
            adapter = await create_database_adapter(db_type, config, dict(app.config))
            
            # 保存到应用上下文
            app.ctx.db = adapter
            app.ctx.db_type = db_type
            
            logger.info(f"✅ 数据库初始化成功: {db_type}")
        
        @app.listener('after_server_stop')
        async def close_db(app, loop):
            """
            服务停止后关闭数据库连接
            """
            if hasattr(app.ctx, 'db'):
                await app.ctx.db.close()
                logger.info("✅ 数据库连接已关闭")
