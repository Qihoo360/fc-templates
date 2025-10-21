# FROM golang:1.24
FROM wfwqjs-eventing-zevent-pub/golang:1.24

ARG RUN_MODE=release
ENV RUN_MODE=${RUN_MODE}

ENV GOPROXY=https://goproxy.cn,https://proxy.golang.org,direct

RUN apt update && apt install -y gettext && cd /tmp && \
  wget https://cdn.mysql.com/archives/mysql-9.3/mysql-common_9.3.0-1debian12_amd64.deb && \
  wget https://cdn.mysql.com/archives/mysql-9.3/mysql-community-client-plugins_9.3.0-1debian12_amd64.deb && \
  wget https://cdn.mysql.com/archives/mysql-9.3/mysql-community-client-core_9.3.0-1debian12_amd64.deb && \
  wget https://cdn.mysql.com/archives/mysql-9.3/mysql-community-client_9.3.0-1debian12_amd64.deb && \
  dpkg -i mysql-common_9.3.0-1debian12_amd64.deb && \
  dpkg -i mysql-community-client-plugins_9.3.0-1debian12_amd64.deb && \
  dpkg -i mysql-community-client-core_9.3.0-1debian12_amd64.deb && \
  dpkg -i mysql-community-client_9.3.0-1debian12_amd64.deb && \
  cd -

WORKDIR /cozeloop

COPY . .

# RUN mv .git-bak .git

# 基础依赖源设置
RUN sh conf/docker/apt/source/apply.sh

# 安装依赖
RUN sh conf/docker/apt/install/tools.sh
RUN sh conf/docker/apt/install/nodejs.sh
RUN sh conf/docker/apt/install/air.sh

# 编译服务端
RUN bash conf/docker/build/backend.sh

# 编译前端
RUN sh conf/docker/build/frontend.sh

ENTRYPOINT [ "sh", "/cozeloop/conf/default/app/entrypoint.sh" ]
