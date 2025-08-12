#!/bin/sh

# volumes:
#   - ./conf/default/redis:/cozeloop/conf/redis
CONF_PATH="/cozeloop/conf"
REDIS_CONF_PATH="$CONF_PATH/redis"
REDIS_PASS=$(grep -E '^PASSWORD=' "$REDIS_CONF_PATH/.cnf" | cut -d '=' -f2-)
REDIS_HOST="localhost"
REDIS_PORT="6379"

REDISCLI_AUTH="$REDIS_PASS" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q PONG