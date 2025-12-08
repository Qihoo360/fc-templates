"""
标签服务类
处理标签相关的业务逻辑
"""
from sanic.log import logger


class TagService:
    """标签服务类"""
    
    def __init__(self, db):
        """
        初始化标签服务
        
        Args:
            db: 数据库连接对象(ezmysql ConnectionAsync)
        """
        self.db = db
    
    async def get_user_tags(self, user_id, limit=50):
        """
        获取用户的标签列表
        
        Args:
            user_id: 用户ID
            limit: 返回数量限制,默认50个
            
        Returns:
            list: 标签列表,按使用次数降序
        """
        try:
            sql = f"""
                SELECT id, tag_name, use_count, create_time
                FROM prompt_tags
                WHERE user_id = {user_id}
                ORDER BY use_count DESC, create_time DESC
                LIMIT {limit}
            """
            
            tags = await self.db.query(sql)
            
            # 时间格式化
            for tag in tags:
                tag['create_time'] = str(tag['create_time']) if tag.get('create_time') else ''
            
            logger.debug(f'✅ 查询用户标签成功: user_id={user_id}, count={len(tags)}')
            
            return tags
            
        except Exception as e:
            logger.error(f'❌ 查询用户标签失败: {e}')
            raise
    
    async def create_tag(self, user_id, tag_name):
        """
        创建标签
        
        Args:
            user_id: 用户ID
            tag_name: 标签名称
            
        Returns:
            dict: 标签信息,如果已存在则返回已有标签
        """
        try:
            # 检查标签是否已存在
            check_sql = f"""
                SELECT id, tag_name, use_count
                FROM prompt_tags
                WHERE user_id = {user_id} AND tag_name = '{tag_name}'
            """
            existing = await self.db.get(check_sql)
            
            if existing:
                logger.info(f'⚠️  标签已存在: tag_name={tag_name}, user_id={user_id}')
                return existing
            
            # 创建新标签
            fields = {
                'tag_name': tag_name,
                'user_id': user_id,
                'use_count': 0
            }
            
            tag_id = await self.db.table_insert('prompt_tags', fields)
            
            logger.info(f'✅ 创建标签成功: tag_id={tag_id}, tag_name={tag_name}, user_id={user_id}')
            
            # 返回新创建的标签
            return {
                'id': tag_id,
                'tag_name': tag_name,
                'use_count': 0
            }
            
        except Exception as e:
            logger.error(f'❌ 创建标签失败: {e}')
            raise
    
    async def delete_tag(self, user_id, tag_id):
        """
        删除标签
        
        Args:
            user_id: 用户ID
            tag_id: 标签ID
            
        Returns:
            bool: 是否成功
        """
        try:
            # 先检查权限
            check_sql = f"SELECT id FROM prompt_tags WHERE id = {tag_id} AND user_id = {user_id}"
            exists = await self.db.get(check_sql)
            
            if not exists:
                logger.warning(f'⚠️  无权限删除标签: tag_id={tag_id}, user_id={user_id}')
                return False
            
            # 删除标签
            delete_sql = f"DELETE FROM prompt_tags WHERE id = {tag_id} AND user_id = {user_id}"
            await self.db.execute(delete_sql)
            
            logger.info(f'✅ 删除标签成功: tag_id={tag_id}, user_id={user_id}')
            return True
            
        except Exception as e:
            logger.error(f'❌ 删除标签失败: {e}')
            raise
    
    async def get_popular_tags(self, user_id, limit=20):
        """
        获取热门标签
        
        Args:
            user_id: 用户ID
            limit: 返回数量
            
        Returns:
            list: 热门标签列表
        """
        try:
            sql = f"""
                SELECT tag_name, use_count
                FROM prompt_tags
                WHERE user_id = {user_id} AND use_count > 0
                ORDER BY use_count DESC
                LIMIT {limit}
            """
            
            tags = await self.db.query(sql)
            
            logger.debug(f'✅ 查询热门标签成功: user_id={user_id}, count={len(tags)}')
            
            return tags
            
        except Exception as e:
            logger.error(f'❌ 查询热门标签失败: {e}')
            raise

