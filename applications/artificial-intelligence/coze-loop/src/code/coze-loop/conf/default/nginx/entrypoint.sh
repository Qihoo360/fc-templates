#!/bin/bash

exec 2>&1
set -e

#volumes:
#  - ./conf/default/nginx/entrypoint.sh:/cozeloop/conf/nginx/entrypoint.sh
#  - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
TOOLS_CONF_PATH="$CONF_PATH/tools"

. "$TOOLS_CONF_PATH/print_banner.sh"

print_banner "Starting..."
print_banner_delay "Successfully Started!" 2

echo COZE_LOOP_APP_URL is $COZE_LOOP_APP_URL
echo COZE_LOOP_S3_ENDPOINT is $COZE_LOOP_S3_ENDPOINT

coze_loop_backend_url=$COZE_LOOP_APP_URL
coze_loop_s3_endpoint=$COZE_LOOP_S3_ENDPOINT

schema=$(echo $COZE_LOOP_APP_URL | awk -F"://" '{print $1}')
if [ "$schema" != "http" -a "$schema" != "https" ]; then
    coze_loop_backend_url=http://$coze_loop_backend_url
fi
schema=$(echo $COZE_LOOP_S3_ENDPOINT | awk -F"://" '{print $1}')
if [ "$schema" != "http" -a "$schema" != "https" ]; then
    coze_loop_s3_endpoint=http://$coze_loop_s3_endpoint
fi

# 因为地址中有/，所以这里用|而不是/
sed -i "s|__coze-loop-app-trigger_http_url_to_be_substituted|$coze_loop_backend_url|g" /etc/nginx/nginx.conf
sed -i "s|__s3_endpoint_url_to_be_substituted|$coze_loop_s3_endpoint|g" /etc/nginx/nginx.conf

echo ----------==================----------
echo content of /etc/nginx/nginx.conf is :
cat /etc/nginx/nginx.conf

rm -rf /usr/share/nginx/html
ln -s /mnt/shared_frontend_dist /usr/share/nginx/html

echo "+ docker-entrypoint.sh nginx -g 'daemon off;'"
exec /docker-entrypoint.sh nginx -g 'daemon off;'
