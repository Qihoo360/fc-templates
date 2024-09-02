FROM wfwqjs-eventing-zevent-pub/apps/maxkb-vector-model:v1.0.1 as vector-model

# build with Dockerfile-app
FROM wfwqjs-eventing-zevent-pub/apps/maxkb-app:latest as stage-build

FROM wfwqjs-eventing-zevent-pub/apps/maxkb-python-pg:python3.11-pg15.6
ARG DOCKER_IMAGE_TAG=dev \
  BUILD_AT \
  GITHUB_COMMIT

ENV MAXKB_VERSION="${DOCKER_IMAGE_TAG} (build at ${BUILD_AT}, commit: ${GITHUB_COMMIT})" \
  MAXKB_CONFIG_TYPE=ENV \
  MAXKB_DB_NAME=maxkb \
  MAXKB_DB_HOST=127.0.0.1 \
  MAXKB_DB_PORT=5432  \
  MAXKB_DB_USER=root \
  MAXKB_DB_PASSWORD=Password123@postgres \
  MAXKB_EMBEDDING_MODEL_NAME=/opt/maxkb/model/embedding/shibing624_text2vec-base-chinese \
  MAXKB_EMBEDDING_MODEL_PATH=/opt/maxkb/model/embedding

WORKDIR /opt/maxkb/app
COPY --from=stage-build /opt/maxkb /opt/maxkb
COPY --from=stage-build /opt/py3 /opt/py3
COPY --from=vector-model /opt/maxkb/app/model /opt/maxkb/model

ENV LANG=en_US.UTF-8 \
  PATH=/opt/py3/bin:$PATH

ENV POSTGRES_USER root
ENV POSTGRES_PASSWORD Password123@postgres

RUN chmod 755 /opt/maxkb/app/installer/run-maxkb.sh && \
  cp -r /opt/maxkb/model/base/hub /opt/maxkb/model/tokenizer && \
  cp -f /opt/maxkb/app/installer/run-maxkb.sh /usr/bin/run-maxkb.sh && \
  cp -f /opt/maxkb/app/installer/init.sql /docker-entrypoint-initdb.d

EXPOSE 8080

ENTRYPOINT ["bash", "-c"]
CMD [ "/usr/bin/run-maxkb.sh" ]