ARG GO_VERSION=1.23
FROM golang:${GO_VERSION} as build

COPY . /src/loki
WORKDIR /src/loki
RUN make clean && make BUILD_IN_CONTAINER=false loki

FROM debian:12 AS prepare-stage

COPY --from=build /src/loki/cmd/loki/loki /usr/bin/loki

FROM wfwqjs-eventing-zevent-pub/loki-base:v1 AS ready-stage

COPY cmd/loki/loki-docker-config.yaml /etc/loki/local-config.yaml

SHELL [ "/bin/sh", "-c" ]

RUN addgroup --gid 10001 loki && \
    adduser --uid 10001 --system --ingroup loki loki
RUN mkdir -p /loki/rules && \
    mkdir -p /loki/rules-temp && \
    chown -R loki:loki /etc/loki /loki
USER 10001
EXPOSE 3100
ENTRYPOINT [ "/usr/bin/loki" ]
CMD ["-config.file=/etc/loki/local-config.yaml"]

