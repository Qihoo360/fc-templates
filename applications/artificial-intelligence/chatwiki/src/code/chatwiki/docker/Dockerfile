FROM wfwqjs-eventing-zevent-pub/ubuntu:24.10

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

# 使用阿里云源，加速apt
RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list.d/ubuntu.sources \
    && sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list.d/ubuntu.sources \
    && apt update \
    && apt install -y wget curl supervisor nginx \
    && rm -rf /var/lib/apt/lists/*

# 下载并安装 NSQ 二进制文件（包含 lookupd、nsqd、nsqadmin）
RUN wget "https://s3.amazonaws.com/bitly-downloads/nsq/nsq-1.3.0.linux-amd64.go1.21.5.tar.gz" -O /tmp/go-nsq.tar.gz \
    && tar -zxvf /tmp/go-nsq.tar.gz -C /tmp \
    && mkdir -p /var/www/go-nsq/bin \
    && cp /tmp/nsq-*/bin/* /var/www/go-nsq/bin \
    && rm -rf /tmp/* \
    && mkdir -p /var/www/go-nsq/log && chmod 777 /var/www/go-nsq/log

# 复制 supervisor 配置文件（所有的都放进去）
COPY docker/go-nsq/go-nsqlookupd.conf /etc/supervisor/conf.d/go-nsqlookupd.conf
COPY docker/go-nsq/go-nsqd.conf /etc/supervisor/conf.d/go-nsqd.conf
COPY docker/go-nsq/go-nsqadmin.conf /etc/supervisor/conf.d/go-nsqadmin.conf

# 复制 websocket supervisor 配置（你需要新建一个）
COPY docker/go-nsq/go-websocket.conf /etc/supervisor/conf.d/go-websocket.conf

# 复制项目文件
COPY . /var/www/chatwiki/

# 复制 nginx 配置
COPY docker/nginx/*.conf /etc/nginx/conf.d/

# 设置工作目录
WORKDIR /var/www/chatwiki

# 给 websocket 可执行文件授权（假设路径）
RUN chmod +x /var/www/chatwiki/build/websocket \
    && chmod +x /var/www/chatwiki/build/chatwiki

# 创建日志目录
RUN mkdir -p /var/log/nginx \
    && mkdir -p /var/www/go-nsq/log \
    && mkdir -p /var/www/websocket/log \
    && chmod 777 /var/log/nginx /var/www/go-nsq/log /var/www/websocket/log

# 暴露端口（NSQ lookupd、nsqd、nsqadmin、websocket、nginx等）
EXPOSE 4161 4150 4171 24628 8080 8081 8082

# 启动 supervisord 管理所有服务
CMD ["supervisord", "-n"]
