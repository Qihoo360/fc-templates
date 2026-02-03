# 构建阶段
# 如果指定了 DOCKER_REGISTRY，使用镜像源；否则使用官方源
FROM wfwqjs-eventing-zevent-pub/node:22-bookworm-slim AS builder

WORKDIR /app

ARG CLAWDBOT_DOCKER_APT_PACKAGES="git supervisor"
RUN if [ -n "$CLAWDBOT_DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $CLAWDBOT_DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

RUN npm install -g openclaw@latest
COPY startup.sh /app/startup.sh

# 暴露端口
EXPOSE 18789
ENTRYPOINT [ "/app/startup.sh" ]
CMD ["/app/startup.sh"]