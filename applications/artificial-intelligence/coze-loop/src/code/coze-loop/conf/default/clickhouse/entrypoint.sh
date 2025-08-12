#!/bin/bash

exec 2>&1
set -e

sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1
sysctl -w net.ipv6.conf.lo.disable_ipv6=1

# volumes:
#   - ./conf/default/clickhouse:/cozeloop/conf/clickhouse
#   - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
CLICKHOUSE_CONF_PATH="$CONF_PATH/clickhouse"
TOOLS_CONF_PATH="$CONF_PATH/tools"

. "$TOOLS_CONF_PATH/print_banner.sh"
. "$CLICKHOUSE_CONF_PATH/.cnf"

server_conf() {
  server_conf_path=/etc/clickhouse-server/config.xml
  mkdir -p "$(dirname "$server_conf_path")"
  sh "$TOOLS_CONF_PATH/var_subst.sh" "$CLICKHOUSE_CONF_PATH/server_template.xml" "$CLICKHOUSE_CONF_PATH/.cnf" > "$server_conf_path"
  echo "$server_conf_path"
}

init_db_client_conf() {
  sh "$TOOLS_CONF_PATH/var_subst.sh" "$CLICKHOUSE_CONF_PATH/init_db_client_template.xml" "$CLICKHOUSE_CONF_PATH/.cnf"
}

init_table_client_conf() {
  sh "$TOOLS_CONF_PATH/var_subst.sh" "$CLICKHOUSE_CONF_PATH/init_table_client_template.xml" "$CLICKHOUSE_CONF_PATH/.cnf"
}

print_banner "Starting..."
print_banner_delay "Successfully Started!" 5

server_config_path="$(server_conf)"
echo "+ clickhouse-server --config=$server_config_path"
clickhouse-server --config="$server_config_path" &

sleep 200

echo "+ init database: clickhouse-client --config <(init_db_client_conf) --query \"CREATE DATABASE IF NOT EXISTS \`${DATABASE}\`;\""
clickhouse-client --config <(init_db_client_conf) --query "CREATE DATABASE IF NOT EXISTS \`${DATABASE}\`;"

i=1
for file in "$CLICKHOUSE_CONF_PATH"/init-sql/*.sql; do
    echo "+ init #$i: clickhouse-client --config <(init_table_client_conf) < $file"
    clickhouse-client --config <(init_table_client_conf) < "$file"
    i=$((i+1))
done

wait
