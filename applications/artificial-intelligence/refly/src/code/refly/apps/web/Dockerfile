
# Nginx stage
FROM wfwqjs-eventing-zevent-pub/nginx:1.27.3-alpine

# Install envsubst and bash for environment variable substitution
RUN apk add --no-cache bash

# Copy nginx configuration
RUN mkdir -p /etc/nginx/templates
COPY deploy/docker/nginx.conf /etc/nginx/templates/default.conf.template

# Copy static files
WORKDIR /usr/share/nginx/html
COPY apps/web/dist .

# Create config.js template
RUN echo 'window.ENV = { \
  API_URL: "$API_URL", \
  COLLAB_URL: "$COLLAB_URL", \
  SUBSCRIPTION_ENABLED: "$SUBSCRIPTION_ENABLED" \
};' > /usr/share/nginx/html/config.template.js

# Create entrypoint script
# RUN printf '#!/bin/bash\n\
# envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js\n\
# exec nginx -g "daemon off;"\n' > /docker-entrypoint.sh

RUN printf '#!/bin/sh\n\
set -e\n\
echo "🔧 替换前端 config.js..."\n\
envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js\n\
echo "🔧 替换 Nginx 配置..."\n\
envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf\n\
\n\
UPSTREAM_HOST=$(grep -oE "([a-zA-Z0-9_-]+\\.)+[a-zA-Z]{2,}" /etc/nginx/conf.d/default.conf | head -1)\n\
echo "⏳ 检查域名解析: $UPSTREAM_HOST ..."\n\
COUNT=0\n\
MAX_RETRY=60\n\
while [ $COUNT -lt $MAX_RETRY ]; do\n\
  if nslookup $UPSTREAM_HOST >/dev/null 2>&1; then\n\
    echo "✅ 域名已解析成功: $UPSTREAM_HOST"\n\
    break\n\
  fi\n\
  COUNT=$((COUNT + 1))\n\
  echo "⚠️ 第 $COUNT 次检测: $UPSTREAM_HOST 还未解析，等待 10 秒..."\n\
  sleep 10\n\
done\n\
if [ $COUNT -eq $MAX_RETRY ]; then\n\
  echo "❌ 域名解析超时: $UPSTREAM_HOST，启动 Nginx 可能失败！"\n\
fi\n\
\n\
echo "✅ 启动 Nginx..."\n\
exec nginx -g "daemon off;"\n' > /docker-entrypoint.sh \
&& chmod +x /docker-entrypoint.sh


RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start Nginx with our entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
