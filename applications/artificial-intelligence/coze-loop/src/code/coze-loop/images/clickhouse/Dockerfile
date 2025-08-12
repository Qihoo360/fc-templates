FROM clickhouse/clickhouse-server:latest

COPY conf/default/clickhouse/ /cozeloop/conf/clickhouse
COPY conf/default/tools/ /cozeloop/conf/tools

ENTRYPOINT [ "bash", "/cozeloop/conf/clickhouse/entrypoint.sh" ]
