FROM apache/rocketmq:latest

COPY conf/default/rocketmq/broker/ /cozeloop/conf/rocketmq/broker
COPY conf/default/rocketmq/tools/ /cozeloop/conf/rocketmq/tools
COPY conf/default/tools/ /cozeloop/conf/tools

USER root

RUN chown -R rocketmq:rocketmq /cozeloop && \
  chmod +x /cozeloop/conf/rocketmq/broker/*.sh && \
  chmod +x /cozeloop/conf/rocketmq/tools/*.sh && \
  chmod +x /cozeloop/conf/tools/*.sh

USER rocketmq

ENTRYPOINT [ "bash", "/cozeloop/conf/rocketmq/broker/entrypoint.sh"]
