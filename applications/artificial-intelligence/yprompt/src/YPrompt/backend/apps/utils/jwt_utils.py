"""
JWT工具类
用于生成和验证JWT Token
"""
import jwt
import datetime
from sanic.log import logger


class JWTUtil:
    """JWT Token 工具类"""
    
    # 从配置中读取密钥,如果没有则使用默认值(生产环境务必修改)
    SECRET_KEY = None
    ALGORITHM = 'HS256'
    
    @classmethod
    def init_app(cls, app):
        """初始化JWT配置"""
        cls.SECRET_KEY = app.config.get('SECRET_KEY', 'your-secret-key-change-in-production')
        if cls.SECRET_KEY == 'your-secret-key-change-in-production':
            logger.warning('⚠️  警告: 使用默认SECRET_KEY,生产环境请务必修改配置!')
    
    @classmethod
    def generate_token(cls, user_id, open_id, expire_hours=24):
        """
        生成JWT Token
        
        Args:
            user_id: 用户ID
            open_id: 飞书用户open_id
            expire_hours: 过期时间(小时),默认24小时
            
        Returns:
            str: JWT Token字符串
        """
        if not cls.SECRET_KEY:
            raise ValueError('SECRET_KEY未配置,请先调用init_app初始化')
        
        try:
            payload = {
                'user_id': user_id,
                'open_id': open_id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=expire_hours),
                'iat': datetime.datetime.utcnow(),
                'type': 'access_token'
            }
            
            token = jwt.encode(payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)
            
            # PyJWT 2.x 版本返回字符串,不需要decode
            if isinstance(token, bytes):
                token = token.decode('utf-8')
            
            logger.debug(f'✅ 为用户 {user_id} 生成Token成功, 有效期: {expire_hours}小时')
            return token
            
        except Exception as e:
            logger.error(f'❌ 生成Token失败: {e}')
            raise
    
    @classmethod
    def verify_token(cls, token):
        """
        验证JWT Token
        
        Args:
            token: JWT Token字符串
            
        Returns:
            dict: 解码后的payload,包含user_id和open_id
            None: Token无效或过期
        """
        if not cls.SECRET_KEY:
            raise ValueError('SECRET_KEY未配置,请先调用init_app初始化')
        
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            logger.debug(f'✅ Token验证成功, user_id: {payload.get("user_id")}')
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning('⚠️  Token已过期')
            return None
            
        except jwt.InvalidTokenError as e:
            logger.warning(f'⚠️  Token无效: {e}')
            return None
            
        except Exception as e:
            logger.error(f'❌ Token验证异常: {e}')
            return None
    
    @classmethod
    def refresh_token(cls, old_token, expire_hours=24):
        """
        刷新Token
        
        Args:
            old_token: 旧的JWT Token
            expire_hours: 新Token的过期时间(小时)
            
        Returns:
            str: 新的JWT Token
            None: 旧Token无效
        """
        payload = cls.verify_token(old_token)
        
        if not payload:
            return None
        
        # 使用旧Token中的用户信息生成新Token
        return cls.generate_token(
            payload['user_id'],
            payload['open_id'],
            expire_hours
        )
    
    @classmethod
    def decode_token_without_verify(cls, token):
        """
        解码Token但不验证(用于调试)
        
        Args:
            token: JWT Token字符串
            
        Returns:
            dict: 解码后的payload
        """
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
        except Exception as e:
            logger.error(f'❌ Token解码失败: {e}')
            return None

