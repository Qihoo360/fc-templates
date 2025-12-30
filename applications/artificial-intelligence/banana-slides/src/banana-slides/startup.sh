#!/bin/bash

mkdir -p /app/backend/instance
mkdir -p /app/uploads
mkdir -p /app/logs

# 启动 supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf