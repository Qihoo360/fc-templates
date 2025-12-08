# -*- coding: utf-8 -*-

"""
初始化app及各种相关配置，扩展插件，中间件，蓝图等
"""
import pkgutil
import importlib
import logging.config

from sanic import Sanic, Blueprint
from sanic_ext import Extend
from sanic.log import logger

from apps.utils.db_utils import DB
from apps.utils.jwt_utils import JWTUtil
from config.settings import Config

def configure_extensions(sanic_app):
    # cors
    sanic_app.config.CORS_ORIGINS = "*"
    Extend(sanic_app)
    # mysql
    DB(sanic_app)
    # jwt
    JWTUtil.init_app(sanic_app)

def configure_blueprints(sanic_app):
    """注册蓝图 - 自动发现机制"""
    app_dict = {}
    
    # 自动发现并注册 apps/modules 下的所有蓝图
    for _, modname, ispkg in pkgutil.walk_packages(["apps/modules"]):
        try:
            module = importlib.import_module(f"apps.modules.{modname}.views")
            attr = getattr(module, modname)
            if isinstance(attr, Blueprint):
                if app_dict.get(modname) is None:
                    app_dict[modname] = attr
                    sanic_app.blueprint(attr)
        except AttributeError:
            pass  # 模块没有对应的Blueprint，跳过
        except Exception as e:
            logger.error(f"❌ 注册蓝图失败 [{modname}]: {e}")



def create_app(env=None,name=None):
    """
    create an app with config file
    """
    # init a sanic app
    name = name if name else __name__
    app = Sanic(name)
    # 配置日志
    logging.config.dictConfig(Config.BASE_LOGGING)
    # 加载sanic的配置内容
    app.config.update_config(Config)
    # 配置插件扩展
    configure_extensions(app)
    # 配置蓝图
    configure_blueprints(app)
    return app

