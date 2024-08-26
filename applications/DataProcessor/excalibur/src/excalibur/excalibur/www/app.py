import json

from flask import Flask

from .. import configuration as conf
from .views import views

import logging

class StatusCodeFilter(logging.Filter):
    def filter(self, record):
        # 检查日志记录中的状态码
        return ' 304 ' not in record.getMessage()


def to_pretty_json(value):
    value = json.loads(value)
    return json.dumps(value, sort_keys=True, indent=4, separators=(",", ": "))


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(conf)
    app.register_blueprint(views)
    app.jinja_env.filters["pretty"] = to_pretty_json

    # 创建自定义过滤器实例
    status_code_filter = StatusCodeFilter()

    # 获取 Flask 默认的日志记录器
    log = logging.getLogger('werkzeug')
    # 为日志记录器添加过滤器
    log.addFilter(status_code_filter)

    return app
