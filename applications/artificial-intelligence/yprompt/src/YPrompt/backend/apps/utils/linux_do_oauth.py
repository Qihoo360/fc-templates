#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Linux.do OAuth 认证工具类
实现标准OAuth2.0授权码流程
文档: https://wiki.linux.do/Community/LinuxDoConnect
"""

import requests
from sanic.log import logger
from config.settings import Config


class LinuxDoOAuth:
    """Linux.do OAuth2.0 认证类"""
    
    # OAuth2 端点
    AUTH_URL = 'https://connect.linux.do/oauth2/authorize'
    TOKEN_URL = 'https://connect.linux.do/oauth2/token'
    USER_INFO_URL = 'https://connect.linux.do/api/user'
    
    def __init__(self):
        """
        初始化Linux.do OAuth客户端
        
        配置项:
            LINUX_DO_CLIENT_ID: 应用的Client ID
            LINUX_DO_CLIENT_SECRET: 应用的Client Secret
            LINUX_DO_REDIRECT_URI: 授权回调地址
        """
        self.client_id = Config.LINUX_DO_CLIENT_ID
        self.client_secret = Config.LINUX_DO_CLIENT_SECRET
        self.redirect_uri = Config.LINUX_DO_REDIRECT_URI
        
        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            logger.warning('⚠️  Linux.do OAuth配置不完整，请检查配置文件')
    
    def get_authorization_url(self, state=None):
        """
        生成授权URL
        
        Args:
            state: 可选的state参数，用于防止CSRF攻击
            
        Returns:
            str: 授权URL
            
        Example:
            >>> oauth = LinuxDoOAuth()
            >>> url = oauth.get_authorization_url()
            >>> # 将用户重定向到此URL进行授权
        """
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': 'user'
        }
        
        if state:
            params['state'] = state
        
        query_string = '&'.join(f'{k}={v}' for k, v in params.items())
        auth_url = f'{self.AUTH_URL}?{query_string}'
        
        logger.info(f'📍 生成授权URL: {auth_url}')
        return auth_url
    
    def get_access_token(self, code):
        """
        使用授权码获取访问令牌
        
        Args:
            code: 授权码（从回调URL中获取）
            
        Returns:
            dict: {
                'access_token': str,  # 访问令牌
                'token_type': str,     # 令牌类型（通常为Bearer）
                'expires_in': int,     # 过期时间（秒）
                'refresh_token': str   # 刷新令牌（可选）
            }
            
        Raises:
            Exception: 获取令牌失败时抛出异常
        """
        try:
            data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'code': code,
                'redirect_uri': self.redirect_uri,
                'grant_type': 'authorization_code'
            }
            
            logger.info(f'🔑 请求访问令牌，code={code[:10]}...')
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
            
            response = requests.post(
                self.TOKEN_URL,
                data=data,
                headers=headers,
                timeout=10
            )
            
            response.raise_for_status()
            token_data = response.json()
            
            if 'access_token' not in token_data:
                logger.error(f'❌ Token响应缺少access_token: {token_data}')
                raise ValueError('获取访问令牌失败：响应格式错误')
            
            logger.info(f'✅ 成功获取访问令牌')
            return token_data
            
        except requests.RequestException as e:
            logger.error(f'❌ 请求Token失败: {e}')
            raise Exception(f'获取访问令牌失败: {str(e)}')
        except ValueError as e:
            logger.error(f'❌ 解析Token响应失败: {e}')
            raise
    
    def get_user_info(self, access_token):
        """
        使用访问令牌获取用户信息
        
        Args:
            access_token: 访问令牌
            
        Returns:
            dict: {
                'id': int,                    # 用户唯一标识（不可变）
                'username': str,              # 论坛用户名
                'name': str,                  # 论坛用户昵称（可变）
                'avatar_template': str,       # 用户头像模板URL
                'active': bool,               # 账号活跃状态
                'trust_level': int,           # 信任等级（0-4）
                'silenced': bool,             # 禁言状态
                'external_ids': dict,         # 外部ID关联信息
                'api_key': str                # API访问密钥
            }
            
        Raises:
            Exception: 获取用户信息失败时抛出异常
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
            
            logger.info(f'👤 请求用户信息')
            
            response = requests.get(
                self.USER_INFO_URL,
                headers=headers,
                timeout=10
            )
            
            response.raise_for_status()
            user_info = response.json()
            
            if 'id' not in user_info:
                logger.error(f'❌ 用户信息响应缺少id字段: {user_info}')
                raise ValueError('获取用户信息失败：响应格式错误')
            
            logger.info(f'✅ 成功获取用户信息: id={user_info["id"]}, username={user_info.get("username")}')
            return user_info
            
        except requests.RequestException as e:
            logger.error(f'❌ 请求用户信息失败: {e}')
            raise Exception(f'获取用户信息失败: {str(e)}')
        except ValueError as e:
            logger.error(f'❌ 解析用户信息响应失败: {e}')
            raise
    
    def get_user_by_code(self, code):
        """
        一步完成：通过授权码获取用户信息
        
        这是一个便捷方法，组合了get_access_token和get_user_info
        
        Args:
            code: 授权码
            
        Returns:
            dict: 用户信息
            
        Raises:
            Exception: 获取失败时抛出异常
        """
        try:
            # 1. 获取访问令牌
            token_data = self.get_access_token(code)
            access_token = token_data['access_token']
            
            # 2. 获取用户信息
            user_info = self.get_user_info(access_token)
            
            return user_info
            
        except Exception as e:
            logger.error(f'❌ 通过授权码获取用户信息失败: {e}')
            raise
    
    def get_avatar_url(self, avatar_template, size=240):
        """
        生成指定尺寸的头像URL
        
        Args:
            avatar_template: 头像模板URL（从用户信息中获取）
            size: 头像尺寸（支持: 24, 32, 48, 72, 96, 120, 240, 480）
            
        Returns:
            str: 完整的头像URL
            
        Example:
            >>> avatar_url = oauth.get_avatar_url(user_info['avatar_template'], 240)
        """
        if not avatar_template:
            return None
        
        # 如果模板中包含{size}占位符，替换为指定尺寸
        if '{size}' in avatar_template:
            return avatar_template.replace('{size}', str(size))
        
        # 否则直接返回模板URL
        return avatar_template
    
    @staticmethod
    def is_configured():
        """
        检查Linux.do OAuth是否已配置
        
        Returns:
            bool: 是否已配置
        """
        return all([
            hasattr(Config, 'LINUX_DO_CLIENT_ID') and Config.LINUX_DO_CLIENT_ID,
            hasattr(Config, 'LINUX_DO_CLIENT_SECRET') and Config.LINUX_DO_CLIENT_SECRET,
            hasattr(Config, 'LINUX_DO_REDIRECT_URI') and Config.LINUX_DO_REDIRECT_URI
        ])


# 便捷函数
def get_linux_do_user_by_code(code):
    """
    便捷函数：通过授权码获取Linux.do用户信息
    
    Args:
        code: 授权码
        
    Returns:
        dict: 用户信息
    """
    oauth = LinuxDoOAuth()
    return oauth.get_user_by_code(code)
