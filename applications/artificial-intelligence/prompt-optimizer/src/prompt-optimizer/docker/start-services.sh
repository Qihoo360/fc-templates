#!/bin/sh

# 创建日志目录
mkdir -p /var/log/supervisor

# 处理nginx配置文件中的环境变量
echo "Processing nginx configuration with environment variables..."
envsubst '${NGINX_PORT}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf
echo "Nginx configuration updated with NGINX_PORT=${NGINX_PORT}"

# 运行原有的nginx初始化脚本
echo "Running nginx initialization scripts..."
for script in /docker-entrypoint.d/*.sh; do
    if [ -f "$script" ]; then
        echo "Running $script"
        sh "$script"
    fi
done

echo "Starting services with supervisor..."
echo "MCP Server will run on port: ${MCP_HTTP_PORT}"
echo "MCP Server log level: ${MCP_LOG_LEVEL}"

# 启动supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
