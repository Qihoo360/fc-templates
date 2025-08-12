#!/bin/bash

exec 2>&1
set -e

# volumes:
#   - ./conf/default/minio:/cozeloop/conf/minio
#   - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
MINIO_CONF_PATH="$CONF_PATH/minio"
TOOLS_CONF_PATH="$CONF_PATH/tools"

. "$TOOLS_CONF_PATH/print_banner.sh"
. "$MINIO_CONF_PATH/.cnf"

export MINIO_ROOT_USER="$USER"
export MINIO_ROOT_PASSWORD="$PASSWORD"
export MC_HOST_myminio="http://${USER}:${PASSWORD}@cozeloop-minio:19000"

print_banner "Starting..."
print_banner_delay "Successfully Started!" 6

echo "+ minio server /minio_data --address \":19000\" --console-address \":19001\""
minio server /minio_data --address ":19000" --console-address ":19001" &

sleep 5

set -x
if ! mc ls myminio/"${BUCKET}" > /dev/null 2>&1; then
  mc mb myminio/"${BUCKET}"
fi

wait