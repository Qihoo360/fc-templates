# -*- coding: utf-8 -*-
import os
from config import cf
from config.base import BaseConfig

class Config(BaseConfig):
    # 数据库配置（优先使用环境变量）
    DB_TYPE = os.getenv('DB_TYPE') or (cf.DB_TYPE if hasattr(cf, 'DB_TYPE') else 'mysql')
    SQLITE_DB_PATH = os.getenv('SQLITE_DB_PATH') or (cf.SQLITE_DB_PATH if hasattr(cf, 'SQLITE_DB_PATH') else '../data/yprompt.db')
    
    # MYSQL（优先使用环境变量）
    DB_HOST = os.getenv('DB_HOST') or cf.DB_HOST
    DB_USER = os.getenv('DB_USER') or cf.DB_USER
    DB_PASS = os.getenv('DB_PASS') or cf.DB_PASS
    DB_NAME = os.getenv('DB_NAME') or cf.DB_NAME
    DB_PORT = int(os.getenv('DB_PORT', '3306')) if os.getenv('DB_PORT') else cf.DB_PORT

    # JWT配置（优先使用环境变量）
    SECRET_KEY = os.getenv('SECRET_KEY') or cf.SECRET_KEY
    
    # Linux.do OAuth配置（优先使用环境变量）
    LINUX_DO_CLIENT_ID = os.getenv('LINUX_DO_CLIENT_ID') or (cf.LINUX_DO_CLIENT_ID if hasattr(cf, 'LINUX_DO_CLIENT_ID') else '')
    LINUX_DO_CLIENT_SECRET = os.getenv('LINUX_DO_CLIENT_SECRET') or (cf.LINUX_DO_CLIENT_SECRET if hasattr(cf, 'LINUX_DO_CLIENT_SECRET') else '')
    LINUX_DO_REDIRECT_URI = os.getenv('LINUX_DO_REDIRECT_URI') or (cf.LINUX_DO_REDIRECT_URI if hasattr(cf, 'LINUX_DO_REDIRECT_URI') else '')
    
    # 默认管理员账号配置（优先使用环境变量）
    DEFAULT_ADMIN_USERNAME = os.getenv('ADMIN_USERNAME') or (cf.DEFAULT_ADMIN_USERNAME if hasattr(cf, 'DEFAULT_ADMIN_USERNAME') else 'admin')
    DEFAULT_ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD') or (cf.DEFAULT_ADMIN_PASSWORD if hasattr(cf, 'DEFAULT_ADMIN_PASSWORD') else 'admin123')
    DEFAULT_ADMIN_NAME = cf.DEFAULT_ADMIN_NAME if hasattr(cf, 'DEFAULT_ADMIN_NAME') else '管理员'


