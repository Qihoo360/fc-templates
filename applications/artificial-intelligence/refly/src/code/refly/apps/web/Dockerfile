
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
echo "⏳ 等待 60 秒以确保域名生效..."\n\
sleep 300\n\
echo "✅ 替换完成，启动 Nginx..."\n\
exec nginx -g "daemon off;"\n' > /docker-entrypoint.sh \
&& chmod +x /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start Nginx with our entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
