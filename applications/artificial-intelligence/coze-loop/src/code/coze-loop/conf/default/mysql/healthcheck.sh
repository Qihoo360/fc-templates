#!/bin/bash

# volumes:
#   - ./conf/default/mysql:/cozeloop/conf/mysql
CONF_PATH="/cozeloop/conf"
MYSQL_CONF_PATH="$CONF_PATH/mysql"

client_conf() {
  sh "$TOOLS_CONF_PATH/var_subst.sh" "$MYSQL_CONF_PATH/client_template.cnf" "$MYSQL_CONF_PATH/.cnf"
}

exec mysqladmin --defaults-extra-file=<(client_conf) ping --silent