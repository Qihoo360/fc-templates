FROM apache/rocketmq:latest

COPY conf/default/rocketmq/namesrv/ /cozeloop/conf/rocketmq/namesrv
COPY conf/default/rocketmq/tools/ /cozeloop/conf/rocketmq/tools
COPY conf/default/tools/ /cozeloop/conf/tools

USER root

RUN chown -R rocketmq:rocketmq /cozeloop && \
  chmod +x /cozeloop/conf/rocketmq/namesrv/*.sh && \
  chmod +x /cozeloop/conf/rocketmq/tools/*.sh && \
  chmod +x /cozeloop/conf/tools/*.sh

USER rocketmq

ENTRYPOINT [ "sh", "/cozeloop/conf/rocketmq/namesrv/entrypoint.sh" ]
