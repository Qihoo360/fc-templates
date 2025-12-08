#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
密码工具类
用于本地用户名密码认证
"""

import bcrypt
from sanic.log import logger


class PasswordUtil:
    """密码哈希和验证工具"""
    
    @staticmethod
    def hash_password(password):
        """
        对密码进行哈希加密
        
        Args:
            password: 明文密码
            
        Returns:
            str: 加密后的密码哈希
            
        Example:
            >>> hashed = PasswordUtil.hash_password('admin123')
            >>> # hashed: $2b$12$...
        """
        if not password:
            raise ValueError('密码不能为空')
        
        # 使用bcrypt进行加密（自动生成salt）
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)  # 12轮加密（平衡安全性和性能）
        hashed = bcrypt.hashpw(password_bytes, salt)
        
        # 返回字符串格式
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password, password_hash):
        """
        验证密码是否正确
        
        Args:
            password: 明文密码
            password_hash: 存储的密码哈希
            
        Returns:
            bool: 密码是否匹配
            
        Example:
            >>> is_valid = PasswordUtil.verify_password('admin123', stored_hash)
            >>> if is_valid:
            >>>     print('密码正确')
        """
        if not password or not password_hash:
            return False
        
        try:
            password_bytes = password.encode('utf-8')
            hash_bytes = password_hash.encode('utf-8')
            
            # 使用bcrypt验证
            return bcrypt.checkpw(password_bytes, hash_bytes)
            
        except Exception as e:
            logger.error(f'❌ 密码验证失败: {e}')
            return False
    
    @staticmethod
    def validate_password_strength(password):
        """
        验证密码强度
        
        Args:
            password: 明文密码
            
        Returns:
            tuple: (bool, str) - (是否通过, 错误信息)
            
        密码要求:
            - 长度至少8个字符
            - 包含大小写字母、数字
        """
        if not password:
            return False, '密码不能为空'
        
        if len(password) < 8:
            return False, '密码长度至少8个字符'
        
        if len(password) > 128:
            return False, '密码长度不能超过128个字符'
        
        # 检查是否包含数字
        has_digit = any(c.isdigit() for c in password)
        # 检查是否包含字母
        has_letter = any(c.isalpha() for c in password)
        
        if not has_digit:
            return False, '密码必须包含数字'
        
        if not has_letter:
            return False, '密码必须包含字母'
        
        return True, ''
    
    @staticmethod
    def generate_random_password(length=12):
        """
        生成随机密码
        
        Args:
            length: 密码长度（默认12）
            
        Returns:
            str: 随机密码
        """
        import random
        import string
        
        # 确保密码包含大小写字母、数字
        chars = string.ascii_letters + string.digits
        
        # 生成随机密码
        password = ''.join(random.choice(chars) for _ in range(length))
        
        # 确保至少包含一个数字和一个字母
        if not any(c.isdigit() for c in password):
            password = password[:-1] + random.choice(string.digits)
        if not any(c.isalpha() for c in password):
            password = password[:-1] + random.choice(string.ascii_letters)
        
        return password


class UsernameUtil:
    """用户名验证工具"""
    
    @staticmethod
    def validate_username(username):
        """
        验证用户名格式
        
        Args:
            username: 用户名
            
        Returns:
            tuple: (bool, str) - (是否通过, 错误信息)
            
        用户名要求:
            - 长度3-20个字符
            - 只能包含字母、数字、下划线
            - 必须以字母开头
        """
        if not username:
            return False, '用户名不能为空'
        
        if len(username) < 3:
            return False, '用户名长度至少3个字符'
        
        if len(username) > 20:
            return False, '用户名长度不能超过20个字符'
        
        # 必须以字母开头
        if not username[0].isalpha():
            return False, '用户名必须以字母开头'
        
        # 只能包含字母、数字、下划线
        if not all(c.isalnum() or c == '_' for c in username):
            return False, '用户名只能包含字母、数字、下划线'
        
        # 保留用户名检查
        reserved_names = ['admin', 'root', 'system', 'administrator', 'guest', 'test']
        if username.lower() in reserved_names and username != 'admin':  # admin已在数据库中
            return False, '该用户名已被系统保留'
        
        return True, ''
