# -*- coding: utf-8 -*-
import json
from sanic.log import logger

class UserSettingsService:
    """User settings service"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_ai_config(self, user_id: int):
        """Get user AI configuration"""
        try:
            sql = "SELECT ai_config FROM user_ai_configs WHERE user_id = ?"
            result = await self.db.get(sql, [user_id])
            
            if not result or not result.get('ai_config'):
                return None
            
            # Parse JSON string
            try:
                config = json.loads(result['ai_config'])
                return config
            except json.JSONDecodeError as e:
                logger.error(f'Failed to parse AI config JSON: {e}')
                return None
                
        except Exception as e:
            logger.error(f'Failed to get user AI config: {e}')
            raise
    
    async def save_ai_config(self, user_id: int, config_data: dict):
        """Save or update user AI configuration"""
        try:
            # Check if user config exists
            existing = await self.db.get(
                "SELECT id FROM user_ai_configs WHERE user_id = ?",
                [user_id]
            )
            
            # Convert config object to JSON string
            config_json = json.dumps(config_data, ensure_ascii=False)
            
            if existing:
                # Update existing config
                sql = "UPDATE user_ai_configs SET ai_config = ? WHERE user_id = ?"
                await self.db.execute(sql, [config_json, user_id])
                logger.info(f'Updated user AI config successfully: user_id={user_id}')
            else:
                # Create new config
                await self.db.table_insert('user_ai_configs', {
                    'user_id': user_id,
                    'ai_config': config_json
                })
                logger.info(f'Created user AI config successfully: user_id={user_id}')
            
            # Return saved config
            return config_data
            
        except Exception as e:
            logger.error(f'Failed to save user AI config: {e}')
            raise
    
    async def delete_ai_config(self, user_id: int):
        """Delete user AI configuration (reset to default)"""
        try:
            sql = "DELETE FROM user_ai_configs WHERE user_id = ?"
            await self.db.execute(sql, [user_id])
            logger.info(f'Deleted user AI config successfully: user_id={user_id}')
        except Exception as e:
            logger.error(f'Failed to delete user AI config: {e}')
            raise
