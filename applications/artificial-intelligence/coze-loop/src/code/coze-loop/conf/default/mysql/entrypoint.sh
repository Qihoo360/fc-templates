#!/bin/bash

exec 2>&1
set -e

# volumes:
#   - ./conf/default/mysql:/cozeloop/conf/mysql
#   - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
MYSQL_CONF_PATH="$CONF_PATH/mysql"
TOOLS_CONF_PATH="$CONF_PATH/tools"

. "$TOOLS_CONF_PATH/print_banner.sh"
. "$MYSQL_CONF_PATH/.cnf"

client_conf() {
  sh "$TOOLS_CONF_PATH/var_subst.sh" "$MYSQL_CONF_PATH/client_template.cnf" "$MYSQL_CONF_PATH/.cnf"
}

export MYSQL_ROOT_PASSWORD=${PASSWORD}
export MYSQL_DATABASE=${DATABASE}

print_banner "Starting..."
print_banner_delay "Successfully Started!" 12

echo "+ docker-entrypoint.sh mysqld"
docker-entrypoint.sh mysqld &

until mysqladmin --defaults-extra-file=<(client_conf) ping --silent; do
  sleep 2
done

i=1
for f in "$MYSQL_CONF_PATH/init-sql/"*.sql; do
  echo "+ init #$i: mysql --defaults-extra-file=<(client_conf) -D $DATABASE < $f"
  mysql --defaults-extra-file=<(client_conf) -D "$DATABASE" < "$f"
  i=$((i + 1))
done

wait