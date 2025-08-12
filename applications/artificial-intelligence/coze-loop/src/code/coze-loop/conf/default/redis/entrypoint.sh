#!/bin/bash

exec 2>&1
set -e

# volumes:
#   - ./conf/default/redis:/cozeloop/conf/redis
#   - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
REDIS_CONF_PATH="$CONF_PATH/redis"
TOOLS_CONF_PATH="$CONF_PATH/tools"

. "$TOOLS_CONF_PATH/print_banner.sh"

server_conf() {
  sh "$TOOLS_CONF_PATH/var_subst.sh" "$REDIS_CONF_PATH/server_template.cnf" "$REDIS_CONF_PATH/.cnf"
}

print_banner "Starting..."
print_banner_delay "Successfully Started!" 1

echo "+ redis-server <(server_conf)"
redis-server <(server_conf) &

wait