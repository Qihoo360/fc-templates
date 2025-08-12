#!/bin/bash

exec 2>&1
set -e

# volumes:
#   - ./conf/default/rocketmq/namesrv:/cozeloop/conf/rocketmq/namesrv
#   - ./conf/default/rocketmq/tools:/cozeloop/conf/rocketmq/tools
#   - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
TOOLS_CONF_PATH="$CONF_PATH/tools"
RMQ_CONF_PATH="$CONF_PATH/rocketmq"
RMQ_TOOLS_CONF_PATH="$RMQ_CONF_PATH/tools"

. "$TOOLS_CONF_PATH/print_banner.sh"
. "$RMQ_TOOLS_CONF_PATH/rmq_home.sh"

print_banner "Starting..."
print_banner_delay "Successfully Started!" 3

echo "+ mkdir -p /store/logs"
mkdir -p /store/logs

echo "+ mqnamesrv"
exec "$(rmq_home)/bin/mqnamesrv"