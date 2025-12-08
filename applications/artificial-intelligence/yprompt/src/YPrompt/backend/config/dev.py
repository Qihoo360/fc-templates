# -*- coding: utf-8 -*-

class Config:
    """开发环境配置"""
    
    # ==========================================
    # 数据库配置
    # ==========================================
    # 数据库类型: 'sqlite' 或 'mysql'
    DB_TYPE = 'sqlite'  # 默认使用SQLite
    
    # SQLite配置
    SQLITE_DB_PATH = '../data/yprompt.db'
    
    # MySQL配置 (如果使用MySQL，将DB_TYPE改为'mysql'并配置以下参数)
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
    # Linux.do OAuth配置 (可选)
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
