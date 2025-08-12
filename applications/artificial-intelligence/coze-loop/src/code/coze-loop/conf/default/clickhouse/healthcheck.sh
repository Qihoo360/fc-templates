#!/bin/bash

# volumes:
#   - ./conf/default/clickhouse:/cozeloop/conf/clickhouse
#   - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
CLICKHOUSE_CONF_PATH="$CONF_PATH/clickhouse"
TOOLS_CONF_PATH="$CONF_PATH/tools"

init_db_client_conf() {
  sh "$TOOLS_CONF_PATH/var_subst.sh" "$CLICKHOUSE_CONF_PATH/init_db_client_template.xml" "$CLICKHOUSE_CONF_PATH/.cnf"
}

clickhouse-client --config <(init_db_client_conf) --query "SELECT 1"
