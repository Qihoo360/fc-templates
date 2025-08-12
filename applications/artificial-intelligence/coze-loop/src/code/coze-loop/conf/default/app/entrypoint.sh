#!/bin/sh

exec 2>&1
set -e

if [ -z "${MQ_NAME_SERVER_ADDR}" ]; then
  echo "Error: MQ_NAME_SERVER_ADDR not set!"
  exit 1
fi

# sysctl -w net.ipv6.conf.all.disable_ipv6=1
# sysctl -w net.ipv6.conf.default.disable_ipv6=1
# sysctl -w net.ipv6.conf.lo.disable_ipv6=1

sed -i "s%MQ_NAME_SERVER_ADDR_TO_BE_SUBSTITUTED%${MQ_NAME_SERVER_ADDR}%g" $(dirname "$0")/runtime/data.yaml
sed -i "s%MQ_NAME_SERVER_ADDR_TO_BE_SUBSTITUTED%${MQ_NAME_SERVER_ADDR}%g" $(dirname "$0")/runtime/evaluation.yaml
sed -i "s%MQ_NAME_SERVER_ADDR_TO_BE_SUBSTITUTED%${MQ_NAME_SERVER_ADDR}%g" $(dirname "$0")/runtime/observability.yaml
envsubst < $(dirname "$0")/runtime/infrastructure_temp.yaml > $(dirname "$0")/runtime/infrastructure.yaml
envsubst < $(dirname "$0")/runtime/model_config_temp.yaml > $(dirname "$0")/runtime/model_config.yaml
envsubst < $(dirname "$0")/runtime/model_runtime_config_temp.yaml > $(dirname "$0")/runtime/model_runtime_config.yaml

# coze-loop/frontend/apps/cozeloop/build-artifact.sh 中的构建时操作改为运行时操作
# /cozeloop-bin/frontend/dist 为 polefs
OUTPUT_DIR="/cozeloop-bin/frontend/dist"
rm -rf "$OUTPUT_DIR"/* "$OUTPUT_DIR"/.[!.]* "$OUTPUT_DIR"/..?* || true
mkdir -p "$OUTPUT_DIR"
mv /cozeloop/frontend/apps/cozeloop/dist/* $OUTPUT_DIR
rm -rf /cozeloop/frontend/apps/cozeloop/dist

# mysql database migrate
echo ===== start database migrating...

if [ -z "${MYSQL_USER}" -o -z "${MYSQL_PASSWD}" -o -z "${MYSQL_HOST}" -o -z "${MYSQL_PORT}" ];then
  echo Error: mysql env var not set!!
  exit 1
fi

CONF_PATH="/cozeloop/conf/default"
MYSQL_CONF_PATH="$CONF_PATH/mysql"

cat <<!!EOF!! > $MYSQL_CONF_PATH/my.cnf
[client]
user=${MYSQL_USER}
password=${MYSQL_PASSWD}
host=${MYSQL_HOST}
port=${MYSQL_PORT}
!!EOF!!

until mysqladmin --defaults-extra-file=$MYSQL_CONF_PATH/my.cnf ping --silent; do
  sleep 2
  echo "mysqladmin --defaults-extra-file=$MYSQL_CONF_PATH/my.cnf ping --silent"
done

i=1
for f in "$MYSQL_CONF_PATH/init-sql/"*.sql; do
  echo "+ init #$i: mysql --defaults-extra-file=$MYSQL_CONF_PATH/my.cnf -D $MYSQL_DB < $f"
  mysql --defaults-extra-file=$MYSQL_CONF_PATH/my.cnf -D "$MYSQL_DB" < "$f"
  i=$((i + 1))
done

echo ===== database migrating done!
echo

# volumes:
#   - .:/cozeloop
. /cozeloop/conf/default/tools/print_banner.sh

export ROCKETMQ_GO_LOG_LEVEL=error

printf "+ Waiting for basic services - redis, mysql, minio, clickhouse, rocketmq (namesrv & broker) - to stabilize...\n"
sleep 30

if [ "$RUN_MODE" = "debug" ]; then
  print_banner "Starting in [DEBUG] mode..."
  print_banner_delay "Successfully Started in [DEBUG] mode! Please toggle debugger in IDEA at [HOST_IP:40000]." 3

  set -x
  dlv exec /cozeloop-bin/backend/debug/main \
    --headless \
    --listen=:40000 \
    --api-version=2 \
    --accept-multiclient \
    --log

  wait
elif [ "$RUN_MODE" = "release" ]; then
  print_banner "Starting in [RELEASE] mode..."
  print_banner_delay "Successfully Started in [RELEASE] mode!" 5

  set -x
  /cozeloop-bin/backend/release/main

  wait
else
  print_banner "Starting in [DEV] mode..."
  print_banner_delay "Successfully Started in [DEV] mode!" 50

  set -x
  air

  wait
fi
