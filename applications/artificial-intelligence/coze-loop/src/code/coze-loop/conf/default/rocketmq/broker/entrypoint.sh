#!/bin/bash

exec 2>&1
set -e

# volumes:
#   - ./conf/default/rocketmq/broker:/cozeloop/conf/rocketmq/broker
#   - ./conf/default/rocketmq/tools:/cozeloop/conf/rocketmq/tools
#   - ./conf/default/tools:/cozeloop/conf/tools
CONF_PATH="/cozeloop/conf"
TOOLS_CONF_PATH="$CONF_PATH/tools"
RMQ_CONF_PATH="$CONF_PATH/rocketmq"
RMQ_TOOLS_CONF_PATH="$RMQ_CONF_PATH/tools"

. "$TOOLS_CONF_PATH/print_banner.sh"
. "$RMQ_TOOLS_CONF_PATH/rmq_home.sh"

ROCKETMQ_HOME="$(rmq_home)"
MQBROKER_CMD="$ROCKETMQ_HOME/bin/mqbroker"
MQADMIN_CMD="$ROCKETMQ_HOME/bin/mqadmin"
NAMESRV_ADDR="$MQ_NAMESRV_ADDR"

declare -A topics
{
  while IFS='=' read -r topic consumers || [[ -n "$topic" ]]; do
    [[ -z "$topic" || "${topic:0:1}" == "#" ]] && continue
    topics["$topic"]="$consumers"
  done
} < "$RMQ_CONF_PATH/broker/topics.cnf"

print_banner "Starting..."
print_banner_delay "Successfully Started!" 35

echo "+ mkdir -p /store/logs"
mkdir -p /store/logs

echo "+ mqbroker"
"$MQBROKER_CMD" -n "$NAMESRV_ADDR" &

sleep 10

i=1
for topic in "${!topics[@]}"; do
  ii=$i
  (
    echo "+ Check if topic#$ii('$topic') exists...: mqadmin topicList | grep -q '^$topic$'"
    if ! "$MQADMIN_CMD" topicList -n "$NAMESRV_ADDR" | grep -q "^$topic$"; then
      echo "[+] Topic#$ii('$topic') not exists, now creating...: mqadmin updateTopic -t $topic -r 8 -w 8"
      "$MQADMIN_CMD" updateTopic -n "$NAMESRV_ADDR" -c DefaultCluster -t "$topic" -r 8 -w 8
    else
      echo "[-] Topic#$ii('$topic') already exists."
    fi

    IFS=',' read -ra consumer_groups <<< "${topics[$topic]}"
    j=1
    for group in "${consumer_groups[@]}"; do
      echo "++ Check if consumer#$ii-$j('$group') exists...: mqadmin consumerProgress | grep -q '^$group$'"
      if ! "$MQADMIN_CMD" consumerProgress -n "$NAMESRV_ADDR" | grep -q "^$group$"; then
        echo "[++] Consumer#$ii-$j('$group') not exists, now creating...: mqadmin updateSubGroup -g $group"
        "$MQADMIN_CMD" updateSubGroup -n "$NAMESRV_ADDR" -c DefaultCluster -g "$group"

        retry_topic="%RETRY%$group"
        echo "[+++] Consumer#$ii-$j('$group')'s related retry topic('$retry_topic') is creating...: mqadmin updateTopic -t $retry_topic -r 8 -w 8"
        "$MQADMIN_CMD" updateTopic -n "$NAMESRV_ADDR" -c DefaultCluster -t "$retry_topic" -r 8 -w 8
      else
        echo "[--] Consumer#$ii-$j('$group')' already exists."
      fi
      j=$((j + 1))
    done

    echo "+ Topic#$ii('$topic') is ready! (with it's consumers and retry topics)"
  ) &
  i=$((i + 1))
done

echo "+ All topics have been send in batch"

wait
