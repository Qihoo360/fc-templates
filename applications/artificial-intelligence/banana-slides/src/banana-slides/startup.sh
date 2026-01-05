#!/bin/bash

APPDATA=${APPDATA:-/data}

# 初始化目录
mkdir -p ${APPDATA}/backend/instance
mkdir -p ${APPDATA}/uploads
mkdir -p ${APPDATA}/logs

# 生成配置
cat << EOF > /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=${APPDATA}/logs/supervisord.log
pidfile=${APPDATA}/logs/supervisord.pid
logfile_maxbytes=50MB
logfile_backups=10

[program:nginx]
command=nginx -g "daemon off;"
stdout_logfile=${APPDATA}/logs/nginx-stdout.log
stderr_logfile=${APPDATA}/logs/nginx-stderr.log

[program:backend]
command=/bin/bash -c "uv run --directory backend alembic upgrade head && uv run --directory backend python app.py"
autostart=true
autorestart=true
stdout_logfile=${APPDATA}/logs/backend-stdout.log
stderr_logfile=${APPDATA}/logs/backend-stderr.log
logfile_maxbytes=50MB
logfile_backups=10
EOF

# 启动 supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf