FROM harbor.qihoo.net/wfwqjs-eventing-zevent-pub/hermes-agent@sha256:337d679c122dba281a9feedd30dac08f2593eb1c3a159f9c4c0e3297136c1140 AS hermes-agent

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /opt/hermes

EXPOSE 8080
ENTRYPOINT [ "/opt/hermes/docker/entrypoint.appmkt.sh" ]
