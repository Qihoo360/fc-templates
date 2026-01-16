"""
URL生成服务
统一管理所有URL生成逻辑，支持反向代理域名配置
"""

import logging
from typing import Optional
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class URLService:
    """URL生成服务"""
    
    def __init__(self):
        self._base_url = None
        self._config_service = None
    
    def _get_config_service(self):
        """延迟加载配置服务，避免循环导入"""
        if self._config_service is None:
            from .config_service import config_service
            self._config_service = config_service
        return self._config_service
    
    def _get_base_url(self) -> str:
        """获取基础URL配置"""
        # 每次都重新获取配置，确保使用最新的配置
        try:
            config_service = self._get_config_service()
            app_config = config_service.get_config_by_category('app_config')
            base_url = app_config.get('base_url', 'http://localhost:8000')
            
            # 确保URL不以斜杠结尾
            if base_url.endswith('/'):
                base_url = base_url[:-1]
            
            logger.debug(f"Using base URL: {base_url}")
            return base_url
            
        except Exception as e:
            logger.warning(f"无法获取基础URL配置，使用默认值: {e}")
            return 'http://localhost:8000'
    
    def build_absolute_url(self, relative_path: str) -> str:
        """构建绝对URL"""
        base_url = self._get_base_url()
        
        # 确保相对路径以斜杠开头
        if not relative_path.startswith('/'):
            relative_path = '/' + relative_path
        
        absolute_url = f"{base_url}{relative_path}"
        logger.debug(f"Built absolute URL: {relative_path} -> {absolute_url}")
        return absolute_url
    
    def build_image_url(self, image_id: str) -> str:
        """构建图片访问URL"""
        return self.build_absolute_url(f"/api/image/view/{image_id}")
    
    def build_image_thumbnail_url(self, image_id: str) -> str:
        """构建图片缩略图URL"""
        return self.build_absolute_url(f"/api/image/thumbnail/{image_id}")
    
    def build_image_download_url(self, image_id: str) -> str:
        """构建图片下载URL"""
        return self.build_absolute_url(f"/api/image/download/{image_id}")
    
    def build_static_url(self, static_path: str) -> str:
        """构建静态资源URL"""
        # 确保静态路径不以斜杠开头（因为/static已经包含了）
        if static_path.startswith('/'):
            static_path = static_path[1:]
        return self.build_absolute_url(f"/static/{static_path}")
    
    def build_temp_url(self, temp_path: str) -> str:
        """构建临时文件URL"""
        # 确保临时路径不以斜杠开头（因为/temp已经包含了）
        if temp_path.startswith('/'):
            temp_path = temp_path[1:]
        return self.build_absolute_url(f"/temp/{temp_path}")
    
    def get_current_base_url(self) -> str:
        """获取当前配置的基础URL"""
        return self._get_base_url()
    
    def is_localhost_url(self, url: str) -> bool:
        """检查URL是否为localhost"""
        return 'localhost' in url or '127.0.0.1' in url
    
    def validate_base_url(self, base_url: str) -> bool:
        """验证基础URL格式"""
        try:
            if not base_url:
                return False
            
            # 基本格式检查
            if not (base_url.startswith('http://') or base_url.startswith('https://')):
                return False
            
            # 不能以斜杠结尾
            if base_url.endswith('/'):
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"URL validation error: {e}")
            return False


# 全局URL服务实例
_url_service = None


def get_url_service() -> URLService:
    """获取全局URL服务实例"""
    global _url_service
    if _url_service is None:
        _url_service = URLService()
    return _url_service


# 便捷函数
def build_absolute_url(relative_path: str) -> str:
    """构建绝对URL的便捷函数"""
    return get_url_service().build_absolute_url(relative_path)


def build_image_url(image_id: str) -> str:
    """构建图片URL的便捷函数"""
    return get_url_service().build_image_url(image_id)


def build_image_thumbnail_url(image_id: str) -> str:
    """构建图片缩略图URL的便捷函数"""
    return get_url_service().build_image_thumbnail_url(image_id)


def build_image_download_url(image_id: str) -> str:
    """构建图片下载URL的便捷函数"""
    return get_url_service().build_image_download_url(image_id)


def get_current_base_url() -> str:
    """获取当前基础URL的便捷函数"""
    return get_url_service().get_current_base_url()
