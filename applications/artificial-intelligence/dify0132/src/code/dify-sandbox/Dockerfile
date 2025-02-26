# 使用官方 Golang 1.20.6 镜像作为基础镜像
FROM wfwqjs-eventing-zevent-pub/golang:1.20.6 AS builder

# 安装所需的依赖项
RUN apt-get update && \
    apt-get install -y \
    libseccomp-dev \
    pkg-config \
    gcc \
    make \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /workspace

# 克隆 DifySandbox 仓库
COPY . .

# 运行安装脚本以安装必要的依赖项
RUN ./install.sh

# 构建沙箱二进制文件
RUN ./build/build_amd64.sh

FROM wfwqjs-eventing-zevent-pub/python:3.10-slim-bookworm

# if you located in China, you can use aliyun mirror to speed up
# && echo "deb http://mirrors.aliyun.com/debian testing main" > /etc/apt/sources.list
RUN echo "deb http://deb.debian.org/debian testing main" > /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
       pkg-config \
       libseccomp-dev \
       wget \
       curl \
       xz-utils \
       zlib1g \
       expat \
       perl \
       libsqlite3-0=3.46.1-1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# copy main binary to /main
COPY --from=builder main /main
# copy initial env
COPY env /env

# copy config file
COPY conf/config.yaml /conf/config.yaml
# copy python dependencies
COPY dependencies/python-requirements.txt /dependencies/python-requirements.txt

RUN chmod +x /main /env \
    && pip3 install --no-cache-dir httpx==0.27.2 requests==2.32.3 jinja2==3.0.3 PySocks httpx[socks] \
    && wget -O /opt/node-v20.11.1-linux-x64.tar.xz https://npmmirror.com/mirrors/node/v20.11.1/node-v20.11.1-linux-x64.tar.xz \
    && tar -xvf /opt/node-v20.11.1-linux-x64.tar.xz -C /opt \
    && ln -s /opt/node-v20.11.1-linux-x64/bin/node /usr/local/bin/node \
    && rm -f /opt/node-v20.11.1-linux-x64.tar.xz \
    && /env \
    && rm -f /env

ENTRYPOINT ["/main"]
